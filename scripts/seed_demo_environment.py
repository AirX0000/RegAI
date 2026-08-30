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
    from app.db.session import SessionLocal, engine, Base
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
except ImportError:
    from backend.app.db.session import SessionLocal, engine, Base  # type: ignore
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

def seed_demo():
    # 1. Run migrations / create tables
    try:
        from alembic.config import Config
        from alembic import command
        alembic_ini_path = "alembic.ini"
        if not os.path.exists(alembic_ini_path):
            alembic_ini_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend", "alembic.ini")
        if os.path.exists(alembic_ini_path):
            alembic_cfg = Config(alembic_ini_path)
            command.upgrade(alembic_cfg, "head")
    except Exception as e:
        print(f"Migration notice: {e}")

    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        pass

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
