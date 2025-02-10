"""create other_agents table

Revision ID: create_other_agents_table
Revises: # 这里需要填写上一个迁移文件的revision id
Create Date: 2024-03-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import os

# revision identifiers, used by Alembic.
revision = 'create_other_agents_table'
down_revision = None  # 这里需要填写上一个迁移文件的revision id
branch_labels = None
depends_on = None

def read_system_prompt(filename: str) -> str:
    """从文件读取系统提示词"""
    file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                            'system_prompts', filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except FileNotFoundError:
        raise Exception(f"System prompt file not found: {file_path}")

def upgrade() -> None:
    # 创建other_agents表
    op.create_table(
        'other_agents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # 创建索引
    op.create_index('idx_other_agents_name', 'other_agents', ['name'])

    # 读取系统提示词
    role_selection_prompt = read_system_prompt('speaker_selection.txt')
    finish_prompt = read_system_prompt('finish.txt')

    # 插入默认的speaker_selection和finish agent
    op.execute(f"""
        INSERT INTO other_agents (name, system_prompt) VALUES 
        ('speaker_selection', '{role_selection_prompt}'),
        ('finish', '{finish_prompt}')
    """)

def downgrade() -> None:
    # 删除索引
    op.drop_index('idx_other_agents_name')
    
    # 删除表
    op.drop_table('other_agents') 