"""add balance sheet tables

Revision ID: 0013_balance_sheets
Revises: add_hierarchy_fields
Create Date: 2025-11-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0013_balance_sheets'
down_revision = 'add_hierarchy_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Create balance_sheets table
    op.create_table(
        'balance_sheets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('period', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('draft', 'submitted', 'transformed', name='balancesheetstatus'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_balance_sheets_company_id'), 'balance_sheets', ['company_id'], unique=False)
    op.create_index(op.f('ix_balance_sheets_period'), 'balance_sheets', ['period'], unique=False)

    # Create balance_sheet_items table
    op.create_table(
        'balance_sheet_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('balance_sheet_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('account_code', sa.String(length=50), nullable=False),
        sa.Column('account_name', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('category', sa.Enum('assets', 'liabilities', 'equity', name='balancesheetcategory'), nullable=False),
        sa.Column('subcategory', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['balance_sheet_id'], ['balance_sheets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_balance_sheet_items_balance_sheet_id'), 'balance_sheet_items', ['balance_sheet_id'], unique=False)
    op.create_index(op.f('ix_balance_sheet_items_category'), 'balance_sheet_items', ['category'], unique=False)

    # Create transformed_statements table
    op.create_table(
        'transformed_statements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('balance_sheet_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('format_type', sa.Enum('mcfo', 'ifrs', name='transformationformat'), nullable=False),
        sa.Column('transformed_data', sa.JSON(), nullable=False),
        sa.Column('transformation_rules_applied', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['balance_sheet_id'], ['balance_sheets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transformed_statements_balance_sheet_id'), 'transformed_statements', ['balance_sheet_id'], unique=False)
    op.create_index(op.f('ix_transformed_statements_format_type'), 'transformed_statements', ['format_type'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_transformed_statements_format_type'), table_name='transformed_statements')
    op.drop_index(op.f('ix_transformed_statements_balance_sheet_id'), table_name='transformed_statements')
    op.drop_table('transformed_statements')
    
    op.drop_index(op.f('ix_balance_sheet_items_category'), table_name='balance_sheet_items')
    op.drop_index(op.f('ix_balance_sheet_items_balance_sheet_id'), table_name='balance_sheet_items')
    op.drop_table('balance_sheet_items')
    
    op.drop_index(op.f('ix_balance_sheets_period'), table_name='balance_sheets')
    op.drop_index(op.f('ix_balance_sheets_company_id'), table_name='balance_sheets')
    op.drop_table('balance_sheets')
    
    op.execute('DROP TYPE balancesheetstatus')
    op.execute('DROP TYPE balancesheetcategory')
    op.execute('DROP TYPE transformationformat')
