
from fastapi.testclient import TestClient
from app.main import app
import logging

# Configure logging to print to stderr
logging.basicConfig(level=logging.DEBUG)

client = TestClient(app)

def debug_login():
    print("Attempting login via TestClient...")
    try:
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "admin@example.com",
                "password": "admin123"
            }
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response Text: {response.text}")
    except Exception as e:
        print(f"Exception caught: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_login()
