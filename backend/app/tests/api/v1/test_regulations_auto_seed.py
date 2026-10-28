import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.db.models.regulation import Regulation
from app.services.regulation_auto_seeder import RegulationAutoSeeder

def test_regulation_auto_seeder_direct(db: Session):
    """
    Verify RegulationAutoSeeder populates regulations into the database.
    """
    seeder = RegulationAutoSeeder(db)
    result = seeder.seed_if_missing()
    assert result["status"] == "success"
    assert "total_regulations" in result
    assert result["total_regulations"] > 0

    # Verify IFRS and NSBU items exist
    ifrs16 = db.query(Regulation).filter(Regulation.code == "IFRS-16").first()
    assert ifrs16 is not None
    assert "IFRS 16" in ifrs16.title
    assert ifrs16.category == "IFRS"

    nsbu1 = db.query(Regulation).filter(Regulation.code == "NSBU-1").first()
    assert nsbu1 is not None
    assert "НСБУ 1" in nsbu1.title
    assert nsbu1.jurisdiction == "Uzbekistan"

def test_auto_seed_api_endpoint(client: TestClient, db: Session, normal_user_token_headers: dict):
    """
    Test POST /api/v1/regulations/auto-seed endpoint.
    """
    response = client.post("/api/v1/regulations/auto-seed", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "total_regulations" in data

def test_refresh_regulations_api_endpoint(client: TestClient, db: Session, normal_user_token_headers: dict):
    """
    Test POST /api/v1/regulations/refresh endpoint returns stats.
    """
    response = client.post("/api/v1/regulations/refresh", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "added" in data
    assert "total_regulations" in data

def test_search_regulations_includes_new_standards(client: TestClient, db: Session, normal_user_token_headers: dict):
    """
    Test searching for newly added normatives (IFRS, NSBU, Basel).
    """
    # Ensure seeded
    RegulationAutoSeeder(db).seed_if_missing()

    # Search for NSBU
    response = client.get("/api/v1/regulations/search?query=НСБУ", headers=normal_user_token_headers)
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    codes = [r.get("metadata", {}).get("code") for r in results]
    assert any("NSBU" in (c or "") for c in codes)

    # Search for Basel
    response_basel = client.get("/api/v1/regulations/search?query=Basel", headers=normal_user_token_headers)
    assert response_basel.status_code == 200
    results_basel = response_basel.json()
    assert len(results_basel) > 0


def test_detailed_regulations_multi_word_search_and_snippet(client: TestClient, db: Session, normal_user_token_headers: dict):
    """
    Verify multi-word deep search finds regulations across title, content, code,
    and returns contextual snippets and matched fields.
    """
    RegulationAutoSeeder(db).seed_if_missing()

    # Multi-word search (non-adjacent terms: e.g. "налог кодекс")
    response = client.get("/api/v1/regulations/search?query=налог кодекс", headers=normal_user_token_headers)
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    top = results[0]
    meta = top.get("metadata", {})
    assert "snippet" in top or "snippet" in meta
    assert "matched_fields" in top or "matched_fields" in meta


def test_search_all_ifrs_standards(client: TestClient, db: Session, normal_user_token_headers: dict):
    """
    Verify searching 'IFRS' or 'МСФО' returns complete suite of both IFRS and IAS standards (including IAS 16, IAS 38, IFRS 16, etc.)
    """
    RegulationAutoSeeder(db).seed_if_missing()

    # Search for IFRS
    res_ifrs = client.get("/api/v1/regulations/search?query=IFRS", headers=normal_user_token_headers)
    assert res_ifrs.status_code == 200
    items_ifrs = res_ifrs.json()
    codes = [r.get("metadata", {}).get("code") or r.get("code") for r in items_ifrs]

    # Must find both IFRS and IAS standards
    assert any("IFRS-16" in c for c in codes)
    assert any("IFRS-9" in c for c in codes)
    assert any("IAS-1" in c or "IAS-16" in c or "IAS-38" in c for c in codes)
    assert len(items_ifrs) >= 20

    # Search for МСФО
    res_msfo = client.get("/api/v1/regulations/search?query=МСФО", headers=normal_user_token_headers)
    assert res_msfo.status_code == 200
    items_msfo = res_msfo.json()
    assert len(items_msfo) >= 20


def test_export_regulations_pdf_with_cyrillic(client: TestClient, db: Session, normal_user_token_headers: dict):
    """
    Verify PDF export does not crash on Cyrillic / Uzbek characters and returns valid PDF bytes.
    """
    RegulationAutoSeeder(db).seed_if_missing()
    response = client.get("/api/v1/regulations/export/pdf", headers=normal_user_token_headers)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")

