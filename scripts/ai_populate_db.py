#!/usr/bin/env python3
"""
AI-powered database population script for RegAI.
Uses OpenAI GPT-4o to generate comprehensive regulatory content and seed data.

Run locally:
    cd backend && source venv/bin/activate
    python ../scripts/ai_populate_db.py

Or trigger via API endpoint:
    POST /api/v1/admin/seed-demo
"""
import sys
import os
import uuid
import json
import time
from datetime import datetime, date, timezone

# Path setup
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.crypto import encrypt_secret

# ─── OpenAI Client ────────────────────────────────────────────────────────────
import openai
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

def ai_generate(prompt: str, max_tokens: int = 2000) -> str:
    """Call OpenAI GPT-4o-mini for text generation."""
    for attempt in range(3):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": (
                        "You are a regulatory compliance expert and legal analyst. "
                        "Provide accurate, detailed information about financial regulations, "
                        "accounting standards, and compliance requirements. "
                        "Write in professional English. Be thorough and precise."
                    )},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.3,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            if attempt < 2:
                print(f"   ⚠️  OpenAI retry {attempt+1}: {e}")
                time.sleep(2 ** attempt)
            else:
                raise

# ─── Regulation Definitions ───────────────────────────────────────────────────
REGULATIONS_TO_SEED = [
    # IFRS Standards
    {"code": "IFRS-1", "title": "IFRS 1 — First-time Adoption of IFRS", "category": "IFRS", "jurisdiction": "International", "effective_date": "2004-03-01"},
    {"code": "IFRS-9", "title": "IFRS 9 — Financial Instruments", "category": "IFRS", "jurisdiction": "International", "effective_date": "2018-01-01"},
    {"code": "IFRS-15", "title": "IFRS 15 — Revenue from Contracts with Customers", "category": "IFRS", "jurisdiction": "International", "effective_date": "2018-01-01"},
    {"code": "IFRS-16", "title": "IFRS 16 — Leases", "category": "IFRS", "jurisdiction": "International", "effective_date": "2019-01-01"},
    {"code": "IFRS-17", "title": "IFRS 17 — Insurance Contracts", "category": "IFRS", "jurisdiction": "International", "effective_date": "2023-01-01"},
    {"code": "IAS-1", "title": "IAS 1 — Presentation of Financial Statements", "category": "IFRS", "jurisdiction": "International", "effective_date": "2007-01-01"},
    {"code": "IAS-7", "title": "IAS 7 — Statement of Cash Flows", "category": "IFRS", "jurisdiction": "International", "effective_date": "1994-01-01"},
    {"code": "IAS-12", "title": "IAS 12 — Income Taxes", "category": "IFRS", "jurisdiction": "International", "effective_date": "1979-01-01"},
    {"code": "IAS-16", "title": "IAS 16 — Property, Plant and Equipment", "category": "IFRS", "jurisdiction": "International", "effective_date": "1983-01-01"},
    {"code": "IAS-19", "title": "IAS 19 — Employee Benefits", "category": "IFRS", "jurisdiction": "International", "effective_date": "1985-01-01"},
    {"code": "IAS-36", "title": "IAS 36 — Impairment of Assets", "category": "IFRS", "jurisdiction": "International", "effective_date": "1998-01-01"},
    {"code": "IAS-37", "title": "IAS 37 — Provisions, Contingent Liabilities and Assets", "category": "IFRS", "jurisdiction": "International", "effective_date": "1999-07-01"},
    {"code": "IAS-38", "title": "IAS 38 — Intangible Assets", "category": "IFRS", "jurisdiction": "International", "effective_date": "1998-07-01"},

    # AML / CFT
    {"code": "FATF-40", "title": "FATF 40 Recommendations — AML/CFT Standards", "category": "AML", "jurisdiction": "International", "effective_date": "2012-02-16"},
    {"code": "EU-5AMLD", "title": "5th EU Anti-Money Laundering Directive (2018/843)", "category": "AML", "jurisdiction": "European Union", "effective_date": "2020-01-10"},
    {"code": "EU-6AMLD", "title": "6th EU Anti-Money Laundering Directive (2018/1673)", "category": "AML", "jurisdiction": "European Union", "effective_date": "2020-12-03"},
    {"code": "FINCEN-BSA", "title": "FinCEN Bank Secrecy Act — AML Requirements", "category": "AML", "jurisdiction": "United States", "effective_date": "1970-10-26"},

    # SOX / US Regulations
    {"code": "SOX-302", "title": "SOX Section 302 — Corporate Responsibility for Financial Reports", "category": "SOX", "jurisdiction": "United States", "effective_date": "2002-07-30"},
    {"code": "SOX-404", "title": "SOX Section 404 — Management Assessment of Internal Controls", "category": "SOX", "jurisdiction": "United States", "effective_date": "2002-07-30"},
    {"code": "SOX-906", "title": "SOX Section 906 — Criminal Penalties for CEO/CFO Certifications", "category": "SOX", "jurisdiction": "United States", "effective_date": "2002-07-30"},

    # Privacy / Data Protection
    {"code": "GDPR", "title": "General Data Protection Regulation (EU 2016/679)", "category": "Privacy", "jurisdiction": "European Union", "effective_date": "2018-05-25"},
    {"code": "CCPA", "title": "California Consumer Privacy Act", "category": "Privacy", "jurisdiction": "United States", "effective_date": "2020-01-01"},

    # Security / ISO
    {"code": "ISO-27001", "title": "ISO/IEC 27001:2022 — Information Security Management Systems", "category": "Security", "jurisdiction": "International", "effective_date": "2022-10-25"},
    {"code": "ISO-27017", "title": "ISO/IEC 27017 — Cloud Security Controls", "category": "Security", "jurisdiction": "International", "effective_date": "2015-12-15"},
    {"code": "PCI-DSS-4", "title": "PCI DSS v4.0 — Payment Card Industry Data Security Standard", "category": "Security", "jurisdiction": "International", "effective_date": "2022-03-31"},

    # ESG
    {"code": "CSRD", "title": "Corporate Sustainability Reporting Directive (EU 2022/2464)", "category": "ESG", "jurisdiction": "European Union", "effective_date": "2024-01-01"},
    {"code": "TCFD", "title": "TCFD Recommendations — Climate-related Financial Disclosures", "category": "ESG", "jurisdiction": "International", "effective_date": "2017-06-29"},
    {"code": "GRI-1", "title": "GRI 1 — Foundation (Universal Standards 2021)", "category": "ESG", "jurisdiction": "International", "effective_date": "2023-01-01"},

    # Russian regulations (RAS / ПБУ)
    {"code": "PBU-1-2008", "title": "ПБУ 1/2008 — Учётная политика организации", "category": "RAS", "jurisdiction": "Russia", "effective_date": "2008-01-01"},
    {"code": "PBU-4-99", "title": "ПБУ 4/99 — Бухгалтерская отчётность организации", "category": "RAS", "jurisdiction": "Russia", "effective_date": "1999-07-01"},
    {"code": "PBU-6-01", "title": "ПБУ 6/01 — Учёт основных средств", "category": "RAS", "jurisdiction": "Russia", "effective_date": "2001-01-01"},
    {"code": "PBU-9-99", "title": "ПБУ 9/99 — Доходы организации", "category": "RAS", "jurisdiction": "Russia", "effective_date": "1999-01-01"},
    {"code": "PBU-10-99", "title": "ПБУ 10/99 — Расходы организации", "category": "RAS", "jurisdiction": "Russia", "effective_date": "1999-01-01"},
    {"code": "PBU-18-02", "title": "ПБУ 18/02 — Учёт расчётов по налогу на прибыль", "category": "RAS", "jurisdiction": "Russia", "effective_date": "2002-01-01"},
    {"code": "FK-RF-402", "title": "Федеральный закон № 402-ФЗ — О бухгалтерском учёте", "category": "RAS", "jurisdiction": "Russia", "effective_date": "2013-01-01"},
    {"code": "NK-RF-VAT", "title": "НК РФ Глава 21 — Налог на добавленную стоимость (НДС)", "category": "Tax", "jurisdiction": "Russia", "effective_date": "2001-01-01"},
    {"code": "NK-RF-CIT", "title": "НК РФ Глава 25 — Налог на прибыль организаций", "category": "Tax", "jurisdiction": "Russia", "effective_date": "2002-01-01"},

    # Basel / Banking
    {"code": "BASEL-III", "title": "Basel III — International Regulatory Framework for Banks", "category": "Banking", "jurisdiction": "International", "effective_date": "2013-01-01"},
    {"code": "BASEL-IV", "title": "Basel IV (BCBS 2017) — Finalising Post-Crisis Reforms", "category": "Banking", "jurisdiction": "International", "effective_date": "2025-01-01"},
]

# ─── Tax Rates ────────────────────────────────────────────────────────────────
TAX_RATES_DATA = [
    # Russia
    {"country_code": "RU", "country_name": "Russia", "tax_type": "vat", "rate": 20.0, "description": "Standard VAT rate (НДС)"},
    {"country_code": "RU", "country_name": "Russia", "tax_type": "vat", "rate": 10.0, "description": "Reduced VAT for food, medicine, children's goods"},
    {"country_code": "RU", "country_name": "Russia", "tax_type": "corporate", "rate": 25.0, "description": "Corporate income tax 2025 (Налог на прибыль), increased from 20%"},
    {"country_code": "RU", "country_name": "Russia", "tax_type": "income", "rate": 13.0, "description": "Personal income tax for residents (НДФЛ, up to 5M RUB)"},
    {"country_code": "RU", "country_name": "Russia", "tax_type": "income", "rate": 15.0, "description": "Personal income tax for high earners (>5M RUB/year)"},
    {"country_code": "RU", "country_name": "Russia", "tax_type": "payroll", "rate": 30.0, "description": "Social insurance contributions (Страховые взносы)"},
    # Germany
    {"country_code": "DE", "country_name": "Germany", "tax_type": "vat", "rate": 19.0, "description": "Standard MwSt"},
    {"country_code": "DE", "country_name": "Germany", "tax_type": "vat", "rate": 7.0, "description": "Reduced MwSt for food, books, transport"},
    {"country_code": "DE", "country_name": "Germany", "tax_type": "corporate", "rate": 15.0, "description": "Körperschaftsteuer + 5.5% solidarity surcharge"},
    {"country_code": "DE", "country_name": "Germany", "tax_type": "corporate", "rate": 14.35, "description": "Average Gewerbesteuer (trade tax)"},
    # United States
    {"country_code": "US", "country_name": "United States", "tax_type": "corporate", "rate": 21.0, "description": "Federal CIT (Tax Cuts and Jobs Act 2017)"},
    {"country_code": "US", "country_name": "United States", "tax_type": "income", "rate": 37.0, "description": "Federal top marginal income tax rate"},
    {"country_code": "US", "country_name": "United States", "tax_type": "vat", "rate": 8.87, "description": "Average combined state+local sales tax"},
    # United Kingdom
    {"country_code": "GB", "country_name": "United Kingdom", "tax_type": "vat", "rate": 20.0, "description": "Standard VAT"},
    {"country_code": "GB", "country_name": "United Kingdom", "tax_type": "corporate", "rate": 25.0, "description": "Corporation tax (main rate, from April 2023)"},
    {"country_code": "GB", "country_name": "United Kingdom", "tax_type": "corporate", "rate": 19.0, "description": "Small profits rate (<£50K profit)"},
    # European Union / France
    {"country_code": "FR", "country_name": "France", "tax_type": "vat", "rate": 20.0, "description": "Taux normal TVA"},
    {"country_code": "FR", "country_name": "France", "tax_type": "corporate", "rate": 25.0, "description": "Impôt sur les sociétés (IS)"},
    # Netherlands
    {"country_code": "NL", "country_name": "Netherlands", "tax_type": "vat", "rate": 21.0, "description": "Standard BTW"},
    {"country_code": "NL", "country_name": "Netherlands", "tax_type": "corporate", "rate": 25.8, "description": "VPB on profits >€200K"},
    {"country_code": "NL", "country_name": "Netherlands", "tax_type": "corporate", "rate": 19.0, "description": "VPB on first €200K"},
    # UAE
    {"country_code": "AE", "country_name": "United Arab Emirates", "tax_type": "vat", "rate": 5.0, "description": "Standard VAT (since 2018)"},
    {"country_code": "AE", "country_name": "United Arab Emirates", "tax_type": "corporate", "rate": 9.0, "description": "Federal Corporate Tax (since June 2023)"},
    {"country_code": "AE", "country_name": "United Arab Emirates", "tax_type": "corporate", "rate": 0.0, "description": "CIT for Free Zone qualifying income"},
    # Kazakhstan
    {"country_code": "KZ", "country_name": "Kazakhstan", "tax_type": "vat", "rate": 12.0, "description": "Standard VAT (КПН)"},
    {"country_code": "KZ", "country_name": "Kazakhstan", "tax_type": "corporate", "rate": 20.0, "description": "Corporate Income Tax (КПН)"},
    {"country_code": "KZ", "country_name": "Kazakhstan", "tax_type": "income", "rate": 10.0, "description": "Individual income tax (ИПН)"},
    # Belarus
    {"country_code": "BY", "country_name": "Belarus", "tax_type": "vat", "rate": 20.0, "description": "Standard VAT"},
    {"country_code": "BY", "country_name": "Belarus", "tax_type": "corporate", "rate": 18.0, "description": "Corporate income tax"},
    # China
    {"country_code": "CN", "country_name": "China", "tax_type": "vat", "rate": 13.0, "description": "Standard VAT rate"},
    {"country_code": "CN", "country_name": "China", "tax_type": "corporate", "rate": 25.0, "description": "Enterprise income tax (EIT)"},
    {"country_code": "CN", "country_name": "China", "tax_type": "corporate", "rate": 15.0, "description": "EIT preferential rate for High-Tech enterprises"},
    # Singapore
    {"country_code": "SG", "country_name": "Singapore", "tax_type": "vat", "rate": 9.0, "description": "GST (from Jan 2024)"},
    {"country_code": "SG", "country_name": "Singapore", "tax_type": "corporate", "rate": 17.0, "description": "Corporate income tax (flat rate)"},
    # Switzerland
    {"country_code": "CH", "country_name": "Switzerland", "tax_type": "vat", "rate": 8.1, "description": "Standard MWST/TVA/IVA"},
    {"country_code": "CH", "country_name": "Switzerland", "tax_type": "corporate", "rate": 14.9, "description": "Effective avg (federal + cantonal + communal)"},
    # India
    {"country_code": "IN", "country_name": "India", "tax_type": "vat", "rate": 18.0, "description": "Standard GST rate"},
    {"country_code": "IN", "country_name": "India", "tax_type": "corporate", "rate": 22.0, "description": "Corporate tax (domestic companies)"},
    # Turkey
    {"country_code": "TR", "country_name": "Turkey", "tax_type": "vat", "rate": 20.0, "description": "Standard KDV (increased 2023)"},
    {"country_code": "TR", "country_name": "Turkey", "tax_type": "corporate", "rate": 25.0, "description": "Corporate income tax (2023+)"},
    # Uzbekistan
    {"country_code": "UZ", "country_name": "Uzbekistan", "tax_type": "vat", "rate": 12.0, "description": "Standard VAT (НДС)"},
    {"country_code": "UZ", "country_name": "Uzbekistan", "tax_type": "corporate", "rate": 15.0, "description": "Corporate income tax"},
    {"country_code": "UZ", "country_name": "Uzbekistan", "tax_type": "income", "rate": 12.0, "description": "Personal income tax"},
]


def seed_regulations(db: Session, tenant_id, user_id):
    """AI-generate content for all regulations and seed them."""
    from app.db.models.regulation import Regulation
    from app.rag.ingest import ingest_regulation, compute_content_hash

    print(f"\n📋 Seeding {len(REGULATIONS_TO_SEED)} regulations with AI-generated content...")

    for i, reg_def in enumerate(REGULATIONS_TO_SEED):
        try:
            # Check if exists
            existing = db.query(Regulation).filter(
                Regulation.code == reg_def["code"],
            ).first()

            if existing and existing.content and len(existing.content) > 200:
                print(f"   ✓ [{i+1}/{len(REGULATIONS_TO_SEED)}] {reg_def['code']} — already has content ({len(existing.content)} chars)")
                continue

            print(f"   🤖 [{i+1}/{len(REGULATIONS_TO_SEED)}] Generating content for {reg_def['code']}...")

            # AI generate comprehensive content
            content = ai_generate(
                f"""Write a comprehensive regulatory compliance guide for: {reg_def['title']}

Include the following sections:
1. **Overview** - What is this regulation and why it matters
2. **Scope** - Who must comply (entities, industries, thresholds)
3. **Key Requirements** - The most important mandatory obligations (at least 5-8 points)
4. **Compliance Checklist** - Practical checklist for compliance officers
5. **Key Definitions** - Important terms and their meanings
6. **Penalties & Enforcement** - Consequences of non-compliance
7. **Reporting Requirements** - What must be reported, when, and to whom
8. **Recent Updates** - Any significant amendments or upcoming changes

Write detailed, practical content that a compliance officer at a mid-sized company would find valuable.
Jurisdiction: {reg_def['jurisdiction']}
Effective date: {reg_def['effective_date']}
Format in clear sections with bullet points where appropriate.""",
                max_tokens=1800
            )

            # AI generate workflow steps
            workflow_raw = ai_generate(
                f"""For compliance with {reg_def['title']}, create a structured JSON workflow.
Return ONLY valid JSON (no markdown), with this exact structure:
{{
  "steps": [
    {{"step": 1, "title": "...", "description": "...", "responsible": "CFO/Compliance Officer/...", "deadline": "...", "checklist": ["item1", "item2"]}},
    ...
  ]
}}
Include 5-7 practical workflow steps for a compliance officer.""",
                max_tokens=800
            )

            try:
                # Strip markdown fences if present
                workflow_str = workflow_raw.strip()
                if workflow_str.startswith("```"):
                    workflow_str = workflow_str.split("```")[1]
                    if workflow_str.startswith("json"):
                        workflow_str = workflow_str[4:]
                workflow_data = json.loads(workflow_str.strip())
            except Exception:
                workflow_data = {"steps": []}

            content_hash = compute_content_hash(content)

            if existing:
                existing.content = content
                existing.content_hash = content_hash
                existing.workflow_steps = workflow_data
                existing.category = reg_def.get("category", existing.category)
                existing.jurisdiction = reg_def.get("jurisdiction", existing.jurisdiction)
            else:
                reg = Regulation(
                    id=uuid.uuid4(),
                    code=reg_def["code"],
                    title=reg_def["title"],
                    category=reg_def.get("category"),
                    jurisdiction=reg_def.get("jurisdiction"),
                    content=content,
                    content_hash=content_hash,
                    workflow_steps=workflow_data,
                    source_url=reg_def.get("source_url"),
                    effective_date=datetime.strptime(reg_def["effective_date"], "%Y-%m-%d").replace(tzinfo=timezone.utc),
                    tenant_id=None,  # Global regulation
                    status="active",
                )
                db.add(reg)

            db.commit()

            # Ingest into RAG vectorstore
            try:
                ingest_regulation(
                    str(tenant_id),
                    reg_def["code"],
                    content,
                    {"title": reg_def["title"], "jurisdiction": reg_def.get("jurisdiction", "")},
                )
                print(f"   ✅ {reg_def['code']} — {len(content)} chars + RAG indexed")
            except Exception as e:
                print(f"   ⚠️  {reg_def['code']} — saved but RAG failed: {e}")

            time.sleep(0.3)  # Respect rate limits

        except Exception as e:
            print(f"   ❌ {reg_def['code']} — FAILED: {e}")
            db.rollback()


def seed_tax_rates(db: Session, tenant_id):
    """Seed comprehensive global tax rates."""
    from app.db.models.tax_rate import TaxRate

    print(f"\n💰 Seeding {len(TAX_RATES_DATA)} tax rates for {len(set(t['country_code'] for t in TAX_RATES_DATA))} countries...")

    created = 0
    for t in TAX_RATES_DATA:
        existing = db.query(TaxRate).filter(
            TaxRate.country_code == t["country_code"],
            TaxRate.tax_type == t["tax_type"],
            TaxRate.rate == t["rate"],
        ).first()

        if not existing:
            tax = TaxRate(
                id=uuid.uuid4(),
                country_code=t["country_code"],
                country_name=t["country_name"],
                tax_type=t["tax_type"],
                rate=t["rate"],
                description=t["description"],
                effective_from=date(2024, 1, 1),
                effective_to=None,
                source_url=None,
            )
            db.add(tax)
            created += 1

    db.commit()
    print(f"   ✅ Created {created} new tax rates")


def main():
    print("=" * 70)
    print("🤖 RegAI — AI-Powered Database Population Script")
    print("=" * 70)

    if not settings.OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not set. Cannot generate AI content.")
        sys.exit(1)

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        from app.db.models.user import User
        from app.db.models.tenant import Tenant

        # Find superadmin for tenant context
        admin = db.query(User).filter(User.is_superuser == True).first()
        if not admin:
            print("⚠️  No superadmin found — creating default tenant context")
            tenant_id = uuid.uuid4()
            user_id = uuid.uuid4()
        else:
            tenant_id = admin.tenant_id
            user_id = admin.id
            print(f"✅ Using tenant: {tenant_id}")

        seed_tax_rates(db, tenant_id)
        seed_regulations(db, tenant_id, user_id)

        # Final status
        from app.db.models.regulation import Regulation
        from app.db.models.tax_rate import TaxRate
        reg_count = db.query(Regulation).count()
        tax_count = db.query(TaxRate).count()
        regs_with_content = db.query(Regulation).filter(Regulation.content != None, Regulation.content != "").count()

        print("\n" + "=" * 70)
        print("✅ AI Population Complete!")
        print(f"   📋 Regulations: {reg_count} total, {regs_with_content} with content")
        print(f"   💰 Tax Rates: {tax_count}")
        print("=" * 70)

    finally:
        db.close()


if __name__ == "__main__":
    main()
