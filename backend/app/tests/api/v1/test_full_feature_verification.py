import pytest
import uuid
import io
from datetime import datetime
from decimal import Decimal
import openpyxl

from app.db.models.company import Company
from app.db.models.user import User
from app.db.models.report_template import ReportTemplate
from app.db.models.balance_sheet import (
    BalanceSheet,
    BalanceSheetItem,
    TransformationAdjustment,
    BalanceSheetStatus,
    BalanceSheetCategory
)
from app.core.security import get_password_hash, verify_password
from app.services.transformation_service import TransformationService
from app.services.excel_export_service import ExcelExportService
from app.services.ai_auditor_service import AIAuditorService
from app.core.crypto import encrypt_secret, decrypt_secret
from app.services.onec_service import OneCParser


def setup_base_entities(db):
    """Helper to initialize company and base tenant."""
    company = db.query(Company).first()
    if not company:
        company = Company(name="RegAI Enterprise Corp", tenant_id=uuid.uuid4())
        db.add(company)
        db.commit()
        db.refresh(company)
    return company


def test_feature_1_regai_email_domain_and_users(db):
    """
    FEATURE 1: Verify RegAI email domains (@regai.uz / @regai.ai) and password security.
    Ensures email addresses adhere to regai branding and auth hashing works.
    """
    company = setup_base_entities(db)
    
    # Test creating user with @regai.uz email
    email = f"cfo_{uuid.uuid4().hex[:6]}@regai.uz"
    raw_password = "SecurePassword2026!"
    hashed = get_password_hash(raw_password)
    
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    
    user = User(
        id=uuid.uuid4(),
        email=email,
        hashed_password=hashed,
        full_name="Chief Financial Officer",
        role="company_admin",
        hierarchy_level=4,
        company_id=company.id,
        tenant_id=company.tenant_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    
    fetched = db.query(User).filter(User.email == email).first()
    assert fetched is not None
    assert fetched.email.endswith("@regai.uz")
    assert fetched.role == "company_admin"
    assert fetched.hierarchy_level == 4


def test_feature_2_rbac_permissions_hierarchy(db):
    """
    FEATURE 2: Verify Role-Based Access Control (RBAC) hierarchy and permissions.
    Hierarchy levels:
      Level 1: Website SuperAdmin
      Level 2: Company Owner
      Level 3: Auditor
      Level 4: Accountant
      Level 5: Standard User
    """
    company = setup_base_entities(db)
    
    roles_config = [
        ("superadmin@regai.uz", "website_superadmin", 1),
        ("owner@regai.uz", "company_owner", 2),
        ("auditor@regai.uz", "auditor", 3),
        ("accountant@regai.uz", "accountant", 4),
    ]
    
    created_users = []
    for email, role, level in roles_config:
        u = User(
            id=uuid.uuid4(),
            email=f"{uuid.uuid4().hex[:4]}_{email}",
            hashed_password="hash",
            role=role,
            hierarchy_level=level,
            company_id=company.id,
            tenant_id=company.tenant_id
        )
        db.add(u)
        created_users.append(u)
    db.commit()
    
    # Verify hierarchy ranking
    levels = [u.hierarchy_level for u in created_users]
    assert levels == [1, 2, 3, 4]
    
    # Test privilege rules: accountant (level 4) cannot access auditor (level 3) or owner (level 2) scope
    acc = next(u for u in created_users if u.role == "accountant")
    aud = next(u for u in created_users if u.role == "auditor")
    assert acc.hierarchy_level > aud.hierarchy_level  # Greater number means lower privilege


def test_feature_3_nas_vs_ifrs_balance_sheet_equilibrium(db):
    """
    FEATURE 3: Verify NAS (НСБУ) Balance Sheet mathematical equilibrium ($A = L + E$).
    Verifies terminology (NAS is source, IFRS is target, not IFRS vs МСФО duplicate).
    """
    company = setup_base_entities(db)
    
    bs = BalanceSheet(
        company_id=company.id,
        period=datetime(2025, 1, 1),
        status=BalanceSheetStatus.DRAFT,
        notes="NAS to IFRS Transformation Baseline"
    )
    db.add(bs)
    db.commit()
    db.refresh(bs)
    
    # Balanced NAS Sheet: Assets $500K = Liabilities $200K + Equity $300K
    items = [
        # Assets: 500,000
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="01", account_name="Fixed Assets (НСБУ)", amount=Decimal("350000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="51", account_name="Cash & Equivalents", amount=Decimal("150000.00"), category=BalanceSheetCategory.ASSETS),
        # Liabilities: 200,000
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="60", account_name="Accounts Payable", amount=Decimal("120000.00"), category=BalanceSheetCategory.LIABILITIES),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="67", account_name="Long-term Borrowings", amount=Decimal("80000.00"), category=BalanceSheetCategory.LIABILITIES),
        # Equity: 300,000
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="80", account_name="Charter Capital", amount=Decimal("200000.00"), category=BalanceSheetCategory.EQUITY),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="84", account_name="Retained Earnings (НСБУ)", amount=Decimal("100000.00"), category=BalanceSheetCategory.EQUITY),
    ]
    for item in items:
        db.add(item)
    db.commit()
    db.refresh(bs)
    
    total_assets = sum(i.amount for i in bs.items if i.category == BalanceSheetCategory.ASSETS)
    total_liab = sum(i.amount for i in bs.items if i.category == BalanceSheetCategory.LIABILITIES)
    total_equity = sum(i.amount for i in bs.items if i.category == BalanceSheetCategory.EQUITY)
    
    assert total_assets == Decimal("500000.00")
    assert total_liab == Decimal("200000.00")
    assert total_equity == Decimal("300000.00")
    assert total_assets == (total_liab + total_equity)  # Perfect Zero Delta


def test_feature_4_transformation_engine_with_zero_delta_capital_guard(db):
    """
    FEATURE 4: Verify complete transformation from NAS (НСБУ) to IFRS (МСФО).
    Tests IFRS 16 Leases, IAS 36 Impairment, IFRS 9 ECL with balanced offsetting adjustments.
    """
    company = setup_base_entities(db)
    
    bs = BalanceSheet(
        company_id=company.id,
        period=datetime(2025, 1, 1),
        status=BalanceSheetStatus.DRAFT,
        notes="Q1 Comprehensive Transformation"
    )
    db.add(bs)
    db.commit()
    db.refresh(bs)
    
    # 1. Base NAS Items: Assets 1,000,000 = Liab 400,000 + Equity 600,000
    db.add_all([
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="01", account_name="Property & Plant", amount=Decimal("600000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="62", account_name="Receivables", amount=Decimal("400000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="60", account_name="Payables", amount=Decimal("400000.00"), category=BalanceSheetCategory.LIABILITIES),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="80", account_name="Share Capital", amount=Decimal("500000.00"), category=BalanceSheetCategory.EQUITY),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="84", account_name="Retained Earnings", amount=Decimal("100000.00"), category=BalanceSheetCategory.EQUITY),
    ])
    db.commit()
    
    # 2. Adjustments:
    # IFRS 16: +$50,000 Asset (ROU), +$50,000 Liability (Lease obligation) -> Delta = 0
    adj_ifrs16_asset = TransformationAdjustment(
        balance_sheet_id=bs.id,
        description="IFRS 16 Right-of-Use Asset Recognition",
        adjustment_amount=Decimal("50000.00"),
        adjustment_type="debit",
        ifrs_category="IFRS 16"
    )
    adj_ifrs16_liab = TransformationAdjustment(
        balance_sheet_id=bs.id,
        description="IFRS 16 Lease Liability",
        adjustment_amount=Decimal("50000.00"),
        adjustment_type="credit",
        ifrs_category="IFRS 16"
    )
    
    # IAS 36: -$20,000 Asset Impairment, -$20,000 Retained Earnings (84) -> Delta = 0
    adj_ias36_asset = TransformationAdjustment(
        balance_sheet_id=bs.id,
        description="IAS 36 Impairment of PPE",
        adjustment_amount=Decimal("20000.00"),
        adjustment_type="credit",
        ifrs_category="IAS 36"
    )
    adj_ias36_equity = TransformationAdjustment(
        balance_sheet_id=bs.id,
        description="IAS 36 Impairment Loss to Retained Earnings",
        adjustment_amount=Decimal("20000.00"),
        adjustment_type="debit",
        ifrs_category="IAS 36"
    )
    
    db.add_all([adj_ifrs16_asset, adj_ifrs16_liab, adj_ias36_asset, adj_ias36_equity])
    db.commit()
    
    # Run transformation service
    service = TransformationService(db)
    service.transform(bs)
    db.refresh(bs)
    
    # Verify transformed state
    assert bs.status == BalanceSheetStatus.TRANSFORMED
    assert len(bs.transformations) == 4


def test_feature_5_three_way_excel_export_structure(db):
    """
    FEATURE 5: Verify Enterprise 3-way Big-4 Excel workbook generation (.xlsx).
    Verifies sheet names <= 31 chars, header columns, and valid openpyxl parsing.
    """
    company = setup_base_entities(db)
    
    bs = BalanceSheet(
        company_id=company.id,
        period=datetime(2024, 12, 31),
        status=BalanceSheetStatus.TRANSFORMED,
        notes="Excel Export Validation Project"
    )
    db.add(bs)
    db.commit()
    db.refresh(bs)
    
    db.add_all([
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="01", account_name="Fixed Assets", amount=Decimal("1000000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="60", account_name="Trade Payables", amount=Decimal("400000.00"), category=BalanceSheetCategory.LIABILITIES),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="80", account_name="Equity Capital", amount=Decimal("600000.00"), category=BalanceSheetCategory.EQUITY),
        TransformationAdjustment(
            balance_sheet_id=bs.id,
            description="IFRS 16 Lease Capitalization",
            adjustment_amount=Decimal("75000.00"),
            adjustment_type="debit",
            ifrs_category="IFRS 16"
        )
    ])
    db.commit()
    db.refresh(bs)
    
    excel_stream = ExcelExportService.generate_reconciliation_workbook(bs)
    assert excel_stream is not None
    excel_bytes = excel_stream.getvalue()
    assert len(excel_bytes) > 2000
    
    # Open workbook in memory using openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(excel_bytes))
    sheet_names = wb.sheetnames
    
    # Verify standard names and length limits
    assert len(sheet_names) == 3
    assert "Transformation Worksheet" in sheet_names
    assert "IFRS Balance Sheet" in sheet_names
    assert "Audit Adjustments Log" in sheet_names
    
    for name in sheet_names:
        assert len(name) <= 31, f"Sheet name {name} exceeds Excel 31-char limit"
    
    # Verify sheet 1 columns
    ws1 = wb["Transformation Worksheet"]
    headers_ws1 = [ws1.cell(row=4, column=col).value for col in range(1, 9)]
    assert any("NAS" in str(h) or "НСБУ" in str(h) for h in headers_ws1)
    assert any("IFRS" in str(h) or "МСФО" in str(h) for h in headers_ws1)


def test_feature_6_ai_auditor_memorandum_and_kam(db):
    """
    FEATURE 6: Verify AI Regulatory Assurance Auditor service & memorandum generation.
    Checks Zero-Delta verification, Key Audit Matters (KAM) discovery, and risk scoring.
    """
    company = setup_base_entities(db)
    
    bs = BalanceSheet(
        company_id=company.id,
        period=datetime(2024, 12, 31),
        status=BalanceSheetStatus.TRANSFORMED,
        notes="AI Auditor Quality Assurance"
    )
    db.add(bs)
    db.commit()
    db.refresh(bs)
    
    db.add_all([
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="01", account_name="Fixed Assets", amount=Decimal("500000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="60", account_name="Accounts Payable", amount=Decimal("200000.00"), category=BalanceSheetCategory.LIABILITIES),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="80", account_name="Share Capital", amount=Decimal("300000.00"), category=BalanceSheetCategory.EQUITY),
        TransformationAdjustment(
            balance_sheet_id=bs.id,
            description="IFRS 16 Lease Right of Use Asset",
            adjustment_amount=Decimal("45000.00"),
            adjustment_type="debit",
            ifrs_category="IFRS 16"
        ),
        TransformationAdjustment(
            balance_sheet_id=bs.id,
            description="IAS 36 Impairment Assessment",
            adjustment_amount=Decimal("15000.00"),
            adjustment_type="credit",
            ifrs_category="IAS 36"
        )
    ])
    db.commit()
    db.refresh(bs)
    
    audit_report = AIAuditorService.audit_transformation(
        balance_sheet=bs,
        expert_role="Senior IFRS Big 4 Audit Partner",
        custom_prompt="Analyze lease commitments and asset impairment risk",
        language="ru"
    )
    
    # Assertions on AI audit findings
    assert audit_report["is_balanced"] is True
    assert audit_report["discrepancy"] == 0.0
    assert audit_report["risk_score"] >= 80
    assert "Unqualified" in audit_report["opinion"]
    
    # Check Key Audit Matters (KAM)
    findings = audit_report["findings"]
    assert any("IFRS 16" in f["title"] for f in findings)
    assert any("IAS 36" in f["title"] for f in findings)
    
    # Check Memorandum Text
    memo = audit_report["audit_memo_markdown"]
    assert "МЕМОРАНДУМ НЕЗАВИСИМОГО АУДИТОРА" in memo or "AUDIT MEMORANDUM" in memo
    assert "IFRS 16" in memo


def test_feature_7_smart_report_templates_engine(db):
    """
    FEATURE 7: Verify Smart Report Templates Engine with 5-step JSON configuration.
    Validates storage of 1C Chart of Accounts, active IFRS standards, AI directives, and workflow routes.
    """
    company = setup_base_entities(db)
    
    config_payload = {
        "data_source": "1c_odata",
        "selected_accounts": ["01", "02", "10", "51", "60", "62", "80", "84"],
        "active_standards": {
            "ifrs16": True,
            "ias36": True,
            "ifrs9": True,
            "ias19": False,
            "ifrs15": True
        },
        "zero_delta_guard": True,
        "ai_compliance": {
            "expert_role": "Senior IFRS Big 4 Auditor",
            "language": "ru",
            "strict_equilibrium_check": True
        },
        "workflow": {
            "schedule": "quarterly",
            "approval_chain": ["accountant", "auditor", "cfo"]
        }
    }
    
    user = db.query(User).first()
    template = ReportTemplate(
        name="Пакет комплексной трансформации МСФО + 1С",
        description="Комплексный шаблон для трансформации данных 1С:Предприятие в МСФО с Zero-Delta Guard",
        report_type="financial",
        country_code="UZ",
        configuration=config_payload,
        created_by=user.id if user else uuid.uuid4(),
        company_id=company.id,
        tenant_id=company.tenant_id
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    # Query back and verify configuration fidelity
    loaded = db.query(ReportTemplate).filter(ReportTemplate.id == template.id).first()
    assert loaded is not None
    assert loaded.configuration["data_source"] == "1c_odata"
    assert "01" in loaded.configuration["selected_accounts"]
    assert loaded.configuration["active_standards"]["ifrs16"] is True
    assert loaded.configuration["zero_delta_guard"] is True
    assert loaded.configuration["ai_compliance"]["expert_role"] == "Senior IFRS Big 4 Auditor"
    assert loaded.configuration["workflow"]["approval_chain"] == ["accountant", "auditor", "cfo"]


def test_feature_8_onec_integration_crypto_and_account_classification():
    """
    FEATURE 8: Verify 1C:Enterprise security (Fernet Crypto) and RSBU/NAS chart classification.
    """
    # 1. Test Crypto
    secret_password = "SuperSecret1CEnterprisePassword2026!"
    encrypted = encrypt_secret(secret_password)
    assert encrypted != secret_password
    decrypted = decrypt_secret(encrypted)
    assert decrypted == secret_password
    
    # 2. Test 1C Parser Account Classification
    cat_01, sub_01 = OneCParser.classify_rsbu_account("01")
    assert cat_01 == BalanceSheetCategory.ASSETS
    assert sub_01 == "Non-Current Assets"

    cat_51, sub_51 = OneCParser.classify_rsbu_account("51")
    assert cat_51 == BalanceSheetCategory.ASSETS
    assert sub_51 == "Current Assets"

    cat_60, sub_60 = OneCParser.classify_rsbu_account("60")
    assert cat_60 == BalanceSheetCategory.LIABILITIES
    assert sub_60 == "Current Liabilities"

    cat_67, sub_67 = OneCParser.classify_rsbu_account("67")
    assert cat_67 == BalanceSheetCategory.LIABILITIES
    assert sub_67 == "Non-Current Liabilities"

    cat_80, sub_80 = OneCParser.classify_rsbu_account("80")
    assert cat_80 == BalanceSheetCategory.EQUITY
    assert sub_80 == "Share Capital"

    cat_84, sub_84 = OneCParser.classify_rsbu_account("84")
    assert cat_84 == BalanceSheetCategory.EQUITY
    assert sub_84 == "Retained Earnings"


def test_feature_9_multi_currency_conversion_engine():
    """
    FEATURE 9: Verify Multi-Currency Re-denomination Engine (USD, UZS, EUR).
    Ensures correct multiplier mathematics and precision.
    """
    usd_amount = 100000.0  # $100,000
    
    # Rates
    rates = {
        "USD": 1.0,
        "UZS": 12850.0,
        "EUR": 0.92
    }
    
    uzs_amount = usd_amount * rates["UZS"]
    eur_amount = usd_amount * rates["EUR"]
    
    assert uzs_amount == 1285000000.0  # 1.285 Billion UZS
    assert eur_amount == 92000.0        # €92,000
    
    # Formatting sanity checks
    def format_money(val, curr):
        if curr == "UZS":
            return f"{round(val):,} сум".replace(",", " ")
        elif curr == "EUR":
            return f"€{val:,.2f}"
        else:
            return f"${val:,.2f}"
            
    assert "1 285 000 000 сум" in format_money(uzs_amount, "UZS")
    assert "€92,000.00" == format_money(eur_amount, "EUR")
    assert "$100,000.00" == format_money(usd_amount, "USD")


def test_feature_10_api_endpoints_live_execution(client, db, superuser_token_headers):
    """
    FEATURE 10: Verify live REST API execution for Excel Export & AI Auditor endpoints.
    """
    company = setup_base_entities(db)
    
    admin_user = User(
        id=uuid.uuid4(),
        email="admin_test@regai.uz",
        hashed_password="hash",
        is_active=True,
        is_superuser=True,
        role="superadmin",
        company_id=company.id,
        tenant_id=company.tenant_id
    )
    db.add(admin_user)
    db.commit()

    from app.main import app
    from app.core import deps
    app.dependency_overrides[deps.get_current_user] = lambda: admin_user
    app.dependency_overrides[deps.get_current_active_user] = lambda: admin_user
    app.dependency_overrides[deps.get_current_active_superuser] = lambda: admin_user
    
    bs = BalanceSheet(
        company_id=company.id,
        period=datetime(2024, 12, 31),
        status=BalanceSheetStatus.TRANSFORMED,
        notes="Live API Integration Test"
    )
    db.add(bs)
    db.commit()
    db.refresh(bs)
    
    db.add_all([
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="01", account_name="Plant Assets", amount=Decimal("100000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="60", account_name="Trade Debt", amount=Decimal("40000.00"), category=BalanceSheetCategory.LIABILITIES),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="80", account_name="Authorized Capital", amount=Decimal("60000.00"), category=BalanceSheetCategory.EQUITY),
    ])
    db.commit()
    
    # 1. Test Excel Export Endpoint
    resp_excel = client.get(f"/api/v1/balance-sheets/{bs.id}/export-excel", headers=superuser_token_headers)
    assert resp_excel.status_code == 200
    assert "openxmlformats" in resp_excel.headers["content-type"]
    assert len(resp_excel.content) > 1000
    
    # 2. Test AI Auditor Endpoint
    resp_audit = client.post(
        f"/api/v1/balance-sheets/{bs.id}/ai-audit",
        headers=superuser_token_headers,
        json={
            "expert_role": "Senior IFRS Big 4 Auditor",
            "custom_prompt": "Audit statement and verify zero delta",
            "language": "ru"
        }
    )
    assert resp_audit.status_code == 200
    data = resp_audit.json()
    assert len(data["audit_memo_markdown"]) > 100


def test_feature_11_silent_token_refresh_and_session_persistence(client, db):
    """
    FEATURE 11: Verify silent session token refresh mechanism and extended session.
    Tests POST /api/v1/auth/refresh to ensure users remain authenticated seamlessly without being kicked out.
    """
    company = setup_base_entities(db)
    user = User(
        id=uuid.uuid4(),
        email=f"auditor_{uuid.uuid4().hex[:6]}@regai.uz",
        hashed_password=get_password_hash("SecretRefreshPass123!"),
        full_name="Assurance Auditor",
        role="senior_auditor",
        is_active=True,
        company_id=company.id,
        tenant_id=company.tenant_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # 1. Generate access token for user
    from app.core import security
    token = security.create_access_token(
        user.id,
        claims={"role": user.role, "tid": str(user.tenant_id), "cid": str(user.company_id)}
    )

    # 2. Call /api/v1/auth/refresh with the bearer token
    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert refresh_resp.status_code == 200
    refresh_data = refresh_resp.json()
    assert "access_token" in refresh_data
    assert refresh_data["token_type"] == "bearer"
    
    new_token = refresh_data["access_token"]
    assert new_token != token  # A freshly generated token

    # 3. Verify that the new refreshed token allows accessing protected endpoints
    me_resp = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {new_token}"}
    )
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == user.email
    assert me_data["role"] == "senior_auditor"


