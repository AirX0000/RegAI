import time
import uuid
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
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

def ensure_demo_accounts():
    """Ensure essential demo accounts and companies exist with active status and correct password on every startup."""
    try:
        from app.db.session import SessionLocal
        from app.db.models.tenant import Tenant
        from app.db.models.company import Company
        from app.db.models.user import User
        from app.core.security import get_password_hash

        db = SessionLocal()
        try:
            # 1. Ensure Tenant
            tenant = db.query(Tenant).first()
            if not tenant:
                tenant = Tenant(id=uuid.uuid4(), name="FinBridge Group", plan="enterprise")
                db.add(tenant)
                db.commit()
                db.refresh(tenant)

            # 2. Ensure Primary Company
            company = db.query(Company).filter(Company.domain == "finbridge.demo").first()
            if not company:
                company = db.query(Company).first()
            if not company:
                company = Company(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    name="FinBridge Capital",
                    domain="finbridge.demo",
                    industry="Financial Services",
                    employee_count=850,
                    website="https://finbridge.demo",
                    description="Enterprise financial advisory and IFRS compliance.",
                    is_active=True
                )
                db.add(company)
                db.commit()
                db.refresh(company)

            # 3. Ensure All Demo Accounts with active password FinBridge2026!
            demo_accounts = [
                {
                    "email": "superadmin@finbridge.demo",
                    "full_name": "Chief Master SuperAdmin (Global)",
                    "role": "superadmin",
                    "is_superuser": True,
                    "is_company_owner": False,
                    "hierarchy_level": 1,
                },
                {
                    "email": "admin@finbridge.demo",
                    "full_name": "Alexander Volkov (Company Admin)",
                    "role": "admin",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 4,
                },
                {
                    "email": "owner@finbridge.demo",
                    "full_name": "Elena Smirnova (Company Owner)",
                    "role": "company_owner",
                    "is_superuser": False,
                    "is_company_owner": True,
                    "hierarchy_level": 2,
                },
                {
                    "email": "accountant@finbridge.demo",
                    "full_name": "Dmitry Ivanov (Chief Accountant)",
                    "role": "accountant",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 4,
                },
                {
                    "email": "auditor@finbridge.demo",
                    "full_name": "Marina Petrova (External Auditor)",
                    "role": "auditor",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 4,
                },
                {
                    "email": "analyst@finbridge.demo",
                    "full_name": "Nikolay Volkov (Analyst)",
                    "role": "user",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 5,
                },
            ]

            hashed_pwd = get_password_hash("FinBridge2026!")

            for acc in demo_accounts:
                user = db.query(User).filter(User.email == acc["email"]).first()
                if not user:
                    user = User(
                        id=uuid.uuid4(),
                        tenant_id=tenant.id,
                        company_id=company.id,
                        email=acc["email"],
                        full_name=acc["full_name"],
                        hashed_password=hashed_pwd,
                        role=acc["role"],
                        hierarchy_level=acc["hierarchy_level"],
                        is_superuser=acc["is_superuser"],
                        is_company_owner=acc["is_company_owner"],
                        is_active=True
                    )
                    db.add(user)
                    logger.info(f"Initialized demo user: {acc['email']}")
                else:
                    user.hashed_password = hashed_pwd
                    user.is_active = True
                    user.role = acc["role"]
                    user.is_superuser = acc["is_superuser"]
                    user.is_company_owner = acc["is_company_owner"]
                    user.hierarchy_level = acc["hierarchy_level"]
                    if not user.tenant_id:
                        user.tenant_id = tenant.id
                    if not user.company_id:
                        user.company_id = company.id
                    logger.info(f"Refreshed credentials for demo user: {acc['email']}")

            db.commit()
            logger.info("Demo accounts verified and active.")
        except Exception as e:
            db.rollback()
            logger.error(f"Error initializing demo accounts: {e}")
        finally:
            db.close()
    except Exception as outer_e:
        logger.error(f"Could not load demo seeding dependencies: {outer_e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    run_migrations()
    ensure_demo_accounts()
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

    # General API Rate Limiting (only on API endpoints, exclude assets/docs/metrics/health)
    path = request.url.path
    if path.startswith("/api/") and not path.startswith("/api/v1/health"):
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

# 4. Frontend SPA Serving (Full-Stack single container mode)
dist_dir = "/app/frontend/dist"
if not os.path.exists(dist_dir):
    local_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
    if os.path.exists(local_dist):
        dist_dir = local_dist

if os.path.exists(dist_dir):
    logger.info(f"Mounting React Frontend SPA from {dist_dir}")
    assets_path = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_page(full_path: str):
        # Exclude backend internal routes
        if full_path.startswith("api/") or full_path.startswith("metrics") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API route not found")
        
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return Response(content='{"detail":"Frontend index.html not found"}', status_code=404, media_type="application/json")
else:
    @app.get("/")
    def fallback_root():
        return {
            "message": "RegAI Platform API is Operational",
            "docs": "/docs",
            "api_v1": "/api/v1"
        }
