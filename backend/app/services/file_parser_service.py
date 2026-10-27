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
        'account_code': ['account_code', 'account code', 'код счета', 'code', 'код', 'счет', 'номер счета'],
        'account_name': ['account_name', 'account name', 'наименование счета', 'name', 'наименование', 'description', 'название', 'статья'],
        'amount': ['amount', 'сумма', 'balance', 'value', 'сальдо', 'итог'],
        'debit': ['debit', 'дебет', 'дт', 'deb', 'dr'],
        'credit': ['credit', 'кредит', 'кт', 'cred', 'cr'],
        'category': ['category', 'категория', 'type', 'раздел'],
        'subcategory': ['subcategory', 'подкатегория', 'sub category', 'sub-category', 'subkonto', 'субконто']
    }
    
    # Category mappings (support multiple languages)
    CATEGORY_MAPPINGS = {
        'assets': ['assets', 'активы', 'asset', 'актив'],
        'liabilities': ['liabilities', 'обязательства', 'liability', 'пассивы', 'пассив'],
        'equity': ['equity', 'капитал', 'собственный капитал']
    }

    @staticmethod
    def infer_category_and_subcategory(code_str: str) -> Tuple[str, str]:
        """Automatically classify standard accounting account codes (NSBU UZ / PBU RU / IFRS)"""
        raw = str(code_str).strip()
        import re
        code = re.sub(r'[^0-9]', '', raw)
        if not code:
            return ('assets', 'Other Assets')
        
        # Ensure 4-digit formatting if leading 0 was lost (e.g. 110 -> 0110, 210 -> 0210, 804 -> 0804)
        if len(code) == 3:
            code = "0" + code

        # 02xx: Accumulated Depreciation (Contra-asset / Regulatory balance credit article)
        if code.startswith('02'):
            return ('liabilities', 'Accumulated Depreciation')
        
        # 01xx - 09xx: Non-Current Assets (Fixed Assets, Intangibles, Right-of-use, Capital investments)
        if code.startswith(('01', '03', '04', '05', '06', '07', '08', '09')):
            return ('assets', 'Non-Current Assets')
            
        # 10xx - 29xx: Inventories & Materials
        if any(code.startswith(f"{i:02d}") for i in range(10, 30)):
            return ('assets', 'Current Assets / Inventories')
            
        # 30xx - 39xx: Deferred expenses / Prepayments
        if any(code.startswith(f"{i:02d}") for i in range(30, 40)):
            return ('assets', 'Current Assets / Prepayments')
            
        # 40xx - 49xx: Receivables
        if any(code.startswith(f"{i:02d}") for i in range(40, 50)):
            return ('assets', 'Trade and Other Receivables')
            
        # 50xx - 59xx: Cash & Cash Equivalents
        if any(code.startswith(f"{i:02d}") for i in range(50, 60)):
            return ('assets', 'Cash and Cash Equivalents')
            
        # 60xx - 69xx: Current Liabilities (Payables, Taxes, Short-term debt, Provisions)
        if any(code.startswith(f"{i:02d}") for i in range(60, 70)):
            return ('liabilities', 'Current Liabilities')
            
        # 70xx - 79xx: Non-Current Liabilities (Long-term debts, IFRS 16 Lease Liabilities)
        if any(code.startswith(f"{i:02d}") for i in range(70, 80)):
            return ('liabilities', 'Non-Current Liabilities')
            
        # 80xx - 89xx: Equity
        if any(code.startswith(f"{i:02d}") for i in range(80, 90)):
            if code.startswith(('80', '83', '85')):
                return ('equity', 'Share Capital')
            elif code.startswith('87'):
                return ('equity', 'Retained Earnings')
            else:
                return ('equity', 'Reserves & Other Equity')
                
        return ('assets', 'Other Assets')
    
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
            # Determine file type and parse with dtype=str to preserve account codes
            if filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(file_content), dtype=str)
            elif filename.endswith('.csv'):
                # Try UTF-8 with BOM and without, fallback to cp1251
                try:
                    df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8', dtype=str)
                except Exception:
                    try:
                        df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8-sig', dtype=str)
                    except Exception:
                        df = pd.read_csv(io.BytesIO(file_content), encoding='cp1251', dtype=str)
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
                    'error': 'Could not detect required columns. Please ensure your file has: Account Code, Account Name, Amount (or Debit/Credit)'
                }
            
            # Rename columns
            df = df.rename(columns=column_mapping)
            
            # Validate required columns: account_code and (amount OR debit OR credit)
            if 'account_code' not in df.columns:
                return {
                    'success': False,
                    'error': 'Missing required column: Account Code (Код счета)'
                }
            
            has_amount_or_dc = 'amount' in df.columns or 'debit' in df.columns or 'credit' in df.columns
            if not has_amount_or_dc:
                return {
                    'success': False,
                    'error': 'Missing required column: Amount or Debit/Credit (Сумма или Дебет/Кредит)'
                }
            
            # Clean and validate data
            items, errors = self._process_rows(df)
            
            if not items:
                return {
                    'success': False,
                    'error': f"No valid rows extracted from file. Errors: {'; '.join(errors[:3]) if errors else 'Check file structure'}"
                }

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
        matched_standards = set()
        
        for our_col, possible_names in self.COLUMN_MAPPINGS.items():
            if our_col in matched_standards:
                continue
            for col in columns:
                if col in mapping:
                    continue
                # exact match or substring match
                cleaned_col = col.replace('_', ' ').replace('-', ' ').strip()
                if any(name == col or name == cleaned_col or name in col for name in possible_names):
                    mapping[col] = our_col
                    matched_standards.add(our_col)
                    break
        
        return mapping
    
    def _process_rows(self, df: pd.DataFrame) -> Tuple[List[Dict], List[str]]:
        """Process DataFrame rows and extract balance sheet items"""
        items = []
        errors = []
        has_debit_credit = 'debit' in df.columns or 'credit' in df.columns
        
        for idx, row in df.iterrows():
            try:
                # Skip empty rows or rows without account code
                raw_code = row.get('account_code')
                if pd.isna(raw_code) or not str(raw_code).strip():
                    continue
                
                code_str = str(raw_code).strip()
                # Skip header-like rows repeated in data
                if code_str.lower() in ['account_code', 'account code', 'код счета', 'код']:
                    continue
                
                # Parse amount (support direct amount or Debit/Credit)
                amount = None
                if has_debit_credit:
                    deb = 0.0
                    cred = 0.0
                    if 'debit' in df.columns and pd.notna(row.get('debit')):
                        try:
                            clean_val = str(row['debit']).replace(' ', '').replace(',', '.').strip()
                            deb = float(clean_val) if clean_val else 0.0
                        except Exception:
                            deb = 0.0
                    if 'credit' in df.columns and pd.notna(row.get('credit')):
                        try:
                            clean_val = str(row['credit']).replace(' ', '').replace(',', '.').strip()
                            cred = float(clean_val) if clean_val else 0.0
                        except Exception:
                            cred = 0.0
                    
                    if deb > 0 and cred == 0:
                        amount = deb
                    elif cred > 0 and deb == 0:
                        amount = cred
                    elif deb > 0 or cred > 0:
                        amount = abs(deb - cred)
                    else:
                        amount = 0.0
                elif 'amount' in df.columns and pd.notna(row.get('amount')):
                    try:
                        clean_val = str(row['amount']).replace(' ', '').replace(',', '.').strip()
                        amount = float(clean_val)
                    except (ValueError, TypeError):
                        errors.append(f"Row {idx + 2}: Invalid amount '{row['amount']}'")
                        continue
                
                if amount is None:
                    errors.append(f"Row {idx + 2}: Invalid or missing amount")
                    continue
                
                # Normalize category or infer from account code
                category = None
                if 'category' in df.columns and pd.notna(row.get('category')) and str(row.get('category')).strip():
                    category = self._normalize_category(str(row['category']).lower())
                
                # Auto-infer category & subcategory if missing
                subcategory = None
                if not category:
                    category, subcategory = self.infer_category_and_subcategory(code_str)
                
                if not subcategory and pd.notna(row.get('subcategory')):
                    subcategory = str(row['subcategory']).strip()
                
                raw_name = row.get('account_name')
                account_name = str(raw_name).strip() if pd.notna(raw_name) and str(raw_name).strip() else f"Счет {code_str}"
                
                item = {
                    'account_code': code_str,
                    'account_name': account_name,
                    'amount': amount,
                    'category': category,
                    'subcategory': subcategory if subcategory else None
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
