"""add is_active to users

Revision ID: dba07fd53de9
Revises: e44c150bdcc5
Create Date: 2026-06-29 06:43:10.228229

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dba07fd53de9'
down_revision: Union[str, Sequence[str], None] = 'e44c150bdcc5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'is_active')
