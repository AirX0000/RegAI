"""
File Parser Service for Balance Sheet Uploads
Supports Excel (.xlsx, .xls) and CSV files
"""

import pandas as pd
from typing import Dict, List, Optional, Tuple
from decimal import Decimal
import io
from datetime import datetime


class FileParserService:
    """Service to parse uploaded balance sheet files"""
    
    # Column name mappings (support multiple languages)
    COLUMN_MAPPINGS = {
        'account_code': ['account code', 'код счета', 'code', 'account_code', 'код'],
        'account_name': ['account name', 'наименование счета', 'name', 'account_name', 'наименование', 'description'],
        'amount': ['amount', 'сумма', 'balance', 'value', 'amount'],
        'category': ['category', 'категория', 'type', 'category'],
        'subcategory': ['subcategory', 'подкатегория', 'sub category', 'subcategory', 'sub-category']
    }
    
    # Category mappings (support multiple languages)
    CATEGORY_MAPPINGS = {
        'assets': ['assets', 'активы', 'asset'],
        'liabilities': ['liabilities', 'обязательства', 'liability', 'пассивы'],
        'equity': ['equity', 'капитал', 'собственный капитал']
    }
    
    def parse_file(self, file_content: bytes, filename: str) -> Dict:
        """
        Parse uploaded file and extract balance sheet data
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            
        Returns:
            Dict with parsed data and validation results
        """
        try:
            # Determine file type and parse
            if filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(file_content))
            elif filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(file_content))
            else:
                return {
                    'success': False,
                    'error': f'Unsupported file format: {filename}. Please upload .xlsx, .xls, or .csv'
                }
            
            # Normalize column names
            df.columns = df.columns.str.strip().str.lower()
            
            # Map columns to our schema
            column_mapping = self._detect_columns(df.columns.tolist())
            
            if not column_mapping:
                return {
                    'success': False,
                    'error': 'Could not detect required columns. Please ensure your file has: Account Code, Account Name, Amount, Category'
                }
            
            # Rename columns
            df = df.rename(columns=column_mapping)
            
            # Validate required columns
            required = ['account_code', 'account_name', 'amount', 'category']
            missing = [col for col in required if col not in df.columns]
            
            if missing:
                return {
                    'success': False,
                    'error': f'Missing required columns: {", ".join(missing)}'
                }
            
            # Clean and validate data
            items, errors = self._process_rows(df)
            
            # Validate balance
            balance_check = self._validate_balance(items)
            
            return {
                'success': True,
                'items': items,
                'total_rows': len(df),
                'valid_rows': len(items),
                'errors': errors,
                'balance_check': balance_check,
                'columns': list(df.columns)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error parsing file: {str(e)}'
            }
    
    def _detect_columns(self, columns: List[str]) -> Dict[str, str]:
        """Detect and map column names to our schema"""
        mapping = {}
        
        for our_col, possible_names in self.COLUMN_MAPPINGS.items():
            for col in columns:
                if any(name in col for name in possible_names):
                    mapping[col] = our_col
                    break
        
        return mapping
    
    def _process_rows(self, df: pd.DataFrame) -> Tuple[List[Dict], List[str]]:
        """Process DataFrame rows and extract balance sheet items"""
        items = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row.get('account_code')) or pd.isna(row.get('amount')):
                    continue
                
                # Parse amount
                try:
                    amount = float(row['amount'])
                except (ValueError, TypeError):
                    errors.append(f"Row {idx + 2}: Invalid amount '{row['amount']}'")
                    continue
                
                # Normalize category
                category = self._normalize_category(str(row['category']).lower())
                if not category:
                    errors.append(f"Row {idx + 2}: Invalid category '{row['category']}'")
                    continue
                
                item = {
                    'account_code': str(row['account_code']).strip(),
                    'account_name': str(row['account_name']).strip(),
                    'amount': amount,
                    'category': category,
                    'subcategory': str(row.get('subcategory', '')).strip() if pd.notna(row.get('subcategory')) else None
                }
                
                items.append(item)
                
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
        
        return items, errors
    
    def _normalize_category(self, category: str) -> Optional[str]:
        """Normalize category name to our standard"""
        for our_category, possible_names in self.CATEGORY_MAPPINGS.items():
            if any(name in category for name in possible_names):
                return our_category
        return None
    
    def _validate_balance(self, items: List[Dict]) -> Dict:
        """Validate that Assets = Liabilities + Equity"""
        totals = {
            'assets': 0,
            'liabilities': 0,
            'equity': 0
        }
        
        for item in items:
            category = item['category']
            totals[category] += item['amount']
        
        total_assets = totals['assets']
        total_liabilities_equity = totals['liabilities'] + totals['equity']
        difference = abs(total_assets - total_liabilities_equity)
        is_balanced = difference < 0.01  # Allow for rounding errors
        
        return {
            'is_balanced': is_balanced,
            'total_assets': total_assets,
            'total_liabilities': totals['liabilities'],
            'total_equity': totals['equity'],
            'difference': difference
        }
    
    def create_template(self) -> pd.DataFrame:
        """Create an Excel template for users to download"""
        template_data = {
            'Account Code': ['1010', '1020', '1030', '2010', '2020', '3010', '3020'],
            'Account Name': [
                'Cash on Hand',
                'Bank Account',
                'Accounts Receivable',
                'Accounts Payable',
                'Short-term Loan',
                'Share Capital',
                'Retained Earnings'
            ],
            'Amount': [50000, 150000, 75000, 60000, 40000, 150000, 25000],
            'Category': ['assets', 'assets', 'assets', 'liabilities', 'liabilities', 'equity', 'equity'],
            'Subcategory': [
                'Current Assets',
                'Current Assets',
                'Current Assets',
                'Current Liabilities',
                'Current Liabilities',
                'Share Capital',
                'Retained Earnings'
            ]
        }
        
        return pd.DataFrame(template_data)
