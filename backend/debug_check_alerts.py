import logging
from app.db.session import SessionLocal
from app.db.models.alert import Alert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_alerts():
    db = SessionLocal()
    try:
        # Get all alerts
        alerts = db.query(Alert).all()
        
        logger.info(f"\n{'='*60}")
        logger.info(f"TOTAL ALERTS IN DATABASE: {len(alerts)}")
        logger.info(f"{'='*60}\n")
        
        # Group by status
        status_counts = {}
        severity_counts = {}
        regulation_list = set()
        
        for alert in alerts:
            status = alert.status.value if hasattr(alert.status, 'value') else str(alert.status)
            severity = alert.severity.value if hasattr(alert.severity, 'value') else str(alert.severity)
            
            status_counts[status] = status_counts.get(status, 0) + 1
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
            
            if alert.regulation:
                regulation_list.add(alert.regulation)
        
        logger.info("STATUS BREAKDOWN:")
        for status, count in status_counts.items():
            logger.info(f"  {status}: {count}")
        
        logger.info("\nSEVERITY BREAKDOWN:")
        for severity, count in severity_counts.items():
            logger.info(f"  {severity}: {count}")
        
        logger.info("\nREGULATIONS FOUND:")
        for reg in sorted(regulation_list):
            logger.info(f"  - {reg}")
        
        logger.info(f"\n{'='*60}")
        logger.info("DETAILED ALERT LIST:")
        logger.info(f"{'='*60}\n")
        
        for i, alert in enumerate(alerts, 1):
            logger.info(f"Alert #{i}:")
            logger.info(f"  ID: {alert.id}")
            logger.info(f"  Message: {alert.message}")
            logger.info(f"  Regulation: {alert.regulation or 'None'}")
            logger.info(f"  Status: {alert.status}")
            logger.info(f"  Severity: {alert.severity}")
            logger.info(f"  Created: {alert.created_at}")
            logger.info("")
        
        # Check IFRS specifically
        ifrs_alerts = db.query(Alert).filter(Alert.regulation.ilike('%IFRS%')).all()
        logger.info(f"\n{'='*60}")
        logger.info(f"ALERTS MATCHING 'IFRS': {len(ifrs_alerts)}")
        logger.info(f"{'='*60}\n")
        
        for alert in ifrs_alerts:
            logger.info(f"  - {alert.message} (Status: {alert.status}, Regulation: {alert.regulation})")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_alerts()
