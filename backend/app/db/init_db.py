from sqlalchemy.orm import Session
from app.core.config import settings
from app.db import base  # noqa: F401
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.core.security import get_password_hash

def init_db(db: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you wanted to create them here for simple tests:
    # base.Base.metadata.create_all(bind=db.get_bind())

    # Check if superuser exists
    user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    if not user:
        # Create default tenant for superuser
        tenant = db.query(Tenant).filter(Tenant.name == "System").first()
        if not tenant:
            tenant = Tenant(name="System", plan="enterprise")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
        
        user = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name="Super Admin",
            is_superuser=True,
            is_active=True,
            role="superadmin",
            tenant_id=tenant.id
        )
        db.add(user)
        db.commit()
