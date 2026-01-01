import time
import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app
from alembic.config import Config
from alembic import command

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1 import api_router
from app.rag.scheduler import start_scheduler

setup_logging()
logger = logging.getLogger(__name__)

def run_migrations():
    """Run database migrations on startup"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully")
    except Exception as e:
        error_msg = str(e)
        # Ignore "table already exists" errors - this means migration was already applied
        if "already exists" in error_msg.lower():
            logger.warning(f"Migration skipped - tables already exist")
        else:
            logger.error(f"Error running database migrations: {e}")
            # Don't raise - allow app to start even if migrations fail

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    run_migrations()
    start_scheduler()
    yield
    # Shutdown (if needed)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS] if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# API routes
app.include_router(api_router, prefix=settings.API_V1_STR)
