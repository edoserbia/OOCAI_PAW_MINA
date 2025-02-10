from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class Language(Document):
    """语言模型
    
    用于存储系统支持的语言
    """
    language: str = Field(description="语言名称")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")

    class Settings:
        name = "languages"
        indexes = [
            "language",  # unique
        ] 