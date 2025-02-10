from datetime import datetime
from pydantic import BaseModel

class PromptTemplateResponse(BaseModel):
    """提示词模板响应模型"""
    prompt_id: str
    type: str
    content: str
    created_at: datetime
    updated_at: datetime 