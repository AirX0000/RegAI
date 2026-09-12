"""add alert workflow fields

Revision ID: 0012_alert_workflow
Revises: 0011_company_profile
Create Date: 2024-01-23 20:36:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0012_alert_workflow'
down_revision = '0011_company_profile'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns, constraints, and indexes using batch mode for SQLite & Postgres compatibility
    with op.batch_alter_table('alerts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('regulation', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('resolution_notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('created_by', sa.UUID(), nullable=True))
        batch_op.add_column(sa.Column('assigned_to', sa.UUID(), nullable=True))
        batch_op.add_column(sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
        try:
            batch_op.create_foreign_key('fk_alerts_created_by', 'users', ['created_by'], ['id'])
            batch_op.create_foreign_key('fk_alerts_assigned_to', 'users', ['assigned_to'], ['id'])
        except Exception:
            pass
        batch_op.create_index('ix_alerts_regulation', ['regulation'])
        batch_op.create_index('ix_alerts_severity', ['severity'])
        batch_op.create_index('ix_alerts_status', ['status'])


def downgrade() -> None:
    with op.batch_alter_table('alerts', schema=None) as batch_op:
        batch_op.drop_index('ix_alerts_status')
        batch_op.drop_index('ix_alerts_severity')
        batch_op.drop_index('ix_alerts_regulation')
        try:
            batch_op.drop_constraint('fk_alerts_assigned_to', type_='foreignkey')
            batch_op.drop_constraint('fk_alerts_created_by', type_='foreignkey')
        except Exception:
            pass
        batch_op.drop_column('resolved_at')
        batch_op.drop_column('assigned_to')
        batch_op.drop_column('created_by')
        batch_op.drop_column('resolution_notes')
        batch_op.drop_column('notes')
        batch_op.drop_column('regulation')
