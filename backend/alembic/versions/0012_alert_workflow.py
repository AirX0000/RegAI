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
    # Add new columns to alerts table
    op.add_column('alerts', sa.Column('regulation', sa.String(length=100), nullable=True))
    op.add_column('alerts', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('alerts', sa.Column('resolution_notes', sa.Text(), nullable=True))
    op.add_column('alerts', sa.Column('created_by', sa.UUID(), nullable=True))
    op.add_column('alerts', sa.Column('assigned_to', sa.UUID(), nullable=True))
    op.add_column('alerts', sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True))
    
    # Create foreign keys
    op.create_foreign_key('fk_alerts_created_by', 'alerts', 'users', ['created_by'], ['id'])
    op.create_foreign_key('fk_alerts_assigned_to', 'alerts', 'users', ['assigned_to'], ['id'])
    
    # Create indexes
    op.create_index('ix_alerts_regulation', 'alerts', ['regulation'])
    op.create_index('ix_alerts_severity', 'alerts', ['severity'])
    op.create_index('ix_alerts_status', 'alerts', ['status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_alerts_status', table_name='alerts')
    op.drop_index('ix_alerts_severity', table_name='alerts')
    op.drop_index('ix_alerts_regulation', table_name='alerts')
    
    # Drop foreign keys
    op.drop_constraint('fk_alerts_assigned_to', 'alerts', type_='foreignkey')
    op.drop_constraint('fk_alerts_created_by', 'alerts', type_='foreignkey')
    
    # Drop columns
    op.drop_column('alerts', 'resolved_at')
    op.drop_column('alerts', 'assigned_to')
    op.drop_column('alerts', 'created_by')
    op.drop_column('alerts', 'resolution_notes')
    op.drop_column('alerts', 'notes')
    op.drop_column('alerts', 'regulation')
