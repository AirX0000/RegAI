
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./regai.db"

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("--- Tenants ---")
        tenants = session.execute(text("SELECT id, name FROM tenants")).fetchall()
        for t in tenants:
            print(f"Tenant: {t[0]} - {t[1]}")
            
        print("\n--- Users ---")
        users = session.execute(text("SELECT id, email, tenant_id, company_id FROM users")).fetchall()
        for u in users:
            print(f"User: {u[1]} (Tenant: {u[2]})")

        print("\n--- Regulations ---")
        # Check tenant_id of regulations
        regs = session.execute(text("SELECT tenant_id, COUNT(*) FROM regulations GROUP BY tenant_id")).fetchall()
        for r in regs:
            print(f"Regulations for Tenant {r[0]}: {r[1]} count")

        print("\n--- ChromaDB ---")
        try:
            import chromadb
            from app.core.config import settings
            client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
            
            print("Listing collections:")
            collections = client.list_collections()
            for c in collections:
                print(f" - {c.name} (Count: {c.count()})")
                
            # Get collection for the tenant
            # Use the hyphenated ID found in the listing
            tenant_id = "b4e63cbc-5d53-48c5-bfdd-f1c35a9886ba" 
            collection_name = f"regai_{tenant_id}"
            try:
                collection = client.get_collection(name=collection_name)
                print(f"Collection '{collection_name}' found.")
                print(f"Count: {collection.count()}")
                
                # Try a query
                print("Querying with empty string...")
                # Mock embedding
                embedding = [0.1] * 1536
                results = collection.query(
                    query_embeddings=[embedding],
                    n_results=5
                )
                print(f"Query returned {len(results['ids'][0])} results.")
                print("IDs:", results['ids'][0])
                
            except Exception as e:
                print(f"Collection error: {e}")
                
        except ImportError:
            print("chromadb not installed or accessible")


    except Exception as e:
        print(e)
    finally:
        session.close()

if __name__ == "__main__":
    main()
