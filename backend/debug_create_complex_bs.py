import logging
from datetime import date
from decimal import Decimal
from app.db.session import SessionLocal
from app.db.models.balance_sheet import BalanceSheet, BalanceSheetItem, BalanceSheetStatus, BalanceSheetCategory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_complex_balance_sheet():
    db = SessionLocal()
    try:
        # Create Balance Sheet
        import uuid
        bs = BalanceSheet(
            company_id=uuid.uuid4(), # Random UUID to satisfy type check
            period=date(2024, 12, 31),
            status=BalanceSheetStatus.DRAFT
        )
        db.add(bs)
        db.commit()
        db.refresh(bs)
        
        items = [
            # Standard Items (Should be handled by Rules)
            ("1001", "Cash in Hand", "Assets", "Current Assets", 50000.00),
            
            # Ambiguous Items (Should be handled by AI)
            ("2001", "Obligations to Suppliers", "Liabilities", "Current Liabilities", 15000.00), # -> Trade Payables
            ("1005", "Intellectual Property Rights", "Assets", "Non-Current Assets", 75000.00), # -> Intangible Assets
            ("3001", "Owner's Initial Investment", "Equity", "Equity", 100000.00), # -> Share Capital
        ]
        
        for code, name, cat, subcat, amount in items:
            item = BalanceSheetItem(
                balance_sheet_id=bs.id,
                account_code=code,
                account_name=name,
                category=BalanceSheetCategory(cat.lower()),
                subcategory=subcat,
                amount=Decimal(str(amount))
            )
            db.add(item)
        
        db.commit()
        logger.info(f"Created Complex Balance Sheet with ID: {bs.id}")
        return bs.id
        
    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_complex_balance_sheet()
