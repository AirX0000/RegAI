"""
Admin utility endpoints — superadmin only.
Provides database seeding and diagnostics for Railway/cloud deployments
where SSH access is not available.
"""
import subprocess
import sys
import os
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_active_user
from app.db.models.user import User
from app.db.models.regulation import Regulation
from app.db.models.tax_rate import TaxRate
from app.db.models.company import Company
from app.db.models.tenant import Tenant

logger = logging.getLogger(__name__)
router = APIRouter()


def _require_superadmin(current_user: User):
    if not current_user.is_superuser and current_user.role != "website_superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")


@router.post("/seed-demo")
def seed_demo_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Run the full demo seed script (superadmin only).
    Use this to populate the database on fresh Railway deployments
    where the startup seed may have failed.
    """
    _require_superadmin(current_user)

    # Find the seed script path
    possible_paths = [
        "/app/scripts/ai_populate_db.py",
        os.path.join(os.path.dirname(__file__), "../../../../scripts/ai_populate_db.py"),
    ]
    script_path = next((p for p in possible_paths if os.path.exists(p)), None)

    if not script_path:
        # Fallback to original seed script
        possible_paths = [
            "/app/scripts/seed_demo_environment.py",
            os.path.join(os.path.dirname(__file__), "../../../../scripts/seed_demo_environment.py"),
        ]
        script_path = next((p for p in possible_paths if os.path.exists(p)), None)

    if not script_path:
        raise HTTPException(status_code=500, detail="Seed script not found on server")


    try:
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=os.path.dirname(script_path),
        )
        output = result.stdout[-3000:] if len(result.stdout) > 3000 else result.stdout
        errors = result.stderr[-1000:] if len(result.stderr) > 1000 else result.stderr

        return {
            "success": result.returncode == 0,
            "return_code": result.returncode,
            "output": output,
            "errors": errors or None,
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Seed script timed out after 120 seconds")
    except Exception as e:
        logger.exception("Seed script failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/seed-regulations")
def seed_regulations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Seed IFRS/AML/SOX/ISO regulations directly into the database (superadmin only).
    Fast alternative to the full demo seed.
    """
    _require_superadmin(current_user)

    from app.rag.ingest import ingest_regulation

    REGULATIONS = [
        {
            "code": "IFRS-IAS-1",
            "title": "IAS 1 — Presentation of Financial Statements",
            "category": "IFRS",
            "jurisdiction": "International",
            "effective_date": "2007-01-01",
            "content": (
                "IAS 1 sets out the overall requirements for financial statements, including how they should be "
                "structured, the minimum requirements for their content, and overriding concepts. "
                "Entities must present a complete set of financial statements at least annually. "
                "A complete set includes: statement of financial position, statement of comprehensive income, "
                "statement of changes in equity, statement of cash flows, and notes. "
                "The statements must present fairly the financial position, financial performance, and cash flows. "
                "Fair presentation requires faithful representation of transactions in accordance with IFRS."
            ),
        },
        {
            "code": "IFRS-16",
            "title": "IFRS 16 — Leases",
            "category": "IFRS",
            "jurisdiction": "International",
            "effective_date": "2019-01-01",
            "content": (
                "IFRS 16 specifies how lessees and lessors should recognise, measure, present and disclose leases. "
                "Lessees are required to recognise a right-of-use asset and a lease liability for all leases "
                "with a term of more than 12 months, unless the underlying asset is of low value. "
                "Lessors continue to classify leases as operating or finance leases. "
                "The standard significantly changes how lease arrangements are reported in financial statements."
            ),
        },
        {
            "code": "IFRS-9",
            "title": "IFRS 9 — Financial Instruments",
            "category": "IFRS",
            "jurisdiction": "International",
            "effective_date": "2018-01-01",
            "content": (
                "IFRS 9 replaces IAS 39 and addresses classification and measurement of financial assets and liabilities. "
                "Financial assets are classified based on the entity's business model and contractual cash flow characteristics. "
                "The standard introduces an expected credit loss (ECL) model for impairment, requiring earlier recognition of credit losses. "
                "Hedge accounting requirements are aligned more closely with risk management activities."
            ),
        },
        {
            "code": "IFRS-15",
            "title": "IFRS 15 — Revenue from Contracts with Customers",
            "category": "IFRS",
            "jurisdiction": "International",
            "effective_date": "2018-01-01",
            "content": (
                "IFRS 15 establishes a five-step model to account for revenue from contracts with customers. "
                "Step 1: Identify the contract. Step 2: Identify performance obligations. Step 3: Determine transaction price. "
                "Step 4: Allocate transaction price. Step 5: Recognise revenue when obligation is satisfied. "
                "Revenue is recognised when control of goods or services transfers to the customer."
            ),
        },
        {
            "code": "AML-5AMLD",
            "title": "5th Anti-Money Laundering Directive (EU 2018/843)",
            "category": "AML",
            "jurisdiction": "European Union",
            "effective_date": "2020-01-10",
            "content": (
                "The 5th AMLD strengthens the EU's fight against money laundering and terrorist financing. "
                "Key requirements: enhanced due diligence for high-risk third countries, public access to beneficial ownership registers, "
                "extended AML rules to virtual currencies and prepaid cards, greater cooperation between financial intelligence units. "
                "Obliged entities must identify beneficial owners of legal entities and trusts. "
                "Suspicious transaction reports (STRs) must be filed without delay."
            ),
        },
        {
            "code": "SOX-302",
            "title": "SOX Section 302 — Corporate Responsibility for Financial Reports",
            "category": "SOX",
            "jurisdiction": "United States",
            "effective_date": "2002-07-30",
            "content": (
                "Section 302 of the Sarbanes-Oxley Act requires the CEO and CFO of public companies to personally certify "
                "the accuracy of financial reports filed with the SEC. "
                "They must certify that: the report does not contain material misstatements, "
                "financial statements fairly present the company's condition, "
                "they have disclosed all significant internal control deficiencies to auditors. "
                "Violations can result in criminal penalties up to $5 million and/or 20 years imprisonment."
            ),
        },
        {
            "code": "SOX-404",
            "title": "SOX Section 404 — Management Assessment of Internal Controls",
            "category": "SOX",
            "jurisdiction": "United States",
            "effective_date": "2002-07-30",
            "content": (
                "Section 404 requires management to assess and report on the effectiveness of internal controls over financial reporting. "
                "The annual report must include an internal control report stating management's responsibility for internal controls, "
                "management's assessment of internal control effectiveness as of fiscal year-end, "
                "and identification of the internal control framework used. "
                "External auditors must attest to and report on management's assessment."
            ),
        },
        {
            "code": "ISO-27001",
            "title": "ISO/IEC 27001 — Information Security Management",
            "category": "Security",
            "jurisdiction": "International",
            "effective_date": "2022-10-25",
            "content": (
                "ISO/IEC 27001 specifies requirements for establishing, implementing, maintaining and continually improving "
                "an information security management system (ISMS). "
                "The standard requires organisations to assess information security risks and implement appropriate controls. "
                "Annex A provides a reference set of 93 controls in 4 themes: Organisational, People, Physical, Technological. "
                "Certification demonstrates commitment to protecting information assets."
            ),
        },
        {
            "code": "GDPR",
            "title": "General Data Protection Regulation (EU 2016/679)",
            "category": "Privacy",
            "jurisdiction": "European Union",
            "effective_date": "2018-05-25",
            "content": (
                "The GDPR establishes rules for the protection of natural persons with regard to processing of personal data. "
                "Key principles: lawfulness, fairness and transparency; purpose limitation; data minimisation; accuracy; "
                "storage limitation; integrity and confidentiality; accountability. "
                "Data subjects have rights to access, rectification, erasure, restriction, portability, and objection. "
                "Data breaches must be notified to supervisory authorities within 72 hours. "
                "Penalties up to €20 million or 4% of global annual turnover."
            ),
        },
        {
            "code": "RAS-PBU-1",
            "title": "ПБУ 1/2008 — Учётная политика организации",
            "category": "RAS",
            "jurisdiction": "Russia",
            "effective_date": "2008-01-01",
            "content": (
                "ПБУ 1/2008 устанавливает правила формирования и раскрытия учётной политики организации. "
                "Учётная политика формируется исходя из допущений: имущественной обособленности, непрерывности деятельности, "
                "последовательности применения учётной политики, временной определённости фактов хозяйственной деятельности. "
                "Изменение учётной политики допускается при изменении законодательства, разработке новых способов ведения учёта "
                "или существенном изменении условий деятельности организации."
            ),
        },
    ]

    tenant_id = str(current_user.tenant_id)
    created = 0
    updated = 0
    errors = []

    for reg_data in REGULATIONS:
        try:
            existing = db.query(Regulation).filter(
                Regulation.code == reg_data["code"],
                Regulation.tenant_id == current_user.tenant_id,
            ).first()

            content_hash = ingest_regulation(
                tenant_id,
                reg_data["code"],
                reg_data["content"],
                {"title": reg_data["title"], "jurisdiction": reg_data["jurisdiction"]},
            )

            if existing:
                existing.content_hash = content_hash
                existing.title = reg_data["title"]
                updated += 1
            else:
                from datetime import datetime
                reg = Regulation(
                    code=reg_data["code"],
                    title=reg_data["title"],
                    category=reg_data["category"],
                    jurisdiction=reg_data["jurisdiction"],
                    content=reg_data["content"],
                    content_hash=content_hash,
                    tenant_id=current_user.tenant_id,
                    effective_date=datetime.strptime(reg_data["effective_date"], "%Y-%m-%d"),
                    status="active",
                )
                db.add(reg)
                created += 1
        except Exception as e:
            errors.append(f"{reg_data['code']}: {e}")
            logger.exception("Failed to seed regulation %s", reg_data["code"])

    db.commit()

    return {
        "success": True,
        "created": created,
        "updated": updated,
        "total": len(REGULATIONS),
        "errors": errors or None,
    }


@router.post("/seed-tax-rates")
def seed_tax_rates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Seed global tax rates for 15+ countries (superadmin only).
    """
    _require_superadmin(current_user)

    TAX_RATES = [
        {"country": "Russia", "country_code": "RU", "tax_type": "VAT", "rate": 20.0, "description": "Standard VAT rate"},
        {"country": "Russia", "country_code": "RU", "tax_type": "Corporate Income Tax", "rate": 20.0, "description": "Federal + regional"},
        {"country": "Russia", "country_code": "RU", "tax_type": "Personal Income Tax", "rate": 13.0, "description": "Standard PIT rate"},
        {"country": "Germany", "country_code": "DE", "tax_type": "VAT", "rate": 19.0, "description": "Standard MwSt"},
        {"country": "Germany", "country_code": "DE", "tax_type": "Corporate Income Tax", "rate": 15.0, "description": "Körperschaftsteuer + solidarity surcharge"},
        {"country": "Germany", "country_code": "DE", "tax_type": "Trade Tax", "rate": 14.0, "description": "Gewerbesteuer avg"},
        {"country": "United States", "country_code": "US", "tax_type": "Corporate Income Tax", "rate": 21.0, "description": "Federal CIT (TCJA 2017)"},
        {"country": "United States", "country_code": "US", "tax_type": "Sales Tax", "rate": 8.5, "description": "Average state sales tax"},
        {"country": "United Kingdom", "country_code": "GB", "tax_type": "VAT", "rate": 20.0, "description": "Standard VAT rate"},
        {"country": "United Kingdom", "country_code": "GB", "tax_type": "Corporate Income Tax", "rate": 25.0, "description": "Main rate from April 2023"},
        {"country": "France", "country_code": "FR", "tax_type": "VAT", "rate": 20.0, "description": "Standard TVA"},
        {"country": "France", "country_code": "FR", "tax_type": "Corporate Income Tax", "rate": 25.0, "description": "Standard IS rate"},
        {"country": "China", "country_code": "CN", "tax_type": "VAT", "rate": 13.0, "description": "Standard VAT rate"},
        {"country": "China", "country_code": "CN", "tax_type": "Corporate Income Tax", "rate": 25.0, "description": "Standard EIT rate"},
        {"country": "UAE", "country_code": "AE", "tax_type": "VAT", "rate": 5.0, "description": "Standard VAT rate"},
        {"country": "UAE", "country_code": "AE", "tax_type": "Corporate Income Tax", "rate": 9.0, "description": "Federal CIT from June 2023"},
        {"country": "Kazakhstan", "country_code": "KZ", "tax_type": "VAT", "rate": 12.0, "description": "Standard VAT rate"},
        {"country": "Kazakhstan", "country_code": "KZ", "tax_type": "Corporate Income Tax", "rate": 20.0, "description": "Standard CIT rate"},
        {"country": "Belarus", "country_code": "BY", "tax_type": "VAT", "rate": 20.0, "description": "Standard VAT rate"},
        {"country": "Belarus", "country_code": "BY", "tax_type": "Corporate Income Tax", "rate": 18.0, "description": "Standard CIT rate"},
        {"country": "Netherlands", "country_code": "NL", "tax_type": "VAT", "rate": 21.0, "description": "Standard BTW"},
        {"country": "Netherlands", "country_code": "NL", "tax_type": "Corporate Income Tax", "rate": 25.8, "description": "VPB main rate"},
        {"country": "Singapore", "country_code": "SG", "tax_type": "GST", "rate": 9.0, "description": "Goods and Services Tax"},
        {"country": "Singapore", "country_code": "SG", "tax_type": "Corporate Income Tax", "rate": 17.0, "description": "Standard CIT rate"},
        {"country": "Switzerland", "country_code": "CH", "tax_type": "VAT", "rate": 8.1, "description": "Standard MWST/TVA/IVA"},
        {"country": "Switzerland", "country_code": "CH", "tax_type": "Corporate Income Tax", "rate": 14.9, "description": "Effective federal + cantonal avg"},
    ]

    created = 0
    updated = 0

    for t in TAX_RATES:
        existing = db.query(TaxRate).filter(
            TaxRate.country_code == t["country_code"],
            TaxRate.tax_type == t["tax_type"],
            TaxRate.tenant_id == current_user.tenant_id,
        ).first()

        if existing:
            existing.rate = t["rate"]
            existing.description = t["description"]
            updated += 1
        else:
            tax = TaxRate(
                country=t["country"],
                country_code=t["country_code"],
                tax_type=t["tax_type"],
                rate=t["rate"],
                description=t["description"],
                tenant_id=current_user.tenant_id,
            )
            db.add(tax)
            created += 1

    db.commit()

    return {
        "success": True,
        "created": created,
        "updated": updated,
        "total": len(TAX_RATES),
        "countries": len(set(t["country_code"] for t in TAX_RATES)),
    }


@router.get("/status")
def get_db_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Database population status (superadmin only)."""
    _require_superadmin(current_user)

    from sqlalchemy import func
    from app.db.models.regulation import Regulation as RegModel

    regs_total = db.query(RegModel).count()
    regs_with_content = db.query(RegModel).filter(
        RegModel.content.isnot(None), RegModel.content != ""
    ).count()

    return {
        "status": "ok",
        "tenants": db.query(Tenant).count(),
        "companies": db.query(Company).count(),
        "users": db.query(User).count(),
        "regulations": {
            "total": regs_total,
            "with_content": regs_with_content,
            "coverage_pct": round(regs_with_content / regs_total * 100, 1) if regs_total else 0,
        },
        "tax_rates": db.query(TaxRate).count(),
        "data_ready": regs_with_content > 0,
    }
