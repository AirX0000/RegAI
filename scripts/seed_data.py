"""
Seed script to populate the database with sample data for testing.
This creates example alerts, reports, companies, and users.
Run this to test all features, then delete or modify the data as needed.
"""

import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.models.alert import Alert, AlertStatus, AlertSeverity
from app.db.models.report import Report
from app.db.models.company import Company
from app.db.models.user import User
from app.db.models.tenant import Tenant
import uuid

def create_sample_alerts(db: Session, tenant_id: uuid.UUID, company_id: uuid.UUID):
    """Create sample compliance alerts for testing"""
    
    sample_alerts = [
        {
            "message": "Gap Analysis: Potential non-compliance with GDPR (Privacy) in EduGlobal - Missing data processing agreements",
            "severity": AlertSeverity.CRITICAL,
            "status": AlertStatus.OPEN,
            "regulation": "GDPR",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with CCPA (Privacy) in TechCorp - Incomplete privacy policy disclosure",
            "severity": AlertSeverity.HIGH,
            "status": AlertStatus.OPEN,
            "regulation": "CCPA",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with HIPAA (Healthcare) in LogiTrans - Missing encryption for patient data",
            "severity": AlertSeverity.CRITICAL,
            "status": AlertStatus.IN_PROGRESS,
            "regulation": "HIPAA",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with PCI-DSS (Security) in FinServe - Weak password policies detected",
            "severity": AlertSeverity.HIGH,
            "status": AlertStatus.OPEN,
            "regulation": "PCI-DSS",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with SOX (Finance) in EduGlobal - Inadequate financial controls documentation",
            "severity": AlertSeverity.MEDIUM,
            "status": AlertStatus.RESOLVED,
            "regulation": "SOX",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with IFRS-9 (IFRS) in HealthPlus - Missing expected credit loss calculations",
            "severity": AlertSeverity.MEDIUM,
            "status": AlertStatus.OPEN,
            "regulation": "IFRS-9",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with TAX-VAT (Tax) in EduGlobal - Incorrect VAT rate application",
            "severity": AlertSeverity.HIGH,
            "status": AlertStatus.IN_PROGRESS,
            "regulation": "TAX-VAT",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with ESG-US (ESG) in FinServe - Missing environmental impact disclosures",
            "severity": AlertSeverity.LOW,
            "status": AlertStatus.DISMISSED,
            "regulation": "ESG",
        },
        {
            "message": "Gap Analysis: Potential non-compliance with IFRS-8 (IFRS) in HealthPlus - Incomplete segment reporting",
            "severity": AlertSeverity.MEDIUM,
            "status": AlertStatus.RESOLVED,
            "regulation": "IFRS-8",
        },
        {
            "message": "Tax Compliance Alert: Q4 2024 tax filing deadline approaching in 15 days",
            "severity": AlertSeverity.HIGH,
            "status": AlertStatus.OPEN,
            "regulation": "TAX",
        },
    ]
    
    created_alerts = []
    for i, alert_data in enumerate(sample_alerts):
        alert = Alert(
            id=uuid.uuid4(),
            message=alert_data["message"],
            severity=alert_data["severity"],
            status=alert_data["status"],
            regulation=alert_data["regulation"],
            company_id=company_id,
            tenant_id=tenant_id,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
        )
        
        # Add resolution notes for resolved alerts
        if alert.status == AlertStatus.RESOLVED:
            alert.resolution_notes = "Issue resolved. Documentation updated and controls implemented."
            alert.resolved_at = datetime.utcnow() - timedelta(days=random.randint(1, 10))
        
        # Add notes for in-progress alerts
        if alert.status == AlertStatus.IN_PROGRESS:
            alert.notes = "Currently working on resolution. Expected completion in 5 business days."
        
        db.add(alert)
        created_alerts.append(alert)
    
    db.commit()
    print(f"✅ Created {len(created_alerts)} sample alerts")
    return created_alerts


def create_sample_reports(db: Session, tenant_id: uuid.UUID, company_id: uuid.UUID, user_id: uuid.UUID):
    """Create sample reports for testing"""
    
    sample_reports = [
        {
            "title": "Q4 2024 Compliance Report",
            "description": "Quarterly compliance assessment covering GDPR, CCPA, and HIPAA regulations",
            "report_type": "compliance",
            "status": "approved",
        },
        {
            "title": "Annual Financial Audit 2024",
            "description": "Comprehensive financial audit for fiscal year 2024",
            "report_type": "audit",
            "status": "under_review",
        },
        {
            "title": "Tax Filing Report - Q3 2024",
            "description": "Quarterly tax filing documentation and calculations",
            "report_type": "financial",
            "status": "submitted",
        },
        {
            "title": "Risk Assessment - Cybersecurity",
            "description": "Assessment of cybersecurity risks and mitigation strategies",
            "report_type": "risk_assessment",
            "status": "draft",
        },
        {
            "title": "GDPR Compliance Audit",
            "description": "Detailed audit of GDPR compliance measures and data protection practices",
            "report_type": "compliance",
            "status": "approved",
        },
    ]
    
    created_reports = []
    for report_data in sample_reports:
        report = Report(
            id=uuid.uuid4(),
            title=report_data["title"],
            description=report_data["description"],
            report_type=report_data["report_type"],
            status=report_data["status"],
            submitted_by=user_id,
            company_id=company_id,
            tenant_id=tenant_id,
            created_at=datetime.utcnow() - timedelta(days=random.randint(5, 60)),
        )
        
        # Add file info for some reports
        if random.choice([True, False]):
            report.file_name = f"{report_data['title'].replace(' ', '_')}.pdf"
            report.file_path = f"/uploads/reports/{report.id}.pdf"
            report.file_size = random.randint(100000, 5000000)
        
        db.add(report)
        created_reports.append(report)
    
    db.commit()
    print(f"✅ Created {len(created_reports)} sample reports")
    return created_reports


def seed_database():
    """Main function to seed the database with sample data"""
    
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seeding...")
        
        # Get existing tenant and company
        tenant = db.query(Tenant).first()
        if not tenant:
            print("❌ No tenant found. Please run the application first to create initial data.")
            return
        
        company = db.query(Company).filter(Company.tenant_id == tenant.id).first()
        if not company:
            print("❌ No company found. Please run the application first to create initial data.")
            return
        
        user = db.query(User).filter(User.tenant_id == tenant.id).first()
        if not user:
            print("❌ No user found. Please run the application first to create initial data.")
            return
        
        print(f"📊 Using tenant: {tenant.name}")
        print(f"🏢 Using company: {company.name}")
        print(f"👤 Using user: {user.email}")
        
        # Create sample data
        alerts = create_sample_alerts(db, tenant.id, company.id)
        reports = create_sample_reports(db, tenant.id, company.id, user.id)
        
        print("\n✨ Database seeding completed successfully!")
        print(f"\n📈 Summary:")
        print(f"   - {len(alerts)} compliance alerts created")
        print(f"   - {len(reports)} reports created")
        print(f"\n🔍 You can now:")
        print(f"   1. View alerts at: http://localhost:5173/compliance")
        print(f"   2. View reports at: http://localhost:5173/reports")
        print(f"   3. Test filtering, sorting, and export features")
        print(f"   4. Edit or delete sample data as needed")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def clear_sample_data():
    """Clear all sample data from the database"""
    
    db = SessionLocal()
    
    try:
        print("🧹 Clearing sample data...")
        
        # Delete all alerts
        alert_count = db.query(Alert).delete()
        print(f"   Deleted {alert_count} alerts")
        
        # Delete all reports
        report_count = db.query(Report).delete()
        print(f"   Deleted {report_count} reports")
        
        db.commit()
        print("✅ Sample data cleared successfully!")
        
    except Exception as e:
        print(f"❌ Error clearing data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Seed or clear sample data")
    parser.add_argument("--clear", action="store_true", help="Clear all sample data")
    args = parser.parse_args()
    
    if args.clear:
        clear_sample_data()
    else:
        seed_database()
