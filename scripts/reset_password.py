
import sys
import os
import argparse

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))

from app.db.session import SessionLocal
from app.db.models.user import User
from app.core.security import get_password_hash

def reset_password(email, new_password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User '{email}' not found.")
            return

        print(f"Found user {email}. Resetting password...")
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        print(f"Password for '{email}' has been reset successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <email> <new_password>")
        sys.exit(1)
        
    email = sys.argv[1]
    password = sys.argv[2]
    reset_password(email, password)
