"""
Test script for Balance Sheet Transformation System
This script creates sample balance sheet data and tests the transformation logic
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

# Login credentials (update these with your test user)
LOGIN_DATA = {
    "username": "admin@example.com",  # Update with your admin email
    "password": "admin123"  # Update with your password
}

def login():
    """Login and get access token"""
    response = requests.post(f"{BASE_URL}/auth/login", data=LOGIN_DATA)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def create_sample_balance_sheet(token):
    """Create a sample balance sheet"""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Sample balance sheet data
    balance_sheet_data = {
        "period": datetime(2024, 12, 1).isoformat(),
        "notes": "Sample balance sheet for testing transformation",
        "items": [
            # Assets - Current
            {"account_code": "1010", "account_name": "Cash on Hand", "amount": 50000, "category": "assets", "subcategory": "Current Assets"},
            {"account_code": "1020", "account_name": "Bank Account", "amount": 150000, "category": "assets", "subcategory": "Current Assets"},
            {"account_code": "1030", "account_name": "Accounts Receivable", "amount": 75000, "category": "assets", "subcategory": "Current Assets"},
            {"account_code": "1040", "account_name": "Inventory", "amount": 100000, "category": "assets", "subcategory": "Current Assets"},
            
            # Assets - Non-Current
            {"account_code": "1510", "account_name": "Property and Equipment", "amount": 500000, "category": "assets", "subcategory": "Non-Current Assets"},
            {"account_code": "1520", "account_name": "Intangible Assets", "amount": 50000, "category": "assets", "subcategory": "Non-Current Assets"},
            
            # Liabilities - Current
            {"account_code": "2010", "account_name": "Accounts Payable", "amount": 60000, "category": "liabilities", "subcategory": "Current Liabilities"},
            {"account_code": "2020", "account_name": "Short-term Borrowings", "amount": 40000, "category": "liabilities", "subcategory": "Current Liabilities"},
            
            # Liabilities - Non-Current
            {"account_code": "2510", "account_name": "Long-term Loan", "amount": 300000, "category": "liabilities", "subcategory": "Non-Current Liabilities"},
            
            # Equity
            {"account_code": "3010", "account_name": "Share Capital", "amount": 400000, "category": "equity", "subcategory": "Share Capital"},
            {"account_code": "3020", "account_name": "Retained Earnings", "amount": 125000, "category": "equity", "subcategory": "Retained Earnings"},
        ]
    }
    
    # Verify balance
    total_assets = sum(item["amount"] for item in balance_sheet_data["items"] if item["category"] == "assets")
    total_liabilities = sum(item["amount"] for item in balance_sheet_data["items"] if item["category"] == "liabilities")
    total_equity = sum(item["amount"] for item in balance_sheet_data["items"] if item["category"] == "equity")
    
    print(f"\n📊 Balance Sheet Summary:")
    print(f"Total Assets: ${total_assets:,.2f}")
    print(f"Total Liabilities: ${total_liabilities:,.2f}")
    print(f"Total Equity: ${total_equity:,.2f}")
    print(f"Balanced: {total_assets == total_liabilities + total_equity}")
    
    response = requests.post(
        f"{BASE_URL}/balance-sheets/",
        headers=headers,
        json=balance_sheet_data
    )
    
    if response.status_code == 201:
        print(f"\n✅ Balance sheet created successfully!")
        balance_sheet = response.json()
        print(f"ID: {balance_sheet['id']}")
        print(f"Status: {balance_sheet['status']}")
        return balance_sheet['id']
    else:
        print(f"\n❌ Failed to create balance sheet: {response.status_code}")
        print(response.text)
        return None

def transform_balance_sheet(token, balance_sheet_id):
    """Transform balance sheet to MCFO and IFRS"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🔄 Transforming balance sheet {balance_sheet_id}...")
    
    response = requests.post(
        f"{BASE_URL}/balance-sheets/{balance_sheet_id}/transform",
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ Transformation successful!")
        print(f"Message: {result['message']}")
        
        # Display MCFO summary
        if result.get('mcfo_statement'):
            mcfo_data = result['mcfo_statement']['transformed_data']
            print(f"\n📈 MCFO Format:")
            print(f"  Total Assets: ${mcfo_data.get('total_assets', 0):,.2f}")
            print(f"  Total Liabilities: ${mcfo_data.get('liabilities', {}).get('total', 0):,.2f}")
            print(f"  Total Equity: ${mcfo_data.get('equity', {}).get('total', 0):,.2f}")
        
        # Display IFRS summary
        if result.get('ifrs_statement'):
            ifrs_data = result['ifrs_statement']['transformed_data']
            statement = ifrs_data.get('statement_of_financial_position', {})
            print(f"\n📊 IFRS Format:")
            print(f"  Total Assets: ${statement.get('assets', {}).get('total', 0):,.2f}")
            print(f"  Total Equity & Liabilities: ${statement.get('equity_and_liabilities', {}).get('total', 0):,.2f}")
        
        # Save results to files
        with open('mcfo_result.json', 'w') as f:
            json.dump(result.get('mcfo_statement', {}), f, indent=2)
        print(f"\n💾 MCFO result saved to mcfo_result.json")
        
        with open('ifrs_result.json', 'w') as f:
            json.dump(result.get('ifrs_statement', {}), f, indent=2)
        print(f"💾 IFRS result saved to ifrs_result.json")
        
        return result
    else:
        print(f"\n❌ Transformation failed: {response.status_code}")
        print(response.text)
        return None

def main():
    print("=" * 60)
    print("Balance Sheet Transformation System - Test Script")
    print("=" * 60)
    
    # Step 1: Login
    print("\n🔐 Logging in...")
    token = login()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    print("✅ Login successful!")
    
    # Step 2: Create sample balance sheet
    balance_sheet_id = create_sample_balance_sheet(token)
    if not balance_sheet_id:
        print("❌ Cannot proceed without balance sheet")
        return
    
    # Step 3: Transform balance sheet
    result = transform_balance_sheet(token, balance_sheet_id)
    if result:
        print("\n" + "=" * 60)
        print("✅ Test completed successfully!")
        print("=" * 60)
        print(f"\nYou can now view the results in the frontend:")
        print(f"http://localhost:5173/transformation/results/{balance_sheet_id}")
    else:
        print("\n❌ Test failed")

if __name__ == "__main__":
    main()
