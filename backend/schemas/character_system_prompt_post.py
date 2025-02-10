from datetime import datetime
from pydantic import BaseModel, Field

class CharacterSystemPromptPostCreate(BaseModel):
    """创建角色系统提示词补充的请求模型"""
    type: str = Field("description", pattern="^(description|requirements)$")  # 提示词类型
    language: str = Field("中文", pattern="^(中文|English)$")  # 语言
    content: str

class CharacterSystemPromptPostResponse(BaseModel):
    """角色系统提示词补充的响应模型"""
    id: str
    type: str  # 提示词类型
    language: str  # 语言
    content: str
    created_at: datetime
    updated_at: datetime 