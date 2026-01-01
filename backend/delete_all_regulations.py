#!/usr/bin/env python3
"""
Script to delete all regulations from the database.
"""

import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database URL
DATABASE_URL = "sqlite:///./regai.db"

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Count regulations
        count_result = session.execute(text("SELECT COUNT(*) FROM regulations"))
        total_count = count_result.scalar()
        
        print("=" * 60)
        print(f"TOTAL REGULATIONS: {total_count}")
        print("=" * 60)
        
        if total_count == 0:
            print("No regulations found in the database.")
            return
        
        # Show sample regulations
        print("\nSample regulations (first 5):")
        sample = session.execute(text("SELECT id, title, category FROM regulations LIMIT 5")).fetchall()
        for reg in sample:
            print(f"  - {reg[1]} ({reg[2]})")
        
        # Confirm deletion
        print(f"\n⚠️  WARNING: This will delete ALL {total_count} regulations!")
        confirmation = input("Type 'DELETE ALL' to confirm: ")
        
        if confirmation != "DELETE ALL":
            print("❌ Deletion cancelled.")
            return
        
        # Delete all regulations
        print("\nDeleting regulations...")
        session.execute(text("DELETE FROM regulations"))
        session.commit()
        
        # Verify deletion
        verify_result = session.execute(text("SELECT COUNT(*) FROM regulations"))
        remaining = verify_result.scalar()
        
        print(f"\n✅ Successfully deleted {total_count} regulations.")
        print(f"Remaining regulations: {remaining}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    main()
