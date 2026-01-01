"""
Script to add sample audit log entries for testing the Audit Log page
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import uuid
from app.db.session import SessionLocal
from app.db.models.audit_log import AuditLog
from app.db.models.user import User
from app.db.models.tenant import Tenant

def create_sample_audit_logs():
    db = SessionLocal()
    
    try:
        # Get first tenant and user
        tenant = db.query(Tenant).first()
        users = db.query(User).filter(User.tenant_id == tenant.id).all()
        
        if not tenant or not users:
            print("No tenant or users found. Please create users first.")
            return
        
        print(f"Creating sample audit logs for tenant: {tenant.name}")
        print(f"Found {len(users)} users")
        
        # Sample actions
        actions = [
            ("create", "report", "Created new compliance report", "192.168.1.100"),
            ("update", "user", "Updated user profile", "192.168.1.101"),
            ("delete", "report", "Deleted draft report", "192.168.1.100"),
            ("login", "auth", "User logged in", "192.168.1.102"),
            ("create", "company", "Created new company", "192.168.1.100"),
            ("update", "regulation", "Updated regulation details", "192.168.1.103"),
            ("delete", "user", "Removed inactive user", "192.168.1.100"),
            ("create", "report", "Created tax report", "192.168.1.104"),
            ("login", "auth", "User logged in", "192.168.1.105"),
            ("update", "company", "Updated company settings", "192.168.1.100"),
        ]
        
        # Create logs over the past 7 days
        logs_created = 0
        for i, (action, resource_type, details, ip) in enumerate(actions):
            # Distribute logs over the past week
            days_ago = i % 7
            timestamp = datetime.utcnow() - timedelta(days=days_ago, hours=i % 24)
            
            # Rotate through users
            user = users[i % len(users)]
            
            log = AuditLog(
                tenant_id=tenant.id,
                user_id=user.id,
                action=action,
                resource_type=resource_type,
                resource_id=str(uuid.uuid4()),
                details=details,
                ip_address=ip,
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                success=True,
                timestamp=timestamp,
                created_at=timestamp
            )
            db.add(log)
            logs_created += 1
        
        db.commit()
        print(f"✅ Successfully created {logs_created} sample audit log entries!")
        print("\nSample data includes:")
        print("  - Create actions (reports, companies)")
        print("  - Update actions (users, regulations, companies)")
        print("  - Delete actions (reports, users)")
        print("  - Login actions")
        print("  - Distributed over the past 7 days")
        print("\nRefresh the Audit Log page to see the data!")
        
    except Exception as e:
        print(f"❌ Error creating sample logs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_audit_logs()
