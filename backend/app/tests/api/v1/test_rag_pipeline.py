import pytest
from app.rag.ingest import _smart_chunk, redact_pii, ingest_regulation
from app.rag.retriever import search_regulations, query_rag


def test_smart_chunking():
    text = "Paragraph 1 is a relatively long sentence here.\n\nParagraph 2 has another section of important content.\n\nParagraph 3 concludes the documentation."
    chunks = _smart_chunk(text, max_chunk=60, overlap=10)
    assert len(chunks) >= 2
    assert "Paragraph 1" in chunks[0]


def test_redact_pii():
    text = "Company INN is 1234567890 and contact email is audit@company.com with SSN"
    clean = redact_pii(text)
    assert "1234567890" not in clean
    assert "[INN/OGRN REDACTED]" in clean
    assert "audit@company.com" not in clean
    assert "[EMAIL REDACTED]" in clean
    assert "[REDACTED]" in clean


def test_rag_ingest_and_retrieval(client):
    tenant_id = "test-tenant-rag"
    code = "IFRS-16-LEASES"
    content = "IFRS 16 introduces a single lessee accounting model and requires a lessee to recognise assets and liabilities for all leases with a term of more than 12 months."
    complex_metadata = {
        "title": "IFRS 16 Leases Standard",
        "category": "Accounting",
        "tags": ["leases", "ifrs", "iasb"],
        "active": True,
        "null_val": None,
    }

    hash_val = ingest_regulation(tenant_id, code, content, complex_metadata)
    assert len(hash_val) == 64

    # Search with exact code boost
    results = search_regulations(tenant_id, "IFRS 16", limit=3)
    assert len(results) > 0
    top = results[0]
    assert "content" in top
    assert top["metadata"].get("code") == "IFRS-16-LEASES"

    # Query RAG text helper
    text_response = query_rag("lessee accounting model", tenant_id, limit=1)
    assert "IFRS 16" in text_response or "lessee" in text_response
