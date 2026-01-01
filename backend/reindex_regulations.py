from app.db.session import SessionLocal
from app.db.models.regulation import Regulation
from app.rag import ingest

db = SessionLocal()
try:
    regulations = db.query(Regulation).all()
    print(f"Found {len(regulations)} regulations in SQL DB. Re-indexing...")
    
    for reg in regulations:
        # Assuming tenant_id might be None for global, but ingest expects a string
        tenant_id = str(reg.tenant_id) if reg.tenant_id else "default"
        
        # Handle empty content to avoid embedding errors
        content_to_index = reg.content
        if not content_to_index or len(content_to_index.strip()) == 0:
            print(f"Warning: {reg.code} has empty content. Using placeholder.")
            content_to_index = f"Content for {reg.title} is currently not available. Please check the source URL: {reg.source_url}"

        # Sanitize metadata to remove None values
        metadata = {
            "title": reg.title, 
            "jurisdiction": reg.jurisdiction or "",
            "category": reg.category or "Uncategorized",
            "id": str(reg.id),
            "effective_date": str(reg.effective_date) if reg.effective_date else ""
        }

        print(f"Indexing {reg.code} ({reg.category})...")
        ingest.ingest_regulation(
            tenant_id,
            reg.code,
            content_to_index,
            metadata
        )
        
    print("Re-indexing complete.")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
