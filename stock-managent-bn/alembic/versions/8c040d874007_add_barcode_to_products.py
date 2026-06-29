"""add barcode to products

Revision ID: 8c040d874007
Revises: 3fc52b4ab8d9
Create Date: 2026-06-29 15:30:02.920707

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c040d874007'
down_revision: Union[str, Sequence[str], None] = '3fc52b4ab8d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('barcode', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_products_barcode'), 'products', ['barcode'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_products_barcode'), table_name='products')
    op.drop_column('products', 'barcode')
