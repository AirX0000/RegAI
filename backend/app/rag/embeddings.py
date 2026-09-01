import logging
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIEmbeddings:
    """
    Production embeddings using OpenAI text-embedding-3-small.
    Falls back to ChromaDB default embeddings if key is unavailable.
    """

    MODEL = "text-embedding-3-small"
    DIMENSIONS = 1536

    def __init__(self):
        self._client = None
        self._available = bool(settings.OPENAI_API_KEY)
        if self._available:
            try:
                import openai
                self._client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI embeddings initialised (model=%s)", self.MODEL)
            except Exception as exc:
                logger.warning("OpenAI unavailable, falling back to local embeddings: %s", exc)
                self._available = False

    def _embed(self, texts: List[str]) -> List[List[float]]:
        if self._available and self._client:
            try:
                resp = self._client.embeddings.create(
                    model=self.MODEL,
                    input=texts,
                )
                return [item.embedding for item in resp.data]
            except Exception as exc:
                logger.error("OpenAI embedding call failed, using fallback: %s", exc)

        # Local TF-IDF-style sparse fallback — deterministic, not random.
        # Each vector encodes a simple character bigram hash into 1536 dims.
        import hashlib
        vectors = []
        for text in texts:
            vec = [0.0] * self.DIMENSIONS
            for i in range(0, len(text) - 1, 2):
                bigram = text[i : i + 2]
                idx = int(hashlib.md5(bigram.encode()).hexdigest(), 16) % self.DIMENSIONS
                vec[idx] += 1.0
            # L2-normalise
            norm = (sum(v * v for v in vec) ** 0.5) or 1.0
            vectors.append([v / norm for v in vec])
        return vectors

    def embed_query(self, text: str) -> List[float]:
        return self._embed([text])[0]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        # Batch in chunks of 512 to respect OpenAI rate limits
        results: List[List[float]] = []
        chunk_size = 512
        for start in range(0, len(texts), chunk_size):
            batch = texts[start : start + chunk_size]
            results.extend(self._embed(batch))
        return results


_instance: OpenAIEmbeddings | None = None


def get_embeddings_model() -> OpenAIEmbeddings:
    global _instance
    if _instance is None:
        _instance = OpenAIEmbeddings()
    return _instance
