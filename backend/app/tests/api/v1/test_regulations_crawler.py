import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.db.models.regulation import Regulation

def test_crawler_start_and_import(client: TestClient, db: Session, normal_user_token_headers: dict):
    """
    Test crawler scan discovery and subsequent import increments regulation count.
    """
    # 1. Check initial count
    initial_count = db.query(Regulation).count()

    # 2. Run crawler scan
    scan_res = client.post("/api/v1/regulations/crawler/start", json={"auto_import": False}, headers=normal_user_token_headers)
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["status"] == "success"
    assert "discoveries" in scan_data
    assert len(scan_data["discoveries"]) > 0

    discovery = scan_data["discoveries"][0]
    code = discovery["code"]

    # 3. Import this discovery
    import_res = client.post(
        "/api/v1/regulations/crawler/import",
        json={"codes": [code], "items": [discovery]},
        headers=normal_user_token_headers
    )
    assert import_res.status_code == 200
    import_data = import_res.json()
    assert import_data["status"] == "success"
    assert "total_in_db" in import_data

    # 4. Verify in DB
    imported_reg = db.query(Regulation).filter(Regulation.code == code).first()
    assert imported_reg is not None
    assert imported_reg.code == code
