#!/usr/bin/env python3
"""
Seed complete realistic demo environment for RegAI:
- Tenants & Organizations
- Companies (Technology, Logistics, Finance)
- Users across all role hierarchy levels (Superadmin, Owner, Accountant, Auditor)
- 1C:Enterprise Connections with encrypted credentials
- Balanced Financial Trial Balances (RSBU 01, 10, 51, 60, 80, 84)
- IFRS Transformations & Adjustments
- Compliance Alerts & Audit Logs
"""

import sys
import os
import uuid
from datetime import datetime, timedelta

# Add backend and project root directories to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_path not in sys.path:
    sys.path.insert(0, root_path)

from sqlalchemy.orm import Session

try:
    from app.db.session import SessionLocal, engine
    from app.db.base import Base
    from app.core.security import get_password_hash
    from app.core.crypto import encrypt_secret
    from app.db.models.tenant import Tenant
    from app.db.models.company import Company
    from app.db.models.user import User
    from app.db.models.onec_connection import OneCConnection
    from app.db.models.balance_sheet import (
        BalanceSheet, 
        BalanceSheetItem, 
        BalanceSheetStatus, 
        BalanceSheetCategory,
        TransformationAdjustment
    )
    from app.db.models.alert import Alert, AlertStatus, AlertSeverity
    from app.db.models.report import Report
    from app.db.models.report_template import ReportTemplate
    from app.db.models.report_analysis import ReportAnalysis
    from app.db.models.report_comment import ReportComment
    from app.db.models.document import Document, DocumentType, DocumentStatus
    from app.db.models.audit_log import AuditLog
    from app.db.models.onec_sync_log import OneCSyncLog
    from app.db.models.regulation import Regulation
    from app.db.models.tax_rate import TaxRate
except ImportError:
    from backend.app.db.session import SessionLocal, engine  # type: ignore
    from backend.app.db.base import Base  # type: ignore
    from backend.app.core.security import get_password_hash  # type: ignore
    from backend.app.core.crypto import encrypt_secret  # type: ignore
    from backend.app.db.models.tenant import Tenant  # type: ignore
    from backend.app.db.models.company import Company  # type: ignore
    from backend.app.db.models.user import User  # type: ignore
    from backend.app.db.models.onec_connection import OneCConnection  # type: ignore
    from backend.app.db.models.balance_sheet import (  # type: ignore
        BalanceSheet, 
        BalanceSheetItem, 
        BalanceSheetStatus, 
        BalanceSheetCategory,
        TransformationAdjustment
    )
    from backend.app.db.models.alert import Alert, AlertStatus, AlertSeverity  # type: ignore
    from backend.app.db.models.report import Report  # type: ignore
    from backend.app.db.models.report_template import ReportTemplate  # type: ignore
    from backend.app.db.models.report_analysis import ReportAnalysis  # type: ignore
    from backend.app.db.models.report_comment import ReportComment  # type: ignore
    from backend.app.db.models.document import Document, DocumentType, DocumentStatus  # type: ignore
    from backend.app.db.models.audit_log import AuditLog  # type: ignore
    from backend.app.db.models.onec_sync_log import OneCSyncLog  # type: ignore
    from backend.app.db.models.regulation import Regulation  # type: ignore
    from backend.app.db.models.tax_rate import TaxRate  # type: ignore

def seed_demo():
    # 1. Guarantee all database tables exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Table creation notice: {e}")

    # 2. Run migrations if applicable
    try:
        from alembic.config import Config
        from alembic import command
        alembic_ini_path = "alembic.ini"
        if not os.path.exists(alembic_ini_path):
            alembic_ini_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "alembic.ini")
        if os.path.exists(alembic_ini_path):
            alembic_cfg = Config(alembic_ini_path)
            script_dir = os.path.join(os.path.dirname(alembic_ini_path), "alembic")
            if os.path.exists(script_dir):
                alembic_cfg.set_main_option("script_location", script_dir)
            command.upgrade(alembic_cfg, "head")
    except Exception as e:
        print(f"Migration notice: {e}")

    db: Session = SessionLocal()
    try:
        print("🌱 [1/6] Seeding Tenant...")
        tenant = db.query(Tenant).filter(Tenant.name == "TechCorp Group").first()
        if not tenant:
            tenant = Tenant(
                id=uuid.uuid4(),
                name="TechCorp Group",
                plan="enterprise"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            print(f"   ✅ Tenant created: {tenant.name} ({tenant.id})")
        else:
            print(f"   ℹ️ Tenant exists: {tenant.name}")

        print("\n🏢 [2/6] Seeding Companies...")
        companies_data = [
            {
                "name": "TechCorp International LLC",
                "domain": "techcorp.com",
                "industry": "Technology",
                "employee_count": 120,
                "website": "https://techcorp.com",
                "description": "Global software enterprise, cloud SaaS, and AI technology provider.",
                "logo_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80"
            },
            {
                "name": "Global Logistics & Freight JSC",
                "domain": "logistics.global",
                "industry": "Transportation",
                "employee_count": 450,
                "website": "https://logistics.global",
                "description": "International cargo transportation, warehouse hubs, and supply chain management.",
                "logo_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=128&auto=format&fit=crop&q=80"
            },
            {
                "name": "FinServe Capital Partners",
                "domain": "finserve.io",
                "industry": "Finance",
                "employee_count": 85,
                "website": "https://finserve.io",
                "description": "Fintech payment processing, investment banking, and capital advisory.",
                "logo_url": "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80"
            }
        ]

        companies = {}
        for cdata in companies_data:
            comp = db.query(Company).filter(Company.name == cdata["name"]).first()
            if not comp:
                comp = Company(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    name=cdata["name"],
                    domain=cdata["domain"],
                    industry=cdata["industry"],
                    employee_count=cdata["employee_count"],
                    website=cdata["website"],
                    description=cdata["description"],
                    logo_url=cdata["logo_url"],
                    is_active=True
                )
                db.add(comp)
                db.commit()
                db.refresh(comp)
                print(f"   ✅ Company created: {comp.name}")
            else:
                print(f"   ℹ️ Company exists: {comp.name}")
            companies[cdata["name"]] = comp

        primary_company = companies["TechCorp International LLC"]

        print("\n👥 [3/6] Seeding Users with Role Hierarchy...")
        users_data = [
            {
                "email": "admin@techcorp.com",
                "full_name": "Alexander Volkov (SuperAdmin)",
                "password": "password123",
                "role": "superadmin",
                "hierarchy_level": 1,
                "is_superuser": True,
                "company_id": primary_company.id
            },
            {
                "email": "owner@techcorp.com",
                "full_name": "Elena Smirnova (Company Owner)",
                "password": "password123",
                "role": "company_owner",
                "hierarchy_level": 2,
                "is_superuser": False,
                "company_id": primary_company.id
            },
            {
                "email": "accountant@techcorp.com",
                "full_name": "Dmitry Ivanov (Chief Accountant)",
                "password": "password123",
                "role": "accountant",
                "hierarchy_level": 4,
                "is_superuser": False,
                "company_id": primary_company.id
            },
            {
                "email": "auditor@techcorp.com",
                "full_name": "Marina Petrova (External Auditor)",
                "password": "password123",
                "role": "auditor",
                "hierarchy_level": 4,
                "is_superuser": False,
                "company_id": primary_company.id
            },
            {
                "email": "accountant@finserve.io",
                "full_name": "Sergey Kuznetsov (FinServe Controller)",
                "password": "password123",
                "role": "accountant",
                "hierarchy_level": 4,
                "is_superuser": False,
                "company_id": companies["FinServe Capital Partners"].id
            }
        ]

        users = {}
        for udata in users_data:
            user = db.query(User).filter(User.email == udata["email"]).first()
            if not user:
                user = User(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    company_id=udata["company_id"],
                    email=udata["email"],
                    full_name=udata["full_name"],
                    hashed_password=get_password_hash(udata["password"]),
                    role=udata["role"],
                    hierarchy_level=udata["hierarchy_level"],
                    is_superuser=udata["is_superuser"],
                    is_active=True,
                    is_company_owner=(udata["role"] == "company_owner")
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"   ✅ User created: {user.email} (Role: {user.role}, Level: {user.hierarchy_level})")
            else:
                print(f"   ℹ️ User exists: {user.email}")
            users[udata["email"]] = user

        # Link company owner
        primary_company.owner_id = users["owner@techcorp.com"].id
        primary_company.created_by_id = users["admin@techcorp.com"].id
        db.commit()

        admin_user = users["admin@techcorp.com"]
        owner_user = users["owner@techcorp.com"]
        accountant_user = users["accountant@techcorp.com"]
        auditor_user = users["auditor@techcorp.com"]

        print("\n🔌 [4/6] Seeding 1C:Enterprise Integration Connection...")
        onec = db.query(OneCConnection).filter(OneCConnection.company_id == primary_company.id).first()
        if not onec:
            onec = OneCConnection(
                id=uuid.uuid4(),
                company_id=primary_company.id,
                url="http://1c-server.local/accounting/odata/standard.odata/",
                username="odata_acc_admin",
                password=encrypt_secret("Secure1CPassword!2026"),
                company_code="TECH-001",
                auth_type="basic",
                verify_ssl=True,
                status="connected",
                last_sync=datetime.utcnow() - timedelta(hours=2),
                last_latency_ms=18
            )
            db.add(onec)
            db.commit()
            print("   ✅ 1C:Enterprise connection configured and encrypted")
        else:
            print("   ℹ️ 1C:Enterprise connection already configured")

        print("\n📊 [5/6] Seeding Trial Balance Sheets & IFRS Transformations...")
        existing_bs = db.query(BalanceSheet).filter(BalanceSheet.company_id == primary_company.id).first()
        if not existing_bs:
            # 2024 FY Balance Sheet
            bs_2024 = BalanceSheet(
                id=uuid.uuid4(),
                company_id=primary_company.id,
                period=datetime(2024, 12, 31),
                status=BalanceSheetStatus.TRANSFORMED,
                notes="2024 Full Year Consolidated Balance Sheet (Synchronized via 1C:Enterprise OData)"
            )
            db.add(bs_2024)
            db.flush()

            # Balanced Trial Balance Line Items (A = 120M, L = 70M, E = 50M)
            items_data = [
                # Assets (Total: 120,000,000)
                ("01.01", "Основные средства (Fixed Assets)", 45000000.00, BalanceSheetCategory.ASSETS, "Non-Current Assets"),
                ("02.01", "Амортизация ОС (Accumulated Depreciation)", -5000000.00, BalanceSheetCategory.ASSETS, "Non-Current Assets"),
                ("08.04", "Вложения во внеоборотные активы", 10000000.00, BalanceSheetCategory.ASSETS, "Non-Current Assets"),
                ("10.01", "Сырье и материалы (Inventories)", 15000000.00, BalanceSheetCategory.ASSETS, "Current Assets"),
                ("41.01", "Товары на складах (Goods)", 20000000.00, BalanceSheetCategory.ASSETS, "Current Assets"),
                ("62.01", "Расчеты с покупателями (Accounts Receivable)", 18000000.00, BalanceSheetCategory.ASSETS, "Current Assets"),
                ("51.00", "Расчетные счета (Cash & Bank)", 17000000.00, BalanceSheetCategory.ASSETS, "Cash & Equivalents"),

                # Liabilities (Total: 70,000,000)
                ("60.01", "Расчеты с поставщиками (Accounts Payable)", 25000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),
                ("66.01", "Краткосрочные кредиты (Short-term Loans)", 15000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),
                ("67.01", "Долгосрочные кредиты (Long-term Borrowings)", 20000000.00, BalanceSheetCategory.LIABILITIES, "Non-Current Liabilities"),
                ("70.00", "Расчеты по оплате труда (Payroll Liabilities)", 6000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),
                ("68.02", "Расчеты по налогам и сборам (НДС/Налог на прибыль)", 4000000.00, BalanceSheetCategory.LIABILITIES, "Current Liabilities"),

                # Equity (Total: 50,000,000)
                ("80.01", "Уставный капитал (Share Capital)", 30000000.00, BalanceSheetCategory.EQUITY, "Equity"),
                ("84.01", "Нераспределенная прибыль (Retained Earnings)", 20000000.00, BalanceSheetCategory.EQUITY, "Equity"),
            ]

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

            # Add IFRS Adjustments
            adj1 = TransformationAdjustment(
                id=uuid.uuid4(),
                balance_sheet_id=bs_2024.id,
                description="IFRS 16 Lease Capitalization (Right-of-Use Asset Recognition)",
                adjustment_amount=12500000.00,
                adjustment_type="debit",
                ifrs_category="IFRS 16 Leases"
            )
            adj2 = TransformationAdjustment(
                id=uuid.uuid4(),
                balance_sheet_id=bs_2024.id,
                description="IFRS 16 Lease Liability Recognition",
                adjustment_amount=12500000.00,
                adjustment_type="credit",
                ifrs_category="IFRS 16 Leases"
            )
            db.add_all([adj1, adj2])
            db.commit()
            print(f"   ✅ Seeded 2024 Balanced Sheet with 14 accounts and 2 IFRS adjustments")
        else:
            print("   ℹ️ Balance sheet data already exists")

        print("\n🔔 [6/6] Seeding Compliance Alerts & Reports...")
        alerts_count = db.query(Alert).filter(Alert.company_id == primary_company.id).count()
        if alerts_count == 0:
            sample_alerts = [
                ("IFRS 16 Lease Asset Valuation Audit Required", AlertSeverity.HIGH, AlertStatus.OPEN, "IFRS 16"),
                ("Q4 2024 Corporate Profit Tax Filing in 10 days", AlertSeverity.MEDIUM, AlertStatus.OPEN, "Tax Compliance"),
                ("1C:Enterprise General Ledger Sync Succeeded", AlertSeverity.LOW, AlertStatus.RESOLVED, "1C Connector"),
                ("GDPR / 152-FZ Personal Data Protection Check", AlertSeverity.HIGH, AlertStatus.IN_PROGRESS, "Compliance"),
            ]
            for msg, sev, stat, reg in sample_alerts:
                a = Alert(
                    id=uuid.uuid4(),
                    company_id=primary_company.id,
                    tenant_id=tenant.id,
                    message=msg,
                    severity=sev,
                    status=stat,
                    regulation=reg,
                    created_at=datetime.utcnow() - timedelta(days=2)
                )
                db.add(a)
            db.commit()
            print("   ✅ Seeded compliance alerts")
        else:
            print("   ℹ️ Alerts already exist")

        print("\n📚 [7/8] Seeding Global Regulations across all categories...")
        regs_count = db.query(Regulation).count()
        if regs_count == 0:
            from populate_regulations import REGULATIONS as COMPREHENSIVE_REGS
            from app.db.seeds.banking_regulations_bilingual import banking_regulations_bilingual
            from app.db.seeds.audit_standards_bilingual import audit_standards_bilingual
            from app.db.seeds.uzbekistan_regulations import uzbekistan_regulations
            from app.db.seeds.uzbekistan_laws import uzbekistan_laws

            # 1. Comprehensive multi-category regulations
            for rdata in COMPREHENSIVE_REGS:
                # generate clean code
                title_words = rdata["title"].split()
                if "(" in rdata["title"] and ")" in rdata["title"]:
                    code = rdata["title"].split("(")[1].split(")")[0]
                else:
                    code = "-".join(word[:4].upper() for word in title_words[:2])

                eff_date = None
                if "effective_date" in rdata and rdata["effective_date"]:
                    try:
                        eff_date = datetime.strptime(rdata["effective_date"], "%Y-%m-%d")
                    except Exception:
                        pass

                reg = Regulation(
                    id=uuid.uuid4(),
                    code=code,
                    title=rdata["title"],
                    category=rdata["category"],
                    jurisdiction=rdata["jurisdiction"],
                    content=rdata.get("description", "") + "\n\n" + rdata.get("summary", ""),
                    source_url=rdata.get("source_url"),
                    effective_date=eff_date,
                    tenant_id=None
                )
                db.add(reg)

            # 2. Banking and Audit Standards
            for bdata in banking_regulations_bilingual + audit_standards_bilingual + uzbekistan_regulations + uzbekistan_laws:
                existing_code = db.query(Regulation).filter(Regulation.code == bdata["code"]).first()
                if existing_code:
                    continue
                eff_date = None
                if "effective_date" in bdata and bdata["effective_date"]:
                    try:
                        eff_date = datetime.strptime(bdata["effective_date"], "%Y-%m-%d")
                    except Exception:
                        pass

                breg = Regulation(
                    id=uuid.uuid4(),
                    code=bdata["code"],
                    title=bdata["title"],
                    category=bdata.get("category", "Finance"),
                    jurisdiction=bdata.get("jurisdiction", "Global"),
                    content=bdata.get("content", ""),
                    source_url=bdata.get("source_url"),
                    effective_date=eff_date,
                    tenant_id=None
                )
                db.add(breg)

            db.commit()
            total_loaded = db.query(Regulation).count()
            print(f"   ✅ Seeded {total_loaded} regulations across all categories (IFRS, Tax, ESG, Privacy, Security, Finance, AML, etc.)")
        else:
            print(f"   ℹ️ Regulations already seeded ({regs_count} found)")

        print("\n💰 [8/8] Seeding Global and Regional Tax Rates...")
        sample_taxes = [
            # United States
            ("US", "United States", "corporate", 21.0, "Federal Corporate Income Tax", "https://www.irs.gov"),
            ("US", "United States", "income_top", 37.0, "Top Federal Individual Income Tax Bracket", "https://www.irs.gov"),
            ("US", "United States", "withholding", 30.0, "Statutory Non-Resident Withholding Tax (WHT)", "https://www.irs.gov"),
            
            # United Kingdom
            ("GB", "United Kingdom", "vat", 20.0, "Standard VAT (Value Added Tax)", "https://www.gov.uk/vat-rates"),
            ("GB", "United Kingdom", "vat_reduced", 5.0, "Reduced VAT for Domestic Fuel & Power", "https://www.gov.uk/vat-rates"),
            ("GB", "United Kingdom", "corporate", 25.0, "Corporation Tax Main Rate", "https://www.gov.uk/corporation-tax-rates"),
            ("GB", "United Kingdom", "corporate_small", 19.0, "Small Profits Rate for Profits under £50,000", "https://www.gov.uk/corporation-tax-rates"),
            
            # Germany
            ("DE", "Germany", "vat", 19.0, "Standard Umsatzsteuer (USt)", "https://www.bzst.de"),
            ("DE", "Germany", "vat_reduced", 7.0, "Ermäßigter Steuersatz (Food & Books)", "https://www.bzst.de"),
            ("DE", "Germany", "corporate", 15.0, "Körperschaftsteuer (Federal Corporate Tax)", "https://www.bzst.de"),
            
            # France
            ("FR", "France", "vat", 20.0, "Taxe sur la valeur ajoutée (TVA normale)", "https://www.impots.gouv.fr"),
            ("FR", "France", "vat_reduced", 5.5, "TVA taux réduit (Alimentation & Livres)", "https://www.impots.gouv.fr"),
            ("FR", "France", "corporate", 25.0, "Impôt sur les sociétés (Taux normal)", "https://www.impots.gouv.fr"),
            
            # Uzbekistan (РУз)
            ("UZ", "Uzbekistan", "vat", 12.0, "Стандартная ставка НДС (ст. 258 НК РУз)", "https://soliq.uz"),
            ("UZ", "Uzbekistan", "corporate", 15.0, "Налог на прибыль юрлиц (ст. 337 НК РУз)", "https://soliq.uz"),
            ("UZ", "Uzbekistan", "corporate_small", 20.0, "Налог на прибыль для банков и финорганизаций", "https://soliq.uz"),
            ("UZ", "Uzbekistan", "income_top", 12.0, "Налог на доходы физических лиц (НДФЛ РУз)", "https://soliq.uz"),
            ("UZ", "Uzbekistan", "withholding", 10.0, "Налог на доходы нерезидентов у источника выплаты", "https://soliq.uz"),
            
            # Kazakhstan (РК)
            ("KZ", "Kazakhstan", "vat", 12.0, "Ставка НДС (ст. 422 НК РК)", "https://kgd.gov.kz"),
            ("KZ", "Kazakhstan", "corporate", 20.0, "Корпоративный подоходный налог (КПН)", "https://kgd.gov.kz"),
            ("KZ", "Kazakhstan", "income_top", 10.0, "Индивидуальный подоходный налог (ИПН)", "https://kgd.gov.kz"),
            ("KZ", "Kazakhstan", "withholding", 15.0, "КПН у источника выплаты с доходов нерезидента", "https://kgd.gov.kz"),

            # UAE
            ("AE", "United Arab Emirates", "vat", 5.0, "Federal Standard VAT Rate", "https://tax.gov.ae"),
            ("AE", "United Arab Emirates", "corporate", 9.0, "Corporate Tax on Taxable Income above AED 375,000", "https://tax.gov.ae"),
            ("AE", "United Arab Emirates", "corporate_small", 0.0, "Qualifying Free Zone Person (QFZP) 0% Rate", "https://tax.gov.ae"),

            # Singapore
            ("SG", "Singapore", "gst", 9.0, "Goods and Services Tax (GST)", "https://www.iras.gov.sg"),
            ("SG", "Singapore", "corporate", 17.0, "Headline Corporate Income Tax Rate", "https://www.iras.gov.sg"),

            # Switzerland
            ("CH", "Switzerland", "vat", 8.1, "Standard VAT (MWST/TVA)", "https://www.estv.admin.ch"),
            ("CH", "Switzerland", "vat_reduced", 2.6, "Reduced VAT for Everyday Goods", "https://www.estv.admin.ch"),
            ("CH", "Switzerland", "corporate", 8.5, "Direct Federal Corporate Income Tax", "https://www.estv.admin.ch"),

            # Cyprus
            ("CY", "Cyprus", "vat", 19.0, "Standard VAT Rate", "https://www.mof.gov.cy"),
            ("CY", "Cyprus", "corporate", 12.5, "Corporate Income Tax (CIT)", "https://www.mof.gov.cy"),

            # Japan
            ("JP", "Japan", "consumption", 10.0, "Standard Japanese Consumption Tax (JCT)", "https://www.nta.go.jp"),
            ("JP", "Japan", "corporate", 23.2, "National Corporation Tax Rate", "https://www.nta.go.jp"),

            # Canada
            ("CA", "Canada", "gst", 5.0, "Federal Goods and Services Tax (GST)", "https://www.canada.ca"),
            ("CA", "Canada", "corporate", 15.0, "Federal General Corporate Tax Rate", "https://www.canada.ca"),

            # Spain & Italy
            ("ES", "Spain", "vat", 21.0, "Impuesto sobre el Valor Añadido (IVA general)", "https://sede.agenciatributaria.gob.es"),
            ("ES", "Spain", "corporate", 25.0, "Impuesto sobre Sociedades (IS)", "https://sede.agenciatributaria.gob.es"),
            ("IT", "Italy", "vat", 22.0, "Imposta sul Valore Aggiunto (IVA ordinaria)", "https://www.agenziaentrate.gov.it"),
            ("IT", "Italy", "corporate", 24.0, "Imposta sul Reddito delle Società (IRES)", "https://www.agenziaentrate.gov.it"),
        ]
        seeded_tax_count = 0
        for c_code, c_name, t_type, rate, desc, src in sample_taxes:
            existing_tr = db.query(TaxRate).filter(
                TaxRate.country_code == c_code,
                TaxRate.tax_type == t_type
            ).first()
            if not existing_tr:
                tr = TaxRate(
                    id=uuid.uuid4(),
                    country_code=c_code,
                    country_name=c_name,
                    tax_type=t_type,
                    rate=rate,
                    description=desc,
                    source_url=src,
                    effective_from=datetime.now().date()
                )
                db.add(tr)
                seeded_tax_count += 1
        db.commit()
        total_taxes = db.query(TaxRate).count()
        print(f"   ✅ Seeded/verified {total_taxes} tax rates across 15+ countries")

        print("\n📋 [9/12] Seeding Report Templates...")
        tmpl_count = db.query(ReportTemplate).count()
        if tmpl_count == 0:
            templates = [
                ("IFRS 16 Lease Recognition & Disclosure Pack", "Standard valuation template for capital leases under IFRS 16", "financial", "US", ["corporate", "vat"]),
                ("Corporate Profit Tax & VAT Declaration Form", "Quarterly reconciliation form for tax authorities", "compliance", "UZ", ["vat", "corporate"]),
                ("1C:Enterprise General Ledger & Trial Balance Audit", "Trial balance reconciliation pack between 1C and IFRS chart of accounts", "audit", "EU", ["vat"]),
                ("Executive ESG & Carbon Accounting Summary", "Scope 1, 2, and 3 emissions reporting and governance matrix", "risk_assessment", "Global", []),
            ]
            for t_name, t_desc, t_type, t_cc, t_taxes in templates:
                tmpl = ReportTemplate(
                    id=uuid.uuid4(),
                    name=t_name,
                    description=t_desc,
                    report_type=t_type,
                    country_code=t_cc,
                    tax_types=t_taxes,
                    is_recurring=True,
                    recurrence_pattern="quarterly",
                    created_by=admin_user.id,
                    company_id=primary_company.id,
                    tenant_id=tenant.id
                )
                db.add(tmpl)
            db.commit()
            print("   ✅ Seeded 4 industry-standard report templates")
        else:
            print(f"   ℹ️ Templates already exist ({tmpl_count} found)")

        print("\n📑 [10/12] Seeding Reports, Analyses & Comments...")
        reports_count = db.query(Report).count()
        if reports_count == 0:
            # Report 1
            rep1 = Report(
                id=uuid.uuid4(),
                title="Annual Financial Convergence Report 2024",
                description="Comprehensive IFRS 16 and IAS 1 financial transformation and balance convergence pack for TechCorp International.",
                report_type="financial",
                status="approved",
                submitted_by=accountant_user.id,
                reviewed_by=auditor_user.id,
                company_id=primary_company.id,
                tenant_id=tenant.id,
                file_name="TechCorp_2024_IFRS_Convergence.xlsx",
                file_size=245800,
                submitted_at=datetime.utcnow() - timedelta(days=5),
                reviewed_at=datetime.utcnow() - timedelta(days=2),
                reviewer_comments="Verified against 1C General Ledger. Right-of-Use assets and Lease liabilities are perfectly balanced with 0 discrepancy."
            )
            db.add(rep1)
            db.commit()

            # Analysis for Report 1
            analysis1 = ReportAnalysis(
                id=uuid.uuid4(),
                report_id=rep1.id,
                country_code="US",
                tax_types=["corporate", "vat"],
                status="completed",
                overall_score=98,
                total_checks=18,
                passed_checks=18,
                warnings=0,
                errors=0,
                summary="Full compliance with IFRS 16 recognition criteria. All accounts converge with 100% precision.",
                started_at=datetime.utcnow() - timedelta(days=3),
                completed_at=datetime.utcnow() - timedelta(days=3, minutes=2)
            )
            db.add(analysis1)

            # Comments for Report 1
            c1 = ReportComment(
                id=uuid.uuid4(),
                report_id=rep1.id,
                user_id=accountant_user.id,
                comment="Synchronized directly from 1C:Enterprise OData. Lease adjustment of 12.5M ₽ applied.",
                created_at=datetime.utcnow() - timedelta(days=5)
            )
            c2 = ReportComment(
                id=uuid.uuid4(),
                report_id=rep1.id,
                user_id=auditor_user.id,
                comment="Audit checks passed. Ready for submission to external auditors and stakeholders.",
                created_at=datetime.utcnow() - timedelta(days=2)
            )
            db.add_all([c1, c2])

            # Report 2
            rep2 = Report(
                id=uuid.uuid4(),
                title="Q3 2024 Corporate Tax & VAT Reconciliation",
                description="Quarterly tax reconciliation and calculation of effective corporate tax rate across jurisdictions.",
                report_type="compliance",
                status="submitted",
                submitted_by=accountant_user.id,
                company_id=primary_company.id,
                tenant_id=tenant.id,
                file_name="Q3_Tax_Reconciliation.pdf",
                file_size=184000,
                submitted_at=datetime.utcnow() - timedelta(days=1)
            )
            db.add(rep2)
            db.commit()

            analysis2 = ReportAnalysis(
                id=uuid.uuid4(),
                report_id=rep2.id,
                country_code="UZ",
                tax_types=["vat", "corporate"],
                status="completed",
                overall_score=94,
                total_checks=14,
                passed_checks=13,
                warnings=1,
                errors=0,
                summary="VAT calculation verified. 1 minor timing difference on prepayments note.",
                started_at=datetime.utcnow() - timedelta(hours=12),
                completed_at=datetime.utcnow() - timedelta(hours=11, minutes=58)
            )
            db.add(analysis2)
            db.commit()
            print("   ✅ Seeded realistic financial reports, automated analyses, and discussion threads")
        else:
            print(f"   ℹ️ Reports already exist ({reports_count} found)")

        print("\n📁 [11/12] Seeding OCR Documents Repository...")
        docs_count = db.query(Document).count()
        if docs_count == 0:
            import json
            docs = [
                (
                    "Invoice_2024_001_CloudHosting.pdf", 
                    "uploads/documents/invoice_2024_001.pdf", 
                    DocumentType.INVOICE, 
                    DocumentStatus.COMPLETED,
                    json.dumps({
                        "invoice_number": "INV-2024-8841",
                        "vendor_name": "Cloud Infrastructure LLC",
                        "total_amount": 1250000.00,
                        "currency": "RUB",
                        "tax_amount": 250000.00,
                        "vat_rate": "20%",
                        "issue_date": "2024-11-15",
                        "due_date": "2024-12-15"
                    })
                ),
                (
                    "Contract_Lease_HQ_Tower_2024.pdf", 
                    "uploads/documents/contract_lease_hq.pdf", 
                    DocumentType.CONTRACT, 
                    DocumentStatus.COMPLETED,
                    json.dumps({
                        "contract_number": "LSE-2024-001",
                        "parties": ["TechCorp International LLC", "Prime Real Estate JSC"],
                        "contract_type": "Commercial Real Estate Lease (IFRS 16)",
                        "annual_rent": 12500000.00,
                        "lease_term_months": 60,
                        "effective_date": "2024-01-01"
                    })
                ),
                (
                    "Bank_Statement_Q4_2024_Nov.pdf", 
                    "uploads/documents/bank_statement_nov2024.pdf", 
                    DocumentType.BANK_STATEMENT, 
                    DocumentStatus.COMPLETED,
                    json.dumps({
                        "bank_name": "International Commerce Bank",
                        "account_number": "40702810900000001234",
                        "opening_balance": 8500000.00,
                        "total_credits": 24000000.00,
                        "total_debits": 14500000.00,
                        "closing_balance": 18000000.00
                    })
                )
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
                    created_at=datetime.utcnow() - timedelta(days=7),
                    processed_at=datetime.utcnow() - timedelta(days=7, minutes=1)
                )
                db.add(doc)
            db.commit()
            print("   ✅ Seeded OCR parsed documents with structured JSON financial metadata")
        else:
            print(f"   ℹ️ Documents already exist ({docs_count} found)")

        print("\n🛡️ [12/12] Seeding Audit Logs & 1C Sync History...")
        logs_count = db.query(AuditLog).count()
        if logs_count == 0:
            audit_events = [
                (admin_user.id, "login", "auth", "User admin@techcorp.com logged into system", "192.168.1.10", 6),
                (owner_user.id, "update", "company", "Updated 1C:Enterprise connection parameters with AES-256 encryption", "192.168.1.25", 5),
                (accountant_user.id, "sync", "1c_connector", "Synchronized 2024 Trial Balance (14 accounts, 120M ₽)", "192.168.1.40", 4),
                (accountant_user.id, "transform", "balance_sheet", "Executed IFRS 16 lease capitalization adjustment (12.5M ₽)", "192.168.1.40", 3),
                (auditor_user.id, "review", "report", "Approved Annual Financial Convergence Report 2024", "192.168.1.88", 2),
                (admin_user.id, "update", "tax_rates", "Verified Uzbekistan and Kazakhstan VAT/Corporate tax rates", "192.168.1.10", 1),
            ]
            for u_id, act, res_type, det, ip, days_ago in audit_events:
                alog = AuditLog(
                    id=uuid.uuid4(),
                    tenant_id=tenant.id,
                    user_id=u_id,
                    action=act,
                    resource_type=res_type,
                    resource_id=str(uuid.uuid4()),
                    details=det,
                    ip_address=ip,
                    created_at=datetime.utcnow() - timedelta(days=days_ago)
                )
                db.add(alog)

            # 1C Sync Logs
            sync_events = [
                ("sync_trial_balance", "SUCCESS", 142, 14, {"message": "Trial balance synchronized successfully via OData v4 REST API", "total_amount": 120000000.00}, 2),
                ("export_adjustments", "SUCCESS", 210, 2, {"message": "Successfully exported 2 adjustment entries to 1C:Enterprise Document_ОперацияБух #REG-2024-001", "total_amount": 12500000.00}, 1),
                ("test_connection", "SUCCESS", 65, 0, {"message": "Connection to 1C:Enterprise is healthy (Latency: 65ms)"}, 0),
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
                    created_at=datetime.utcnow() - timedelta(days=s_days)
                )
                db.add(slog)

            db.commit()
            print("   ✅ Seeded security audit trail and 1C synchronization logs")
        else:
            print(f"   ℹ️ Audit logs already exist ({logs_count} found)")

        print("\n" + "="*70)
        print("🎉 DEMO ENVIRONMENT SEEDED SUCCESSFULLY!")
        print("="*70)
        print("\n🔑 Ready-to-Use Test Accounts (Password for all: password123):")
        print("  1. Superadmin:  admin@techcorp.com       (Full system & user control)")
        print("  2. Owner:       owner@techcorp.com       (Company settings & integrations)")
        print("  3. Accountant:  accountant@techcorp.com  (Balance sheets & 1C Sync)")
        print("  4. Auditor:     auditor@techcorp.com     (Audit logs & IFRS reviews)")
        print("="*70)

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo()
