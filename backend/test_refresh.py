import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_refresh():
    # Login first
    print("Logging in...")
    login_data = {
        "username": "admin@example.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} {response.text}")
        return
    
    token = response.json()["access_token"]
    print("Login successful!")
    
    # Test refresh endpoint
    print("\nTesting /regulations/refresh endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.post(f"{BASE_URL}/regulations/refresh", headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("\n✅ Refresh endpoint working!")
    else:
        print("\n❌ Refresh endpoint failed!")

if __name__ == "__main__":
    test_refresh()
