"""add supplier name and phone to purchase orders

Revision ID: aad221320ec6
Revises: 0f40ca4c884b
Create Date: 2026-06-29 14:21:16.662372

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aad221320ec6'
down_revision: Union[str, Sequence[str], None] = '0f40ca4c884b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('purchase_orders', sa.Column('supplier_name', sa.String(length=150), nullable=True))
    op.add_column('purchase_orders', sa.Column('supplier_phone', sa.String(length=32), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('purchase_orders', 'supplier_phone')
    op.drop_column('purchase_orders', 'supplier_name')
