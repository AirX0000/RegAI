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
