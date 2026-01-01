"""
Test script for File Upload Feature
Tests the file parser service and upload API endpoints
"""

import requests
import pandas as pd
import io
import os

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

# Login credentials (update these with your test user)
LOGIN_DATA = {
    "username": "admin@example.com",
    "password": "admin123"
}

def login():
    """Login and get access token"""
    response = requests.post(f"{BASE_URL}/auth/login", data=LOGIN_DATA)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        return None

def create_sample_excel():
    """Create a sample Excel file for testing"""
    data = {
        'Account Code': ['1010', '1020', '2010', '3010'],
        'Account Name': ['Cash', 'Bank', 'Payables', 'Capital'],
        'Amount': [50000, 150000, 60000, 140000],
        'Category': ['assets', 'assets', 'liabilities', 'equity'],
        'Subcategory': ['Current Assets', 'Current Assets', 'Current Liabilities', 'Share Capital']
    }
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False)
    output.seek(0)
    return output

def test_template_download(token):
    """Test template download endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    print("\n📥 Testing Template Download...")
    
    response = requests.get(f"{BASE_URL}/balance-sheets/template", headers=headers)
    
    if response.status_code == 200:
        print("✅ Template downloaded successfully")
        # Verify it's a valid Excel file
        try:
            df = pd.read_excel(io.BytesIO(response.content))
            print(f"   Columns found: {', '.join(df.columns)}")
            return True
        except Exception as e:
            print(f"❌ Invalid Excel file: {e}")
            return False
    else:
        print(f"❌ Download failed: {response.status_code}")
        print(response.text)
        return False

def test_file_upload(token):
    """Test file upload endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    print("\n📤 Testing File Upload...")
    
    # Create sample file
    excel_file = create_sample_excel()
    files = {'file': ('test_balance_sheet.xlsx', excel_file, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    
    response = requests.post(
        f"{BASE_URL}/balance-sheets/upload",
        headers=headers,
        files=files
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ File uploaded and parsed successfully")
        print(f"   Items found: {len(result['items'])}")
        print(f"   Valid rows: {result['valid_rows']}")
        print(f"   Balanced: {result['balance_check']['is_balanced']}")
        return result
    else:
        print(f"❌ Upload failed: {response.status_code}")
        print(response.text)
        return None

def test_confirm_upload(token, items):
    """Test confirm upload endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    print("\n💾 Testing Save Uploaded Data...")
    
    data = {
        "items": items,
        "period": "2024-12-31T00:00:00",
        "notes": "Uploaded via test script"
    }
    
    response = requests.post(
        f"{BASE_URL}/balance-sheets/upload/confirm",
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Data saved successfully")
        print(f"   Balance Sheet ID: {result['balance_sheet_id']}")
        return result['balance_sheet_id']
    else:
        print(f"❌ Save failed: {response.status_code}")
        print(response.text)
        return None

def main():
    print("=" * 60)
    print("File Upload Feature - Test Script")
    print("=" * 60)
    
    # 1. Login
    token = login()
    if not token:
        return
    
    # 2. Test Template Download
    if not test_template_download(token):
        return
        
    # 3. Test File Upload
    upload_result = test_file_upload(token)
    if not upload_result:
        return
        
    # 4. Test Save
    if upload_result['success']:
        test_confirm_upload(token, upload_result['items'])

if __name__ == "__main__":
    main()
