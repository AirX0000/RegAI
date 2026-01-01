import requests
import logging
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@example.com"
PASSWORD = "admin123"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_verification():
    session = requests.Session()
    
    # 1. Login
    try:
        login_data = {
            "username": EMAIL,
            "password": PASSWORD
        }
        response = session.post(f"http://localhost:8000/api/v1/auth/login", data=login_data)
        if response.status_code != 200:
            logger.error(f"Login failed: {response.text}")
            return
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        logger.info("Login successful")
        
    except Exception as e:
        logger.error(f"Connection error: {e}")
        return

    # 2. Run Compliance Check
    try:
        logger.info("Triggering Compliance Check...")
        response = session.post(f"{BASE_URL}/compliance/run-check", headers=headers)
        
        if response.status_code == 200:
            logger.info(f"Check Success: {json.dumps(response.json(), indent=2)}")
        else:
            logger.error(f"Check Failed: {response.status_code} - {response.text}")
            return
            
    except Exception as e:
        logger.error(f"Error running check: {e}")
        return

    # 3. Verify Alerts Created
    try:
        logger.info("Fetching Alerts...")
        response = session.get(f"{BASE_URL}/compliance/alerts", headers=headers)
        
        if response.status_code == 200:
            alerts = response.json()
            logger.info(f"Found {len(alerts)} alerts.")
            if len(alerts) > 0:
                logger.info(f"Latest Alert: {alerts[0]['message']} ({alerts[0]['severity']})")
        else:
            logger.error(f"Fetch Failed: {response.text}")

    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")

if __name__ == "__main__":
    run_verification()
