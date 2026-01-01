from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import uuid

from app.core.deps import get_db, get_current_active_user
from app.db.models.report_analysis import ReportAnalysis
from app.db.models.report import Report
from app.db.models.user import User
from app.db.schemas import report_analysis as analysis_schemas
from app.services.report_analyzer import ReportAnalyzer

router = APIRouter()

@router.post("/analyze", response_model=analysis_schemas.ReportAnalysis)
async def analyze_report(
    *,
    db: Session = Depends(get_db),
    analysis_request: analysis_schemas.AnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Analyze a report for tax compliance.
    """
    # Check if report exists and user has access
    report = db.query(Report).filter(Report.id == analysis_request.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role in ["accountant", "auditor"]:
        if report.submitted_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == "admin":
        if report.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if file exists
    if not report.file_path:
        raise HTTPException(status_code=400, detail="Report has no file attached")
    
    # Create analyzer
    analyzer = ReportAnalyzer(db)
    
    # Run analysis (could be async in production)
    try:
        analysis = analyzer.analyze_report(
            report_id=analysis_request.report_id,
            file_path=report.file_path,
            country_code=analysis_request.country_code,
            tax_types=analysis_request.tax_types
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/{analysis_id}", response_model=analysis_schemas.ReportAnalysis)
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get analysis results.
    """
    analysis = db.query(ReportAnalysis).filter(
        ReportAnalysis.id == uuid.UUID(analysis_id)
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check permissions
    report = db.query(Report).filter(Report.id == analysis.report_id).first()
    if current_user.role in ["accountant", "auditor"]:
        if report.submitted_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == "admin":
        if report.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return analysis


@router.get("/{analysis_id}/errors")
def get_analysis_errors(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get detailed error list from analysis.
    """
    analysis = db.query(ReportAnalysis).filter(
        ReportAnalysis.id == uuid.UUID(analysis_id)
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Check permissions (same as above)
    report = db.query(Report).filter(Report.id == analysis.report_id).first()
    if current_user.role in ["accountant", "auditor"]:
        if report.submitted_by != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    elif current_user.role == "admin":
        if report.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "analysis_id": analysis_id,
        "errors": analysis.error_details or [],
        "summary": {
            "total_checks": analysis.total_checks,
            "passed": analysis.passed_checks,
            "warnings": analysis.warnings,
            "errors": analysis.errors,
            "score": analysis.overall_score
        }
    }


@router.get("/report/{report_id}", response_model=List[analysis_schemas.ReportAnalysis])
def get_report_analyses(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get all analyses for a specific report.
    """
    analyses = db.query(ReportAnalysis).filter(
        ReportAnalysis.report_id == uuid.UUID(report_id)
    ).order_by(ReportAnalysis.created_at.desc()).all()
    
    return analyses
