"""add_regulation_category

Revision ID: 0004
Revises: 0003
Create Date: 2025-11-23 11:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0004'
down_revision = '0003_audit_logs'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('regulations', sa.Column('category', sa.String(), nullable=True))
    op.create_index(op.f('ix_regulations_category'), 'regulations', ['category'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_regulations_category'), table_name='regulations')
    op.drop_column('regulations', 'category')
