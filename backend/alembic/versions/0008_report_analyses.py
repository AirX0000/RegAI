"""Add report analyses table

Revision ID: 0008
Revises: 0007
Create Date: 2025-11-23 19:14:30.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'report_analyses',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('report_id', UUID(as_uuid=True), sa.ForeignKey('reports.id'), nullable=False),
        sa.Column('country_code', sa.String(2), nullable=False),
        sa.Column('tax_types', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(50), server_default='pending'),
        sa.Column('overall_score', sa.Integer(), nullable=True),
        sa.Column('total_checks', sa.Integer(), server_default='0'),
        sa.Column('passed_checks', sa.Integer(), server_default='0'),
        sa.Column('warnings', sa.Integer(), server_default='0'),
        sa.Column('errors', sa.Integer(), server_default='0'),
        sa.Column('error_details', sa.JSON(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('ix_report_analyses_id', 'report_analyses', ['id'])
    op.create_index('ix_report_analyses_report_id', 'report_analyses', ['report_id'])
    op.create_index('ix_report_analyses_status', 'report_analyses', ['status'])


def downgrade() -> None:
    op.drop_index('ix_report_analyses_status', table_name='report_analyses')
    op.drop_index('ix_report_analyses_report_id', table_name='report_analyses')
    op.drop_index('ix_report_analyses_id', table_name='report_analyses')
    op.drop_table('report_analyses')
