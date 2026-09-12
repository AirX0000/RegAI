from sqlalchemy.orm import Session
from typing import Dict, List
from decimal import Decimal

from app.db.models.balance_sheet import BalanceSheet, BalanceSheetItem, TransformedStatement, TransformationFormat, BalanceSheetStatus
from app.db.schemas.balance_sheet import TransformationResponse, TransformedStatement as TransformedStatementSchema
import openai
import json
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class TransformationService:
    """Service for transforming balance sheets to MCFO and IFRS formats"""
    
    def __init__(self, db: Session):
        self.db = db
        openai.api_key = settings.OPENAI_API_KEY
        
    def transform(self, balance_sheet: BalanceSheet) -> TransformationResponse:
        """Transform a balance sheet to both MCFO and IFRS formats"""
        
        # Clear previous transformation results if re-transforming
        self.db.query(TransformedStatement).filter(
            TransformedStatement.balance_sheet_id == balance_sheet.id
        ).delete()
        self.db.flush()

        # Perform MCFO transformation
        mcfo_data = self._transform_to_mcfo(balance_sheet)
        mcfo_statement = TransformedStatement(
            balance_sheet_id=balance_sheet.id,
            format_type=TransformationFormat.MCFO,
            transformed_data=mcfo_data,
            transformation_rules_applied={"version": "1.0", "rules": "MCFO standard mapping"}
        )
        self.db.add(mcfo_statement)
        
        # Perform IFRS transformation
        ifrs_data = self._transform_to_ifrs(balance_sheet)
        rules_applied = [
            {"standard": "IFRS 1 / IAS 1", "impact": "Presentation of Financial Statements & Standard Chart of Accounts Mapping"}
        ]
        for adj in (balance_sheet.transformations or []):
            rules_applied.append({
                "standard": adj.ifrs_category or "Adjustment",
                "impact": f"{adj.description} ({adj.adjustment_type.upper()} {float(adj.adjustment_amount):,.2f})"
            })

        ifrs_statement = TransformedStatement(
            balance_sheet_id=balance_sheet.id,
            format_type=TransformationFormat.IFRS,
            transformed_data=ifrs_data,
            transformation_rules_applied=rules_applied
        )
        self.db.add(ifrs_statement)
        
        # Update balance sheet status
        balance_sheet.status = BalanceSheetStatus.TRANSFORMED
        
        self.db.commit()
        self.db.refresh(mcfo_statement)
        self.db.refresh(ifrs_statement)
        
        return TransformationResponse(
            balance_sheet_id=balance_sheet.id,
            mcfo_statement=TransformedStatementSchema.from_orm(mcfo_statement),
            ifrs_statement=TransformedStatementSchema.from_orm(ifrs_statement),
            success=True,
            message="Balance sheet successfully transformed to MCFO and IFRS formats"
        )
    
    def _transform_to_mcfo(self, balance_sheet: BalanceSheet) -> Dict:
        """Transform balance sheet to MCFO (Management Accounting) format"""
        
        # Group items by category and subcategory
        mcfo_structure = {
            "period": balance_sheet.period.isoformat(),
            "assets": {
                "current": [],
                "non_current": [],
                "total": Decimal("0")
            },
            "liabilities": {
                "current": [],
                "non_current": [],
                "total": Decimal("0")
            },
            "equity": {
                "items": [],
                "total": Decimal("0")
            },
            "total_assets": Decimal("0"),
            "total_liabilities_and_equity": Decimal("0")
        }
        
        for item in balance_sheet.items:
            code = (item.account_code or "").strip()
            name_lower = (item.account_name or "").lower()
            subcat = (item.subcategory or "").lower().strip()
            
            is_non_current = (
                "non-current" in subcat or "non_current" in subcat or "внеоборот" in subcat or "долгосроч" in subcat
                or code.startswith(("01", "02", "03", "04", "05", "07", "08", "58", "67", "77", "96", "1510", "1520", "2510"))
                or any(k in name_lower for k in ["основные средства", "амортизац", "нематериальн", "долгосрочн"])
            )
            
            mapped_item = {
                "code": item.account_code,
                "name": item.account_name,
                "amount": float(item.amount),
                "subcategory": item.subcategory or ("Non-Current" if is_non_current else "Current")
            }
            
            if item.category.value == "assets":
                if is_non_current:
                    mcfo_structure["assets"]["non_current"].append(mapped_item)
                else:
                    mcfo_structure["assets"]["current"].append(mapped_item)
                mcfo_structure["assets"]["total"] += item.amount
                mcfo_structure["total_assets"] += item.amount
                
            elif item.category.value == "liabilities":
                if is_non_current:
                    mcfo_structure["liabilities"]["non_current"].append(mapped_item)
                else:
                    mcfo_structure["liabilities"]["current"].append(mapped_item)
                mcfo_structure["liabilities"]["total"] += item.amount
                mcfo_structure["total_liabilities_and_equity"] += item.amount
                
            elif item.category.value == "equity":
                mcfo_structure["equity"]["items"].append(mapped_item)
                mcfo_structure["equity"]["total"] += item.amount
                mcfo_structure["total_liabilities_and_equity"] += item.amount
        
        # Convert Decimal to float for JSON serialization
        mcfo_structure["assets"]["total"] = float(mcfo_structure["assets"]["total"])
        mcfo_structure["liabilities"]["total"] = float(mcfo_structure["liabilities"]["total"])
        mcfo_structure["equity"]["total"] = float(mcfo_structure["equity"]["total"])
        mcfo_structure["total_assets"] = float(mcfo_structure["total_assets"])
        mcfo_structure["total_liabilities_and_equity"] = float(mcfo_structure["total_liabilities_and_equity"])
        
        return mcfo_structure
    
    def _transform_to_ifrs(self, balance_sheet: BalanceSheet) -> Dict:
        """Transform balance sheet to IFRS (International Financial Reporting Standards) format"""
        
        # IFRS structure with standard classifications
        ifrs_structure = {
            "period": balance_sheet.period.isoformat(),
            "statement_of_financial_position": {
                "assets": {
                    "non_current_assets": {
                        "property_plant_equipment": [],
                        "intangible_assets": [],
                        "financial_assets": [],
                        "other": [],
                        "total": Decimal("0")
                    },
                    "current_assets": {
                        "inventories": [],
                        "trade_receivables": [],
                        "cash_and_equivalents": [],
                        "other": [],
                        "total": Decimal("0")
                    },
                    "total": Decimal("0")
                },
                "equity_and_liabilities": {
                    "equity": {
                        "share_capital": [],
                        "retained_earnings": [],
                        "other_reserves": [],
                        "total": Decimal("0")
                    },
                    "non_current_liabilities": {
                        "long_term_borrowings": [],
                        "deferred_tax": [],
                        "provisions": [],
                        "other": [],
                        "total": Decimal("0")
                    },
                    "current_liabilities": {
                        "trade_payables": [],
                        "short_term_borrowings": [],
                        "provisions": [],
                        "other": [],
                        "total": Decimal("0")
                    },
                    "total": Decimal("0")
                }
            }
        }
        
        # Map item adjustments if present
        item_adjustments = {}
        for adj in (balance_sheet.transformations or []):
            if adj.balance_sheet_item_id:
                item_adjustments.setdefault(str(adj.balance_sheet_item_id), []).append(adj)

        # Map items to IFRS categories
        for item in balance_sheet.items:
            adj_list = item_adjustments.get(str(item.id), [])
            adjusted_amount = Decimal(str(item.amount))
            for adj in adj_list:
                adj_amt = Decimal(str(adj.adjustment_amount))
                if item.category.value == "assets":
                    adjusted_amount += adj_amt if adj.adjustment_type == "debit" else -adj_amt
                else:
                    adjusted_amount += adj_amt if adj.adjustment_type == "credit" else -adj_amt

            mapped_item = {
                "code": item.account_code,
                "name": item.account_name,
                "amount": float(adjusted_amount)
            }
            code = (item.account_code or "").strip()
            name_lower = (item.account_name or "").lower()
            subcat = (item.subcategory or "").lower().strip()
            
            is_non_current = (
                "non-current" in subcat or "non_current" in subcat or "внеоборот" in subcat or "долгосроч" in subcat
                or code.startswith(("01", "02", "03", "04", "05", "07", "08", "58", "67", "77", "96", "1510", "1520", "2510"))
                or any(k in name_lower for k in ["основные средства", "амортизац", "нематериальн", "долгосрочн"])
            )
            
            if item.category.value == "assets":
                if is_non_current:
                    if code.startswith(("01", "02", "03", "07", "08", "1510")) or any(k in name_lower for k in ["основные средства", "амортизац", "fixed asset", "property", "equipment", "plant", "ppe", "вложения во внеоборот", "строительств"]):
                        ifrs_structure["statement_of_financial_position"]["assets"]["non_current_assets"]["property_plant_equipment"].append(mapped_item)
                    elif code.startswith(("04", "05", "1520")) or any(k in name_lower for k in ["нематериальн", "нма", "intangible", "патенты", "лицензи"]):
                        ifrs_structure["statement_of_financial_position"]["assets"]["non_current_assets"]["intangible_assets"].append(mapped_item)
                    elif code.startswith(("58",)) or any(k in name_lower for k in ["финансов", "инвестиц", "financial"]):
                        ifrs_structure["statement_of_financial_position"]["assets"]["non_current_assets"]["financial_assets"].append(mapped_item)
                    else:
                        ifrs_structure["statement_of_financial_position"]["assets"]["non_current_assets"]["other"].append(mapped_item)
                else:
                    if code.startswith(("10", "41", "43", "1040")) or any(k in name_lower for k in ["сырье", "материал", "товар", "склад", "запасы", "inventory", "inventories", "goods", "stock"]):
                        ifrs_structure["statement_of_financial_position"]["assets"]["current_assets"]["inventories"].append(mapped_item)
                    elif code.startswith(("62", "1030")) or any(k in name_lower for k in ["покупател", "заказчик", "клиент", "дебитор", "receivable"]):
                        ifrs_structure["statement_of_financial_position"]["assets"]["current_assets"]["trade_receivables"].append(mapped_item)
                    elif code.startswith(("50", "51", "52", "55", "1010", "1020")) or any(k in name_lower for k in ["расчетные счета", "касса", "валютн", "денежн", "банк", "cash", "bank"]):
                        ifrs_structure["statement_of_financial_position"]["assets"]["current_assets"]["cash_and_equivalents"].append(mapped_item)
                    else:
                        ifrs_structure["statement_of_financial_position"]["assets"]["current_assets"]["other"].append(mapped_item)
                        
            elif item.category.value == "liabilities":
                if is_non_current:
                    if code.startswith(("67", "2510")) or any(k in name_lower for k in ["долгосроч", "кредиты банк", "long-term", "long term"]):
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["non_current_liabilities"]["long_term_borrowings"].append(mapped_item)
                    elif code.startswith(("77",)) or any(k in name_lower for k in ["отложенн", "deferred"]):
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["non_current_liabilities"]["deferred_tax"].append(mapped_item)
                    elif code.startswith(("96",)) or any(k in name_lower for k in ["оценочн", "provision"]):
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["non_current_liabilities"]["provisions"].append(mapped_item)
                    else:
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["non_current_liabilities"]["other"].append(mapped_item)
                else:
                    if code.startswith(("66", "2020")) or any(k in name_lower for k in ["краткосроч", "short-term", "short term", "займы", "заем"]):
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["current_liabilities"]["short_term_borrowings"].append(mapped_item)
                    elif code.startswith(("60", "68", "69", "70", "76", "2010")) or any(k in name_lower for k in ["поставщик", "подрядчик", "оплата труда", "персонал", "зарплат", "налог", "сбор", "ндс", "страхов", "payable"]):
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["current_liabilities"]["trade_payables"].append(mapped_item)
                    elif any(k in name_lower for k in ["оценочн", "provision"]):
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["current_liabilities"]["provisions"].append(mapped_item)
                    else:
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["current_liabilities"]["other"].append(mapped_item)
                        
            elif item.category.value == "equity":
                if code.startswith(("80", "3010")) or any(k in name_lower for k in ["уставн", "акционерн", "складочн", "capital", "капитал"]):
                    ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["equity"]["share_capital"].append(mapped_item)
                elif code.startswith(("84", "3020")) or any(k in name_lower for k in ["нераспределен", "прибыль", "убыток", "retained", "earnings"]):
                    ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["equity"]["retained_earnings"].append(mapped_item)
                else:
                    ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["equity"]["other_reserves"].append(mapped_item)

        # Apply global adjustments (e.g. from IFRS 16, IAS 36, IFRS 9 calculators)
        for adj in (balance_sheet.transformations or []):
            if not adj.balance_sheet_item_id:
                adj_desc = (adj.description or "").lower()
                adj_amt = float(adj.adjustment_amount)
                item_entry = {
                    "code": "ADJ",
                    "name": adj.description,
                    "amount": adj_amt
                }
                if "ifrs 16" in adj_desc or "lease" in adj_desc:
                    if "asset" in adj_desc or "rou" in adj_desc or "right-of-use" in adj_desc:
                        ifrs_structure["statement_of_financial_position"]["assets"]["non_current_assets"]["property_plant_equipment"].append(item_entry)
                    elif "liab" in adj_desc:
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["non_current_liabilities"]["long_term_borrowings"].append(item_entry)
                elif "ias 36" in adj_desc or "impairment" in adj_desc:
                    if adj.adjustment_type == "credit":
                        item_entry["amount"] = -abs(adj_amt)
                        ifrs_structure["statement_of_financial_position"]["assets"]["non_current_assets"]["property_plant_equipment"].append(item_entry)
                    else:
                        item_entry["amount"] = -abs(adj_amt)
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["equity"]["retained_earnings"].append(item_entry)
                elif "ifrs 9" in adj_desc or "ecl" in adj_desc:
                    if adj.adjustment_type == "credit":
                        item_entry["amount"] = -abs(adj_amt)
                        ifrs_structure["statement_of_financial_position"]["assets"]["current_assets"]["trade_receivables"].append(item_entry)
                    else:
                        item_entry["amount"] = -abs(adj_amt)
                        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["equity"]["retained_earnings"].append(item_entry)

        # Calculate section totals directly from items
        def sum_items(lst):
            return sum(Decimal(str(i["amount"])) for i in lst)

        nc_assets = ifrs_structure["statement_of_financial_position"]["assets"]["non_current_assets"]
        c_assets = ifrs_structure["statement_of_financial_position"]["assets"]["current_assets"]
        
        nc_assets["total"] = sum_items(nc_assets["property_plant_equipment"]) + sum_items(nc_assets["intangible_assets"]) + sum_items(nc_assets["financial_assets"]) + sum_items(nc_assets["other"])
        c_assets["total"] = sum_items(c_assets["inventories"]) + sum_items(c_assets["trade_receivables"]) + sum_items(c_assets["cash_and_equivalents"]) + sum_items(c_assets["other"])
        
        ifrs_structure["statement_of_financial_position"]["assets"]["total"] = nc_assets["total"] + c_assets["total"]

        eq = ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["equity"]
        nc_liab = ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["non_current_liabilities"]
        c_liab = ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["current_liabilities"]

        eq["total"] = sum_items(eq["share_capital"]) + sum_items(eq["retained_earnings"]) + sum_items(eq["other_reserves"])
        nc_liab["total"] = sum_items(nc_liab["long_term_borrowings"]) + sum_items(nc_liab["deferred_tax"]) + sum_items(nc_liab["provisions"]) + sum_items(nc_liab["other"])
        c_liab["total"] = sum_items(c_liab["trade_payables"]) + sum_items(c_liab["short_term_borrowings"]) + sum_items(c_liab["provisions"]) + sum_items(c_liab["other"])

        ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]["total"] = eq["total"] + nc_liab["total"] + c_liab["total"]


        
        # Convert all Decimal values to float for JSON serialization
        def convert_decimals(obj):
            if isinstance(obj, dict):
                return {k: convert_decimals(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_decimals(item) for item in obj]
            elif isinstance(obj, Decimal):
                return float(obj)
            return obj
        
        return convert_decimals(ifrs_structure)

    def _map_account_with_ai(self, item_name: str, item_code: str, category: str, amount: float) -> Dict[str, str]:
        """
        Use AI to map an account to the correct IFRS category and subcategory.
        """
        try:
            prompt = f"""
            Map the following financial account to the most appropriate IFRS category and subcategory.
            
            Account Name: "{item_name}"
            Account Code: "{item_code}"
            Original Category: "{category}"
            Amount: {amount}
            
            Available IFRS Structure:
            - Assets
                - Non-Current Assets (Property Plant Equipment, Intangible Assets, Financial Assets, Other)
                - Current Assets (Inventories, Trade Receivables, Cash and Equivalents, Other)
            - Equity and Liabilities
                - Equity (Share Capital, Retained Earnings, Other Reserves)
                - Non-Current Liabilities (Long Term Borrowings, Deferred Tax, Provisions, Other)
                - Current Liabilities (Trade Payables, Short Term Borrowings, Provisions, Other)
            
            Return ONLY valid JSON in this format:
            {{
                "category": "Assets" or "Equity and Liabilities",
                "subcategory_1": "Current Assets" etc,
                "subcategory_2": "Trade Receivables" etc
            }}
            """

            response = openai.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert IFRS accountant. Return only JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                max_tokens=150
            )
            
            content = response.choices[0].message.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"AI Mapping failed for {item_name}: {e}")
            return None

    def _get_ifrs_target_list(self, ifrs_structure: Dict, mapping: Dict) -> List:
        """Helper to navigate the IFRS structure based on AI mapping"""
        try:
            cat = mapping.get("category")
            sub1 = mapping.get("subcategory_1")
            sub2 = mapping.get("subcategory_2")
            
            # Normalize keys to snake_case matches in our structure
            # This is a simplified navigator. In a real app, we'd need robust key matching.
            
            if cat == "Assets":
                target_root = ifrs_structure["statement_of_financial_position"]["assets"]
                if "Non-Current" in sub1:
                    target_sub = target_root["non_current_assets"]
                else:
                    target_sub = target_root["current_assets"]
            else:
                target_root = ifrs_structure["statement_of_financial_position"]["equity_and_liabilities"]
                if "Equity" in sub1:
                    target_sub = target_root["equity"]
                elif "Non-Current" in sub1:
                    target_sub = target_root["non_current_liabilities"]
                else:
                    target_sub = target_root["current_liabilities"]
            
            # Find the list
            # We map the AI's "subcategory_2" to our list keys
            key_map = {
                "Property Plant Equipment": "property_plant_equipment",
                "Intangible Assets": "intangible_assets",
                "Financial Assets": "financial_assets",
                "Inventories": "inventories",
                "Trade Receivables": "trade_receivables",
                "Cash and Equivalents": "cash_and_equivalents",
                "Share Capital": "share_capital",
                "Retained Earnings": "retained_earnings",
                "Other Reserves": "other_reserves",
                "Long Term Borrowings": "long_term_borrowings",
                "Deferred Tax": "deferred_tax",
                "Trade Payables": "trade_payables",
                "Short Term Borrowings": "short_term_borrowings",
                "Provisions": "provisions"
            }
            
            target_key = key_map.get(sub2, "other")
            return target_sub[target_key]
            
        except Exception:
            return None
