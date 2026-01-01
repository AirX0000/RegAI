"""Add tax rates table

Revision ID: 0007
Revises: 0006
Create Date: 2025-11-23 19:14:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tax_rates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('country_code', sa.String(2), nullable=False),
        sa.Column('country_name', sa.String(100), nullable=False),
        sa.Column('tax_type', sa.String(50), nullable=False),
        sa.Column('rate', sa.Numeric(10, 4), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('source_url', sa.String(500), nullable=True),
        sa.Column('last_updated', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # Create indexes
    op.create_index('ix_tax_rates_id', 'tax_rates', ['id'])
    op.create_index('ix_tax_rates_country_code', 'tax_rates', ['country_code'])
    op.create_index('ix_tax_rates_tax_type', 'tax_rates', ['tax_type'])


def downgrade() -> None:
    op.drop_index('ix_tax_rates_tax_type', table_name='tax_rates')
    op.drop_index('ix_tax_rates_country_code', table_name='tax_rates')
    op.drop_index('ix_tax_rates_id', table_name='tax_rates')
    op.drop_table('tax_rates')
