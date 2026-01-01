
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.user import User
import uuid

DATABASE_URL = "sqlite:///./regai.db"

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Checking admin user via ORM...")
        user = session.query(User).filter(User.email == "admin@example.com").first()
        
        if user:
            print(f"User found: {user.email}")
            print(f"Tenant ID (raw): {user.tenant_id}")
            print(f"Tenant ID (type): {type(user.tenant_id)}")
            print(f"Tenant ID (str): {str(user.tenant_id)}")
            
            # Check if it matches the hyphenated version
            hyphenated = "b4e63cbc-5d53-48c5-bfdd-f1c35a9886ba"
            print(f"Matches hyphenated expected? {str(user.tenant_id) == hyphenated}")
            
        else:
            print("User admin@example.com not found!")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    main()
