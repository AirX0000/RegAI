import argparse
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))

from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.core.security import get_password_hash

def create_admin(email, password, tenant_name):
    db = SessionLocal()
    try:
        # Check or create tenant
        tenant = db.query(Tenant).filter(Tenant.name == tenant_name).first()
        if not tenant:
            tenant = Tenant(name=tenant_name, plan="enterprise")
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"Tenant '{tenant_name}' created.")
        else:
            print(f"Tenant '{tenant_name}' found.")
            
        # Check user
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User '{email}' already exists.")
            return

        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name="Admin User",
            is_superuser=True,
            is_active=True,
            role="superadmin",
            tenant_id=tenant.id
        )
        db.add(user)
        db.commit()
        print(f"Superuser '{email}' created successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a superadmin user")
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password")
    parser.add_argument("--tenant", required=True, help="Tenant name")
    
    args = parser.parse_args()
    create_admin(args.email, args.password, args.tenant)
