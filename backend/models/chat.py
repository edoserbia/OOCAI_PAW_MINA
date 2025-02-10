from pydantic import BaseModel, Field
from typing import List, Optional
from models.conversation_message import MessageRole


class HistoryMessage(BaseModel):
    """历史消息模型
    
    注意：这是一个Pydantic模型，不是MongoDB文档模型，
    仅用于API请求和响应的数据验证
    """
    id: str = Field(
        description="消息ID"
    )  # 消息ID
    role: MessageRole = Field(
        description="角色类型",
        examples=[MessageRole.USER, MessageRole.NARRATOR, MessageRole.CHARACTER]
    )  # 角色类型：user, narrator, character
    content: str = Field(
        description="消息内容"
    )  # 消息内容
    character_name: Optional[str] = Field(
        default=None,
        description="角色名称，仅当role=character时需要"
    )  # 角色名称，仅当role=character时需要
    sequence: int = Field(
        description="消息序号"
    )  # 消息序号
    created_at: str = Field(
        description="消息创建时间，ISO格式的UTC时间字符串"
    )  # 消息创建时间

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "role": MessageRole.CHARACTER,
                "content": "今天天气真好啊，我特别喜欢这样的下午~",
                "character_name": "小惠",
                "sequence": 1,
                "created_at": "2024-01-21T17:34:40.312Z"
            }
        } 