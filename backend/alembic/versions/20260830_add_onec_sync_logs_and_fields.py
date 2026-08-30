"""add_onec_sync_logs_and_fields

Revision ID: a512c9e78210
Revises: 413bae150903
Create Date: 2026-08-30 12:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a512c9e78210'
down_revision = '413bae150903'
branch_labels = None
depends_on = None


def upgrade():
    # Update onec_connections with new security & config columns
    with op.batch_alter_table('onec_connections') as batch_op:
        batch_op.add_column(sa.Column('auth_type', sa.String(length=50), server_default='basic', nullable=False))
        batch_op.add_column(sa.Column('api_token', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('verify_ssl', sa.Boolean(), server_default='1', nullable=False))
        batch_op.add_column(sa.Column('last_latency_ms', sa.Integer(), nullable=True))

    # Create onec_sync_logs table
    op.create_table(
        'onec_sync_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('sync_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('records_processed', sa.Integer(), server_default='0', nullable=False),
        sa.Column('duration_ms', sa.Integer(), server_default='0', nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=True),
        sa.Column('period_end', sa.DateTime(), nullable=True),
        sa.Column('request_payload', sa.JSON(), nullable=True),
        sa.Column('response_summary', sa.JSON(), nullable=True),
        sa.Column('error_details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('onec_sync_logs')
    with op.batch_alter_table('onec_connections') as batch_op:
        batch_op.drop_column('last_latency_ms')
        batch_op.drop_column('verify_ssl')
        batch_op.drop_column('api_token')
        batch_op.drop_column('auth_type')
