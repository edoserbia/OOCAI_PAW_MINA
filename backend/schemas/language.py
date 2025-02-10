from datetime import datetime
from pydantic import BaseModel

class LanguageCreate(BaseModel):
    """创建语言的请求模型"""
    language: str

class LanguageResponse(BaseModel):
    """语言的响应模型"""
    id: str
    language: str
    created_at: datetime 