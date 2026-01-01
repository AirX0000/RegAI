"""add_multi_tenancy_rls

Revision ID: 0002_rls
Revises: 0001_core_tables
Create Date: 2024-01-01 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002_rls'
down_revision: Union[str, None] = '0001_core_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Only run RLS commands on Postgres
    bind = op.get_bind()
    if bind.dialect.name != 'postgresql':
        return

    # Enable RLS on tables with tenant_id
    tables = ['users', 'companies', 'alerts', 'link_company_regulation']
    
    for table in tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY tenant_isolation_policy ON {table}
            USING (tenant_id = current_setting('app.tenant_id')::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)
        """)
        
        # Bypass policy for superadmin or special role could be added here
        # For now, we rely on the app setting app.tenant_id correctly
        # Or we can add a bypass policy:
        # op.execute(f"CREATE POLICY superadmin_bypass ON {table} USING (current_setting('app.role') = 'superadmin')")

    # Regulations is special because tenant_id can be null (global)
    op.execute("ALTER TABLE regulations ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_policy_regulations ON regulations
        USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id')::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid)
    """)

def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != 'postgresql':
        return

    tables = ['users', 'companies', 'alerts', 'link_company_regulation', 'regulations']
    for table in tables:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON {table}")
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy_regulations ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
