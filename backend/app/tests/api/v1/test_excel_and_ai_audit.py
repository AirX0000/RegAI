import pytest
import uuid
from datetime import datetime
from decimal import Decimal
from app.db.models.balance_sheet import BalanceSheet, BalanceSheetItem, TransformationAdjustment, BalanceSheetStatus, BalanceSheetCategory
from app.db.models.company import Company
from app.db.models.user import User
from app.services.transformation_service import TransformationService
from app.services.excel_export_service import ExcelExportService
from app.services.ai_auditor_service import AIAuditorService


def test_excel_export_and_ai_audit_service(db):
    company = db.query(Company).first()
    if not company:
        company = Company(name="FinBridge Corporation", tenant_id=uuid.uuid4())
        db.add(company)
        db.commit()

    user = db.query(User).first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            email="auditor@regai.uz",
            hashed_password="hash",
            company_id=company.id,
            tenant_id=company.tenant_id,
            role="auditor"
        )
        db.add(user)
        db.commit()

    bs = BalanceSheet(
        company_id=company.id,
        period=datetime(2024, 12, 31),
        status=BalanceSheetStatus.DRAFT,
        notes="Audit test balance sheet"
    )
    db.add(bs)
    db.commit()
    db.refresh(bs)

    # Add sample items: Assets $120M = Liabilities $70M + Equity $50M
    items = [
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="01", account_name="Fixed Assets", amount=Decimal("50000000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="51", account_name="Cash and Equivalents", amount=Decimal("70000000.00"), category=BalanceSheetCategory.ASSETS),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="60", account_name="Accounts Payable", amount=Decimal("70000000.00"), category=BalanceSheetCategory.LIABILITIES),
        BalanceSheetItem(balance_sheet_id=bs.id, account_code="80", account_name="Share Capital", amount=Decimal("50000000.00"), category=BalanceSheetCategory.EQUITY),
    ]
    for item in items:
        db.add(item)
    db.commit()

    # Add adjustments: IFRS 16 (+10M Asset, +10M Liab)
    adj_rou = TransformationAdjustment(
        balance_sheet_id=bs.id,
        description="IFRS 16 Right-of-Use Asset recognition",
        adjustment_amount=Decimal("10000000.00"),
        adjustment_type="debit",
        ifrs_category="IFRS 16"
    )
    adj_liab = TransformationAdjustment(
        balance_sheet_id=bs.id,
        description="IFRS 16 Lease Liability recognition",
        adjustment_amount=Decimal("10000000.00"),
        adjustment_type="credit",
        ifrs_category="IFRS 16"
    )
    db.add(adj_rou)
    db.add(adj_liab)
    db.commit()

    # Transform
    service = TransformationService(db)
    service.transform(bs)
    db.refresh(bs)

    # 1. Test Excel Export
    excel_stream = ExcelExportService.generate_reconciliation_workbook(bs)
    assert excel_stream is not None
    excel_bytes = excel_stream.getvalue()
    assert len(excel_bytes) > 1000
    assert excel_bytes.startswith(b"PK")  # ZIP container header for .xlsx

    # 2. Test AI Auditor
    audit_res = AIAuditorService.audit_transformation(
        balance_sheet=bs,
        expert_role="Senior IFRS Big 4 Audit Partner",
        custom_prompt="Verify lease accounting and zero delta",
        language="ru"
    )
    assert audit_res["is_balanced"] is True
    assert audit_res["discrepancy"] == 0.0
    assert "Unqualified" in audit_res["opinion"]
    assert audit_res["risk_score"] > 90
    assert len(audit_res["findings"]) > 0
    assert "AUDIT MEMORANDUM" in audit_res["audit_memo_markdown"]
