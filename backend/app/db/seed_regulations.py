from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.api.v1.regulations import ingest_regulation
from app.db.schemas.regulation import RegulationCreate
from app.db.models.user import User
from app.core.config import settings

def seed_regulations():
    db = SessionLocal()
    try:
        # Get superuser for tenant_id
        superuser = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not superuser:
            print("Superuser not found. Please init db first.")
            return

        # Mock current_user object with tenant_id
        class MockUser:
            tenant_id = superuser.tenant_id
        
        current_user = MockUser()

        regulations = [
            {
                "code": "IFRS 9",
                "title": "IFRS 9 Financial Instruments",
                "jurisdiction": "International",
                "source_url": "https://www.ifrs.org/issued-standards/list-of-standards/ifrs-9-financial-instruments/",
                "effective_date": "2018-01-01",
                "content": """
                IFRS 9 Financial Instruments specifies how an entity should classify and measure financial assets, financial liabilities, and some contracts to buy or sell non-financial items.
                
                Key requirements include:
                1. Classification and Measurement: Financial assets are classified based on the business model and cash flow characteristics.
                2. Impairment: IFRS 9 introduces an expected credit loss (ECL) model, requiring earlier recognition of credit losses.
                3. Hedge Accounting: The new model aligns hedge accounting more closely with risk management.
                """
            },
            {
                "code": "IFRS 15",
                "title": "IFRS 15 Revenue from Contracts with Customers",
                "jurisdiction": "International",
                "source_url": "https://www.ifrs.org/",
                "effective_date": "2018-01-01",
                "content": """
                IFRS 15 establishes a five-step model to account for revenue arising from contracts with customers.
                
                The 5 steps are:
                1. Identify the contract with the customer.
                2. Identify the performance obligations in the contract.
                3. Determine the transaction price.
                4. Allocate the transaction price to the performance obligations.
                5. Recognize revenue when (or as) the entity satisfies a performance obligation.
                """
            },
            {
                "code": "GDPR",
                "title": "General Data Protection Regulation",
                "jurisdiction": "EU",
                "source_url": "https://gdpr.eu/",
                "effective_date": "2018-05-25",
                "content": """
                The General Data Protection Regulation (GDPR) is a regulation in EU law on data protection and privacy in the European Union and the European Economic Area.
                
                Key principles:
                - Lawfulness, fairness and transparency
                - Purpose limitation
                - Data minimization
                - Accuracy
                - Storage limitation
                - Integrity and confidentiality (security)
                - Accountability
                """
            }
        ]

        for reg_data in regulations:
            print(f"Seeding {reg_data['code']}...")
            try:
                reg_in = RegulationCreate(**reg_data)
                ingest_regulation(db=db, regulation_in=reg_in, current_user=current_user)
                print(f"Successfully seeded {reg_data['code']}")
            except Exception as e:
                print(f"Error seeding {reg_data['code']}: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    seed_regulations()
