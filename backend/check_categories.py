from sqlalchemy import func
from app.db.session import SessionLocal
from app.db.models.regulation import Regulation

db = SessionLocal()
try:
    results = db.query(Regulation.category, func.count(Regulation.id)).group_by(Regulation.category).all()
    print("Regulation Counts by Category:")
    for category, count in results:
        print(f"- {category}: {count}")
        
    # Also check for ones with no category or different casing
    total = db.query(Regulation).count()
    print(f"\nTotal Regulations: {total}")
    
finally:
    db.close()
