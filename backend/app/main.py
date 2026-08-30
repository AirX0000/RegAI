import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
from alembic.config import Config
from alembic import command

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.rate_limit import check_rate_limit
from app.api.v1 import api_router
from app.rag.scheduler import start_scheduler

setup_logging()
logger = logging.getLogger(__name__)

# Maximum allowed payload size: 35 MB (for Excel / OCR document uploads)
MAX_CONTENT_LENGTH = 35 * 1024 * 1024

def run_migrations():
    """Run database migrations on startup"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully")
    except Exception as e:
        error_msg = str(e)
        if "already exists" in error_msg.lower():
            logger.warning("Migration skipped - tables already exist")
        else:
            logger.error(f"Error running database migrations: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    run_migrations()
    start_scheduler()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS] if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Security Headers & Payload Size Middleware
@app.middleware("http")
async def security_and_size_middleware(request: Request, call_next):
    # Enforce request payload size limit (DoS protection)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_CONTENT_LENGTH:
        return Response(
            content='{"detail":"Payload Too Large: Maximum allowed request size is 35MB"}',
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            media_type="application/json"
        )

    # General API Rate Limiting (exclude metrics and healthcheck)
    path = request.url.path
    if not path.startswith("/metrics") and not path.startswith("/health") and not path.startswith("/docs") and not path.startswith("/openapi"):
        try:
            check_rate_limit(request)
        except HTTPException as he:
            return Response(
                content=f'{{"detail":"{he.detail}"}}',
                status_code=he.status_code,
                media_type="application/json"
            )

    response = await call_next(request)

    # Security Headers (OWASP recommendations)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    return response

# 2. Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# 3. Timing / Performance Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# 4. Single-Container Frontend Serving (Production / Railway / Cloud PaaS fallback)
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist_candidates = [
    "/app/frontend/dist",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
]

for dist_dir in frontend_dist_candidates:
    if os.path.exists(dist_dir) and os.path.isdir(dist_dir):
        assets_dir = os.path.join(dist_dir, "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str, _dist=dist_dir):
            file_path = os.path.join(_dist, full_path)
            if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(os.path.join(_dist, "index.html"))
        break

