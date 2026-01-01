import hashlib
from typing import List
from uuid import UUID
from app.rag.vectorstore import get_collection
from app.rag.embeddings import get_embeddings_model

def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def redact_pii(text: str) -> str:
    # Placeholder for PII redaction logic
    # Use libraries like presidio-analyzer in production
    return text.replace("SSN", "[REDACTED]")

def ingest_regulation(tenant_id: str, code: str, content: str, metadata: dict):
    # 1. Redact PII
    safe_content = redact_pii(content)
    
    # 2. Chunking (simple split for now)
    # In production use langchain RecursiveCharacterTextSplitter
    chunks = [safe_content[i:i+1000] for i in range(0, len(safe_content), 1000)]
    
    # 3. Embed and Store
    collection = get_collection(tenant_id)
    embeddings_model = get_embeddings_model()
    
    ids = [f"{code}_{i}" for i in range(len(chunks))]
    embeddings = embeddings_model.embed_documents(chunks)
    
    # Add metadata to each chunk
    metadatas = []
    for i in range(len(chunks)):
        meta = metadata.copy()
        meta["chunk_index"] = i
        meta["code"] = code
        metadatas.append(meta)
        
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )
    
    return compute_content_hash(content)
