import pytest
import io
import uuid
from decimal import Decimal
from fastapi.testclient import TestClient

from app.services.file_parser_service import FileParserService
from app.db.models.company import Company
from app.db.models.user import User
from app.db.models.balance_sheet import BalanceSheet, BalanceSheetItem


USER_CSV_CONTENT = """Account_Code,Account_Name,Subkonto,Debit,Credit
0110,Здания и сооружения (Офис),Головной офис,4500000000,0
0210,Износ зданий и сооружений,Линейная амортизация,0,450000000
0804,Приобретение права пользования активом,Договор аренды склад №4,0,0
4010,Дебиторская задолженность покупателей,Контрагенты СНГ,3200000000,0
5110,Расчетные счета (UZS),Основной счет,1850000000,0
6010,Кредиторская задолженность поставщикам,Поставщики сырья,0,1950000000
6310,Резерв по сомнительным долгам,Общий резерв,0,80000000
7607,Обязательства по аренде (IFRS 16),Аренда склад №4,0,0
8510,Уставный капитал,Оплаченный капитал,0,6000000000
8710,Нераспределенная прибыль,Прибыль прошлых лет,0,1070000000
"""


def test_user_trial_balance_csv_parsing():
    """
    Test that the exact trial balance CSV provided by user (1C/OSV format with Debit/Credit)
    is successfully parsed, account codes keep leading zeros, categories are inferred,
    and balance equilibrium (Assets = Liabilities + Equity) holds.
    """
    parser = FileParserService()
    raw_bytes = USER_CSV_CONTENT.encode("utf-8")
    result = parser.parse_file(raw_bytes, "trial_balance_1c.csv")

    assert result["success"] is True
    assert result["total_rows"] == 10
    assert result["valid_rows"] == 10
    assert len(result["items"]) == 10

    # Verify preserved leading zeros
    account_codes = [item["account_code"] for item in result["items"]]
    assert "0110" in account_codes
    assert "0210" in account_codes
    assert "0804" in account_codes
    assert "4010" in account_codes
    assert "5110" in account_codes
    assert "6010" in account_codes
    assert "8510" in account_codes

    # Verify financial math
    balance_check = result["balance_check"]
    assert balance_check["is_balanced"] is True
    assert balance_check["total_assets"] == 9550000000.0
    assert balance_check["total_liabilities"] == 2480000000.0
    assert balance_check["total_equity"] == 7070000000.0
    assert balance_check["difference"] == 0.0


def test_balance_sheet_upload_and_confirm(client: TestClient, db):
    """
    Test uploading user CSV trial balance via the API endpoint and confirming it.
    """
    from app.main import app
    from app.core.deps import get_current_user

    tenant_id = uuid.uuid4()
    company = Company(name="Test Co", tenant_id=tenant_id)
    db.add(company)
    db.commit()
    db.refresh(company)

    mock_user = User(
        id=uuid.uuid4(),
        email="test_cfo@regai.uz",
        is_active=True,
        is_superuser=True,
        role="superadmin",
        hierarchy_level=1,
        company_id=company.id,
        tenant_id=tenant_id
    )

    app.dependency_overrides[get_current_user] = lambda: mock_user

    try:
        # 1. Upload preview
        file_payload = ("trial_balance_1c.csv", USER_CSV_CONTENT.encode("utf-8"), "text/csv")
        response = client.post(
            "/api/v1/balance-sheets/upload",
            files={"file": file_payload},
            headers={"Authorization": "Bearer mock_token"}
        )
        assert response.status_code == 200, response.text
        preview_data = response.json()
        assert preview_data["success"] is True
        assert preview_data["valid_rows"] == 10
        assert preview_data["balance_check"]["is_balanced"] is True

        # 2. Confirm upload
        confirm_response = client.post(
            "/api/v1/balance-sheets/upload/confirm",
            json=preview_data["items"],
            headers={"Authorization": "Bearer mock_token"}
        )
        assert confirm_response.status_code == 200, confirm_response.text
        confirm_data = confirm_response.json()
        assert confirm_data["success"] is True
        assert confirm_data["items_count"] == 10
        bs_id = confirm_data["balance_sheet_id"]

        # Verify in DB
        bs = db.query(BalanceSheet).filter(BalanceSheet.id == uuid.UUID(bs_id)).first()
        assert bs is not None
        items = db.query(BalanceSheetItem).filter(BalanceSheetItem.balance_sheet_id == uuid.UUID(bs_id)).all()
        assert len(items) == 10

        # 3. Test PUT /api/v1/balance-sheets/{id} (edit balance sheet)
        put_response = client.put(
            f"/api/v1/balance-sheets/{bs_id}",
            json={
                "notes": "Updated by user editor test",
                "status": "draft",
                "items": [
                    {
                        "account_code": "1010",
                        "account_name": "Updated Cash Account",
                        "amount": 550000.00,
                        "category": "assets",
                        "subcategory": "Current Assets"
                    }
                ]
            },
            headers={"Authorization": "Bearer mock_token"}
        )
        assert put_response.status_code == 200, put_response.text
        updated_data = put_response.json()
        assert updated_data["notes"] == "Updated by user editor test"
        
        # Verify updated items in DB
        updated_items = db.query(BalanceSheetItem).filter(BalanceSheetItem.balance_sheet_id == uuid.UUID(bs_id)).all()
        assert len(updated_items) == 1
        assert updated_items[0].account_code == "1010"
        assert updated_items[0].account_name == "Updated Cash Account"
    finally:
        app.dependency_overrides.pop(get_current_user, None)

