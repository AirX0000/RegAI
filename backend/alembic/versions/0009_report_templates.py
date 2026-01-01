"""add report templates

Revision ID: 0009_report_templates
Revises: 0008_report_analyses
Create Date: 2024-01-23 19:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0009_report_templates'
down_revision = '0008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'report_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('report_type', sa.String(50), nullable=False),
        sa.Column('country_code', sa.String(10), nullable=True),
        sa.Column('tax_types', postgresql.JSON(), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), default=False),
        sa.Column('recurrence_pattern', sa.String(50), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create indexes
    op.create_index('ix_report_templates_id', 'report_templates', ['id'])
    op.create_index('ix_report_templates_created_by', 'report_templates', ['created_by'])
    op.create_index('ix_report_templates_company_id', 'report_templates', ['company_id'])


def downgrade() -> None:
    op.drop_index('ix_report_templates_company_id', table_name='report_templates')
    op.drop_index('ix_report_templates_created_by', table_name='report_templates')
    op.drop_index('ix_report_templates_id', table_name='report_templates')
    op.drop_table('report_templates')
