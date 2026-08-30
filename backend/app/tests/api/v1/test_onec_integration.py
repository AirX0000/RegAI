import pytest
import uuid
import json
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models.company import Company
from app.db.models.balance_sheet import BalanceSheet, BalanceSheetItem, TransformationAdjustment, BalanceSheetStatus, BalanceSheetCategory
from app.db.models.onec_connection import OneCConnection
from app.db.models.onec_sync_log import OneCSyncLog
from app.core.crypto import encrypt_secret, decrypt_secret
from app.services.onec_service import OneCParser, OneCClient, OneCService
from app.db.schemas.onec import TrialBalanceFilterRequest, ExportAdjustmentsRequest


def test_crypto_fernet_encryption():
    plain = "SuperSecret1C_Passw0rd!"
    encrypted = encrypt_secret(plain)
    assert encrypted != plain
    decrypted = decrypt_secret(encrypted)
    assert decrypted == plain
    assert decrypt_secret(None) is None


def test_onec_parser_rsbu_classification():
    # Test assets
    cat_01, sub_01 = OneCParser.classify_rsbu_account("01.01")
    assert cat_01 == BalanceSheetCategory.ASSETS
    assert sub_01 == "Non-Current Assets"

    cat_51, sub_51 = OneCParser.classify_rsbu_account("51")
    assert cat_51 == BalanceSheetCategory.ASSETS
    assert sub_51 == "Current Assets"

    cat_62, sub_62 = OneCParser.classify_rsbu_account("62.01")
    assert cat_62 == BalanceSheetCategory.ASSETS

    # Test liabilities
    cat_60, sub_60 = OneCParser.classify_rsbu_account("60.01")
    assert cat_60 == BalanceSheetCategory.LIABILITIES

    cat_67, sub_67 = OneCParser.classify_rsbu_account("67.01")
    assert cat_67 == BalanceSheetCategory.LIABILITIES
    assert sub_67 == "Non-Current Liabilities"

    # Test equity
    cat_80, sub_80 = OneCParser.classify_rsbu_account("80.01")
    assert cat_80 == BalanceSheetCategory.EQUITY
    assert sub_80 == "Share Capital"


def test_onec_parser_odata_normalization():
    sample_odata = {
        "value": [
            {
                "Счет_Code": "01.01",
                "Account_Description": "Основные средства",
                "СуммаКонечныйОстатокДт": 500000.0,
                "СуммаКонечныйОстатокКт": 0.0
            },
            {
                "Счет_Code": "60.01",
                "Account_Description": "Поставщики",
                "СуммаКонечныйОстатокДт": 0.0,
                "СуммаКонечныйОстатокКт": 200000.0
            },
            {
                "Счет_Code": "80.01",
                "Account_Description": "Уставный капитал",
                "СуммаКонечныйОстатокДт": 0.0,
                "СуммаКонечныйОстатокКт": 300000.0
            }
        ]
    }
    lines = OneCParser.normalize_trial_balance(sample_odata)
    assert len(lines) == 3
    assert lines[0].account_code == "01.01"
    assert lines[0].category == "assets"
    assert lines[0].net_closing_balance == 500000.0

    assert lines[1].account_code == "60.01"
    assert lines[1].category == "liabilities"
    assert lines[1].net_closing_balance == 200000.0

    assert lines[2].account_code == "80.01"
    assert lines[2].category == "equity"
    assert lines[2].net_closing_balance == 300000.0


def test_onec_api_config_and_test(client: TestClient, superuser_token_headers, db: Session):
    # Create test company
    tenant_id = uuid.uuid4()
    company = Company(name="1C Test Enterprise", tenant_id=tenant_id)
    db.add(company)
    db.commit()

    # 1. Save Connection Config
    config_payload = {
        "url": "http://1c-mock.local/base/odata/standard.odata/",
        "auth_type": "basic",
        "username": "odata_admin",
        "password": "Password123!",
        "company_code": "ORG-001",
        "verify_ssl": False
    }
    response = client.post(
        "/api/v1/integrations/1c/config",
        json=config_payload,
        headers=superuser_token_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "http://1c-mock.local/base/odata/standard.odata/"
    assert data["has_password"] is True
    assert "password" not in data or data.get("password") is None

    # 2. Get Connection Config
    get_res = client.get("/api/v1/integrations/1c/config", headers=superuser_token_headers)
    assert get_res.status_code == 200
    assert get_res.json()["company_code"] == "ORG-001"

    # 3. Test Connection Ping
    test_res = client.post(
        "/api/v1/integrations/1c/test",
        json={"url": "http://localhost:8000/mock/1c/odata/standard.odata/"},
        headers=superuser_token_headers
    )
    assert test_res.status_code == 200
    test_data = test_res.json()
    assert test_data["success"] is True
    assert test_data["status"] == "connected"
    assert test_data["latency_ms"] is not None


def test_onec_api_sync_and_export_flow(client: TestClient, superuser_token_headers, db: Session):
    tenant_id = uuid.uuid4()
    company = Company(name="1C Flow Co", tenant_id=tenant_id)
    db.add(company)
    db.commit()

    # Configure connection
    conn = OneCConnection(
        id=uuid.uuid4(),
        company_id=company.id,
        url="http://mock.1c.local/odata/standard.odata/",
        username="admin",
        company_code="FLOW-01"
    )
    conn.set_password("pass")
    db.add(conn)
    db.commit()

    # 1. Trigger Trial Balance Sync
    sync_res = client.post(
        "/api/v1/integrations/1c/sync-trial-balance",
        json={"auto_populate_balance_sheet": True, "notes": "Automated 1C Test Import"},
        headers=superuser_token_headers
    )
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["success"] is True
    assert sync_data["total_accounts"] > 0
    assert sync_data["balance_sheet_id"] is not None
    bs_id = uuid.UUID(sync_data["balance_sheet_id"])

    # Verify balance sheet created in DB
    bs = db.query(BalanceSheet).filter(BalanceSheet.id == bs_id).first()
    assert bs is not None
    assert len(bs.items) > 0

    # 2. Add an IFRS Adjustment to this balance sheet
    adj = TransformationAdjustment(
        id=uuid.uuid4(),
        balance_sheet_id=bs_id,
        description="IFRS 16 Lease Capitalization Adjustment",
        adjustment_amount=150000.0,
        adjustment_type="debit",
        ifrs_category="Leases"
    )
    db.add(adj)
    db.commit()

    # 3. Export Adjustments back to 1C
    export_res = client.post(
        "/api/v1/integrations/1c/export-adjustments",
        json={"balance_sheet_id": str(bs_id), "document_comment": "IFRS Export Audit Test"},
        headers=superuser_token_headers
    )
    assert export_res.status_code == 200
    exp_data = export_res.json()
    assert exp_data["success"] is True
    assert exp_data["exported_adjustments_count"] == 1
    assert exp_data["document_number_1c"] is not None

    # 4. Fetch Sync Logs
    logs_res = client.get("/api/v1/integrations/1c/logs", headers=superuser_token_headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 2
    types = [l["sync_type"] for l in logs]
    assert "sync_trial_balance" in types
    assert "export_adjustments" in types
