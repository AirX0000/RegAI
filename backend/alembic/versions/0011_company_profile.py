"""add company profile fields

Revision ID: 0011_company_profile
Revises: 0010_report_comments
Create Date: 2024-01-23 20:22:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0011_company_profile'
down_revision = '0010_report_comments'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to companies table
    op.add_column('companies', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('companies', sa.Column('logo_url', sa.String(length=500), nullable=True))
    op.add_column('companies', sa.Column('website', sa.String(length=255), nullable=True))
    op.add_column('companies', sa.Column('industry', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('employee_count', sa.Integer(), nullable=True))
    op.add_column('companies', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    
    # Create indexes
    op.create_index('ix_companies_industry', 'companies', ['industry'])
    op.create_index('ix_companies_is_active', 'companies', ['is_active'])
    
    # Make name unique
    op.create_unique_constraint('uq_companies_name', 'companies', ['name'])


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint('uq_companies_name', 'companies', type_='unique')
    
    # Drop indexes
    op.drop_index('ix_companies_is_active', table_name='companies')
    op.drop_index('ix_companies_industry', table_name='companies')
    
    # Drop columns
    op.drop_column('companies', 'is_active')
    op.drop_column('companies', 'employee_count')
    op.drop_column('companies', 'industry')
    op.drop_column('companies', 'website')
    op.drop_column('companies', 'logo_url')
    op.drop_column('companies', 'description')
