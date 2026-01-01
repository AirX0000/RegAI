"""add_transformation_adjustments

Revision ID: a7534b7235dc
Revises: 0013_balance_sheets
Create Date: 2025-11-26 19:51:55.788402

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a7534b7235dc'
down_revision = '0013_balance_sheets'
branch_labels = None
depends_on = None


def upgrade():
    # Create transformed_statements table
    op.create_table('transformed_statements',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('balance_sheet_id', sa.UUID(), nullable=False),
        sa.Column('format_type', sa.Enum('MCFO', 'IFRS', name='transformationformat'), nullable=False),
        sa.Column('transformed_data', sa.JSON(), nullable=False),
        sa.Column('transformation_rules_applied', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['balance_sheet_id'], ['balance_sheets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    # Create transformation_adjustments table
    op.create_table('transformation_adjustments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('balance_sheet_id', sa.UUID(), nullable=False),
        sa.Column('balance_sheet_item_id', sa.UUID(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('adjustment_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('adjustment_type', sa.String(length=50), nullable=False),
        sa.Column('ifrs_category', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['balance_sheet_id'], ['balance_sheets.id'], ),
        sa.ForeignKeyConstraint(['balance_sheet_item_id'], ['balance_sheet_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    # Create indexes
    op.create_index(op.f('ix_transformed_statements_balance_sheet_id'), 'transformed_statements', ['balance_sheet_id'], unique=False)
    op.create_index(op.f('ix_transformed_statements_format_type'), 'transformed_statements', ['format_type'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_transformed_statements_format_type'), table_name='transformed_statements')
    op.drop_index(op.f('ix_transformed_statements_balance_sheet_id'), table_name='transformed_statements')
    op.drop_table('transformation_adjustments')
    op.drop_table('transformed_statements')
