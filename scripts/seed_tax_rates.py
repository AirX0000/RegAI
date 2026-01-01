"""
Seed tax rates for supported countries
Run with: PYTHONPATH=. python scripts/seed_tax_rates.py
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import date
from decimal import Decimal
import uuid

from backend.app.db.session import SessionLocal
from backend.app.db.models.tax_rate import TaxRate

def seed_tax_rates():
    db = SessionLocal()
    
    try:
        print("Seeding tax rates...")
        
        # Tax rates data
        tax_rates_data = [
            # United Kingdom
            {"country_code": "GB", "country_name": "United Kingdom", "tax_type": "vat", "rate": Decimal("20.0"), 
             "description": "Standard VAT rate", "effective_from": date(2011, 1, 4), 
             "source_url": "https://www.gov.uk/vat-rates"},
            {"country_code": "GB", "country_name": "United Kingdom", "tax_type": "vat_reduced", "rate": Decimal("5.0"), 
             "description": "Reduced VAT rate", "effective_from": date(2011, 1, 4)},
            {"country_code": "GB", "country_name": "United Kingdom", "tax_type": "corporate", "rate": Decimal("25.0"), 
             "description": "Corporation Tax main rate", "effective_from": date(2023, 4, 1),
             "source_url": "https://www.gov.uk/corporation-tax-rates"},
            
            # United States
            {"country_code": "US", "country_name": "United States", "tax_type": "corporate", "rate": Decimal("21.0"), 
             "description": "Federal corporate tax rate", "effective_from": date(2018, 1, 1),
             "source_url": "https://www.irs.gov/businesses/small-businesses-self-employed/corporate-income-tax"},
            {"country_code": "US", "country_name": "United States", "tax_type": "income_top", "rate": Decimal("37.0"), 
             "description": "Top federal income tax bracket", "effective_from": date(2018, 1, 1)},
            
            # Germany
            {"country_code": "DE", "country_name": "Germany", "tax_type": "vat", "rate": Decimal("19.0"), 
             "description": "Standard VAT rate (Mehrwertsteuer)", "effective_from": date(2007, 1, 1),
             "source_url": "https://www.bzst.de/EN/Home/home_node.html"},
            {"country_code": "DE", "country_name": "Germany", "tax_type": "vat_reduced", "rate": Decimal("7.0"), 
             "description": "Reduced VAT rate", "effective_from": date(2007, 1, 1)},
            {"country_code": "DE", "country_name": "Germany", "tax_type": "corporate", "rate": Decimal("15.0"), 
             "description": "Corporate income tax", "effective_from": date(2008, 1, 1)},
            
            # France
            {"country_code": "FR", "country_name": "France", "tax_type": "vat", "rate": Decimal("20.0"), 
             "description": "Standard VAT rate (TVA)", "effective_from": date(2014, 1, 1),
             "source_url": "https://www.impots.gouv.fr/"},
            {"country_code": "FR", "country_name": "France", "tax_type": "vat_reduced", "rate": Decimal("5.5"), 
             "description": "Reduced VAT rate", "effective_from": date(2014, 1, 1)},
            {"country_code": "FR", "country_name": "France", "tax_type": "corporate", "rate": Decimal("25.0"), 
             "description": "Corporate income tax", "effective_from": date(2022, 1, 1)},
            
            # Spain
            {"country_code": "ES", "country_name": "Spain", "tax_type": "vat", "rate": Decimal("21.0"), 
             "description": "Standard VAT rate (IVA)", "effective_from": date(2012, 9, 1)},
            {"country_code": "ES", "country_name": "Spain", "tax_type": "corporate", "rate": Decimal("25.0"), 
             "description": "Corporate income tax", "effective_from": date(2016, 1, 1)},
            
            # Italy
            {"country_code": "IT", "country_name": "Italy", "tax_type": "vat", "rate": Decimal("22.0"), 
             "description": "Standard VAT rate (IVA)", "effective_from": date(2013, 10, 1)},
            {"country_code": "IT", "country_name": "Italy", "tax_type": "corporate", "rate": Decimal("24.0"), 
             "description": "Corporate income tax (IRES)", "effective_from": date(2017, 1, 1)},
            
            # Canada
            {"country_code": "CA", "country_name": "Canada", "tax_type": "gst", "rate": Decimal("5.0"), 
             "description": "Federal GST", "effective_from": date(2008, 1, 1),
             "source_url": "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html"},
            {"country_code": "CA", "country_name": "Canada", "tax_type": "corporate", "rate": Decimal("15.0"), 
             "description": "Federal corporate tax rate", "effective_from": date(2012, 1, 1)},
            
            # Australia
            {"country_code": "AU", "country_name": "Australia", "tax_type": "gst", "rate": Decimal("10.0"), 
             "description": "Goods and Services Tax", "effective_from": date(2000, 7, 1),
             "source_url": "https://www.ato.gov.au/Business/GST/"},
            {"country_code": "AU", "country_name": "Australia", "tax_type": "corporate", "rate": Decimal("30.0"), 
             "description": "Company tax rate", "effective_from": date(2001, 7, 1)},
            {"country_code": "AU", "country_name": "Australia", "tax_type": "corporate_small", "rate": Decimal("25.0"), 
             "description": "Small business company tax rate", "effective_from": date(2021, 7, 1)},
            
            # Japan
            {"country_code": "JP", "country_name": "Japan", "tax_type": "consumption", "rate": Decimal("10.0"), 
             "description": "Consumption tax", "effective_from": date(2019, 10, 1)},
            {"country_code": "JP", "country_name": "Japan", "tax_type": "corporate", "rate": Decimal("23.2"), 
             "description": "Corporate tax rate", "effective_from": date(2018, 4, 1)},
            
            # Singapore
            {"country_code": "SG", "country_name": "Singapore", "tax_type": "gst", "rate": Decimal("9.0"), 
             "description": "Goods and Services Tax", "effective_from": date(2024, 1, 1),
             "source_url": "https://www.iras.gov.sg/taxes/goods-services-tax-(gst)"},
            {"country_code": "SG", "country_name": "Singapore", "tax_type": "corporate", "rate": Decimal("17.0"), 
             "description": "Corporate income tax", "effective_from": date(2010, 1, 1)},
            
            # Switzerland
            {"country_code": "CH", "country_name": "Switzerland", "tax_type": "vat", "rate": Decimal("8.1"), 
             "description": "Standard VAT rate (MWST)", "effective_from": date(2024, 1, 1)},
            {"country_code": "CH", "country_name": "Switzerland", "tax_type": "corporate", "rate": Decimal("8.5"), 
             "description": "Federal corporate tax rate", "effective_from": date(2020, 1, 1)},
        ]
        
        # Insert tax rates
        for rate_data in tax_rates_data:
            # Check if rate already exists
            existing = db.query(TaxRate).filter(
                TaxRate.country_code == rate_data["country_code"],
                TaxRate.tax_type == rate_data["tax_type"],
                TaxRate.effective_from == rate_data["effective_from"]
            ).first()
            
            if not existing:
                tax_rate = TaxRate(
                    id=uuid.uuid4(),
                    **rate_data
                )
                db.add(tax_rate)
                print(f"Added: {rate_data['country_name']} - {rate_data['tax_type']} ({rate_data['rate']}%)")
        
        db.commit()
        print(f"\nTax rates seeding complete!")
        
        # Print summary
        total_rates = db.query(TaxRate).count()
        countries = db.query(TaxRate.country_code).distinct().count()
        print(f"Total tax rates: {total_rates}")
        print(f"Countries covered: {countries}")
        
    except Exception as e:
        print(f"Error seeding tax rates: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_tax_rates()
