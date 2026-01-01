"""
Seed script to load banking regulations and audit standards into database
Run with: python -m app.db.seeds.load_regulations
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.db.session import SessionLocal
from app.db.models.regulation import Regulation
from app.db.seeds.banking_regulations_bilingual import banking_regulations_bilingual
from app.db.seeds.audit_standards_bilingual import audit_standards_bilingual
from app.db.seeds.uzbekistan_regulations import uzbekistan_regulations
from app.db.seeds.uzbekistan_detailed_instructions import uzbekistan_detailed_instructions
from app.db.seeds.uzbekistan_laws import uzbekistan_laws


def load_regulations():
    """Load banking regulations and audit standards into database"""
    db = SessionLocal()
    
    try:
        print("Loading bilingual banking regulations, audit standards, Uzbekistan regulations, detailed instructions, and Uzbekistan laws...")
        
        # Combine all regulations - using bilingual versions and new Uzbekistan laws
        all_regulations = banking_regulations_bilingual + audit_standards_bilingual + uzbekistan_regulations + uzbekistan_detailed_instructions + uzbekistan_laws
        
        loaded_count = 0
        skipped_count = 0
        
        for reg_data in all_regulations:
            # Check if regulation already exists
            existing = db.query(Regulation).filter(
                Regulation.code == reg_data["code"]
            ).first()
            
            if existing:
                print(f"  Skipping {reg_data['code']} - already exists")
                skipped_count += 1
                continue
            
            # Parse effective date
            effective_date = None
            if "effective_date" in reg_data:
                effective_date = datetime.strptime(reg_data["effective_date"], "%Y-%m-%d")
            
            # Create new regulation
            regulation = Regulation(
                code=reg_data["code"],
                title=reg_data["title"],
                content=reg_data["content"],
                category=reg_data.get("category"),
                jurisdiction=reg_data.get("jurisdiction"),
                effective_date=effective_date,
                workflow_steps=reg_data.get("workflow_steps"),
                tenant_id=None  # Global regulations
            )
            
            db.add(regulation)
            loaded_count += 1
            print(f"  ✓ Loaded {reg_data['code']}: {reg_data['title']}")
        
        db.commit()
        
        print(f"\n✅ Successfully loaded {loaded_count} regulations")
        print(f"⏭️  Skipped {skipped_count} existing regulations")
        
        # Print summary
        print("\n📊 Summary:")
        basel_count = db.query(Regulation).filter(Regulation.code.like("BASEL%")).count()
        ifrs_count = db.query(Regulation).filter(Regulation.code.like("IFRS%")).count()
        isa_count = db.query(Regulation).filter(Regulation.code.like("ISA%")).count()
        uz_count = db.query(Regulation).filter(Regulation.code.like("UZ%")).count()
        
        print(f"  Basel III regulations: {basel_count}")
        print(f"  IFRS 9 regulations: {ifrs_count}")
        print(f"  ISA audit standards: {isa_count}")
        print(f"  Uzbekistan regulations: {uz_count}")
        print(f"  Total regulations in database: {db.query(Regulation).count()}")
        
    except Exception as e:
        print(f"\n❌ Error loading regulations: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    load_regulations()
