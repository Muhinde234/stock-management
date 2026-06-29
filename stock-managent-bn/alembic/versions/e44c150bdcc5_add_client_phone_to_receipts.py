"""add client_phone to receipts

Revision ID: e44c150bdcc5
Revises: 32627a432f83
Create Date: 2026-06-29 06:33:26.891052

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e44c150bdcc5'
down_revision: Union[str, Sequence[str], None] = '32627a432f83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('receipts', sa.Column('client_phone', sa.String(length=32), nullable=True))
    op.execute("UPDATE receipts SET client_phone = 'unknown' WHERE client_phone IS NULL")
    op.alter_column('receipts', 'client_phone', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('receipts', 'client_phone')
