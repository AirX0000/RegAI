import hashlib
import json
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models.user import User
from app.db.models.tenant import Tenant
from app.db.models.audit_log import AuditLog


def test_audit_export_headers_and_checksum(client: TestClient, superuser_token_headers: dict, db: Session):
    # Ensure tenant exists or fetch one
    tenant = db.query(Tenant).first()
    if not tenant:
        tenant = Tenant(id=uuid.uuid4(), name="Test Audit Tenant")
        db.add(tenant)
        db.commit()

    log = AuditLog(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        action="test_action",
        resource_type="balance_sheet",
        details=json.dumps({"info": "integrity test"}),
        ip_address="127.0.0.1"
    )
    db.add(log)
    db.commit()

    response = client.get("/api/v1/audit-logs/export", headers=superuser_token_headers)
    assert response.status_code == 200
    assert "X-Audit-Checksum-SHA256" in response.headers
    assert "X-Audit-Record-Count" in response.headers
    
    checksum = response.headers["X-Audit-Checksum-SHA256"]
    content_bytes = response.content
    calculated = hashlib.sha256(content_bytes).hexdigest()
    assert checksum == calculated


def test_audit_verify_export_endpoint(client: TestClient, superuser_token_headers: dict):
    sample_text = "ID,Timestamp,User Email,Action\n1,2026-10-05,admin@example.com,create\n"
    valid_sha256 = hashlib.sha256(sample_text.encode('utf-8')).hexdigest()

    # Test valid verification
    verify_resp = client.post(
        "/api/v1/audit-logs/verify-export",
        headers=superuser_token_headers,
        json={
            "content": sample_text,
            "expected_sha256": valid_sha256
        }
    )
    assert verify_resp.status_code == 200
    data = verify_resp.json()
    assert data["valid"] is True
    assert "Document has not been altered" in data["message"]

    # Test invalid verification (tampered content)
    tampered_resp = client.post(
        "/api/v1/audit-logs/verify-export",
        headers=superuser_token_headers,
        json={
            "content": sample_text + "HACKED_LINE",
            "expected_sha256": valid_sha256
        }
    )
    assert tampered_resp.status_code == 200
    tampered_data = tampered_resp.json()
    assert tampered_data["valid"] is False
    assert "Integrity verification failed" in tampered_data["message"]
