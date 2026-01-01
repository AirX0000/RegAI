#!/usr/bin/env python3
"""
Script to index regulations in ChromaDB for semantic search.
"""

import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.regulation import Regulation
from app.rag import ingest

# Database URL
DATABASE_URL = "sqlite:///./regai.db"

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("=" * 70)
        print("INDEXING REGULATIONS IN CHROMADB")
        print("=" * 70)
        
        # Get all regulations
        regulations = session.query(Regulation).all()
        print(f"\nTotal regulations to index: {len(regulations)}")
        
        if len(regulations) == 0:
            print("❌ No regulations found in database!")
            print("Please run populate_regulations.py first.")
            return
        
        indexed_count = 0
        for reg in regulations:
            # Create document text for indexing
            # Combine title, code, category, and jurisdiction for better search
            doc_text = f"{reg.title} ({reg.code}). Category: {reg.category}. Jurisdiction: {reg.jurisdiction}."
            if reg.source_url:
                doc_text += f" Source: {reg.source_url}"
            
            # Index in ChromaDB using the ingest module
            try:
                ingest.ingest_regulation(
                    tenant_id=str(reg.tenant_id),
                    code=reg.code,
                    content=doc_text,
                    metadata={
                        "id": str(reg.id),
                        "title": reg.title,
                        "category": reg.category,
                        "jurisdiction": reg.jurisdiction,
                        "effective_date": reg.effective_date.isoformat() if reg.effective_date else None,
                        "source_url": reg.source_url or ""
                    }
                )
                indexed_count += 1
                print(f"✅ Indexed: {reg.title} ({reg.code})")
            except Exception as e:
                print(f"❌ Error indexing {reg.title}: {e}")
        
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"✅ Successfully indexed: {indexed_count}/{len(regulations)} regulations")
        print("\n✅ ChromaDB indexing complete!")
        print("\nRegulations are now searchable via the Regulations page.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == "__main__":
    main()
