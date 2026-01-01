"""create_core_tables

Revision ID: 0001_core_tables
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_core_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tenants
    op.create_table('tenants',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('plan', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenants_name'), 'tenants', ['name'], unique=False)

    # Users
    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_superuser', sa.Boolean(), nullable=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_full_name'), 'users', ['full_name'], unique=False)

    # Companies
    op.create_table('companies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('domain', sa.String(), nullable=True),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_companies_domain'), 'companies', ['domain'], unique=False)
    op.create_index(op.f('ix_companies_name'), 'companies', ['name'], unique=False)

    # Regulations
    op.create_table('regulations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('jurisdiction', sa.String(), nullable=True),
        sa.Column('content_hash', sa.String(), nullable=True),
        sa.Column('source_url', sa.String(), nullable=True),
        sa.Column('effective_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tenant_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_regulations_code'), 'regulations', ['code'], unique=False)
    op.create_index(op.f('ix_regulations_content_hash'), 'regulations', ['content_hash'], unique=False)
    op.create_index(op.f('ix_regulations_jurisdiction'), 'regulations', ['jurisdiction'], unique=False)
    op.create_index(op.f('ix_regulations_tenant_id'), 'regulations', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_regulations_title'), 'regulations', ['title'], unique=False)

    # Alerts
    op.create_table('alerts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('severity', sa.String(), nullable=True),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Link Company Regulation
    op.create_table('link_company_regulation',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('regulation_id', sa.UUID(), nullable=False),
        sa.Column('tenant_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['regulation_id'], ['regulations.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('link_company_regulation')
    op.drop_table('alerts')
    op.drop_index(op.f('ix_regulations_title'), table_name='regulations')
    op.drop_index(op.f('ix_regulations_tenant_id'), table_name='regulations')
    op.drop_index(op.f('ix_regulations_jurisdiction'), table_name='regulations')
    op.drop_index(op.f('ix_regulations_content_hash'), table_name='regulations')
    op.drop_index(op.f('ix_regulations_code'), table_name='regulations')
    op.drop_table('regulations')
    op.drop_index(op.f('ix_companies_name'), table_name='companies')
    op.drop_index(op.f('ix_companies_domain'), table_name='companies')
    op.drop_table('companies')
    op.drop_index(op.f('ix_users_full_name'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_tenants_name'), table_name='tenants')
    op.drop_table('tenants')
