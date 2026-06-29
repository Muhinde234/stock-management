"""add shop_id to users

Revision ID: 4ef22fe80806
Revises: beb377680d79
Create Date: 2026-06-29 06:03:14.269934

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4ef22fe80806'
down_revision: Union[str, Sequence[str], None] = 'beb377680d79'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('shop_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_users_shop_id'), 'users', ['shop_id'], unique=False)
    op.create_foreign_key(
        'fk_users_shop_id_shops', 'users', 'shops', ['shop_id'], ['id'], ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_users_shop_id_shops', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_shop_id'), table_name='users')
    op.drop_column('users', 'shop_id')
