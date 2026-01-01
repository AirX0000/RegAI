import chromadb
from chromadb.config import Settings
from app.core.config import settings

# Initialize Chroma Client
# In production, use HttpClient to connect to a Chroma server
# For local dev, PersistentClient is fine

_client = None

def get_chroma_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
    return _client

def get_collection(tenant_id: str):
    client = get_chroma_client()
    # Per-tenant collection
    collection_name = f"regai_{tenant_id}"
    return client.get_or_create_collection(name=collection_name)
