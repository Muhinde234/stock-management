"""make products stock_id nullable

Revision ID: 0f40ca4c884b
Revises: dec7a382a5aa
Create Date: 2026-06-29 11:54:09.764945

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0f40ca4c884b'
down_revision: Union[str, Sequence[str], None] = 'dec7a382a5aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('products', 'stock_id', existing_type=sa.INTEGER(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('products', 'stock_id', existing_type=sa.INTEGER(), nullable=False)
