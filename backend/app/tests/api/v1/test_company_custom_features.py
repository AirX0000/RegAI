import pytest
import uuid
from app.db.models.company import Company
from app.db.models.tenant import Tenant
from app.db.schemas.company import CompanyCreate, CompanyUpdate, CompanyProfile


def test_company_custom_features_outside_plan(db):
    """
    Test creating and updating company with custom add-on features outside the subscription plan.
    Allows enabling individual modules (e.g. white_label, ai_auditor, onec_sync) regardless of tier.
    """
    # 1. Ensure a tenant exists
    tenant = db.query(Tenant).first()
    if not tenant:
        tenant = Tenant(id=uuid.uuid4(), name="Primary Tenant")
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

    comp_id = uuid.uuid4()
    company = Company(
        id=comp_id,
        name=f"Addon Enterprise {uuid.uuid4().hex[:6]}",
        domain="addon.uz",
        plan="free",
        custom_features=["white_label", "ai_auditor"],
        tenant_id=tenant.id,
        is_active=True
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    assert company.plan == "free"
    assert "white_label" in company.custom_features
    assert "ai_auditor" in company.custom_features
    assert len(company.custom_features) == 2

    # 2. Update with additional features outside tariff
    updated_features = list(company.custom_features) + ["onec_sync", "ias12_tax", "bespoke_connector"]
    company.custom_features = updated_features
    db.commit()
    db.refresh(company)

    assert "onec_sync" in company.custom_features
    assert "ias12_tax" in company.custom_features
    assert "bespoke_connector" in company.custom_features
    assert len(company.custom_features) == 5

    # 3. Test Pydantic schema validation
    profile = CompanyProfile.from_orm(company)
    assert profile.plan == "free"
    assert profile.custom_features == updated_features
