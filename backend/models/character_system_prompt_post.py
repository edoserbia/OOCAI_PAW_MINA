from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel


class CharacterSystemPromptPost(Document):
    """角色系统提示词补充模型"""
    
    type: str = "description"  # 提示词类型：description/requirements
    language: str = "中文"     # 语言：中文/English
    content: str  # 提示词内容
    created_at: datetime  # 创建时间
    updated_at: datetime  # 更新时间
    
    class Settings:
        name = "character_system_prompt_posts"  # 集合名称
        indexes = [
            "type",
            "language",
            ("type", "language"),  # 复合索引
            "created_at",
            "updated_at"
        ] 