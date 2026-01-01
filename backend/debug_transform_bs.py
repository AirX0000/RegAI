import sys
import logging
import json
from app.db.session import SessionLocal
from app.services.transformation_service import TransformationService
from app.db.models.balance_sheet import BalanceSheet

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def transform_balance_sheet(bs_id: str):
    db = SessionLocal()
    try:
        # Cast string to UUID object
        import uuid
        bs_uuid = uuid.UUID(bs_id)
        bs = db.query(BalanceSheet).filter(BalanceSheet.id == bs_uuid).first()
        if not bs:
            logger.error(f"Balance Sheet {bs_id} not found")
            return

        service = TransformationService(db)
        result = service.transform(bs)
        
        print("\n=== Transformation Result ===")
        print(f"Success: {result.success}")
        
        print("\n--- IFRS Statement ---")
        print(json.dumps(result.ifrs_statement.transformed_data, indent=2))
        
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        bs_id = sys.argv[1]
        transform_balance_sheet(bs_id)
    else:
        # Get latest
        db = SessionLocal()
        bs = db.query(BalanceSheet).order_by(BalanceSheet.created_at.desc()).first()
        db.close()
        if bs:
            logger.info(f"Using latest Balance Sheet: {bs.id}")
            transform_balance_sheet(str(bs.id))
        else:
            logger.error("No Balance Sheets found")
