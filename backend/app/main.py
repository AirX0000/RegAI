import time
import uuid
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from prometheus_client import make_asgi_app
from alembic.config import Config
from alembic import command

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.rate_limit import check_rate_limit
from app.api.v1 import api_router
from app.rag.scheduler import start_scheduler

setup_logging()
logger = logging.getLogger(__name__)

# Maximum allowed payload size: 35 MB (for Excel / OCR document uploads)
MAX_CONTENT_LENGTH = 35 * 1024 * 1024

def run_migrations():
    """Run database migrations on startup"""
    try:
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Database migrations completed successfully")
    except Exception as e:
        error_msg = str(e)
        if "already exists" in error_msg.lower():
            logger.warning("Migration skipped - tables already exist")
        else:
            logger.error(f"Error running database migrations: {e}")

def ensure_db_schema():
    """Universal defensive schema self-healing for SQLite and PostgreSQL:
    inspects all tables in Base.metadata and dynamically creates missing columns.
    """
    try:
        import app.db.base  # ensure all models are registered in Base.metadata
        from app.db.session import engine, Base
        from sqlalchemy import inspect, text

        # 1. Ensure all tables exist
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Base.metadata.create_all verified successfully")
        except Exception as ce:
            logger.warning(f"Base.metadata.create_all notice: {ce}")

        # 2. Inspect existing database tables and check for missing columns
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())

        with engine.connect() as conn:
            for table_name, table in Base.metadata.tables.items():
                if table_name not in existing_tables:
                    continue

                try:
                    db_cols = {col["name"] for col in inspector.get_columns(table_name)}
                except Exception as e:
                    logger.warning(f"Could not inspect table {table_name}: {e}")
                    continue

                for col in table.columns:
                    if col.name not in db_cols:
                        type_str = str(col.type).lower()
                        if "int" in type_str:
                            col_type_str = "INTEGER"
                        elif "bool" in type_str:
                            col_type_str = "BOOLEAN DEFAULT 0"
                        elif "float" in type_str or "numeric" in type_str or "real" in type_str:
                            col_type_str = "REAL"
                        elif "datetime" in type_str or "timestamp" in type_str:
                            col_type_str = "DATETIME"
                        elif "json" in type_str:
                            col_type_str = "JSON"
                        else:
                            col_type_str = "TEXT"

                        try:
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type_str}"))
                            conn.commit()
                            logger.info(f"Schema self-healing: Added missing column {table_name}.{col.name} ({col_type_str})")
                        except Exception as add_err:
                            logger.warning(f"Could not add column {table_name}.{col.name}: {add_err}")

            # Specific column data backfills
            try:
                conn.execute(text("UPDATE audit_logs SET timestamp = created_at WHERE timestamp IS NULL AND created_at IS NOT NULL"))
                conn.commit()
            except Exception:
                pass

            try:
                conn.execute(text("UPDATE users SET preferences = '{}' WHERE preferences IS NULL"))
                conn.commit()
            except Exception:
                pass

    except Exception as e:
        logger.warning(f"Universal schema self-healing warning: {e}")

def ensure_demo_data():
    """Ensure complete, rich demo environment exists and is fully populated on every startup:
    - Tenants, Companies (FinBridge Capital, MediCorp International, LogiTrans Global)
    - Demo users across all role levels with password FinBridge2026!
    - Bilingual Regulations (Basel III, IFRS 9, ISA audit standards, Uzbekistan laws, GDPR, etc.)
    - 1C:Enterprise Connections & Sync Logs
    - Balanced Trial Balances (RSBU 01, 02, 10, 41, 51, 60, 62, 70, 80, 84)
    - IFRS Transformations & Adjustments (IFRS 16 Lease, IAS 36 Impairment, IFRS 9 ECL)
    - Compliance Alerts across all severity levels
    - Compliance & Audit Reports
    - OCR Financial Documents with JSON extracted metadata
    - Tax Rates (Uzbekistan, Russia, Kazakhstan)
    - Security & Operational Audit Logs
    """
    try:
        from app.db.session import SessionLocal
        from app.core.security import get_password_hash
        from app.core.crypto import encrypt_secret
        from app.db.models.tenant import Tenant
        from app.db.models.company import Company
        from app.db.models.user import User
        from app.db.models.regulation import Regulation
        from app.db.models.onec_connection import OneCConnection
        from app.db.models.onec_sync_log import OneCSyncLog
        from app.db.models.balance_sheet import (
            BalanceSheet, BalanceSheetItem, BalanceSheetStatus, BalanceSheetCategory,
            TransformationFormat, TransformedStatement, TransformationAdjustment
        )
        from app.db.models.alert import Alert, AlertStatus, AlertSeverity
        from app.db.models.report import Report
        from app.db.models.document import Document, DocumentType, DocumentStatus
        from app.db.models.tax_rate import TaxRate
        from app.db.models.audit_log import AuditLog

        db = SessionLocal()
        try:
            # 1. Ensure Tenant
            tenant = db.query(Tenant).first()
            if not tenant:
                tenant = Tenant(id=uuid.uuid4(), name="FinBridge Group", plan="enterprise")
                db.add(tenant)
                db.commit()
                db.refresh(tenant)
                logger.info(f"Initialized Tenant: {tenant.name}")

            # 2. Ensure Demo Companies
            companies_data = [
                {
                    "name": "FinBridge Capital",
                    "domain": "finbridge.demo",
                    "industry": "Financial Services",
                    "employee_count": 850,
                    "website": "https://finbridge.demo",
                    "description": "Leading investment banking and asset management firm operating across EU and CIS markets.",
                    "logo_url": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80"
                },
                {
                    "name": "MediCorp International",
                    "domain": "medicorp.demo",
                    "industry": "Healthcare",
                    "employee_count": 320,
                    "website": "https://medicorp.demo",
                    "description": "Multinational healthcare provider and specialized medical equipment manufacturer.",
                    "logo_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=128&auto=format&fit=crop&q=80"
                },
                {
                    "name": "LogiTrans Global",
                    "domain": "logitrans.demo",
                    "industry": "Transportation",
                    "employee_count": 540,
                    "website": "https://logitrans.demo",
                    "description": "Pan-Eurasian container freight forwarding, customs brokerage, and intermodal transport.",
                    "logo_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=128&auto=format&fit=crop&q=80"
                }
            ]

            companies = {}
            for c_info in companies_data:
                comp = db.query(Company).filter(Company.name == c_info["name"]).first()
                if not comp:
                    comp = Company(
                        id=uuid.uuid4(),
                        tenant_id=tenant.id,
                        name=c_info["name"],
                        domain=c_info["domain"],
                        industry=c_info["industry"],
                        employee_count=c_info["employee_count"],
                        website=c_info["website"],
                        description=c_info["description"],
                        logo_url=c_info["logo_url"],
                        is_active=True
                    )
                    db.add(comp)
                    db.commit()
                    db.refresh(comp)
                    logger.info(f"Initialized Company: {comp.name}")
                companies[c_info["name"]] = comp

            primary_company = companies["FinBridge Capital"]

            # 3. Ensure Demo Accounts with FinBridge2026!
            demo_accounts = [
                {
                    "email": "superadmin@finbridge.demo",
                    "full_name": "Chief Master SuperAdmin (Global)",
                    "role": "superadmin",
                    "is_superuser": True,
                    "is_company_owner": False,
                    "hierarchy_level": 1,
                },
                {
                    "email": "admin@finbridge.demo",
                    "full_name": "Alexander Volkov (Company Admin)",
                    "role": "admin",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 4,
                },
                {
                    "email": "owner@finbridge.demo",
                    "full_name": "Elena Smirnova (Company Owner)",
                    "role": "company_owner",
                    "is_superuser": False,
                    "is_company_owner": True,
                    "hierarchy_level": 2,
                },
                {
                    "email": "accountant@finbridge.demo",
                    "full_name": "Dmitry Ivanov (Chief Accountant)",
                    "role": "accountant",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 4,
                },
                {
                    "email": "auditor@finbridge.demo",
                    "full_name": "Marina Petrova (External Auditor)",
                    "role": "auditor",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 4,
                },
                {
                    "email": "analyst@finbridge.demo",
                    "full_name": "Nikolay Volkov (Financial Analyst)",
                    "role": "user",
                    "is_superuser": False,
                    "is_company_owner": False,
                    "hierarchy_level": 5,
                },
            ]

            hashed_pwd = get_password_hash("FinBridge2026!")
            users = {}

            for acc in demo_accounts:
                user = db.query(User).filter(User.email == acc["email"]).first()
                if not user:
                    user = User(
                        id=uuid.uuid4(),
                        tenant_id=tenant.id,
                        company_id=primary_company.id,
                        email=acc["email"],
                        full_name=acc["full_name"],
                        hashed_password=hashed_pwd,
                        role=acc["role"],
                        hierarchy_level=acc["hierarchy_level"],
                        is_superuser=acc["is_superuser"],
                        is_company_owner=acc["is_company_owner"],
                        is_active=True
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    logger.info(f"Initialized demo user: {acc['email']}")
                else:
                    user.hashed_password = hashed_pwd
                    user.is_active = True
                    user.role = acc["role"]
                    user.is_superuser = acc["is_superuser"]
                    user.is_company_owner = acc["is_company_owner"]
                    user.hierarchy_level = acc["hierarchy_level"]
                    if not user.tenant_id:
                        user.tenant_id = tenant.id
                    if not user.company_id:
                        user.company_id = primary_company.id
                    db.commit()
                users[acc["email"]] = user

            # Link primary company ownership
            if "owner@finbridge.demo" in users:
                primary_company.owner_id = str(users["owner@finbridge.demo"].id)
            if "admin@finbridge.demo" in users:
                primary_company.created_by_id = str(users["admin@finbridge.demo"].id)
            db.commit()

            admin_user = users.get("admin@finbridge.demo")
            accountant_user = users.get("accountant@finbridge.demo")
            owner_user = users.get("owner@finbridge.demo")
            auditor_user = users.get("auditor@finbridge.demo")

            # 4. Auto-Seed Regulations (if < 10)
            reg_count = db.query(Regulation).count()
            if reg_count < 10:
                logger.info(f"Seeding comprehensive regulations (current count: {reg_count})...")
                try:
                    from app.db.seeds.load_regulations import load_regulations
                    load_regulations()
                    logger.info("Loaded banking regulations, audit standards, and Uzbekistan laws")
                except Exception as re:
                    logger.warning(f"Notice running load_regulations: {re}")

                try:
                    import sys
                    from pathlib import Path
                    backend_dir = Path(__file__).parent.parent
                    if str(backend_dir) not in sys.path:
                        sys.path.insert(0, str(backend_dir))
                    from populate_regulations import REGULATIONS as GLOBAL_REGS
                    for reg_item in GLOBAL_REGS:
                        if not db.query(Regulation).filter(Regulation.title == reg_item["title"]).first():
                            code = reg_item["title"].split("(")[1].split(")")[0] if "(" in reg_item["title"] and ")" in reg_item["title"] else reg_item["title"][:8].upper().replace(" ", "-")
                            reg_obj = Regulation(
                                id=uuid.uuid4(),
                                code=code,
                                title=reg_item["title"],
                                category=reg_item["category"],
                                jurisdiction=reg_item["jurisdiction"],
                                content=reg_item.get("description", "") + "\n\n" + reg_item.get("summary", ""),
                                effective_date=datetime.strptime(reg_item["effective_date"], "%Y-%m-%d"),
                                source_url=reg_item.get("source_url"),
                                tenant_id=None
                            )
                            db.add(reg_obj)
                    db.commit()
                    logger.info(f"Loaded global regulations. Total now: {db.query(Regulation).count()}")
                except Exception as ge:
                    logger.warning(f"Notice loading global regulations: {ge}")

            # 5. 1C:Enterprise Connection & Sync Logs
            onec = db.query(OneCConnection).filter(OneCConnection.company_id == primary_company.id).first()
            if not onec:
                onec = OneCConnection(
                    id=uuid.uuid4(),
                    company_id=primary_company.id,
                    url="https://1c-gateway.finbridge.demo/accounting/odata/standard.odata/",
                    username="odata_acc_admin",
                    password=encrypt_secret("Secure1CPassword!2026"),
                    company_code="FB-CAPITAL-01",
                    auth_type="basic",
                    verify_ssl=True,
                    status="connected",
                    last_sync=datetime.now(timezone.utc) - timedelta(minutes=14),
                    last_latency_ms=18
                )
                db.add(onec)
                db.commit()
                logger.info("Configured 1C:Enterprise connection with encrypted credentials")

            if db.query(OneCSyncLog).count() == 0 and accountant_user:
                sync_events = [
                    ("sync_trial_balance", "SUCCESS", 142, 14, {"message": "Trial balance synchronized successfully via OData v4 REST API", "total_amount": 120000000.00}, 2),
                    ("export_adjustments", "SUCCESS", 210, 3, {"message": "Successfully exported 3 adjustment entries (IFRS 16 & IFRS 9) to 1C:Enterprise Document_ОперацияБух", "total_amount": 18050000.00}, 1),
                    ("test_connection", "SUCCESS", 18, 0, {"message": "Connection to 1C:Enterprise is healthy (Latency: 18ms)"}, 0),
                ]
                for s_type, s_stat, s_dur, s_rec, s_resp, s_days in sync_events:
                    slog = OneCSyncLog(
                        id=uuid.uuid4(),
                        company_id=primary_company.id,
                        tenant_id=tenant.id,
                        user_id=accountant_user.id,
                        sync_type=s_type,
                        status=s_stat,
                        duration_ms=s_dur,
                        records_processed=s_rec,
                        response_summary=s_resp,
                        created_at=datetime.now(timezone.utc) - timedelta(days=s_days)
                    )
                    db.add(slog)
                db.commit()
                logger.info("Seeded 1C synchronization logs")

            # 6. Balanced Trial Balance & IFRS Transformation
            existing_bs = db.query(BalanceSheet).filter(BalanceSheet.company_id == primary_company.id).first()
            if not existing_bs:
                bs_2024 = BalanceSheet(
                    id=uuid.uuid4(),
                    company_id=primary_company.id,
                    period=datetime(2024, 12, 31),
                    status=BalanceSheetStatus.TRANSFORMED,
                    notes="2024 Full Year Consolidated Balance Sheet (Synchronized via 1C:Enterprise OData)"
                )
                db.add(bs_2024)
                db.flush()

                items_data = [
                    ("01.01", "Основные средства (Fixed Assets)", 45000000.00, BalanceSheetCategory.ASSETS, "Non-Current Assets"),
                    ("02.01", "Амортизация ОС (Accumulated Depreciation)", -5000000.00, BalanceSheetCategory.ASSETS, "Non-Current Assets"),
                    ("08.04", "Вложения во внеоборотные активы", 10000000.00, BalanceSheetCategory.ASSETS, "Non-Current Assets"),
                    ("10.01", "Сырье и материалы (Inventories)", 15000000.00, BalanceSheetCategory.ASSETS, "Current Assets"),
                    ("41.01", "Товары на складах (Goods)", 20000000.00, BalanceSheetCategory.ASSETS, "Current Assets"),
                    ("62.01", "Расчеты с покупателями (Accounts Receivable)", 18000000.00, BalanceSheetCategory.ASSETS, "Current Assets"),
                    ("51.00", "Расчетные счета (Cash & Bank)", 17000000.00, BalanceSheetCategory.ASSETS, "Cash & Equivalents"),
                    ("60.01", "Расчеты с поставщиками (Accounts Payable)", 25000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),
                    ("66.01", "Краткосрочные кредиты (Short-term Loans)", 15000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),
                    ("67.01", "Долгосрочные кредиты (Long-term Borrowings)", 20000000.00, BalanceSheetCategory.LIABILITIES, "Non-Current Liabilities"),
                    ("70.00", "Расчеты по оплате труда (Payroll Liabilities)", 6000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),
                    ("68.02", "Расчеты по налогам и сборам (НДС/Налог на прибыль)", 4000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),
                    ("80.01", "Уставный капитал (Share Capital)", 30000000.00, BalanceSheetCategory.EQUITY, "Equity"),
                    ("84.01", "Нераспределенная прибыль (Retained Earnings)", 20000000.00, BalanceSheetCategory.EQUITY, "Equity"),
                ]

                seeded_items = []
                for code, name, amount, cat, subcat in items_data:
                    item = BalanceSheetItem(
                        id=uuid.uuid4(),
                        balance_sheet_id=bs_2024.id,
                        account_code=code,
                        account_name=name,
                        amount=amount,
                        category=cat,
                        subcategory=subcat
                    )
                    db.add(item)
                    seeded_items.append(item)
                db.flush()

                ts = TransformedStatement(
                    id=uuid.uuid4(),
                    balance_sheet_id=bs_2024.id,
                    format_type=TransformationFormat.IFRS,
                    transformed_data={
                        "total_assets_ifrs": 132500000.00,
                        "total_liabilities_ifrs": 82500000.00,
                        "total_equity_ifrs": 50000000.00,
                        "status": "balanced",
                        "adjustments_count": 3
                    },
                    transformation_rules_applied=[
                        {"standard": "IFRS 16", "impact": "+12,500,000 ROU Asset"},
                        {"standard": "IAS 36", "impact": "-2,300,000 Impairment"},
                        {"standard": "IFRS 9", "impact": "-3,250,000 ECL Provision"}
                    ]
                )
                db.add(ts)

                ar_item = next((i for i in seeded_items if i.account_code == "62.01"), None)
                fa_item = next((i for i in seeded_items if i.account_code == "01.01"), None)

                adjustments = [
                    TransformationAdjustment(
                        id=uuid.uuid4(),
                        balance_sheet_id=bs_2024.id,
                        description="IFRS 16: Capitalization of Operating Lease as Right-of-Use Asset",
                        adjustment_amount=12500000.00,
                        adjustment_type="debit",
                        ifrs_category="IFRS 16 (Leases)",
                        balance_sheet_item_id=fa_item.id if fa_item else None
                    ),
                    TransformationAdjustment(
                        id=uuid.uuid4(),
                        balance_sheet_id=bs_2024.id,
                        description="IAS 36: Impairment of obsolete server infrastructure to recoverable amount",
                        adjustment_amount=2300000.00,
                        adjustment_type="credit",
                        ifrs_category="IAS 36 (Impairment)",
                        balance_sheet_item_id=fa_item.id if fa_item else None
                    ),
                    TransformationAdjustment(
                        id=uuid.uuid4(),
                        balance_sheet_id=bs_2024.id,
                        description="IFRS 9: Expected Credit Loss (ECL) Stage 2 provision on trade receivables past 90 days (PD=12.4%, LGD=45%)",
                        adjustment_amount=3250000.00,
                        adjustment_type="credit",
                        ifrs_category="IFRS 9 (Financial Instruments)",
                        balance_sheet_item_id=ar_item.id if ar_item else None
                    ),
                ]
                for adj in adjustments:
                    db.add(adj)

                db.commit()
                logger.info("Seeded balanced 2024 trial balance and IFRS 16 / IAS 36 / IFRS 9 transformation adjustments")

            # 7. Compliance Alerts
            if db.query(Alert).count() < 5:
                alerts_data = [
                    ("IFRS 9: Expected Credit Loss (ECL) Model Annual Review Required", AlertSeverity.HIGH, AlertStatus.OPEN, "IFRS 9", "Parameters for Stage 2 default probability (PD) matrix require recalibration based on Q4 macro factors."),
                    ("IFRS 16: Headquarters Commercial Lease Renewal Exceeds Capitalization Threshold", AlertSeverity.HIGH, AlertStatus.OPEN, "IFRS 16", "New 5-year lease amendment requires discounting under incremental borrowing rate (IBR 7.5%)."),
                    ("MiFID II: Post-Trade Transaction Reporting Gap — 3 transactions missing Legal Entity Identifier (LEI)", AlertSeverity.CRITICAL, AlertStatus.OPEN, "MiFID II", "Remediation mandatory within 5 business days per Article 26 RTS 22 compliance."),
                    ("IAS 36: Server Infrastructure Technological Obsolescence Impairment Indicator", AlertSeverity.MEDIUM, AlertStatus.IN_PROGRESS, "IAS 36", "Fair value less disposal costs evaluated against carrying amount following cloud migration."),
                    ("AML/CFT 5AMLD: Corporate Beneficial Ownership Documentation Verification", AlertSeverity.MEDIUM, AlertStatus.IN_PROGRESS, "AML-5AMLD", "15 institutional clients pending updated Ultimate Beneficial Owner (UBO) declarations."),
                    ("Basel III: Liquidity Coverage Ratio (LCR) Continuous Monitoring — Current 118%", AlertSeverity.LOW, AlertStatus.RESOLVED, "BASEL-III", "Maintained comfortably above 100% regulatory threshold. Quarterly stress tests cleared."),
                ]
                for msg, sev, stat, reg, notes in alerts_data:
                    alert = Alert(
                        id=uuid.uuid4(),
                        tenant_id=tenant.id,
                        company_id=primary_company.id,
                        message=msg,
                        severity=sev,
                        status=stat,
                        regulation=reg,
                        notes=notes,
                        created_by=admin_user.id if admin_user else None,
                        created_at=datetime.now(timezone.utc) - timedelta(days=2)
                    )
                    db.add(alert)
                db.commit()
                logger.info("Seeded realistic compliance alerts")

            # 8. Compliance & Transformation Reports
            if db.query(Report).count() == 0 and admin_user:
                reports_data = [
                    (
                        "Q4 2024 Consolidated IFRS Transformation Report",
                        "compliance",
                        "approved",
                        "Comprehensive IFRS financial statement package with automated adjustments for IFRS 16 (Right-of-Use Asset 12.5M ₽) and IFRS 9 ECL model reserve (3.25M ₽). Fully reconciled with 1C:Enterprise ledger.",
                        "IFRS_Transformation_Report_FY2024.pdf"
                    ),
                    (
                        "Annual AML & Sanctions Compliance Audit 2024",
                        "audit",
                        "approved",
                        "Independent auditor assessment covering Customer Due Diligence (CDD), transaction monitoring thresholds, PEP screening, and STR reporting workflows across all operating subsidiaries.",
                        "AML_Sanctions_Audit_Report_2024.pdf"
                    ),
                    (
                        "Q1 2025 Regulatory Convergence & Cross-Border Tax Assessment",
                        "compliance",
                        "submitted",
                        "Analysis of regional tax rate harmonization (Uzbekistan VAT 12%, Profit Tax 15% vs Russia/Kazakhstan benchmarks) and transfer pricing documentation.",
                        "Tax_Regulatory_Convergence_Q1_2025.pdf"
                    ),
                ]
                for title, rtype, stat, desc, fname in reports_data:
                    rep = Report(
                        id=uuid.uuid4(),
                        tenant_id=tenant.id,
                        company_id=primary_company.id,
                        submitted_by=admin_user.id,
                        reviewed_by=auditor_user.id if auditor_user else None,
                        title=title,
                        description=desc,
                        report_type=rtype,
                        status=stat,
                        file_name=fname,
                        file_size=2048576,
                        submitted_at=datetime.now(timezone.utc) - timedelta(days=5),
                        reviewed_at=datetime.now(timezone.utc) - timedelta(days=3) if stat == "approved" else None,
                        reviewer_comments="Verified by External Audit. Standard accounting practices aligned with IFRS guidelines." if stat == "approved" else None
                    )
                    db.add(rep)
                db.commit()
                logger.info("Seeded compliance and audit reports")

            # 9. OCR Parsed Financial Documents
            if db.query(Document).count() == 0 and accountant_user:
                import json
                docs = [
                    (
                        "Trial_Balance_FY2024_1C_Export.xlsx",
                        "uploads/documents/trial_balance_fy2024.xlsx",
                        DocumentType.TRIAL_BALANCE,
                        DocumentStatus.COMPLETED,
                        json.dumps({
                            "source_system": "1C:Enterprise 8.3",
                            "period": "2024-12-31",
                            "total_assets": 120000000.00,
                            "total_liabilities": 70000000.00,
                            "total_equity": 50000000.00,
                            "confidence_score": 0.99
                        })
                    ),
                    (
                        "Commercial_Lease_Agreement_HQ_Tower.pdf",
                        "uploads/documents/lease_agreement_hq.pdf",
                        DocumentType.CONTRACT,
                        DocumentStatus.COMPLETED,
                        json.dumps({
                            "contract_type": "Commercial Real Estate Lease",
                            "term_months": 60,
                            "monthly_payment": 250000.00,
                            "discount_rate": 0.075,
                            "rou_asset_calculated": 12500000.00,
                            "applicable_standard": "IFRS 16"
                        })
                    ),
                    (
                        "Bank_Statement_Q4_2024_Consolidated.pdf",
                        "uploads/documents/bank_statement_q4.pdf",
                        DocumentType.BANK_STATEMENT,
                        DocumentStatus.COMPLETED,
                        json.dumps({
                            "bank_name": "International Commerce Bank",
                            "account_number": "40702810900000001234",
                            "opening_balance": 8500000.00,
                            "total_credits": 24000000.00,
                            "total_debits": 15500000.00,
                            "closing_balance": 17000000.00
                        })
                    ),
                ]
                for fn, fp, dt, ds, ed in docs:
                    doc = Document(
                        id=uuid.uuid4(),
                        company_id=primary_company.id,
                        uploaded_by=accountant_user.id,
                        filename=fn,
                        file_path=fp,
                        document_type=dt,
                        status=ds,
                        extracted_data=ed,
                        created_at=datetime.now(timezone.utc) - timedelta(days=7),
                        processed_at=datetime.now(timezone.utc) - timedelta(days=7)
                    )
                    db.add(doc)
                db.commit()
                logger.info("Seeded OCR financial documents with extracted JSON metadata")

            # 10. Tax Rates
            if db.query(TaxRate).count() == 0:
                from datetime import date
                taxes = [
                    ("UZ", "Uzbekistan", "vat", 12.00, "Standard Value Added Tax per Tax Code of the Republic of Uzbekistan", date(2023, 1, 1)),
                    ("UZ", "Uzbekistan", "corporate", 15.00, "Corporate Income (Profit) Tax base rate", date(2023, 1, 1)),
                    ("RU", "Russia", "vat", 20.00, "Standard Value Added Tax per RF Tax Code Article 164", date(2019, 1, 1)),
                    ("RU", "Russia", "corporate", 20.00, "Corporate Profit Tax general rate", date(2009, 1, 1)),
                    ("KZ", "Kazakhstan", "vat", 12.00, "Standard Value Added Tax per Tax Code of the Republic of Kazakhstan", date(2020, 1, 1)),
                    ("KZ", "Kazakhstan", "corporate", 20.00, "Corporate Income Tax statutory rate", date(2020, 1, 1)),
                ]
                for cc, cn, tt, r, desc, ef in taxes:
                    tr = TaxRate(
                        id=uuid.uuid4(),
                        country_code=cc,
                        country_name=cn,
                        tax_type=tt,
                        rate=r,
                        description=desc,
                        effective_from=ef
                    )
                    db.add(tr)
                db.commit()
                logger.info("Seeded cross-border tax rates")

            # 11. Security Audit Logs
            if db.query(AuditLog).count() < 5 and admin_user:
                audit_events = [
                    (admin_user.id, "login", "auth", "User admin@finbridge.demo logged into system via Multi-Factor Authentication", "192.168.1.10", 6),
                    (owner_user.id if owner_user else admin_user.id, "update", "company", "Updated 1C:Enterprise connection parameters with AES-128-CBC encryption", "192.168.1.25", 5),
                    (accountant_user.id if accountant_user else admin_user.id, "sync", "1c_connector", "Synchronized 2024 Trial Balance (14 accounts, 120M ₽) via OData v4", "192.168.1.40", 4),
                    (accountant_user.id if accountant_user else admin_user.id, "transform", "balance_sheet", "Executed IFRS 16 lease capitalization adjustment (12.5M ₽ Right-of-Use Asset)", "192.168.1.40", 3),
                    (accountant_user.id if accountant_user else admin_user.id, "transform", "balance_sheet", "Booked IFRS 9 Expected Credit Loss (ECL) Stage 2 reserve (3.25M ₽)", "192.168.1.40", 3),
                    (auditor_user.id if auditor_user else admin_user.id, "review", "report", "Approved Annual Financial Convergence and IFRS Transformation Report 2024", "192.168.1.88", 2),
                    (admin_user.id, "update", "tax_rates", "Verified Uzbekistan (12% VAT) and Kazakhstan/Russia cross-border tax matrices", "192.168.1.10", 1),
                ]
                for u_id, act, res_type, det, ip, days_ago in audit_events:
                    ts = datetime.now(timezone.utc) - timedelta(days=days_ago)
                    alog = AuditLog(
                        id=uuid.uuid4(),
                        tenant_id=tenant.id,
                        user_id=u_id,
                        action=act,
                        resource_type=res_type,
                        resource_id=str(uuid.uuid4()),
                        details=det,
                        ip_address=ip,
                        timestamp=ts,
                        created_at=ts
                    )
                    db.add(alog)
                db.commit()
                logger.info("Seeded security audit logs")

            logger.info("✅ All demo data verified and fully populated.")
        except Exception as e:
            db.rollback()
            logger.error(f"Error initializing demo data: {e}", exc_info=True)
        finally:
            db.close()
    except Exception as outer_e:
        logger.error(f"Could not load demo seeding dependencies: {outer_e}", exc_info=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    run_migrations()
    ensure_db_schema()
    ensure_demo_data()
    start_scheduler()
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS] if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Security Headers & Payload Size Middleware
@app.middleware("http")
async def security_and_size_middleware(request: Request, call_next):
    # Enforce request payload size limit (DoS protection)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_CONTENT_LENGTH:
        return Response(
            content='{"detail":"Payload Too Large: Maximum allowed request size is 35MB"}',
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            media_type="application/json"
        )

    # General API Rate Limiting (only on API endpoints, exclude assets/docs/metrics/health)
    path = request.url.path
    if path.startswith("/api/") and not path.startswith("/api/v1/health"):
        try:
            check_rate_limit(request)
        except HTTPException as he:
            return Response(
                content=f'{{"detail":"{he.detail}"}}',
                status_code=he.status_code,
                media_type="application/json"
            )

    response = await call_next(request)

    # Security Headers (OWASP recommendations)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    return response

# 2. Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# 3. Timing / Performance Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Prometheus metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# 4. Frontend SPA Serving (Full-Stack single container mode)
dist_dir = "/app/frontend/dist"
if not os.path.exists(dist_dir):
    local_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
    if os.path.exists(local_dist):
        dist_dir = local_dist

if os.path.exists(dist_dir):
    logger.info(f"Mounting React Frontend SPA from {dist_dir}")
    assets_path = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_page(full_path: str):
        # Exclude backend internal routes
        if full_path.startswith("api/") or full_path.startswith("metrics") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API route not found")
        
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return Response(content='{"detail":"Frontend index.html not found"}', status_code=404, media_type="application/json")
else:
    @app.get("/")
    def fallback_root():
        return {
            "message": "RegAI Platform API is Operational",
            "docs": "/docs",
            "api_v1": "/api/v1"
        }
