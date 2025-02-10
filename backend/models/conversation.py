from datetime import datetime
from typing import TYPE_CHECKING, List, Optional, ForwardRef

from beanie import Document, Link, Indexed
from pydantic import Field

from .story import Story

if TYPE_CHECKING:
    from .conversation_message import ConversationMessage
else:
    ConversationMessage = ForwardRef("ConversationMessage")


class Conversation(Document):
    """对话模型
    
    用于存储用户与角色的对话记录
    """
    story: Link[Story] = Field(description="关联的故事")  # 关联的故事
    user_id: str = Field(index=True, description="用户ID")  # 用户ID
    status: str = Field(default="active", description="对话状态")  # 对话状态：active/archived
    current_context: Optional[str] = None  # 当前上下文摘要
    created_at: datetime = Field(default_factory=datetime.utcnow)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.utcnow)  # 更新时间
    last_sequence: int = Field(default=0, description="最后一条消息的序号")  # 最后一条消息的序号

    class Settings:
        name = "conversations"
        indexes = [
            "story",
            "user_id",
            "status",
            "created_at"
        ]
        
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    async def get_messages(self) -> List[ConversationMessage]:
        """获取对话的所有消息
        
        Returns:
            List[ConversationMessage]: 消息列表，按sequence排序
        """
        from .conversation_message import ConversationMessage
        return await ConversationMessage.find(
            ConversationMessage.conversation.id == self.id
        ).sort("+sequence").to_list()

    async def get_next_sequence(self) -> int:
        """获取下一个消息序号
        
        Returns:
            int: 下一个消息序号
        """
        self.last_sequence += 1
        await self.save()
        return self.last_sequence 