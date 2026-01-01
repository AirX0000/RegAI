#!/usr/bin/env python3
"""
Script to populate the database with comprehensive regulation data.
Includes regulations across multiple categories and jurisdictions.
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone
import uuid

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.regulation import Regulation

# Database URL
DATABASE_URL = "sqlite:///./regai.db"

# Comprehensive regulation dataset
REGULATIONS = [
    # Privacy Regulations
    {
        "title": "General Data Protection Regulation (GDPR)",
        "description": "EU regulation on data protection and privacy for all individuals within the European Union and the European Economic Area. It addresses the transfer of personal data outside the EU and EEA areas.",
        "category": "Privacy",
        "jurisdiction": "EU",
        "effective_date": "2018-05-25",
        "source_url": "https://gdpr.eu/",
        "summary": "Comprehensive data protection law requiring consent for data processing, right to access, right to be forgotten, data portability, and breach notification within 72 hours."
    },
    {
        "title": "California Consumer Privacy Act (CCPA)",
        "description": "California state statute intended to enhance privacy rights and consumer protection for residents of California, United States.",
        "category": "Privacy",
        "jurisdiction": "US-CA",
        "effective_date": "2020-01-01",
        "source_url": "https://oag.ca.gov/privacy/ccpa",
        "summary": "Grants California residents rights to know what personal data is collected, delete personal data, opt-out of sale of personal data, and non-discrimination for exercising CCPA rights."
    },
    {
        "title": "Health Insurance Portability and Accountability Act (HIPAA)",
        "description": "US legislation that provides data privacy and security provisions for safeguarding medical information.",
        "category": "Healthcare",
        "jurisdiction": "US",
        "effective_date": "1996-08-21",
        "source_url": "https://www.hhs.gov/hipaa/",
        "summary": "Protects sensitive patient health information from being disclosed without patient consent. Includes Privacy Rule, Security Rule, and Breach Notification Rule."
    },
    {
        "title": "Personal Information Protection and Electronic Documents Act (PIPEDA)",
        "description": "Canadian federal privacy law for private-sector organizations that collect, use or disclose personal information in commercial activities.",
        "category": "Privacy",
        "jurisdiction": "CA",
        "effective_date": "2001-01-01",
        "source_url": "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/",
        "summary": "Requires organizations to obtain consent when collecting, using or disclosing personal information, and to protect personal information with appropriate safeguards."
    },
    
    # Finance Regulations
    {
        "title": "Sarbanes-Oxley Act (SOX)",
        "description": "US federal law that set new or expanded requirements for all US public company boards, management and public accounting firms.",
        "category": "Finance",
        "jurisdiction": "US",
        "effective_date": "2002-07-30",
        "source_url": "https://www.sec.gov/spotlight/sarbanes-oxley.htm",
        "summary": "Mandates strict reforms to improve financial disclosures and prevent accounting fraud. Requires CEO/CFO certification of financial reports and internal controls."
    },
    {
        "title": "Dodd-Frank Wall Street Reform Act",
        "description": "US federal law that placed regulation of the financial industry in the aftermath of the Great Recession.",
        "category": "Finance",
        "jurisdiction": "US",
        "effective_date": "2010-07-21",
        "source_url": "https://www.sec.gov/spotlight/dodd-frank.shtml",
        "summary": "Comprehensive financial reform including Volcker Rule, derivatives regulation, consumer protection, and systemic risk oversight."
    },
    {
        "title": "Basel III",
        "description": "International regulatory framework for banks developed by the Basel Committee on Banking Supervision.",
        "category": "Finance",
        "jurisdiction": "International",
        "effective_date": "2013-01-01",
        "source_url": "https://www.bis.org/bcbs/basel3.htm",
        "summary": "Strengthens bank capital requirements, introduces new regulatory requirements on bank liquidity and leverage."
    },
    {
        "title": "Markets in Financial Instruments Directive II (MiFID II)",
        "description": "EU legislation that regulates firms who provide services to clients linked to financial instruments and venues where those instruments are traded.",
        "category": "Finance",
        "jurisdiction": "EU",
        "effective_date": "2018-01-03",
        "source_url": "https://www.esma.europa.eu/policy-rules/mifid-ii-and-mifir",
        "summary": "Increases transparency across EU financial markets, strengthens investor protection, and improves the functioning of financial markets."
    },
    
    # Security Regulations
    {
        "title": "Payment Card Industry Data Security Standard (PCI DSS)",
        "description": "Information security standard for organizations that handle branded credit cards from major card schemes.",
        "category": "Security",
        "jurisdiction": "International",
        "effective_date": "2004-12-15",
        "source_url": "https://www.pcisecuritystandards.org/",
        "summary": "Requires secure network, protection of cardholder data, vulnerability management, access control, monitoring, and information security policy."
    },
    {
        "title": "ISO/IEC 27001",
        "description": "International standard for information security management systems (ISMS).",
        "category": "Security",
        "jurisdiction": "International",
        "effective_date": "2013-10-01",
        "source_url": "https://www.iso.org/isoiec-27001-information-security.html",
        "summary": "Specifies requirements for establishing, implementing, maintaining and continually improving an information security management system."
    },
    {
        "title": "NIST Cybersecurity Framework",
        "description": "US framework for improving critical infrastructure cybersecurity developed by the National Institute of Standards and Technology.",
        "category": "Security",
        "jurisdiction": "US",
        "effective_date": "2014-02-12",
        "source_url": "https://www.nist.gov/cyberframework",
        "summary": "Provides guidance based on existing standards, guidelines, and practices for organizations to better manage and reduce cybersecurity risk."
    },
    {
        "title": "SOC 2 (Service Organization Control 2)",
        "description": "Auditing procedure that ensures service providers securely manage data to protect the interests of the organization and privacy of its clients.",
        "category": "Security",
        "jurisdiction": "US",
        "effective_date": "2011-01-01",
        "source_url": "https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/socforserviceorganizations.html",
        "summary": "Evaluates controls relevant to security, availability, processing integrity, confidentiality, and privacy."
    },
    
    # Labor Regulations
    {
        "title": "Fair Labor Standards Act (FLSA)",
        "description": "US federal law that establishes minimum wage, overtime pay, recordkeeping, and youth employment standards.",
        "category": "Labor",
        "jurisdiction": "US",
        "effective_date": "1938-06-25",
        "source_url": "https://www.dol.gov/agencies/whd/flsa",
        "summary": "Sets federal minimum wage, requires overtime pay at time-and-a-half for hours over 40 per week, and restricts child labor."
    },
    {
        "title": "Occupational Safety and Health Act (OSHA)",
        "description": "US federal law that ensures safe and healthful working conditions by setting and enforcing standards.",
        "category": "Labor",
        "jurisdiction": "US",
        "effective_date": "1970-12-29",
        "source_url": "https://www.osha.gov/",
        "summary": "Requires employers to provide a workplace free from serious recognized hazards and comply with standards, rules and regulations."
    },
    {
        "title": "Americans with Disabilities Act (ADA)",
        "description": "US civil rights law that prohibits discrimination based on disability.",
        "category": "Labor",
        "jurisdiction": "US",
        "effective_date": "1990-07-26",
        "source_url": "https://www.ada.gov/",
        "summary": "Prohibits discrimination in employment, public services, public accommodations, and telecommunications based on disability."
    },
    {
        "title": "Family and Medical Leave Act (FMLA)",
        "description": "US labor law requiring covered employers to provide employees with job-protected unpaid leave for qualified medical and family reasons.",
        "category": "Labor",
        "jurisdiction": "US",
        "effective_date": "1993-08-05",
        "source_url": "https://www.dol.gov/agencies/whd/fmla",
        "summary": "Provides up to 12 weeks of unpaid, job-protected leave per year for specified family and medical reasons."
    },
    
    # Environmental Regulations
    {
        "title": "Clean Air Act (CAA)",
        "description": "US federal law designed to control air pollution on a national level.",
        "category": "Environmental",
        "jurisdiction": "US",
        "effective_date": "1970-12-31",
        "source_url": "https://www.epa.gov/clean-air-act-overview",
        "summary": "Requires EPA to develop and enforce regulations to protect the public from airborne contaminants known to be hazardous to human health."
    },
    {
        "title": "Clean Water Act (CWA)",
        "description": "US federal law that regulates the discharge of pollutants into US waters and quality standards for surface waters.",
        "category": "Environmental",
        "jurisdiction": "US",
        "effective_date": "1972-10-18",
        "source_url": "https://www.epa.gov/laws-regulations/summary-clean-water-act",
        "summary": "Establishes structure for regulating discharges of pollutants into waters of the United States and regulating quality standards for surface waters."
    },
    {
        "title": "REACH (Registration, Evaluation, Authorisation and Restriction of Chemicals)",
        "description": "EU regulation concerning the production and use of chemical substances and their potential impacts on human health and the environment.",
        "category": "Environmental",
        "jurisdiction": "EU",
        "effective_date": "2007-06-01",
        "source_url": "https://echa.europa.eu/regulations/reach/",
        "summary": "Requires companies to identify and manage risks linked to substances they manufacture and market in the EU."
    },
    {
        "title": "RoHS (Restriction of Hazardous Substances)",
        "description": "EU directive that restricts the use of specific hazardous materials in electrical and electronic products.",
        "category": "Environmental",
        "jurisdiction": "EU",
        "effective_date": "2006-07-01",
        "source_url": "https://ec.europa.eu/environment/topics/waste-and-recycling/rohs-directive_en",
        "summary": "Restricts use of lead, mercury, cadmium, hexavalent chromium, polybrominated biphenyls, and polybrominated diphenyl ethers in electronics."
    },
    
    # Tax Regulations
    {
        "title": "Internal Revenue Code (IRC)",
        "description": "Domestic portion of US federal statutory tax law.",
        "category": "Tax",
        "jurisdiction": "US",
        "effective_date": "1954-08-16",
        "source_url": "https://www.irs.gov/",
        "summary": "Comprehensive set of tax laws covering income tax, estate tax, gift tax, excise tax, and employment tax."
    },
    {
        "title": "Foreign Account Tax Compliance Act (FATCA)",
        "description": "US federal law requiring US persons to report foreign financial accounts and offshore assets.",
        "category": "Tax",
        "jurisdiction": "US",
        "effective_date": "2010-03-18",
        "source_url": "https://www.irs.gov/businesses/corporations/foreign-account-tax-compliance-act-fatca",
        "summary": "Targets tax non-compliance by US taxpayers with foreign accounts by requiring foreign financial institutions to report on foreign assets held by US account holders."
    },
    {
        "title": "EU VAT Directive",
        "description": "EU directive on the common system of value added tax.",
        "category": "Tax",
        "jurisdiction": "EU",
        "effective_date": "2007-01-01",
        "source_url": "https://ec.europa.eu/taxation_customs/business/vat_en",
        "summary": "Harmonizes VAT legislation across EU member states, establishing common rules for VAT application."
    },
    
    # Consumer Protection
    {
        "title": "Federal Trade Commission Act (FTC Act)",
        "description": "US federal law that prohibits unfair methods of competition and unfair or deceptive acts or practices.",
        "category": "Consumer",
        "jurisdiction": "US",
        "effective_date": "1914-09-26",
        "source_url": "https://www.ftc.gov/enforcement/statutes/federal-trade-commission-act",
        "summary": "Empowers FTC to prevent unfair competition and protect consumers from deceptive practices."
    },
    {
        "title": "Children's Online Privacy Protection Act (COPPA)",
        "description": "US federal law that imposes requirements on operators of websites or online services directed to children under 13.",
        "category": "Consumer",
        "jurisdiction": "US",
        "effective_date": "2000-04-21",
        "source_url": "https://www.ftc.gov/enforcement/rules/rulemaking-regulatory-reform-proceedings/childrens-online-privacy-protection-rule",
        "summary": "Requires verifiable parental consent before collecting personal information from children under 13."
    },
    {
        "title": "CAN-SPAM Act",
        "description": "US law that sets rules for commercial email and gives recipients the right to stop emails.",
        "category": "Consumer",
        "jurisdiction": "US",
        "effective_date": "2003-12-16",
        "source_url": "https://www.ftc.gov/tips-advice/business-center/guidance/can-spam-act-compliance-guide-business",
        "summary": "Requires honest subject lines, identification of message as an ad, valid physical postal address, and honor opt-out requests promptly."
    },
    {
        "title": "Consumer Product Safety Act (CPSA)",
        "description": "US federal law that created the Consumer Product Safety Commission to protect the public from unreasonable risks of injury from consumer products.",
        "category": "Consumer",
        "jurisdiction": "US",
        "effective_date": "1972-10-27",
        "source_url": "https://www.cpsc.gov/Regulations-Laws--Standards/Statutes/The-Consumer-Product-Safety-Act",
        "summary": "Establishes safety standards for consumer products and allows for recall of products that pose safety hazards."
    },
    
    # Additional Important Regulations
    {
        "title": "HITECH Act",
        "description": "US legislation promoting the adoption and meaningful use of health information technology.",
        "category": "Healthcare",
        "jurisdiction": "US",
        "effective_date": "2009-02-17",
        "source_url": "https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/index.html",
        "summary": "Strengthens HIPAA privacy and security protections, increases penalties for violations, and promotes electronic health records adoption."
    },
    {
        "title": "Gramm-Leach-Bliley Act (GLBA)",
        "description": "US law requiring financial institutions to explain information-sharing practices and safeguard sensitive data.",
        "category": "Finance",
        "jurisdiction": "US",
        "effective_date": "1999-11-12",
        "source_url": "https://www.ftc.gov/tips-advice/business-center/privacy-and-security/gramm-leach-bliley-act",
        "summary": "Requires financial institutions to provide privacy notices, give customers opt-out rights, and implement information security programs."
    },
    {
        "title": "Electronic Communications Privacy Act (ECPA)",
        "description": "US statute that prohibits unauthorized interception of electronic communications.",
        "category": "Privacy",
        "jurisdiction": "US",
        "effective_date": "1986-10-21",
        "source_url": "https://www.justice.gov/jm/criminal-resource-manual-1050-scope-18-usc-2510-22-electronic-communications-privacy-act",
        "summary": "Protects wire, oral, and electronic communications while in transit and when stored on computers."
    },
    {
        "title": "UK Data Protection Act 2018",
        "description": "UK's implementation of GDPR and regulation of processing of personal data.",
        "category": "Privacy",
        "jurisdiction": "UK",
        "effective_date": "2018-05-25",
        "source_url": "https://www.gov.uk/data-protection",
        "summary": "Supplements GDPR, sets out key definitions, exemptions, and enforcement powers for data protection in the UK."
    },
    {
        "title": "FERPA (Family Educational Rights and Privacy Act)",
        "description": "US federal law that protects the privacy of student education records.",
        "category": "Privacy",
        "jurisdiction": "US",
        "effective_date": "1974-08-21",
        "source_url": "https://www2.ed.gov/policy/gen/guid/fpco/ferpa/index.html",
        "summary": "Gives parents rights to access education records, request amendments, and control disclosure of information."
    },
    {
        "title": "FISMA (Federal Information Security Management Act)",
        "description": "US legislation that defines a framework for protecting government information and assets.",
        "category": "Security",
        "jurisdiction": "US",
        "effective_date": "2002-12-17",
        "source_url": "https://www.cisa.gov/federal-information-security-modernization-act",
        "summary": "Requires federal agencies to develop, document, and implement information security programs."
    },
    {
        "title": "GDPR Article 5 - Principles",
        "description": "Core principles for processing personal data under GDPR.",
        "category": "Privacy",
        "jurisdiction": "EU",
        "effective_date": "2018-05-25",
        "source_url": "https://gdpr-info.eu/art-5-gdpr/",
        "summary": "Lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity and confidentiality, accountability."
    },
    {
        "title": "CCPA Amendment - CPRA (California Privacy Rights Act)",
        "description": "California law that amends and expands the CCPA.",
        "category": "Privacy",
        "jurisdiction": "US-CA",
        "effective_date": "2023-01-01",
        "source_url": "https://oag.ca.gov/privacy/cpra",
        "summary": "Creates California Privacy Protection Agency, adds sensitive personal information category, and expands consumer rights."
    },
    {
        "title": "ePrivacy Directive (Cookie Law)",
        "description": "EU directive concerning privacy in electronic communications.",
        "category": "Privacy",
        "jurisdiction": "EU",
        "effective_date": "2002-07-12",
        "source_url": "https://ec.europa.eu/digital-single-market/en/eprivacy-directive",
        "summary": "Requires consent for cookies and similar technologies, protects confidentiality of communications."
    },
    {
        "title": "AML (Anti-Money Laundering) Regulations",
        "description": "International regulations to prevent money laundering and terrorist financing.",
        "category": "Finance",
        "jurisdiction": "International",
        "effective_date": "2001-10-26",
        "source_url": "https://www.fatf-gafi.org/",
        "summary": "Requires financial institutions to monitor transactions, report suspicious activity, and implement customer due diligence."
    },
    {
        "title": "GDPR Article 17 - Right to Erasure",
        "description": "GDPR provision granting individuals the right to have personal data erased.",
        "category": "Privacy",
        "jurisdiction": "EU",
        "effective_date": "2018-05-25",
        "source_url": "https://gdpr-info.eu/art-17-gdpr/",
        "summary": "Right to be forgotten - individuals can request deletion of personal data under certain conditions."
    },
    {
        "title": "TCPA (Telephone Consumer Protection Act)",
        "description": "US federal law that restricts telemarketing communications.",
        "category": "Consumer",
        "jurisdiction": "US",
        "effective_date": "1991-12-20",
        "source_url": "https://www.fcc.gov/general/telemarketing-and-robocalls",
        "summary": "Restricts use of automated telephone equipment, requires prior express consent for marketing calls/texts."
    },
    {
        "title": "DMCA (Digital Millennium Copyright Act)",
        "description": "US copyright law that criminalizes circumvention of digital rights management.",
        "category": "Consumer",
        "jurisdiction": "US",
        "effective_date": "1998-10-28",
        "source_url": "https://www.copyright.gov/legislation/dmca.pdf",
        "summary": "Implements WIPO treaties, criminalizes circumvention of access controls, provides safe harbor for online service providers."
    },
    {
        "title": "NERC CIP (Critical Infrastructure Protection)",
        "description": "Standards to secure assets required for operating North America's bulk electric system.",
        "category": "Security",
        "jurisdiction": "US",
        "effective_date": "2006-06-01",
        "source_url": "https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx",
        "summary": "Cybersecurity standards for bulk electric system including asset identification, security management, and incident reporting."
    },
    {
        "title": "ITAR (International Traffic in Arms Regulations)",
        "description": "US regulations controlling export and import of defense-related articles and services.",
        "category": "Security",
        "jurisdiction": "US",
        "effective_date": "1976-04-01",
        "source_url": "https://www.pmddtc.state.gov/ddtc_public/ddtc_public?id=ddtc_public_portal_itar_landing",
        "summary": "Controls export of defense and military related technologies to safeguard US national security."
    },
    {
        "title": "CMMC (Cybersecurity Maturity Model Certification)",
        "description": "US Department of Defense framework for cybersecurity requirements for contractors.",
        "category": "Security",
        "jurisdiction": "US",
        "effective_date": "2020-01-31",
        "source_url": "https://www.acq.osd.mil/cmmc/",
        "summary": "Unified standard for implementing cybersecurity across the defense industrial base supply chain."
    },
    {
        "title": "VPPA (Video Privacy Protection Act)",
        "description": "US federal law that governs disclosure of video tape rental or sale records.",
        "category": "Privacy",
        "jurisdiction": "US",
        "effective_date": "1988-11-05",
        "source_url": "https://www.law.cornell.edu/uscode/text/18/2710",
        "summary": "Prohibits video tape service providers from disclosing rental information without consumer consent."
    },
    {
        "title": "BIPA (Biometric Information Privacy Act)",
        "description": "Illinois state law regulating collection and use of biometric information.",
        "category": "Privacy",
        "jurisdiction": "US-IL",
        "effective_date": "2008-10-03",
        "source_url": "https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004",
        "summary": "Requires informed written consent before collecting biometric data, prohibits sale of biometric information."
    },
    {
        "title": "SHIELD Act",
        "description": "New York state law expanding data breach notification and cybersecurity requirements.",
        "category": "Security",
        "jurisdiction": "US-NY",
        "effective_date": "2020-03-21",
        "source_url": "https://www.nysenate.gov/legislation/bills/2019/s5575",
        "summary": "Expands definition of private information, requires reasonable data security measures, strengthens breach notification requirements."
    },
    {
        "title": "APRA (Australian Privacy Act)",
        "description": "Australian federal law regulating handling of personal information.",
        "category": "Privacy",
        "jurisdiction": "AU",
        "effective_date": "1988-12-01",
        "source_url": "https://www.oaic.gov.au/privacy/the-privacy-act",
        "summary": "Contains 13 Australian Privacy Principles covering collection, use, disclosure, and security of personal information."
    }
]


def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Get a tenant_id from existing data
    from sqlalchemy import text
    result = session.execute(text("SELECT id FROM tenants LIMIT 1"))
    tenant_row = result.fetchone()
    
    if not tenant_row:
        print("❌ No tenants found in database. Please create a tenant first.")
        return
    
    tenant_id = tenant_row[0]
    
    try:
        print("=" * 70)
        print("POPULATING REGULATIONS DATABASE")
        print("=" * 70)
        print(f"\nTotal regulations to add: {len(REGULATIONS)}")
        print(f"Using tenant_id: {tenant_id}\n")
        
        added_count = 0
        skipped_count = 0
        
        for reg_data in REGULATIONS:
            # Check if regulation already exists
            existing = session.query(Regulation).filter(
                Regulation.title == reg_data["title"]
            ).first()
            
            if existing:
                print(f"⏭️  Skipped (already exists): {reg_data['title']}")
                skipped_count += 1
                continue
            
            # Generate a code from the title (e.g., "GDPR", "CCPA", etc.)
            # Extract acronym or use first few words
            title_words = reg_data["title"].split()
            if "(" in reg_data["title"] and ")" in reg_data["title"]:
                # Extract acronym from parentheses
                code = reg_data["title"].split("(")[1].split(")")[0]
            else:
                # Use first 2-3 words or create acronym
                code = "-".join(word[:4].upper() for word in title_words[:2])
            
            # Create regulation
            regulation = Regulation(
                id=uuid.uuid4(),
                code=code,
                title=reg_data["title"],
                category=reg_data["category"],
                jurisdiction=reg_data["jurisdiction"],
                effective_date=datetime.strptime(reg_data["effective_date"], "%Y-%m-%d"),
                source_url=reg_data.get("source_url"),
                content_hash=str(uuid.uuid4())[:8],  # Simple hash for now
                tenant_id=uuid.UUID(tenant_id),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            session.add(regulation)
            added_count += 1
            print(f"✅ Added: {reg_data['title']} ({reg_data['category']}, {reg_data['jurisdiction']})")
        
        session.commit()
        
        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"✅ Successfully added: {added_count} regulations")
        print(f"⏭️  Skipped (duplicates): {skipped_count} regulations")
        print(f"📊 Total in database: {added_count + skipped_count} regulations")
        
        # Show category breakdown
        print("\n" + "=" * 70)
        print("CATEGORY BREAKDOWN")
        print("=" * 70)
        categories = {}
        for reg in REGULATIONS:
            cat = reg["category"]
            categories[cat] = categories.get(cat, 0) + 1
        
        for cat, count in sorted(categories.items()):
            print(f"  {cat}: {count} regulations")
        
        print("\n✅ Database population complete!")
        print("\nNext step: Index regulations in ChromaDB for search functionality")
        print("Run: python index_regulations_chromadb.py")
        
    except Exception as e:
        session.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == "__main__":
    main()
