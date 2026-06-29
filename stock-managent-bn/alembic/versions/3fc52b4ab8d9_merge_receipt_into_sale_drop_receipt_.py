"""merge receipt into sale, drop receipt tables

Revision ID: 3fc52b4ab8d9
Revises: aad221320ec6
Create Date: 2026-06-29 14:55:28.575544

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3fc52b4ab8d9'
down_revision: Union[str, Sequence[str], None] = 'aad221320ec6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('sales', sa.Column('client_name', sa.String(length=150), nullable=True))
    op.add_column('sales', sa.Column('client_phone', sa.String(length=32), nullable=True))
    op.execute("UPDATE sales SET client_name = 'unknown', client_phone = 'unknown' WHERE client_name IS NULL")
    op.alter_column('sales', 'client_name', nullable=False)
    op.alter_column('sales', 'client_phone', nullable=False)

    op.drop_table('receipt_items')
    op.drop_table('receipts')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table(
        'receipts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('receipt_number', sa.String(length=32), nullable=False),
        sa.Column('client_name', sa.String(length=150), nullable=False),
        sa.Column('client_phone', sa.String(length=32), nullable=False),
        sa.Column('total_amount', sa.Numeric(12, 2), server_default='0', nullable=False),
        sa.Column('checked_out_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('total_amount >= 0', name='ck_receipts_total_amount_non_negative'),
        sa.ForeignKeyConstraint(['checked_out_by_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_receipts_receipt_number'), 'receipts', ['receipt_number'], unique=True)
    op.create_index(op.f('ix_receipts_checked_out_by_id'), 'receipts', ['checked_out_by_id'], unique=False)

    op.create_table(
        'receipt_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('receipt_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('subtotal', sa.Numeric(12, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('quantity > 0', name='ck_receipt_items_quantity_positive'),
        sa.CheckConstraint('unit_price >= 0', name='ck_receipt_items_unit_price_non_negative'),
        sa.CheckConstraint('subtotal >= 0', name='ck_receipt_items_subtotal_non_negative'),
        sa.ForeignKeyConstraint(['receipt_id'], ['receipts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_receipt_items_receipt_id'), 'receipt_items', ['receipt_id'], unique=False)
    op.create_index(op.f('ix_receipt_items_product_id'), 'receipt_items', ['product_id'], unique=False)

    op.drop_column('sales', 'client_phone')
    op.drop_column('sales', 'client_name')
