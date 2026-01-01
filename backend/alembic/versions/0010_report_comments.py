"""add report comments

Revision ID: 0010_report_comments
Revises: 0009_report_templates
Create Date: 2024-01-23 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0010_report_comments'
down_revision = '0009_report_templates'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'report_comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('report_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('reports.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('comment', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create indexes
    op.create_index('ix_report_comments_id', 'report_comments', ['id'])
    op.create_index('ix_report_comments_report_id', 'report_comments', ['report_id'])
    op.create_index('ix_report_comments_user_id', 'report_comments', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_report_comments_user_id', table_name='report_comments')
    op.drop_index('ix_report_comments_report_id', table_name='report_comments')
    op.drop_index('ix_report_comments_id', table_name='report_comments')
    op.drop_table('report_comments')
