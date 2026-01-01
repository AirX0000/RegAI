from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import io

from app.db.session import get_db
from app.db.models.balance_sheet import BalanceSheet, BalanceSheetItem, TransformedStatement
from app.db.schemas.balance_sheet import (
    BalanceSheetCreate,
    BalanceSheetUpdate,
    BalanceSheet as BalanceSheetSchema,
    TransformationResponse
)
from app.core import deps
from app.db.models.user import User

router = APIRouter()


@router.post("/", response_model=BalanceSheetSchema, status_code=status.HTTP_201_CREATED)
def create_balance_sheet(
    balance_sheet_data: BalanceSheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Create a new balance sheet for the user's company"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a company"
        )
    
    # Create balance sheet
    balance_sheet = BalanceSheet(
        company_id=current_user.company_id,
        period=balance_sheet_data.period,
        notes=balance_sheet_data.notes
    )
    db.add(balance_sheet)
    db.flush()
    
    # Add balance sheet items
    for item_data in balance_sheet_data.items:
        item = BalanceSheetItem(
            balance_sheet_id=balance_sheet.id,
            **item_data.dict()
        )
        db.add(item)
    
    db.commit()
    db.refresh(balance_sheet)
    return balance_sheet


@router.get("/", response_model=List[BalanceSheetSchema])
def list_balance_sheets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """List all balance sheets for the user's company"""
    if not current_user.company_id:
        return []
    
    query = db.query(BalanceSheet).filter(
        BalanceSheet.company_id == current_user.company_id
    )
    
    # Superadmin can see all balance sheets
    if current_user.role == "superadmin":
        query = db.query(BalanceSheet)
    
    balance_sheets = query.offset(skip).limit(limit).all()
    return balance_sheets


@router.get("/{balance_sheet_id}", response_model=BalanceSheetSchema)
def get_balance_sheet(
    balance_sheet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get a specific balance sheet by ID"""
    balance_sheet = db.query(BalanceSheet).filter(
        BalanceSheet.id == balance_sheet_id
    ).first()
    
    if not balance_sheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Balance sheet not found"
        )
    
    # Check access permissions
    if current_user.role != "superadmin" and balance_sheet.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this balance sheet"
        )
    
    return balance_sheet


@router.put("/{balance_sheet_id}", response_model=BalanceSheetSchema)
def update_balance_sheet(
    balance_sheet_id: UUID,
    balance_sheet_data: BalanceSheetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Update a balance sheet"""
    balance_sheet = db.query(BalanceSheet).filter(
        BalanceSheet.id == balance_sheet_id
    ).first()
    
    if not balance_sheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Balance sheet not found"
        )
    
    # Check access permissions
    if current_user.role != "superadmin" and balance_sheet.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this balance sheet"
        )
    
    # Update fields
    update_data = balance_sheet_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(balance_sheet, field, value)
    
    db.commit()
    db.refresh(balance_sheet)
    return balance_sheet


@router.delete("/{balance_sheet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_balance_sheet(
    balance_sheet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Delete a balance sheet"""
    balance_sheet = db.query(BalanceSheet).filter(
        BalanceSheet.id == balance_sheet_id
    ).first()
    
    if not balance_sheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Balance sheet not found"
        )
    
    # Check access permissions
    if current_user.role != "superadmin" and balance_sheet.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this balance sheet"
        )
    
    db.delete(balance_sheet)
    db.commit()
    return None


@router.get("/{balance_sheet_id}/transform", response_model=TransformationResponse)
def get_transformation_results(
    balance_sheet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get existing transformation results"""
    balance_sheet = db.query(BalanceSheet).filter(
        BalanceSheet.id == balance_sheet_id
    ).first()
    
    if not balance_sheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Balance sheet not found"
        )
    
    # Check access permissions
    if current_user.role != "superadmin" and balance_sheet.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this balance sheet"
        )
    
    # Fetch statements
    mcfo_statement = db.query(TransformedStatement).filter(
        TransformedStatement.balance_sheet_id == balance_sheet_id,
        TransformedStatement.format_type == "mcfo"
    ).first()
    
    ifrs_statement = db.query(TransformedStatement).filter(
        TransformedStatement.balance_sheet_id == balance_sheet_id,
        TransformedStatement.format_type == "ifrs"
    ).first()
    
    return {
        "balance_sheet_id": balance_sheet_id,
        "mcfo_statement": mcfo_statement,
        "ifrs_statement": ifrs_statement,
        "success": True,
        "message": "Transformation results retrieved successfully"
    }


@router.post("/{balance_sheet_id}/transform", response_model=TransformationResponse)
def transform_balance_sheet(
    balance_sheet_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Transform a balance sheet to MCFO and IFRS formats"""
    from app.services.transformation_service import TransformationService
    
    balance_sheet = db.query(BalanceSheet).filter(
        BalanceSheet.id == balance_sheet_id
    ).first()
    
    if not balance_sheet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Balance sheet not found"
        )
    
    # Check access permissions
    if current_user.role != "superadmin" and balance_sheet.company_id != current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to transform this balance sheet"
        )
    
    # Perform transformation
    transformation_service = TransformationService(db)
    result = transformation_service.transform(balance_sheet)
    
    return result


@router.post("/upload")
async def upload_balance_sheet_file(
    file: UploadFile = File(...),
    period: Optional[str] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Upload Excel or CSV file with balance sheet data"""
    from app.services.file_parser_service import FileParserService
    
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a company"
        )
    
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload .xlsx, .xls, or .csv file"
        )
    
    # Read file content
    content = await file.read()
    
    # Parse file
    parser = FileParserService()
    result = parser.parse_file(content, file.filename)
    
    if not result['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result['error']
        )
    
    # Return parsed data for preview (don't save yet)
    return {
        "success": True,
        "filename": file.filename,
        "items": result['items'],
        "total_rows": result['total_rows'],
        "valid_rows": result['valid_rows'],
        "errors": result['errors'],
        "balance_check": result['balance_check'],
        "preview_mode": True
    }


@router.post("/upload/confirm")
def confirm_upload(
    items: List[dict],
    period: Optional[datetime] = None,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Confirm and save uploaded balance sheet data"""
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a company"
        )
    
    # Create balance sheet
    balance_sheet = BalanceSheet(
        company_id=current_user.company_id,
        period=period or datetime.now(),
        notes=notes or "Uploaded from file"
    )
    db.add(balance_sheet)
    db.flush()
    
    # Add balance sheet items
    for item_data in items:
        item = BalanceSheetItem(
            balance_sheet_id=balance_sheet.id,
            account_code=item_data['account_code'],
            account_name=item_data['account_name'],
            amount=item_data['amount'],
            category=item_data['category'],
            subcategory=item_data.get('subcategory')
        )
        db.add(item)
    
    db.commit()
    db.refresh(balance_sheet)
    
    return {
        "success": True,
        "balance_sheet_id": str(balance_sheet.id),
        "items_count": len(items),
        "message": "Balance sheet created successfully from uploaded file"
    }


@router.get("/template")
def download_template(current_user: User = Depends(deps.get_current_user)):
    """Download Excel template for balance sheet upload"""
    from app.services.file_parser_service import FileParserService
    import pandas as pd
    
    parser = FileParserService()
    template_df = parser.create_template()
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        template_df.to_excel(writer, index=False, sheet_name='Balance Sheet')
        
        # Add instructions sheet
        instructions = pd.DataFrame({
            'Instructions': [
                '1. Fill in your balance sheet data in the "Balance Sheet" tab',
                '2. Account Code: Unique identifier for each account',
                '3. Account Name: Descriptive name of the account',
                '4. Amount: Numerical value (no currency symbols)',
                '5. Category: Must be one of: assets, liabilities, equity',
                '6. Subcategory: Optional classification (e.g., Current Assets, Long-term Debt)',
                '7. Ensure Assets = Liabilities + Equity',
                '8. Save and upload the file to the Transformation Department'
            ]
        })
        instructions.to_excel(writer, index=False, sheet_name='Instructions')
    
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=balance_sheet_template.xlsx'}
    )


@router.post("/{balance_sheet_id}/adjustments", response_model=BalanceSheetSchema)
def add_adjustment(
    balance_sheet_id: UUID,
    adjustment_data: list[dict] | dict, # Allow single or list
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Add one or more adjustments to a balance sheet"""
    from app.db.models.balance_sheet import TransformationAdjustment
    
    balance_sheet = db.query(BalanceSheet).filter(
        BalanceSheet.id == balance_sheet_id
    ).first()
    
    if not balance_sheet:
        raise HTTPException(status_code=404, detail="Balance sheet not found")
        
    if current_user.role != "superadmin" and balance_sheet.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Handle list or single item
    items = adjustment_data if isinstance(adjustment_data, list) else [adjustment_data]
    
    for item in items:
        adj = TransformationAdjustment(
            balance_sheet_id=balance_sheet_id,
            description=item.get('description'),
            adjustment_amount=item.get('adjustment_amount'),
            adjustment_type=item.get('adjustment_type'),
            ifrs_category=item.get('ifrs_category'),
            balance_sheet_item_id=item.get('balance_sheet_item_id')
        )
        db.add(adj)
    
    db.commit()
    db.refresh(balance_sheet)
    return balance_sheet


@router.delete("/adjustments/{adjustment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_adjustment(
    adjustment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Delete a specific adjustment"""
    from app.db.models.balance_sheet import TransformationAdjustment
    
    adj = db.query(TransformationAdjustment).filter(
        TransformationAdjustment.id == adjustment_id
    ).first()
    
    if not adj:
        raise HTTPException(status_code=404, detail="Adjustment not found")
        
    # Check permissions via balance sheet
    balance_sheet = db.query(BalanceSheet).filter(BalanceSheet.id == adj.balance_sheet_id).first()
    if current_user.role != "superadmin" and balance_sheet.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(adj)
    db.commit()
    return None
