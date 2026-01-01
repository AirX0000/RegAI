"""Add hierarchy fields to users and companies

Revision ID: add_hierarchy_fields
Revises: 
Create Date: 2025-11-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_hierarchy_fields'
down_revision = '0012_alert_workflow'
branch_labels = None
depends_on = None


def upgrade():
    # Add hierarchy fields to users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('hierarchy_level', sa.Integer(), nullable=True, server_default='5'))
        batch_op.add_column(sa.Column('is_company_owner', sa.Boolean(), nullable=True, server_default='false'))
        batch_op.create_index(batch_op.f('ix_users_hierarchy_level'), ['hierarchy_level'], unique=False)
        batch_op.create_index(batch_op.f('ix_users_is_company_owner'), ['is_company_owner'], unique=False)
    
    # Add ownership fields to companies table
    with op.batch_alter_table('companies', schema=None) as batch_op:
        batch_op.add_column(sa.Column('owner_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('created_by_id', sa.String(), nullable=True))
        batch_op.create_index(batch_op.f('ix_companies_owner_id'), ['owner_id'], unique=False)
    
    # Update existing users based on their current role
    op.execute("""
        UPDATE users 
        SET hierarchy_level = CASE 
            WHEN role = 'superadmin' THEN 1
            WHEN role = 'admin' THEN 4
            WHEN role IN ('auditor', 'accountant') THEN 5
            ELSE 5
        END
    """)
    
    # Update is_superuser for website superadmins
    op.execute("""
        UPDATE users 
        SET is_superuser = 1
        WHERE hierarchy_level = 1
    """)


def downgrade():
    # Drop columns from companies
    with op.batch_alter_table('companies', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_companies_owner_id'))
        batch_op.drop_column('created_by_id')
        batch_op.drop_column('owner_id')
    
    # Drop columns from users
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_is_company_owner'))
        batch_op.drop_index(batch_op.f('ix_users_hierarchy_level'))
        batch_op.drop_column('is_company_owner')
        batch_op.drop_column('hierarchy_level')
