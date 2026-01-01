
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def main():
    # 1. Login
    print("Logging in...")
    login_data = {
        "username": "debug_user@example.com",
        "password": "DebugPassword123!"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return
        
        token = response.json()["access_token"]
        print("Login successful.")
        
        # 2. Add Regulation
        print("\nAdding regulation...")
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "code": "TEST-001",
            "title": "Test Regulation",
            "content": "This is a test regulation content.",
            "jurisdiction": "Testland",
            "effective_date": "2025-01-01",
            "source_url": "http://example.com"
        }
        
        response = requests.post(f"{BASE_URL}/regulations/ingest", headers=headers, json=data)
        
        if response.status_code != 200:
            print(f"Add failed: {response.status_code} {response.text}")
        else:
            print("Add successful!")
            print(json.dumps(response.json(), indent=2))
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
