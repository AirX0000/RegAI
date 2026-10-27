from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ias12_asset_taxable_dtl():
    """
    Test IAS 12 for an asset where Carrying Amount > Tax Base.
    Expected: Taxable Temporary Difference -> DTL (ОНО)
    """
    response = client.post(
        "/api/v1/calculators/ias12",
        json={
            "carrying_amount": 10000000.0,
            "tax_base": 8000000.0,
            "tax_rate_percentage": 15.0,
            "category": "asset",
            "item_description": "Fixed Asset Revaluation under IFRS"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["temporary_difference"] == 2000000.0
    assert data["difference_type"] == "taxable"
    assert data["deferred_tax_type"] == "DTL"
    assert data["deferred_tax_amount"] == 300000.0
    assert "Кт 77" in data["journal_credit"]

def test_ias12_asset_deductible_dta():
    """
    Test IAS 12 for an asset where Carrying Amount < Tax Base (e.g. IAS 36 Impairment).
    Expected: Deductible Temporary Difference -> DTA (ОНА)
    """
    response = client.post(
        "/api/v1/calculators/ias12",
        json={
            "carrying_amount": 7500000.0,
            "tax_base": 10000000.0,
            "tax_rate_percentage": 20.0,
            "category": "asset",
            "item_description": "Impairment of Equipment under IAS 36"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["temporary_difference"] == 2500000.0
    assert data["difference_type"] == "deductible"
    assert data["deferred_tax_type"] == "DTA"
    assert data["deferred_tax_amount"] == 500000.0
    assert "Дт 09" in data["journal_debit"]

def test_ias12_liability_deductible_dta():
    """
    Test IAS 12 for a liability where Carrying Amount > Tax Base (e.g. Accrued provision not deductible until paid).
    Expected: Deductible Temporary Difference -> DTA (ОНА)
    """
    response = client.post(
        "/api/v1/calculators/ias12",
        json={
            "carrying_amount": 1200000.0,
            "tax_base": 0.0,
            "tax_rate_percentage": 15.0,
            "category": "liability",
            "item_description": "Warranty Provision"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["temporary_difference"] == 1200000.0
    assert data["difference_type"] == "deductible"
    assert data["deferred_tax_type"] == "DTA"
    assert data["deferred_tax_amount"] == 180000.0
