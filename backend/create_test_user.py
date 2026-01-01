
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
import uuid

DATABASE_URL = "sqlite:///./regai.db"

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Get tenant
        tenant_id = session.execute(text("SELECT id FROM tenants LIMIT 1")).scalar()
        
        # Create test user
        user_id = uuid.uuid4()
        email = "debug_user@example.com"
        password = "DebugPassword123!"
        hashed = get_password_hash(password)
        
        session.execute(text("""
            INSERT INTO users (id, email, hashed_password, is_active, is_superuser, role, tenant_id, full_name)
            VALUES (:id, :email, :hashed, 1, 1, 'admin', :tenant_id, 'Debug User')
        """), {
            "id": user_id.hex, # SQLite stores as hex string if not using UUID type adapter in raw SQL? 
            # Wait, SQLAlchemy UUID type stores as 32-char hex string in SQLite usually.
            # Let's try passing the UUID object, SQLAlchemy might handle it if I used the model, but here I use raw SQL.
            # Let's check how it's stored. debug_tenants.py showed hex strings.
            "email": email,
            "hashed": hashed,
            "tenant_id": tenant_id
        })
        session.commit()
        print(f"Created user {email} with password {password}")
        
    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()
