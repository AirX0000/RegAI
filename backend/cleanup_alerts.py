import logging
from app.db.session import SessionLocal
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_alerts():
    db = SessionLocal()
    try:
        # Option 1: Delete all alerts (simplest for demo)
        logger.info("Deleting all existing alerts...")
        result = db.execute(text("DELETE FROM alerts"))
        db.commit()
        logger.info(f"Deleted {result.rowcount} alerts")
        
        # Option 2: Update enum values to uppercase (if we want to preserve data)
        # This would require raw SQL since SQLAlchemy can't read the bad data
        # db.execute(text("UPDATE alerts SET severity = UPPER(severity), status = UPPER(status)"))
        
    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_alerts()
