
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def main():
    # 1. Login
    print("Logging in...")
    login_data = {
        "username": "admin@example.com",
        "password": "admin123"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} {response.text}")
            return
        
        token = response.json()["access_token"]
        print("Login successful. Token obtained.")
        
        # 2. Search Regulations
        print("\nSearching regulations...")
        headers = {"Authorization": f"Bearer {token}"}
        params = {"query": "", "limit": 5}
        
        response = requests.get(f"{BASE_URL}/regulations/search", headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Search failed: {response.status_code} {response.text}")
            return
            
        results = response.json()
        print(f"Search returned {len(results)} results.")
        for r in results:
            print(f" - {r.get('id')} (Score: {r.get('distance')})")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
