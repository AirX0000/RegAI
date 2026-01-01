import requests
import logging
import json
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@example.com"
PASSWORD = "admin123"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_documents():
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

    # 2. Get user info
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

    # 3. Create test PDF files
    test_files = [
        {
            "filename": "invoice_2024_001.pdf",
            "type": "invoice",
            "content": """
INVOICE #2024-001
Date: November 28, 2024

Bill To:
ABC Corporation
123 Main Street
London, UK

Items:
1. Consulting Services - $5,000.00
2. Software License - $2,500.00
3. Support Package - $1,200.00

Subtotal: $8,700.00
VAT (20%): $1,740.00
Total: $10,440.00

Payment Terms: Net 30
Due Date: December 28, 2024
"""
        },
        {
            "filename": "contract_partnership_2024.pdf",
            "type": "contract",
            "content": """
PARTNERSHIP AGREEMENT

This Agreement is made on November 28, 2024

Between:
Party A: Tech Solutions Ltd
Party B: Innovation Partners Inc

Terms:
1. Duration: 3 years from signing date
2. Revenue Share: 60/40 split
3. Territory: European Union
4. Exclusivity: Non-exclusive partnership

Signatures:
_____________________
CEO, Tech Solutions Ltd

_____________________
CEO, Innovation Partners Inc
"""
        },
        {
            "filename": "bank_statement_nov_2024.pdf",
            "type": "bank_statement",
            "content": """
BANK STATEMENT
Account: ****1234
Period: November 1-30, 2024

Opening Balance: £50,000.00

Transactions:
Nov 5  - Deposit (Client Payment)     +£15,000.00
Nov 10 - Wire Transfer (Supplier)     -£8,500.00
Nov 15 - Salary Payments              -£12,000.00
Nov 20 - Office Rent                  -£3,500.00
Nov 25 - Deposit (Investment)         +£25,000.00

Closing Balance: £66,000.00

Interest Earned: £125.00
Service Charges: £25.00
"""
        }
    ]

    # Create temporary directory for test files
    temp_dir = Path("temp_test_docs")
    temp_dir.mkdir(exist_ok=True)

    for file_info in test_files:
        try:
            # Create temporary file
            file_path = temp_dir / file_info["filename"]
            with open(file_path, 'w') as f:
                f.write(file_info["content"])
            
            logger.info(f"Uploading {file_info['filename']}...")
            
            # Upload file
            with open(file_path, 'rb') as f:
                files = {'file': (file_info["filename"], f, 'application/pdf')}
                data = {'document_type': file_info["type"]}
                
                response = session.post(
                    f"{BASE_URL}/documents/upload",
                    headers=headers,
                    files=files,
                    data=data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"✓ Uploaded: {file_info['filename']}")
                    logger.info(f"  Status: {result['status']}")
                    if result.get('extracted_data'):
                        logger.info(f"  Extracted: {len(str(result['extracted_data']))} chars")
                else:
                    logger.error(f"✗ Failed to upload {file_info['filename']}: {response.text}")
            
            # Clean up temp file
            file_path.unlink()
            
        except Exception as e:
            logger.error(f"Error uploading {file_info['filename']}: {e}")

    # Clean up temp directory
    try:
        temp_dir.rmdir()
    except:
        pass

    logger.info("\n=== Test Documents Created ===")
    logger.info("Check the Documents page in the frontend!")

if __name__ == "__main__":
    create_test_documents()
