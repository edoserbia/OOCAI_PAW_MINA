from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import BaseModel


class PromptTemplate(Document):
    """提示词模板集合模型"""
    prompt_id: Indexed(str, unique=True)  # 提示词模板ID
    type: Indexed(str)  # 模板类型：t2i/i2t/chat/other
    content: str  # 提示词模板内容
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "prompt_templates"
        
    class Config:
        schema_extra = {
            "example": {
                "prompt_id": "t2i_character",
                "type": "t2i",
                "content": "Generate a portrait of {name}, {description}. The image should be {style} style."
            }
        } 