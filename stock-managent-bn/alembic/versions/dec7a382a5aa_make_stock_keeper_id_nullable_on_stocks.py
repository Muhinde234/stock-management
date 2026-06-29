"""make stock_keeper_id nullable on stocks

Revision ID: dec7a382a5aa
Revises: dba07fd53de9
Create Date: 2026-06-29 08:40:26.766254

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dec7a382a5aa'
down_revision: Union[str, Sequence[str], None] = 'dba07fd53de9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('stocks', 'stock_keeper_id', existing_type=sa.INTEGER(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('stocks', 'stock_keeper_id', existing_type=sa.INTEGER(), nullable=False)
