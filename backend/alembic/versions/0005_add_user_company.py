"""add_user_company

Revision ID: 0005
Revises: 0004
Create Date: 2025-11-23 11:44:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.UUID(), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_company_id'), ['company_id'], unique=False)
        batch_op.create_foreign_key('fk_users_company_id', 'companies', ['company_id'], ['id'])


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('fk_users_company_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_users_company_id'))
        batch_op.drop_column('company_id')
