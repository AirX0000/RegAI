#!/usr/bin/env python3
"""
RegAI — Demo Companies & Users Seed Script
Creates 3 realistic companies with full role sets for testing/demo purposes.

Run from backend/:
    source venv/bin/activate && python ../scripts/seed_demo_companies.py
"""
import sys
import os
import uuid
from datetime import datetime, timezone, date

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.db.session import SessionLocal, engine  # type: ignore[import]
from app.db.base import Base  # type: ignore[import]
from app.core.security import get_password_hash  # type: ignore[import]
from app.db.models.user import User  # type: ignore[import]
from app.db.models.company import Company  # type: ignore[import]
from app.db.models.tenant import Tenant  # type: ignore[import]
from app.db.models.alert import Alert  # type: ignore[import]
from app.db.models.balance_sheet import BalanceSheet  # type: ignore[import]
from app.db.models.report import Report  # type: ignore[import]
from app.db.models.notification import Notification  # type: ignore[import]

# ─────────────────────────────────────────────────────────────────────────────
# DEMO COMPANIES CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

DEMO_COMPANIES = [
    {
        "tenant_name": "FinBridge Group",
        "tenant_plan": "enterprise",
        "company": {
            "name": "FinBridge Capital",
            "domain": "finbridge.demo",
            "description": "Leading investment banking and asset management firm operating across EU and CIS markets.",
            "website": "https://finbridge.demo",
            "industry": "Financial Services",
            "employee_count": 850,
        },
        "users": [
            {
                "email": "owner@finbridge.demo",
                "full_name": "Alexander Petrov",
                "role": "company_owner",
                "is_company_owner": True,
                "hierarchy_level": 1,
                "password": "FinBridge2026!",
            },
            {
                "email": "admin@finbridge.demo",
                "full_name": "Maria Ivanova",
                "role": "admin",
                "is_company_owner": False,
                "hierarchy_level": 2,
                "password": "FinBridge2026!",
            },
            {
                "email": "accountant@finbridge.demo",
                "full_name": "Dmitry Sokolov",
                "role": "accountant",
                "is_company_owner": False,
                "hierarchy_level": 3,
                "password": "FinBridge2026!",
            },
            {
                "email": "auditor@finbridge.demo",
                "full_name": "Elena Kozlova",
                "role": "auditor",
                "is_company_owner": False,
                "hierarchy_level": 3,
                "password": "FinBridge2026!",
            },
            {
                "email": "analyst@finbridge.demo",
                "full_name": "Nikolay Volkov",
                "role": "user",
                "is_company_owner": False,
                "hierarchy_level": 4,
                "password": "FinBridge2026!",
            },
        ],
        "alerts": [
            {"title": "IFRS 9 ECL Model Review Required", "description": "Expected Credit Loss model parameters need annual review per IFRS 9 §5.5. Deadline: Q4 2026.", "severity": "high", "regulation_code": "IFRS-9", "status": "open"},
            {"title": "MiFID II Transaction Reporting Gap", "description": "3 equity transactions missing LEI codes in post-trade reports. Remediation required within 5 business days.", "severity": "critical", "regulation_code": "MiFID II", "status": "open"},
            {"title": "AML Beneficial Ownership Update", "description": "15 corporate clients require updated beneficial ownership documentation per 5AMLD Article 30.", "severity": "medium", "regulation_code": "AML-5AMLD", "status": "in_progress"},
            {"title": "Basel III LCR Monitoring", "description": "Liquidity Coverage Ratio at 118% — above regulatory minimum of 100%. Continue monitoring.", "severity": "low", "regulation_code": "BASE-III", "status": "resolved"},
        ],
        "reports": [
            {"title": "Q3 2026 IFRS Compliance Report", "report_type": "compliance", "status": "completed", "summary": "Quarterly IFRS compliance assessment for FinBridge Capital. All 13 applicable IFRS standards reviewed. Compliance rate: 94%."},
            {"title": "AML Annual Risk Assessment 2026", "report_type": "audit", "status": "in_progress", "summary": "Annual Anti-Money Laundering risk assessment covering customer due diligence, transaction monitoring, and SAR reporting."},
        ],
    },
    {
        "tenant_name": "MediCorp International",
        "tenant_plan": "professional",
        "company": {
            "name": "MediCorp International",
            "domain": "medicorp.demo",
            "description": "International pharmaceutical and healthcare services company, subject to HIPAA, FDA, and EU MDR regulations.",
            "website": "https://medicorp.demo",
            "industry": "Healthcare & Pharma",
            "employee_count": 1240,
        },
        "users": [
            {
                "email": "owner@medicorp.demo",
                "full_name": "Sarah Mitchell",
                "role": "company_owner",
                "is_company_owner": True,
                "hierarchy_level": 1,
                "password": "MediCorp2026!",
            },
            {
                "email": "admin@medicorp.demo",
                "full_name": "James Robertson",
                "role": "admin",
                "is_company_owner": False,
                "hierarchy_level": 2,
                "password": "MediCorp2026!",
            },
            {
                "email": "compliance@medicorp.demo",
                "full_name": "Dr. Anna Chen",
                "role": "auditor",
                "is_company_owner": False,
                "hierarchy_level": 2,
                "password": "MediCorp2026!",
            },
            {
                "email": "accountant@medicorp.demo",
                "full_name": "Michael Torres",
                "role": "accountant",
                "is_company_owner": False,
                "hierarchy_level": 3,
                "password": "MediCorp2026!",
            },
            {
                "email": "user@medicorp.demo",
                "full_name": "Linda Park",
                "role": "user",
                "is_company_owner": False,
                "hierarchy_level": 4,
                "password": "MediCorp2026!",
            },
        ],
        "alerts": [
            {"title": "HIPAA PHI Data Breach Risk — Vendor Access", "description": "Third-party vendor MedTech Solutions requires updated BAA before accessing PHI. Deadline: 14 days.", "severity": "critical", "regulation_code": "HIPAA", "status": "open"},
            {"title": "HITECH Act — Security Risk Analysis Overdue", "description": "Annual security risk analysis (45 CFR §164.308) has not been completed. Required for HIPAA compliance.", "severity": "high", "regulation_code": "HITE-ACT", "status": "open"},
            {"title": "GDPR Data Retention Policy Review", "description": "EU patient data retention policy requires review. Current policy exceeds GDPR Article 5(1)(e) storage limitation.", "severity": "medium", "regulation_code": "GDPR", "status": "in_progress"},
            {"title": "EU MDR Clinical Evaluation Update", "description": "Clinical evaluation report for Device Class IIb products due for annual update.", "severity": "medium", "regulation_code": "GDPR", "status": "open"},
        ],
        "reports": [
            {"title": "HIPAA Annual Compliance Assessment 2026", "report_type": "compliance", "status": "completed", "summary": "Comprehensive HIPAA Security and Privacy Rule compliance assessment. 47 controls reviewed, 3 gaps identified, remediation in progress."},
            {"title": "GDPR Data Processing Audit", "report_type": "audit", "status": "completed", "summary": "GDPR Article 30 Records of Processing Activities reviewed and updated. 12 processing activities documented with legal basis confirmed."},
        ],
    },
    {
        "tenant_name": "TechStart EU",
        "tenant_plan": "startup",
        "company": {
            "name": "TechStart EU",
            "domain": "techstart.demo",
            "description": "Fast-growing B2B SaaS startup operating in EU, subject to GDPR, ePrivacy, and SOC 2 requirements.",
            "website": "https://techstart.demo",
            "industry": "Technology / SaaS",
            "employee_count": 95,
        },
        "users": [
            {
                "email": "cto@techstart.demo",
                "full_name": "Viktor Zimmermann",
                "role": "company_owner",
                "is_company_owner": True,
                "hierarchy_level": 1,
                "password": "TechStart2026!",
            },
            {
                "email": "admin@techstart.demo",
                "full_name": "Sophia Müller",
                "role": "admin",
                "is_company_owner": False,
                "hierarchy_level": 2,
                "password": "TechStart2026!",
            },
            {
                "email": "dpo@techstart.demo",
                "full_name": "Lucas Dubois",
                "role": "auditor",
                "is_company_owner": False,
                "hierarchy_level": 2,
                "password": "TechStart2026!",
            },
            {
                "email": "finance@techstart.demo",
                "full_name": "Emma Bergström",
                "role": "accountant",
                "is_company_owner": False,
                "hierarchy_level": 3,
                "password": "TechStart2026!",
            },
        ],
        "alerts": [
            {"title": "Cookie Consent Implementation Required", "description": "ePrivacy Directive compliance: cookie consent banner must distinguish between essential and non-essential cookies. Current implementation non-compliant.", "severity": "high", "regulation_code": "Cookie Law", "status": "open"},
            {"title": "SOC 2 Type II Audit Preparation", "description": "SOC 2 Type II audit scheduled for Q1 2027. Evidence collection for Trust Service Criteria must begin now.", "severity": "medium", "regulation_code": "Service Organization Control 2", "status": "in_progress"},
            {"title": "GDPR Data Subject Request Backlog", "description": "4 pending Data Subject Access Requests (DSARs) approaching 30-day response deadline.", "severity": "high", "regulation_code": "GDPR", "status": "open"},
        ],
        "reports": [
            {"title": "GDPR Readiness Assessment Q3 2026", "report_type": "compliance", "status": "completed", "summary": "GDPR compliance readiness assessment. Privacy by design principles implemented in 8/12 product features. DPA agreements in place with all sub-processors."},
        ],
    },
]

# ─────────────────────────────────────────────────────────────────────────────
# SEED LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_tenant(db, name, plan):
    existing = db.query(Tenant).filter(Tenant.name == name).first()
    if existing:
        return existing, False
    tenant = Tenant(id=uuid.uuid4(), name=name, plan=plan)
    db.add(tenant)
    db.flush()
    return tenant, True


def get_or_create_company(db, tenant_id, company_data, owner_id=None):
    existing = db.query(Company).filter(
        Company.name == company_data["name"],
        Company.tenant_id == tenant_id,
    ).first()
    if existing:
        return existing, False

    company = Company(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        name=company_data["name"],
        domain=company_data["domain"],
        description=company_data["description"],
        website=company_data["website"],
        industry=company_data["industry"],
        employee_count=company_data["employee_count"],
        is_active=True,
        owner_id=owner_id,
    )
    db.add(company)
    db.flush()
    return company, True


def get_or_create_user(db, tenant_id, company_id, user_data):
    existing = db.query(User).filter(User.email == user_data["email"]).first()
    if existing:
        # Update password to ensure it matches
        existing.hashed_password = get_password_hash(user_data["password"])
        return existing, False

    user = User(
        id=uuid.uuid4(),
        email=user_data["email"],
        full_name=user_data["full_name"],
        hashed_password=get_password_hash(user_data["password"]),
        role=user_data["role"],
        is_active=True,
        is_superuser=False,
        is_company_owner=user_data.get("is_company_owner", False),
        hierarchy_level=user_data.get("hierarchy_level", 4),
        tenant_id=tenant_id,
        company_id=company_id,
    )
    db.add(user)
    db.flush()
    return user, True


def seed_alerts(db, company_id, tenant_id, admin_user_id, alerts_data):
    count = 0
    for a in alerts_data:
        existing = db.query(Alert).filter(
            Alert.message.contains(a["title"][:30]),
            Alert.company_id == company_id,
        ).first()
        if existing:
            continue
        alert = Alert(
            id=uuid.uuid4(),
            message=f"{a['title']}\n\n{a['description']}",
            severity=a["severity"],
            status=a["status"],
            regulation=a.get("regulation_code", ""),
            company_id=company_id,
            tenant_id=tenant_id,
            created_by=admin_user_id,
        )
        db.add(alert)
        count += 1
    return count


def seed_reports(db, company_id, tenant_id, user_id, reports_data):
    count = 0
    for r in reports_data:
        existing = db.query(Report).filter(
            Report.title == r["title"],
            Report.company_id == company_id,
        ).first()
        if existing:
            continue
        report = Report(
            id=uuid.uuid4(),
            title=r["title"],
            report_type=r["report_type"],
            status=r["status"],
            description=r.get("summary", ""),
            company_id=company_id,
            tenant_id=tenant_id,
            submitted_by=user_id,
        )
        db.add(report)
        count += 1
    return count


def seed_notifications(db, user_id, tenant_id, messages):
    count = 0
    for msg in messages:
        notif = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=msg["title"],
            message=msg["message"],
            type=msg.get("type", "info"),
            read=False,
        )
        db.add(notif)
        count += 1
    return count


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("=" * 70)
    print("🏢  RegAI — Demo Companies & Users Setup")
    print("=" * 70)

    credentials_output = []

    try:
        for company_cfg in DEMO_COMPANIES:
            print(f"\n{'─'*60}")
            print(f"  🏢  {company_cfg['company']['name']}")
            print(f"{'─'*60}")

            # 1. Tenant
            tenant, created = get_or_create_tenant(
                db, company_cfg["tenant_name"], company_cfg["tenant_plan"]
            )
            print(f"  Tenant: {tenant.name} ({'created' if created else 'exists'})")

            # 2. Find owner user data
            owner_data = next(u for u in company_cfg["users"] if u.get("is_company_owner"))

            # 3. Create owner user first (company needs owner_id)
            owner, _ = get_or_create_user(db, tenant.id, None, owner_data)
            db.flush()

            # 4. Company
            company, created = get_or_create_company(
                db, tenant.id, company_cfg["company"], owner_id=owner.id
            )
            print(f"  Company: {company.name} ({'created' if created else 'exists'})")

            # 5. Link owner to company
            if owner.company_id != company.id:
                owner.company_id = company.id
            db.flush()

            # 6. All users
            company_creds = []
            print(f"  Users:")
            for user_data in company_cfg["users"]:
                if user_data["email"] == owner_data["email"]:
                    user = owner
                    is_new = False
                else:
                    user, is_new = get_or_create_user(db, tenant.id, company.id, user_data)
                status = "created" if is_new else "updated"
                print(f"    [{user_data['role']:15}] {user_data['email']:40} pwd={user_data['password']} ({status})")
                company_creds.append({
                    "role": user_data["role"],
                    "name": user_data["full_name"],
                    "email": user_data["email"],
                    "password": user_data["password"],
                })

            db.flush()

            # 7. Alerts
            admin_user = db.query(User).filter(
                User.company_id == company.id,
                User.role.in_(["admin", "company_owner"])
            ).first()
            alerts_count = seed_alerts(db, company.id, tenant.id, admin_user.id, company_cfg["alerts"])
            print(f"  Alerts: {alerts_count} created")

            # 8. Reports
            reports_count = seed_reports(db, company.id, tenant.id, admin_user.id, company_cfg["reports"])
            print(f"  Reports: {reports_count} created")

            # 9. Welcome notifications for owner
            notifications = [
                {
                    "title": "Welcome to RegAI!",
                    "message": f"Your RegAI workspace for {company.name} is ready. Start by reviewing your compliance dashboard.",
                    "type": "success",
                },
                {
                    "title": "Compliance Check Recommended",
                    "message": "Run your first compliance check to identify regulatory gaps and generate action items.",
                    "type": "info",
                },
                {
                    "title": f"{len(company_cfg['alerts'])} Active Compliance Alerts",
                    "message": "You have compliance alerts that require attention. Review them in the Compliance section.",
                    "type": "warning",
                },
            ]
            notif_count = seed_notifications(db, owner.id, tenant.id, notifications)
            print(f"  Notifications: {notif_count} created")

            credentials_output.append({
                "company": company_cfg["company"]["name"],
                "industry": company_cfg["company"]["industry"],
                "tenant": company_cfg["tenant_name"],
                "plan": company_cfg["tenant_plan"],
                "users": company_creds,
            })

        db.commit()

        # ─── PRINT CREDENTIALS CARD ───────────────────────────────────────────
        print("\n")
        print("=" * 70)
        print("✅  DEMO SETUP COMPLETE — CREDENTIALS FOR TESTING")
        print("=" * 70)
        print()
        print("🔑  SUPERADMIN (Platform-wide access)")
        print(f"    Email:    admin@example.com")
        print(f"    Password: AdminSecurePassword2026!")
        print(f"    Role:     superadmin — full platform control")
        print()

        for comp in credentials_output:
            print(f"{'─'*70}")
            print(f"🏢  {comp['company']}  ({comp['industry']})")
            print(f"    Plan: {comp['plan']} | Tenant: {comp['tenant']}")
            print()
            for u in comp["users"]:
                print(f"    [{u['role']:15}] {u['name']:28}")
                print(f"    Email:    {u['email']}")
                print(f"    Password: {u['password']}")
                print()

        print("=" * 70)
        print("📌  What each role can do:")
        print("    company_owner — Full access: all reports, alerts, settings, billing")
        print("    admin         — User management, compliance, reports, alerts")
        print("    auditor       — Read-only: all reports, compliance status, alerts")
        print("    accountant    — Financial reports, tax rates, balance sheets, export")
        print("    user          — Basic dashboard, view regulations, AI chat")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
