"""add units table and product unit_id fk

Revision ID: 32627a432f83
Revises: 4ef22fe80806
Create Date: 2026-06-29 06:16:18.231619

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '32627a432f83'
down_revision: Union[str, Sequence[str], None] = '4ef22fe80806'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'units',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_units_name'), 'units', ['name'], unique=True)

    op.add_column('products', sa.Column('unit_id', sa.Integer(), nullable=True))

    op.execute("INSERT INTO units (name, created_at, updated_at) "
               "SELECT DISTINCT quantity_unit, now(), now() FROM products "
               "WHERE quantity_unit IS NOT NULL "
               "ON CONFLICT (name) DO NOTHING")
    op.execute("UPDATE products SET unit_id = units.id FROM units WHERE units.name = products.quantity_unit")

    op.alter_column('products', 'unit_id', nullable=False)
    op.create_index(op.f('ix_products_unit_id'), 'products', ['unit_id'], unique=False)
    op.create_foreign_key(
        'fk_products_unit_id_units', 'products', 'units', ['unit_id'], ['id'], ondelete='RESTRICT'
    )

    op.drop_column('products', 'quantity_unit')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('products', sa.Column('quantity_unit', sa.String(length=32), server_default='pcs', nullable=False))
    op.execute("UPDATE products SET quantity_unit = units.name FROM units WHERE units.id = products.unit_id")

    op.drop_constraint('fk_products_unit_id_units', 'products', type_='foreignkey')
    op.drop_index(op.f('ix_products_unit_id'), table_name='products')
    op.drop_column('products', 'unit_id')

    op.drop_index(op.f('ix_units_name'), table_name='units')
    op.drop_table('units')
