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
    # Add new columns to companies table with batch mode
    with op.batch_alter_table('companies') as batch_op:
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('logo_url', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('website', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('industry', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('employee_count', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'))
        batch_op.create_index('ix_companies_industry', ['industry'])
        batch_op.create_index('ix_companies_is_active', ['is_active'])
        batch_op.create_unique_constraint('uq_companies_name', ['name'])


def downgrade() -> None:
    with op.batch_alter_table('companies') as batch_op:
        batch_op.drop_constraint('uq_companies_name', type_='unique')
        batch_op.drop_index('ix_companies_is_active')
        batch_op.drop_index('ix_companies_industry')
        batch_op.drop_column('is_active')
        batch_op.drop_column('employee_count')
        batch_op.drop_column('industry')
        batch_op.drop_column('website')
        batch_op.drop_column('logo_url')
        batch_op.drop_column('description')
