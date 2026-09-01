import hashlib
import logging
from typing import List
from uuid import UUID

from app.rag.vectorstore import get_collection
from app.rag.embeddings import get_embeddings_model

logger = logging.getLogger(__name__)


def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def _smart_chunk(text: str, max_chunk: int = 900, overlap: int = 100) -> List[str]:
    """
    Split text by paragraphs, then by sentences, then hard-cut if needed.
    Adds a small overlap between chunks for better retrieval context.
    """
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 <= max_chunk:
            current = (current + "\n\n" + para).strip()
        else:
            if current:
                chunks.append(current)
                # overlap: keep last `overlap` chars
                current = current[-overlap:].lstrip() + "\n\n" + para
            else:
                # Single very long paragraph — hard-split by sentence
                sentences = para.replace(". ", ".\n").split("\n")
                sub = ""
                for sent in sentences:
                    if len(sub) + len(sent) + 1 <= max_chunk:
                        sub = (sub + " " + sent).strip()
                    else:
                        if sub:
                            chunks.append(sub)
                            sub = sub[-overlap:].lstrip() + " " + sent
                        else:
                            # Sentence itself is too long — hard cut
                            for i in range(0, len(sent), max_chunk):
                                chunks.append(sent[i : i + max_chunk])
                if sub:
                    current = sub

    if current:
        chunks.append(current)

    return chunks or [text[:max_chunk]]


def redact_pii(text: str) -> str:
    """Basic PII redaction. Extend with presidio-analyzer in enterprise deployments."""
    import re
    # Redact Russian INN (10/12 digit tax IDs)
    text = re.sub(r"\b\d{10,12}\b", "[INN/OGRN REDACTED]", text)
    # Redact email-like patterns
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[EMAIL REDACTED]", text)
    # SSN placeholder
    text = text.replace("SSN", "[REDACTED]")
    return text


def ingest_regulation(tenant_id: str, code: str, content: str, metadata: dict) -> str:
    """
    Full ingestion pipeline:
    1. Redact PII
    2. Smart paragraph-aware chunking with overlap
    3. Embed with real OpenAI embeddings (or deterministic fallback)
    4. Upsert into ChromaDB collection
    Returns SHA-256 content hash.
    """
    safe_content = redact_pii(content)
    chunks = _smart_chunk(safe_content)

    collection = get_collection(tenant_id)
    embeddings_model = get_embeddings_model()

    ids = [f"{code}_{i}" for i in range(len(chunks))]
    embeddings = embeddings_model.embed_documents(chunks)

    metadatas = []
    for i in range(len(chunks)):
        meta = metadata.copy()
        meta["chunk_index"] = i
        meta["total_chunks"] = len(chunks)
        meta["code"] = code
        metadatas.append(meta)

    # Upsert so re-ingest doesn't create duplicates
    try:
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )
        logger.info("Ingested regulation %s: %d chunks into tenant %s", code, len(chunks), tenant_id)
    except Exception as exc:
        # ChromaDB may not support upsert for all backends — fallback to add with collision handling
        logger.warning("Upsert failed, retrying with delete+add: %s", exc)
        try:
            collection.delete(ids=ids)
        except Exception:
            pass
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )

    return compute_content_hash(content)
