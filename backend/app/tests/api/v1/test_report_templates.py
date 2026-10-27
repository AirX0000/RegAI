import pytest
import uuid
from app.db.models.report_template import ReportTemplate
from app.db.models.company import Company
from app.db.models.user import User

def test_report_template_model_configuration(db):
    # Test creating a template with rich 5-step configuration
    company = db.query(Company).first()
    if not company:
        tenant_id = uuid.uuid4()
        company = Company(name="Test Company", tenant_id=tenant_id)
        db.add(company)
        db.commit()

    user = db.query(User).first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            email="accountant@regai.uz",
            hashed_password="hashed_pw",
            company_id=company.id,
            tenant_id=company.tenant_id,
            role="accountant"
        )
        db.add(user)
        db.commit()

    assert company is not None
    assert user is not None

    smart_config = {
        "source_standard": "NAS",
        "target_standard": "IFRS",
        "data_source_type": "onec_sync",
        "required_accounts": ["01", "02", "60", "67", "84"],
        "active_standards": ["IFRS 16", "IAS 36", "IFRS 9"],
        "enforce_zero_delta": True,
        "ai_audit_enabled": True,
        "ai_expert_role": "Senior IFRS Big 4 Auditor",
        "ai_prompt": "Проверь классификацию договоров аренды по МСФО 16 и сходимость капитала.",
        "risk_triggers": ["unbalanced_equity", "undisclosed_lease_terms"],
        "approval_chain": ["accountant", "auditor", "admin"]
    }

    template = ReportTemplate(
        id=uuid.uuid4(),
        name="Test IFRS 16 Smart Template",
        description="Automated lease transformation pack",
        report_type="financial",
        country_code="UZ",
        tax_types=["vat", "corporate"],
        configuration=smart_config,
        is_recurring=True,
        recurrence_pattern="quarterly",
        created_by=user.id,
        company_id=company.id,
        tenant_id=company.tenant_id
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    assert template.configuration is not None
    assert template.configuration["source_standard"] == "NAS"
    assert template.configuration["target_standard"] == "IFRS"
    assert "IFRS 16" in template.configuration["active_standards"]
    assert template.configuration["enforce_zero_delta"] is True
    assert template.configuration["ai_audit_enabled"] is True


def test_templates_api_create_and_list(client, superuser_token_headers, db):
    payload = {
        "name": "API Created Smart Template",
        "description": "Template created through API",
        "report_type": "financial",
        "country_code": "UZ",
        "tax_types": ["vat", "corporate"],
        "is_recurring": True,
        "recurrence_pattern": "quarterly",
        "configuration": {
            "source_standard": "NAS",
            "target_standard": "IFRS",
            "data_source_type": "onec_sync",
            "required_accounts": ["01", "02", "60", "67", "84"],
            "strict_validation": True,
            "active_standards": ["IFRS 16", "IAS 36", "IFRS 9"],
            "enforce_zero_delta": True,
            "ai_audit_enabled": True,
            "ai_expert_role": "Senior IFRS Big 4 Auditor",
            "ai_prompt": "Проверь классификацию договоров аренды",
            "risk_triggers": ["unbalanced_equity"],
            "output_language": "ru",
            "approval_chain": ["accountant", "auditor", "admin"]
        }
    }
    create_res = client.post("/api/v1/templates/", json=payload, headers=superuser_token_headers)
    assert create_res.status_code == 200, create_res.text
    created = create_res.json()
    assert created["name"] == "API Created Smart Template"
    assert created["configuration"]["target_standard"] == "IFRS"

    list_res = client.get("/api/v1/templates/", headers=superuser_token_headers)
    assert list_res.status_code == 200
    items = list_res.json()
    assert isinstance(items, list)
    assert any(t["name"] == "API Created Smart Template" for t in items)

    # Test use endpoint
    template_id = created["id"]
    use_res = client.post(f"/api/v1/templates/{template_id}/use", headers=superuser_token_headers)
    assert use_res.status_code == 200
    use_data = use_res.json()
    assert use_data["template_name"] == "API Created Smart Template"

