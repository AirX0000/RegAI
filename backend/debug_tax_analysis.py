import requests
import logging
import json
import os

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@example.com"
PASSWORD = "admin123"
DUMMY_FILE = "dummy_report.txt"

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

    # 1.5 Get User Info (Company ID)
    company_id = ""
    try:
        response = session.get(f"{BASE_URL}/users/me", headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            company_id = user_data.get('company_id')
            logger.info(f"User Company ID: {company_id}")
        else:
            logger.error(f"Failed to get user info: {response.text}")
            return
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        return

    # 2. Upload Report
    report_id = None
    try:
        logger.info("Uploading Report...")
        with open(DUMMY_FILE, 'rb') as f:
            files = {'file': (DUMMY_FILE, f, 'text/plain')}
            data = {
                'title': 'Debug Tax Analysis Report',
                'description': 'Automated test upload',
                'report_type': 'financial',
                'company_id': company_id
            }
            response = session.post(f"{BASE_URL}/reports/", headers=headers, files=files, data=data)
            
            if response.status_code == 200:
                report_data = response.json()
                report_id = report_data['id']
                logger.info(f"Report Uploaded: {report_id}")
            else:
                logger.error(f"Upload Failed: {response.status_code} - {response.text}")
                return
    except Exception as e:
        logger.error(f"Error uploading report: {e}")
        return

    # 3. Run Analysis
    try:
        logger.info("Running Tax Analysis...")
        analysis_payload = {
            "report_id": report_id,
            "country_code": "GB",
            "tax_types": ["vat", "corporate"]
        }
        
        response = session.post(f"{BASE_URL}/report-analysis/analyze", headers=headers, json=analysis_payload)
        
        if response.status_code == 200:
            analysis = response.json()
            logger.info("Analysis Successful!")
            logger.info(f"Score: {analysis['overall_score']}")
            logger.info(f"Summary: {analysis['summary']}")
            logger.info(f"Errors Found: {len(analysis['error_details'])}")
            for error in analysis['error_details']:
                logger.info(f" - {error['type']}: {error['recommendation']}")
        else:
            logger.error(f"Analysis Failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        logger.error(f"Error running analysis: {e}")

if __name__ == "__main__":
    run_verification()
