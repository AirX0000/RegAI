
import sys
from pathlib import Path
import uuid
from datetime import datetime

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.user import User
from app.db.models.regulation import Regulation
from app.rag import ingest

DATABASE_URL = "sqlite:///./regai.db"

REGULATIONS_TO_ADD = [
    # IFRS
    {
        "code": "IFRS-9",
        "title": "IFRS 9 — Financial Instruments",
        "jurisdiction": "International",
        "category": "Financial",
        "effective_date": "2018-01-01",
        "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-9-financial-instruments/",
        "content": """IFRS 9 Financial Instruments specifies how an entity should classify and measure financial assets, financial liabilities, and some contracts to buy or sell non-financial items.
        
        Key areas:
        1. Classification and Measurement: Financial assets are classified based on the business model and cash flow characteristics (SPPI test). Categories include Amortized Cost, FVOCI, and FVTPL.
        2. Impairment: Introduces an Expected Credit Loss (ECL) model, requiring earlier recognition of credit losses compared to the incurred loss model.
        3. Hedge Accounting: Aligns hedge accounting more closely with risk management activities."""
    },
    {
        "code": "IFRS-15",
        "title": "IFRS 15 — Revenue from Contracts with Customers",
        "jurisdiction": "International",
        "category": "Financial",
        "effective_date": "2018-01-01",
        "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/",
        "content": """IFRS 15 establishes a comprehensive framework for determining when to recognize revenue and how much revenue to recognize. The core principle is that an entity should recognize revenue to depict the transfer of promised goods or services to customers in an amount that reflects the consideration to which the entity expects to be entitled.
        
        Five-Step Model:
        1. Identify the contract(s) with a customer.
        2. Identify the performance obligations in the contract.
        3. Determine the transaction price.
        4. Allocate the transaction price to the performance obligations.
        5. Recognize revenue when (or as) the entity satisfies a performance obligation."""
    },
    {
        "code": "IFRS-16",
        "title": "IFRS 16 — Leases",
        "jurisdiction": "International",
        "category": "Financial",
        "effective_date": "2019-01-01",
        "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-16-leases/",
        "content": """IFRS 16 introduces a single lessee accounting model and requires a lessee to recognize assets and liabilities for all leases with a term of more than 12 months, unless the underlying asset is of low value.
        
        Key impacts:
        - Lessees recognize a 'right-of-use' asset and a lease liability.
        - Depreciation of the asset and interest on the liability are recognized in the income statement.
        - Lessor accounting remains substantially unchanged from IAS 17."""
    },
    {
        "code": "IFRS-17",
        "title": "IFRS 17 — Insurance Contracts",
        "jurisdiction": "International",
        "category": "Financial",
        "effective_date": "2023-01-01",
        "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-17-insurance-contracts/",
        "content": """IFRS 17 establishes the principles for the recognition, measurement, presentation and disclosure of insurance contracts within the scope of the standard.
        
        Objective:
        To ensure that an entity provides relevant information that faithfully represents those contracts. This information gives a basis for users of financial statements to assess the effect that insurance contracts have on the entity's financial position, financial performance and cash flows."""
    },
    {
        "code": "IAS-1",
        "title": "IAS 1 — Presentation of Financial Statements",
        "jurisdiction": "International",
        "category": "Financial",
        "effective_date": "2023-01-01",
        "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ias-1-presentation-of-financial-statements/",
        "content": """IAS 1 sets out the overall requirements for financial statements, including how they should be structured, the minimum requirements for their content and overriding concepts such as going concern, the accrual basis of accounting and the current/non-current distinction.
        
        Components of financial statements:
        - Statement of financial position
        - Statement of profit or loss and other comprehensive income
        - Statement of changes in equity
        - Statement of cash flows
        - Notes"""
    },
    {
        "code": "IAS-12",
        "title": "IAS 12 — Income Taxes",
        "jurisdiction": "International",
        "category": "Financial",
        "effective_date": "2023-01-01",
        "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ias-12-income-taxes/",
        "content": """IAS 12 implements a 'comprehensive balance sheet method' of accounting for income taxes, which recognizes both the current tax consequences of transactions and events and the future tax consequences of the future recovery or settlement of the carrying amount of an entity's assets and liabilities.
        
        Key concepts:
        - Current tax liabilities and assets.
        - Deferred tax liabilities and assets (temporary differences)."""
    },
    {
        "code": "IAS-36",
        "title": "IAS 36 — Impairment of Assets",
        "jurisdiction": "International",
        "category": "Financial",
        "effective_date": "2014-01-01",
        "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ias-36-impairment-of-assets/",
        "content": """IAS 36 ensures that an entity's assets are not carried at more than their recoverable amount (i.e., the higher of fair value less costs of disposal and value in use).
        
        Requirements:
        - Conduct impairment tests if there is an indication of impairment.
        - Annual impairment tests for goodwill and intangible assets with indefinite useful lives.
        - Recognize impairment loss if carrying amount > recoverable amount."""
    },
    
    # ESG
    {
        "code": "CSRD",
        "title": "Corporate Sustainability Reporting Directive",
        "jurisdiction": "EU",
        "category": "ESG",
        "effective_date": "2024-01-01",
        "source_url": "https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en",
        "content": """The Corporate Sustainability Reporting Directive (CSRD) requires large companies and listed SMEs to publish regular reports on the social and environmental risks they face, and on how their activities impact people and the environment.
        
        Key features:
        - Double materiality: Impact materiality and financial materiality.
        - Mandatory EU sustainability reporting standards (ESRS).
        - Assurance requirement (audit)."""
    },
    {
        "code": "ESRS-E1",
        "title": "ESRS E1 — Climate Change",
        "jurisdiction": "EU",
        "category": "ESG",
        "effective_date": "2024-01-01",
        "source_url": "https://efrag.org/lab2",
        "content": """ESRS E1 specifies the disclosure requirements for climate change.
        
        Topics covered:
        - Climate change adaptation.
        - Climate change mitigation.
        - Energy.
        
        Metrics:
        - GHG emissions (Scope 1, 2, and 3).
        - Carbon removals.
        - Carbon credits.
        - Internal carbon pricing."""
    },
    {
        "code": "ESRS-S1",
        "title": "ESRS S1 — Own Workforce",
        "jurisdiction": "EU",
        "category": "ESG",
        "effective_date": "2024-01-01",
        "source_url": "https://efrag.org/lab2",
        "content": """ESRS S1 specifies the disclosure requirements regarding the undertaking's own workforce.
        
        Topics covered:
        - Working conditions (wages, working time, social dialogue).
        - Equal treatment and opportunities (gender equality, training, inclusion).
        - Other work-related rights (forced labor, child labor)."""
    },
    {
        "code": "TCFD",
        "title": "TCFD Recommendations",
        "jurisdiction": "Global",
        "category": "ESG",
        "effective_date": "2017-06-01",
        "source_url": "https://www.fsb-tcfd.org/",
        "content": """The Task Force on Climate-related Financial Disclosures (TCFD) developed a framework to help public companies and other organizations more effectively disclose climate-related risks and opportunities through their existing reporting processes.
        
        Four Pillars:
        1. Governance: The organization's governance around climate-related risks and opportunities.
        2. Strategy: The actual and potential impacts of climate-related risks and opportunities on the organization's businesses, strategy, and financial planning.
        3. Risk Management: The processes used by the organization to identify, assess, and manage climate-related risks.
        4. Metrics and Targets: The metrics and targets used to assess and manage relevant climate-related risks and opportunities."""
    },
    {
        "code": "GRI",
        "title": "GRI Standards",
        "jurisdiction": "Global",
        "category": "ESG",
        "effective_date": "2023-01-01",
        "source_url": "https://www.globalreporting.org/standards/",
        "content": """The GRI Standards enable any organization – large or small, private or public – to understand and report on their impacts on the economy, environment and people in a comparable and credible way.
        
        Structure:
        - Universal Standards (GRI 1, 2, 3).
        - Sector Standards.
        - Topic Standards (Economic, Environmental, Social)."""
    },
    {
        "code": "SASB",
        "title": "SASB Standards",
        "jurisdiction": "Global",
        "category": "ESG",
        "effective_date": "2018-11-01",
        "source_url": "https://www.sasb.org/",
        "content": """SASB Standards identify the subset of environmental, social, and governance (ESG) issues most relevant to financial performance in each of 77 industries.
        
        Focus:
        - Financially material sustainability information.
        - Industry-specific.
        - Decision-useful for investors."""
    }
]

def main():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get admin user
        admin = session.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            print("Admin user not found!")
            return

        print(f"Adding regulations for tenant: {admin.tenant_id}")
        tenant_id_str = str(admin.tenant_id)

        for reg_data in REGULATIONS_TO_ADD:
            # Check if exists
            existing = session.query(Regulation).filter(Regulation.code == reg_data["code"]).first()
            if existing:
                print(f"Skipping {reg_data['code']} (already exists)")
                continue

            print(f"Adding {reg_data['code']}...")
            
            # Ingest to ChromaDB first to get content hash
            content_hash = ingest.ingest_regulation(
                tenant_id_str,
                reg_data["code"],
                reg_data["content"],
                {"title": reg_data["title"], "jurisdiction": reg_data["jurisdiction"]}
            )

            # Add to DB
            new_reg = Regulation(
                code=reg_data["code"],
                title=reg_data["title"],
                # content is stored in ChromaDB, only hash in SQL
                jurisdiction=reg_data["jurisdiction"],
                category=reg_data["category"],
                effective_date=datetime.strptime(reg_data["effective_date"], "%Y-%m-%d"),
                source_url=reg_data["source_url"],
                tenant_id=admin.tenant_id,
                content_hash=content_hash
            )
            session.add(new_reg)
        
        session.commit()
        print("Done!")

    except Exception as e:
        print(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()
