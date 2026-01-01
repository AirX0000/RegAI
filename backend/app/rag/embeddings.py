from typing import List
from app.core.config import settings

# Placeholder for embeddings
# In production, use OpenAI or SentenceTransformers

class Embeddings:
    def embed_query(self, text: str) -> List[float]:
        # Mock embedding
        return [0.1] * 1536

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [[0.1] * 1536 for _ in texts]

def get_embeddings_model():
    return Embeddings()
