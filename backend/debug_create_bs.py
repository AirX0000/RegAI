
from fastapi.testclient import TestClient
from app.main import app
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.DEBUG)

client = TestClient(app)

def debug_create_bs():
    print("Attempting to create balance sheet via TestClient...")
    
    # Login first
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    bs_data = {
        "period": datetime(2024, 12, 1).isoformat(),
        "notes": "Debug BS",
        "items": [
            {"account_code": "1010", "account_name": "Cash", "amount": 100, "category": "assets", "subcategory": "Current"}
        ]
    }
    
    try:
        response = client.post(
            "/api/v1/balance-sheets/",
            headers=headers,
            json=bs_data
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 201:
            bs_id = response.json()["id"]
            print(f"Transforming BS {bs_id}...")
            resp_trans = client.post(f"/api/v1/balance-sheets/{bs_id}/transform", headers=headers)
            print(f"Transform Status: {resp_trans.status_code}")
            print(f"Transform Text: {resp_trans.text}")
            
    except Exception as e:
        print(f"Exception caught: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_create_bs()
