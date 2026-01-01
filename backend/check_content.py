from app.db.session import SessionLocal
from app.db.models.regulation import Regulation

db = SessionLocal()
reg = db.query(Regulation).filter(Regulation.code == "GDPR").first()
if reg:
    print(f"Code: {reg.code}")
    print(f"Content Length: {len(reg.content) if reg.content else 0}")
    print(f"Content Preview: {reg.content[:100] if reg.content else 'None'}")
else:
    print("GDPR not found")
db.close()
