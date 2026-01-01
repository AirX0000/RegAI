from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.deps import get_db, get_current_active_user
from app.db.models.alert import Alert, AlertStatus
from app.db.models.regulation import Regulation
from app.db.models.user import User

router = APIRouter()

@router.get("/score")
def get_compliance_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Calculate overall compliance score based on alerts and regulations.
    Score is 0-100, where 100 is perfect compliance.
    """
    # Get all regulations and map them by code/title to category
    regulations = db.query(Regulation).all()
    reg_map = {} # Map code/title to category
    category_stats = {} # Track total regulations per category
    
    total_regulations = len(regulations)
    
    for reg in regulations:
        if not reg.category:
            continue
            
        # Map both code and title for better matching
        reg_map[reg.code.lower()] = reg.category
        reg_map[reg.title.lower()] = reg.category
        
        if reg.category not in category_stats:
            category_stats[reg.category] = {
                "total_regulations": 0,
                "alerts": {"critical": 0, "high": 0, "medium": 0, "low": 0}
            }
        category_stats[reg.category]["total_regulations"] += 1

    # Get all active alerts for the tenant (open + in_progress)
    alerts = db.query(Alert).filter(
        Alert.tenant_id == current_user.tenant_id,
        Alert.status.in_([AlertStatus.OPEN, AlertStatus.IN_PROGRESS])
    ).all()
    
    # Process alerts and assign to categories
    global_alerts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    status_counts = {"open": 0, "in_progress": 0}
    
    for alert in alerts:
        # Update global counts
        severity = alert.severity.value if hasattr(alert.severity, "value") else alert.severity
        if severity in global_alerts:
            global_alerts[severity] += 1
        
        # Count by status
        status = alert.status.value if hasattr(alert.status, "value") else alert.status
        if status in status_counts:
            status_counts[status] += 1
            
        # Try to find category
        category = None
        if alert.regulation:
            reg_key = alert.regulation.lower()
            # Try exact match first, then partial
            if reg_key in reg_map:
                category = reg_map[reg_key]
            else:
                # Simple partial match
                for key, cat in reg_map.items():
                    if key in reg_key or reg_key in key:
                        category = cat
                        break
        
        # If found, update category stats
        if category and category in category_stats:
            if severity in category_stats[category]["alerts"]:
                category_stats[category]["alerts"][severity] += 1

    # Calculate scores
    # Weighting: Critical=10, High=5, Medium=2, Low=1
    def calculate_score(stats, total_regs):
        if total_regs == 0:
            return 100.0
            
        alerts = stats["alerts"] if "alerts" in stats else stats
        
        # Calculate penalty based on alerts relative to number of regulations
        # We assume each regulation can have multiple alerts, but we normalize by total regulations
        # to avoid negative scores for small categories with many alerts.
        
        penalty_points = (
            (alerts["critical"] * 10) + 
            (alerts["high"] * 5) + 
            (alerts["medium"] * 2) + 
            (alerts["low"] * 1)
        )
        
        # Max acceptable penalty per regulation before it's considered 0% compliant
        # Let's say 1 critical alert per regulation = 0% score for that chunk
        max_penalty = total_regs * 10 
        
        if max_penalty == 0: 
            return 100.0
            
        penalty_pct = (penalty_points / max_penalty) * 100
        return max(0.0, 100.0 - penalty_pct)

    # Calculate overall score
    overall_score = calculate_score(global_alerts, total_regulations)
    
    # Calculate per-category scores
    category_scores = {}
    for cat, stats in category_stats.items():
        cat_score = calculate_score(stats, stats["total_regulations"])
        category_scores[cat] = {
            "total_regulations": stats["total_regulations"],
            "open_alerts": sum(stats["alerts"].values()),
            "score": round(cat_score, 1)
        }
    
    return {
        "overall_score": round(overall_score, 1),
        "total_regulations": total_regulations,
        "alerts": {
            "critical": global_alerts["critical"],
            "high": global_alerts["high"],
            "medium": global_alerts["medium"],
            "low": global_alerts["low"],
            "total": sum(global_alerts.values()),
            "open": status_counts["open"],
            "in_progress": status_counts["in_progress"]
        },
        "category_scores": category_scores,
        "trend": "stable" 
    }
