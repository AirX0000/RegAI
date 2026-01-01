import sys
import logging
from app.db.session import SessionLocal
from app.db.models.alert import Alert
from app.db.models.user import User
from app.db.schemas import alert as alert_schemas

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def debug_read_alerts():
    db = SessionLocal()
    try:
        # 1. Get a user (admin)
        user = db.query(User).filter(User.email == "admin@example.com").first()
        if not user:
            logger.error("User not found")
            return

        logger.info(f"User found: {user.email}, Tenant: {user.tenant_id}")

        # 2. Run the query exactly like the endpoint
        query = db.query(Alert).filter(Alert.tenant_id == user.tenant_id)
        alerts = query.order_by(Alert.created_at.desc()).all()
        
        logger.info(f"Query returned {len(alerts)} alerts")
        
        # 3. Try to validate with Pydantic Schema
        for alert in alerts:
            try:
                logger.info(f"Validating alert {alert.id}...")
                # Pydantic v2 syntax might be model_validate, v1 is from_orm
                # The schema uses Config: from_attributes = True, so it's Pydantic v2 style or v1 compatible
                try:
                    schema_alert = alert_schemas.Alert.from_orm(alert)
                except AttributeError:
                    schema_alert = alert_schemas.Alert.model_validate(alert)
                    
                logger.info(f"Alert {alert.id} is valid.")
            except Exception as e:
                logger.error(f"Validation failed for alert {alert.id}: {e}")
                # Print attributes to see what's wrong
                logger.error(f"Alert Data: severity={alert.severity}, status={alert.status}, tenant_id={alert.tenant_id}")
                raise e

    except Exception as e:
        logger.error(f"Top level error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_read_alerts()
