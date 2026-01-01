"""Add reports table

Revision ID: 0006_reports
Revises: 0005_add_user_company
Create Date: 2025-11-23 13:47:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'reports',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('report_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), server_default='draft'),
        sa.Column('submitted_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('reviewed_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('reviewer_comments', sa.Text(), nullable=True),
    )
    
    # Create indexes
    op.create_index('ix_reports_id', 'reports', ['id'])
    op.create_index('ix_reports_submitted_by', 'reports', ['submitted_by'])
    op.create_index('ix_reports_company_id', 'reports', ['company_id'])
    op.create_index('ix_reports_status', 'reports', ['status'])


def downgrade() -> None:
    op.drop_index('ix_reports_status', table_name='reports')
    op.drop_index('ix_reports_company_id', table_name='reports')
    op.drop_index('ix_reports_submitted_by', table_name='reports')
    op.drop_index('ix_reports_id', table_name='reports')
    op.drop_table('reports')
