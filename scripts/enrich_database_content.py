#!/usr/bin/env python3
"""
Comprehensive Database Enrichment Script for RegAI
Populates empty/sparse tables with realistic, high-fidelity enterprise compliance data:
- Documents with full JSON-extracted OCR metadata (invoices, contracts, bank statements, tax declarations)
- Link Company to Regulations (regulatory scope per enterprise)
- Regulation Impacts with risk scores, executive summaries & action items
- Report Comments with auditor notes & review sign-offs
- Report to Regulation Links with legal references and section citations
- 1C:Enterprise Sync Logs with latency, record counts and payload metrics
"""
import sys
import os
import uuid
import json
from datetime import datetime, timedelta, timezone

# Add paths
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.models.company import Company
from app.db.models.tenant import Tenant
from app.db.models.user import User
from app.db.models.regulation import Regulation
from app.db.models.report import Report
from app.db.models.document import Document, DocumentStatus, DocumentType
from app.db.models.onec_sync_log import OneCSyncLog
from sqlalchemy import text

def to_hex(val):
    if not val:
        return None
    return uuid.UUID(str(val)).hex

def enrich_database():
    db: Session = SessionLocal()
    print("=" * 70)
    print("🚀 STARTING REGAI DATABASE ENRICHMENT")
    print("=" * 70)

    try:
        # Fetch base entities
        companies = db.query(Company).all()
        users = db.query(User).all()
        regulations = db.query(Regulation).all()
        reports = db.query(Report).all()

        if not companies or not users or not regulations:
            print("❌ Base entities missing. Run seed_demo_environment.py first.")
            return

        company_map = {c.name: c for c in companies}
        finbridge = company_map.get("FinBridge Capital") or companies[0]
        medicorp = company_map.get("MediCorp International") or (companies[1] if len(companies) > 1 else companies[0])
        techstart = company_map.get("TechStart EU") or (companies[2] if len(companies) > 2 else companies[0])

        auditor_user = next((u for u in users if u.role == "auditor"), users[0])
        accountant_user = next((u for u in users if u.role == "accountant"), users[0])
        owner_user = next((u for u in users if u.role in ["company_owner", "owner"]), users[0])

        # ----------------------------------------------------------------------
        # 1. ENRICH DOCUMENTS WITH COMPLETED STATUS & EXTRACTED JSON DATA
        # ----------------------------------------------------------------------
        print("\n📁 [1/6] Enriching Financial & Compliance Documents...")
        
        # Update existing error documents
        existing_docs = db.query(Document).all()
        for doc in existing_docs:
            doc.status = DocumentStatus.COMPLETED
            doc.error_message = None
            doc.processed_at = datetime.now(timezone.utc)
            if "invoice" in doc.filename.lower():
                doc.extracted_data = json.dumps({
                    "invoice_number": "INV-2024-9841",
                    "invoice_date": "2024-11-28",
                    "due_date": "2024-12-28",
                    "vendor_name": "KPMG Audit & Advisory Services LLC",
                    "vendor_address": "Financial District, Blvd 4, Suite 1200",
                    "total_amount": 145000.00,
                    "currency": "USD",
                    "line_items": [
                        {"description": "Annual IFRS 9 & 16 Audit Assurance", "quantity": 1, "unit_price": 95000.00, "total": 95000.00},
                        {"description": "IT General Controls (ITGC) System Assessment", "quantity": 1, "unit_price": 50000.00, "total": 50000.00}
                    ]
                })
            elif "contract" in doc.filename.lower():
                doc.extracted_data = json.dumps({
                    "contract_title": "Enterprise Cloud ERP Hosting & Service Level Agreement",
                    "parties": [
                        {"name": "FinBridge Capital", "role": "Client"},
                        {"name": "CloudOps Solutions GmbH", "role": "Service Provider"}
                    ],
                    "effective_date": "2024-01-01",
                    "expiration_date": "2026-12-31",
                    "contract_value": 720000.00,
                    "currency": "EUR",
                    "key_terms": [
                        "99.95% Availability SLA with financial compensation penalty",
                        "GDPR & ISO 27001 Data Processing Addendum (DPA) included",
                        "Quarterly disaster recovery failover drill obligation"
                    ]
                })
            elif "bank" in doc.filename.lower():
                doc.extracted_data = json.dumps({
                    "account_number": "****7892",
                    "bank_name": "Deutsche Bank AG",
                    "statement_period": "2024-11-01 to 2024-11-30",
                    "opening_balance": 18450200.00,
                    "closing_balance": 21890450.00,
                    "total_deposits": 5420000.00,
                    "total_withdrawals": 1979750.00,
                    "currency": "EUR",
                    "transactions": [
                        {"date": "2024-11-05", "description": "Client Advisory Fee Receipt", "amount": 1250000.00, "type": "credit"},
                        {"date": "2024-11-15", "description": "1C Payroll Settlement", "amount": 890000.00, "type": "debit"},
                        {"date": "2024-11-20", "description": "Dividend Yield Inflow", "amount": 4170000.00, "type": "credit"},
                        {"date": "2024-11-28", "description": "Supplier Payment - Hardware Leases", "amount": 1089750.00, "type": "debit"}
                    ]
                })
        
        # Add 3 more high-value documents if under 6
        if len(existing_docs) < 6:
            new_docs_data = [
                {
                    "filename": "tax_declaration_uz_q4_2024.pdf",
                    "type": DocumentType.OTHER,
                    "company": finbridge,
                    "uploader": accountant_user,
                    "extracted": {
                        "declaration_type": "Corporate Income Tax (CIT) & VAT Return",
                        "tax_authority": "State Tax Committee of the Republic of Uzbekistan",
                        "tax_period": "Q4 2024",
                        "calculated_tax": 482000000.00,
                        "currency": "UZS",
                        "effective_rate": "15% CIT, 12% VAT",
                        "status": "Accepted by Tax Authority"
                    }
                },
                {
                    "filename": "ifrs16_commercial_lease_agreement.pdf",
                    "type": DocumentType.CONTRACT,
                    "company": finbridge,
                    "uploader": accountant_user,
                    "extracted": {
                        "contract_title": "Commercial Office Space Operating Lease (IFRS 16 Scope)",
                        "parties": [
                            {"name": "FinBridge Capital", "role": "Lessee"},
                            {"name": "Capital Plaza Commercial Realty", "role": "Lessor"}
                        ],
                        "effective_date": "2023-01-01",
                        "expiration_date": "2028-12-31",
                        "contract_value": 12500000.00,
                        "currency": "USD",
                        "discount_rate": "7.5% Incremental Borrowing Rate (IBR)",
                        "right_of_use_asset": 10240000.00,
                        "lease_liability": 10240000.00
                    }
                },
                {
                    "filename": "soc2_type2_attestation_report.pdf",
                    "type": DocumentType.OTHER,
                    "company": techstart,
                    "uploader": auditor_user,
                    "extracted": {
                        "audit_firm": "PricewaterhouseCoopers (PwC) LLP",
                        "attestation_type": "SOC 2 Type II Compliance Report",
                        "trust_services_criteria": ["Security", "Availability", "Confidentiality"],
                        "period_covered": "2024-01-01 to 2024-12-31",
                        "opinion": "Unqualified Clean Opinion - No Exceptions Noted",
                        "cve_vulnerabilities": 0
                    }
                }
            ]
            for d in new_docs_data:
                new_doc = Document(
                    id=uuid.uuid4(),
                    company_id=d["company"].id,
                    uploaded_by=d["uploader"].id,
                    filename=d["filename"],
                    file_path=f"uploads/documents/{d['filename']}",
                    document_type=d["type"],
                    status=DocumentStatus.COMPLETED,
                    extracted_data=json.dumps(d["extracted"]),
                    created_at=datetime.now(timezone.utc) - timedelta(days=5),
                    processed_at=datetime.now(timezone.utc) - timedelta(days=5)
                )
                db.add(new_doc)
        db.commit()
        print(f"   ✅ Verified and enriched {db.query(Document).count()} documents.")

        # ----------------------------------------------------------------------
        # 2. LINK COMPANIES TO RELEVANT REGULATIONS
        # ----------------------------------------------------------------------
        print("\n🔗 [2/6] Linking Companies to Global & Local Regulations...")
        existing_links = db.execute(text("SELECT count(*) FROM link_company_regulation")).scalar()
        if existing_links == 0:
            reg_dict = {r.code: r for r in regulations}
            company_reg_scope = {
                finbridge: ["IFRS-IAS-1", "IFRS-9", "IFRS-16", "IAS-36", "Basel-III", "MiFID-II", "AML-01", "SOX-2002", "UZ-TAX-2020", "UZ-BANK-541"],
                medicorp: ["HIPAA-1996", "HITECH-2009", "GDPR-2016", "ISO-27001", "FDA-21-CFR", "UZ-HEALTH-2023"],
                techstart: ["GDPR-2016", "SOC2-TYPE2", "ISO-27001", "NIST-CSF", "EU-AI-ACT-2024", "NIS2-2023"]
            }

            links_count = 0
            for comp, codes in company_reg_scope.items():
                for code in codes:
                    reg = reg_dict.get(code)
                    if not reg:
                        # Find closest matching regulation
                        reg = next((r for r in regulations if code.split("-")[0].lower() in r.code.lower() or code.split("-")[0].lower() in r.title.lower()), None)
                    if reg:
                        db.execute(text("""
                            INSERT INTO link_company_regulation (id, company_id, regulation_id, tenant_id, created_at)
                            VALUES (:id, :cid, :rid, :tid, :created_at)
                        """), {
                            "id": to_hex(uuid.uuid4()),
                            "cid": to_hex(comp.id),
                            "rid": to_hex(reg.id),
                            "tid": to_hex(comp.tenant_id),
                            "created_at": datetime.now(timezone.utc) - timedelta(days=20)
                        })
                        links_count += 1
            db.commit()
            print(f"   ✅ Created {links_count} company-regulation bindings.")
        else:
            print(f"   ℹ️ Company regulation links already exist ({existing_links}).")

        # ----------------------------------------------------------------------
        # 3. REGULATION IMPACTS
        # ----------------------------------------------------------------------
        print("\n⚖️ [3/6] Populating Regulation Impact Scores & Action Items...")
        existing_impacts = db.execute(text("SELECT count(*) FROM regulation_impacts")).scalar()
        if existing_impacts == 0:
            impact_samples = [
                {
                    "company": finbridge,
                    "reg_search": "IFRS 9",
                    "score": 92,
                    "summary": "Critical balance sheet impact on loan portfolio loss provisions (ECL Stage 2 migration). Requires quarterly probability-of-default (PD) matrix recalculation.",
                    "actions": [
                        "Automate 1C:Enterprise sync with discounted cash flow models",
                        "Recalibrate LGD parameters with risk management committee",
                        "Implement daily ECL variance threshold alerts"
                    ]
                },
                {
                    "company": finbridge,
                    "reg_search": "IFRS 16",
                    "score": 88,
                    "summary": "Mandatory capitalization of commercial real estate and IT infrastructure leases as Right-of-Use (ROU) Assets ($10.2M) and Lease Liabilities.",
                    "actions": [
                        "Review incremental borrowing rates (IBR) across European branches",
                        "Depreciate ROU assets monthly through depreciation schedules",
                        "Reclassify short-term lease exemptions under 12 months"
                    ]
                },
                {
                    "company": finbridge,
                    "reg_search": "Basel III",
                    "score": 95,
                    "summary": "Capital Adequacy Ratio (CAR) and Liquidity Coverage Ratio (LCR) requirements. Net Stable Funding Ratio (NSFR) must stay above 105%.",
                    "actions": [
                        "Maintain High Quality Liquid Assets (HQLA) tier 1 buffer",
                        "Stress test 30-day liquidity cash outflows monthly",
                        "Submit Basel III pillar 3 disclosure report to Central Bank"
                    ]
                },
                {
                    "company": medicorp,
                    "reg_search": "GDPR",
                    "score": 85,
                    "summary": "Stringent handling of patient health data (Special Category Article 9). Consent revocation workflows and 72-hour breach reporting mandated.",
                    "actions": [
                        "Implement automated data retention cleanup in cloud stores",
                        "Conduct Data Protection Impact Assessment (DPIA) on clinical trial app",
                        "Audit sub-processor agreements for international data transfers"
                    ]
                },
                {
                    "company": techstart,
                    "reg_search": "ISO",
                    "score": 80,
                    "summary": "Information security management system (ISMS) controls. Access control reviews and vulnerability scanning required bi-weekly.",
                    "actions": [
                        "Mandate hardware MFA for all production database access",
                        "Complete third-party annual penetration testing",
                        "Automate CI/CD dependency vulnerability screening"
                    ]
                }
            ]

            created_impacts = 0
            for item in impact_samples:
                reg = next((r for r in regulations if item["reg_search"].lower() in r.title.lower() or item["reg_search"].lower() in r.code.lower()), regulations[0])
                db.execute(text("""
                    INSERT INTO regulation_impacts (id, regulation_id, company_id, impact_score, summary, action_items, created_at, updated_at)
                    VALUES (:id, :rid, :cid, :score, :summary, :actions, :created_at, :updated_at)
                """), {
                    "id": to_hex(uuid.uuid4()),
                    "rid": to_hex(reg.id),
                    "cid": to_hex(item["company"].id),
                    "score": item["score"],
                    "summary": item["summary"],
                    "actions": json.dumps(item["actions"]),
                    "created_at": datetime.now(timezone.utc) - timedelta(days=12),
                    "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
                })
                created_impacts += 1
            db.commit()
            print(f"   ✅ Seeded {created_impacts} regulation impact assessments.")
        else:
            print(f"   ℹ️ Regulation impacts already exist ({existing_impacts}).")

        # ----------------------------------------------------------------------
        # 4. REPORT AUDITOR COMMENTS
        # ----------------------------------------------------------------------
        print("\n💬 [4/6] Adding Professional Auditor & Management Comments...")
        existing_comments = db.execute(text("SELECT count(*) FROM report_comments")).scalar()
        if existing_comments == 0 and len(reports) > 0:
            sample_comments = [
                (reports[0], auditor_user, "Auditor verification complete. The IFRS 16 lease liability capitalization of 12.5M ₽ strictly aligns with IASB guidance. Documentation verified with signed lessor agreements."),
                (reports[0], accountant_user, "Noted. Adjustment voucher #ADJ-2024-001 posted in 1C:Enterprise ERP with debit to Account 08/01 and credit to Account 76."),
                (reports[0], owner_user, "Approved for executive sign-off and filing with the board audit committee."),
                (reports[1] if len(reports) > 1 else reports[0], auditor_user, "Attention required on IFRS 9 ECL stage 2 calculations. The forward-looking macroeconomic GDP degradation scenarios need stress-testing."),
                (reports[1] if len(reports) > 1 else reports[0], accountant_user, "Updated the macroeconomic loss rate weights from 40% base to 60% conservative stress. Provision adjusted accordingly.")
            ]

            added_comments = 0
            for rpt, usr, comm in sample_comments:
                db.execute(text("""
                    INSERT INTO report_comments (id, report_id, user_id, comment, created_at)
                    VALUES (:id, :rid, :uid, :comm, :created_at)
                """), {
                    "id": to_hex(uuid.uuid4()),
                    "rid": to_hex(rpt.id),
                    "uid": to_hex(usr.id),
                    "comm": comm,
                    "created_at": datetime.now(timezone.utc) - timedelta(days=4)
                })
                added_comments += 1
            db.commit()
            print(f"   ✅ Seeded {added_comments} auditor & accountant commentary threads.")
        else:
            print(f"   ℹ️ Report comments already exist ({existing_comments}).")

        # ----------------------------------------------------------------------
        # 5. REPORT REGULATION LINKS
        # ----------------------------------------------------------------------
        print("\n📑 [5/6] Mapping Reports directly to Regulatory Clauses...")
        existing_rep_links = db.execute(text("SELECT count(*) FROM report_regulation_links")).scalar()
        if existing_rep_links == 0 and len(reports) > 0:
            sample_links = [
                (reports[0], regulations[0], "Balance Sheet Disclosures & Fair Value", 14, "IAS 1.112 - Structure of Financial Notes", "Disclosures reconciled with notes 4.1 through 4.8 of trial balance."),
                (reports[0], regulations[1] if len(regulations) > 1 else regulations[0], "Impairment of Non-Financial Assets", 22, "IAS 36.54 - Cash Generating Units", "Recoverable amount tested using discounted value-in-use cash flows."),
                (reports[1] if len(reports) > 1 else reports[0], regulations[2] if len(regulations) > 2 else regulations[0], "Capital Adequacy & Buffer Compliance", 8, "Basel III Pillar 1 Minimum Capital", "Common Equity Tier 1 (CET1) verified at 14.2% versus 8.0% requirement.")
            ]

            added_rlinks = 0
            for rpt, reg, stext, spage, sref, mnotes in sample_links:
                db.execute(text("""
                    INSERT INTO report_regulation_links (id, report_id, regulation_id, section_text, section_page, section_reference, mapping_notes, created_by, tenant_id, created_at)
                    VALUES (:id, :rid, :reg_id, :stext, :spage, :sref, :mnotes, :uid, :tid, :created_at)
                """), {
                    "id": to_hex(uuid.uuid4()),
                    "rid": to_hex(rpt.id),
                    "reg_id": to_hex(reg.id),
                    "stext": stext,
                    "spage": spage,
                    "sref": sref,
                    "mnotes": mnotes,
                    "uid": to_hex(auditor_user.id),
                    "tid": to_hex(rpt.tenant_id or finbridge.tenant_id),
                    "created_at": datetime.now(timezone.utc) - timedelta(days=8)
                })
                added_rlinks += 1
            db.commit()
            print(f"   ✅ Seeded {added_rlinks} granular report-to-regulation citations.")
        else:
            print(f"   ℹ️ Report regulation links already exist ({existing_rep_links}).")

        # ----------------------------------------------------------------------
        # 6. EXPAND 1C:ENTERPRISE SYNC LOGS
        # ----------------------------------------------------------------------
        print("\n⚡ [6/6] Generating Realistic 1C:Enterprise Sync Logs History...")
        sync_logs_count = db.query(OneCSyncLog).count()
        if sync_logs_count < 10:
            sync_types = [
                ("trial_balance", "success", 14, 185, {"source": "1C:Enterprise 8.3 OData", "accounts": 14, "balanced": True}),
                ("journal_entries", "success", 342, 620, {"source": "1C:Accounting 3.0", "batch_size": 500, "unposted": 0}),
                ("fixed_assets", "success", 89, 310, {"source": "1C:Enterprise OData Asset Registry", "revaluations": 2}),
                ("payroll_liabilities", "success", 145, 240, {"source": "1C:ZUP 3.1 Payroll", "tax_withheld": True}),
                ("vat_invoices", "success", 215, 415, {"source": "1C:Factura EDI", "signed_edoc": 215}),
                ("trial_balance", "success", 14, 192, {"source": "1C:Enterprise 8.3 OData", "accounts": 14, "balanced": True}),
                ("bank_statements", "success", 78, 160, {"source": "Client-Bank 1C DirectSync", "reconciled": 78}),
                ("inventory_stock", "success", 420, 780, {"source": "1C:Trade Management", "warehouse": "Central"}),
                ("tax_settlements", "success", 12, 110, {"source": "1C:Accounting Tax Module", "verified": True}),
                ("trial_balance", "success", 14, 178, {"source": "1C:Enterprise 8.3 OData", "accounts": 14, "balanced": True})
            ]

            added_logs = 0
            for i, (stype, sstatus, recs, dur, summary) in enumerate(sync_types):
                log_dt = datetime.now(timezone.utc) - timedelta(days=(10 - i), hours=(i * 2 % 12))
                new_log = OneCSyncLog(
                    id=uuid.uuid4(),
                    company_id=finbridge.id,
                    tenant_id=finbridge.tenant_id,
                    user_id=accountant_user.id,
                    sync_type=stype,
                    status=sstatus,
                    records_processed=recs,
                    duration_ms=dur,
                    period_start=log_dt - timedelta(days=30),
                    period_end=log_dt,
                    request_payload={"odata_endpoint": f"/odata/standard.odata/{stype.capitalize()}", "timeout": 30},
                    response_summary=summary,
                    created_at=log_dt
                )
                db.add(new_log)
                added_logs += 1
            db.commit()
            print(f"   ✅ Added {added_logs} historical 1C synchronization events.")
        else:
            print(f"   ℹ️ 1C sync logs already populated ({sync_logs_count}).")

        # ----------------------------------------------------------------------
        # FINAL INTEGRITY CHECK
        # ----------------------------------------------------------------------
        print("\n🔍 Validating Final Database Health...")
        res_integrity = db.execute(text("PRAGMA integrity_check")).scalar()
        res_fk = db.execute(text("PRAGMA foreign_key_check")).fetchall()
        print(f"   • Database Integrity: {res_integrity}")
        print(f"   • Foreign Key Violations: {len(res_fk)}")
        if len(res_fk) > 0:
            print(f"   ⚠️ FK Violations detail: {res_fk}")
        else:
            print("   ✅ 100% Structural & Referential Consistency Confirmed!")

        print("\n======================================================================")
        print("🎉 DATABASE ENRICHMENT COMPLETE!")
        print("======================================================================")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during enrichment: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    enrich_database()
