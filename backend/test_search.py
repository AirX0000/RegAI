from app.rag.retriever import search_regulations
from app.db.session import SessionLocal
from app.db.models.user import User
from app.core.config import settings

def test_search():
    db = SessionLocal()
    try:
        # Get superuser for tenant_id
        superuser = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not superuser:
            print("Superuser not found")
            return

        tenant_id = str(superuser.tenant_id)
        
        print("Searching for 'IFRS'...")
        results = search_regulations(tenant_id, "IFRS", limit=3)
        
        for i, res in enumerate(results):
            print(f"{i+1}. {res['metadata'].get('code')} - {res['metadata'].get('title')}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_search()
