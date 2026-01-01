"""
Add content and workflow_steps columns to regulations table
"""
from app.db.session import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE regulations ADD COLUMN content TEXT"))
            conn.commit()
            print("✓ Added content column")
        except Exception as e:
            print(f"Content column: {e}")
        
        try:
            conn.execute(text("ALTER TABLE regulations ADD COLUMN workflow_steps TEXT"))
            conn.commit()
            print("✓ Added workflow_steps column")
        except Exception as e:
            print(f"Workflow_steps column: {e}")

if __name__ == "__main__":
    add_columns()
