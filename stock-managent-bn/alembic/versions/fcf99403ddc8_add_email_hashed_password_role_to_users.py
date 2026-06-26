"""add email, hashed_password, role to users

Revision ID: fcf99403ddc8
Revises: 6a3a0947fa65
Create Date: 2026-06-26 11:51:26.961213

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fcf99403ddc8'
down_revision: Union[str, Sequence[str], None] = '6a3a0947fa65'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    user_role = sa.Enum('admin', 'cashier', name='user_role')
    user_role.create(op.get_bind(), checkfirst=True)

    op.add_column('users', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('role', user_role, server_default='cashier', nullable=False))
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_column('users', 'role')
    op.drop_column('users', 'hashed_password')
    op.drop_column('users', 'email')
    sa.Enum(name='user_role').drop(op.get_bind(), checkfirst=True)
