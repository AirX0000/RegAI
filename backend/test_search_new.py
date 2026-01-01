
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
        print("Login successful.")
        
        # 2. Search for IFRS 9
        print("\nSearching for IFRS 9...")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/regulations/search?query=IFRS 9", headers=headers)
        
        if response.status_code != 200:
            print(f"Search failed: {response.status_code} {response.text}")
        else:
            results = response.json()
            print(f"Found {len(results)} results.")
            for r in results:
                print(f" - {r['metadata']['title']} (Score: {r['distance']})")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
