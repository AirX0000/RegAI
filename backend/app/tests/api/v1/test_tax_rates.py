from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date

from app.db.models.tax_rate import TaxRate

def test_get_countries(client: TestClient, normal_user_token_headers, db: Session):
    # Create a tax rate to ensure we have data
    tax_rate = TaxRate(
        country_code="US",
        country_name="United States",
        tax_type="vat",
        rate=20.0,
        effective_from=date(2023, 1, 1)
    )
    db.add(tax_rate)
    db.commit()

    response = client.get("/api/v1/tax-rates/countries", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["code"] == "US"

def test_get_country_rates(client: TestClient, normal_user_token_headers, db: Session):
    tax_rate = TaxRate(
        country_code="DE",
        country_name="Germany",
        tax_type="vat",
        rate=19.0,
        effective_from=date(2023, 1, 1)
    )
    db.add(tax_rate)
    db.commit()

    response = client.get("/api/v1/tax-rates/DE", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["country_code"] == "DE"
    assert len(data["rates"]) >= 1
    assert float(data["rates"][0]["rate"]) == 19.0

def test_update_tax_rate(client: TestClient, superuser_token_headers, db: Session):
    tax_rate = TaxRate(
        country_code="FR",
        country_name="France",
        tax_type="vat",
        rate=20.0,
        effective_from=date(2023, 1, 1)
    )
    db.add(tax_rate)
    db.commit()
    
    rate_id = str(tax_rate.id)
    
    update_data = {
        "rate": 21.5,
        "description": "Updated rate"
    }
    
    # This endpoint is not implemented yet, so we expect 404 or 405 initially
    # But we are writing the test for the desired behavior
    response = client.put(f"/api/v1/tax-rates/{rate_id}", json=update_data, headers=superuser_token_headers)
    
    # Assert success (will fail initially)
    assert response.status_code == 200
    data = response.json()
    assert float(data["rate"]) == 21.5
    assert data["description"] == "Updated rate"
    
    # Verify in DB
    db.refresh(tax_rate)
    assert float(tax_rate.rate) == 21.5
