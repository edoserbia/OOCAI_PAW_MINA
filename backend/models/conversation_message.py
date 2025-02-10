from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional, Any, ForwardRef

from beanie import Document, Link, Indexed
from pydantic import Field

if TYPE_CHECKING:
    from .conversation import Conversation
    from .character import Character
else:
    Conversation = ForwardRef("Conversation")
    Character = ForwardRef("Character")


class MessageRole(str, Enum):
    """消息角色枚举"""
    CHARACTER = "character"  # 角色消息
    NARRATOR = "narrator"    # 旁白消息
    USER = "user"           # 用户消息


class ConversationMessage(Document):
    """对话消息模型
    
    用于存储对话中的消息记录
    """
    conversation: Link[Conversation]  # 关联的对话
    character: Optional[Link[Character]] = None  # 关联的角色
    character_name: Optional[str] = None  # 角色名称
    content: str  # 消息内容
    sequence: Indexed(int)  # 消息序号，用于回退
    role: MessageRole = Field(default=MessageRole.CHARACTER)  # 消息角色
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "conversation_messages"
        indexes = [
            [("conversation", 1), ("sequence", 1)],  # 复合索引
            [("conversation", 1), ("created_at", -1)]  # 用于按时间查询
        ]
        
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    async def get_conversation_messages(
        cls,
        conversation_id: str,
        limit: int = 20,
        skip: int = 0
    ) -> list["ConversationMessage"]:
        """获取对话的消息列表
        
        Args:
            conversation_id: 对话ID
            limit: 限制返回的消息数量
            skip: 跳过的消息数量
            
        Returns:
            list[ConversationMessage]: 消息列表
        """
        return await cls.find(
            {"conversation._id": conversation_id}
        ).sort(
            "sequence"
        ).skip(skip).limit(limit).to_list()

    @classmethod
    async def rollback_conversation(
        cls,
        conversation_id: str,
        target_sequence: int
    ) -> None:
        """回退对话到指定序号的消息
        
        Args:
            conversation_id: 对话ID
            target_sequence: 目标消息序号
        """
        await cls.find(
            {
                "conversation._id": conversation_id,
                "sequence": {"$gt": target_sequence}
            }
        ).delete()

    @classmethod
    async def create_character_message(
        cls,
        conversation: Any,  # 避免直接使用Conversation类型
        character: Character,
        content: str,
        sequence: int,
        is_narrator: bool = False
    ) -> "ConversationMessage":
        """创建角色消息
        
        Args:
            conversation: 对话对象
            character: 角色对象
            content: 消息内容
            sequence: 消息序号
            is_narrator: 是否是旁白消息
            
        Returns:
            ConversationMessage: 创建的消息对象
        """
        message = cls(
            conversation=conversation,
            character=character,  # 设置角色引用
            character_name=character.name,  # 设置角色名称
            content=content,
            sequence=sequence,
            role=MessageRole.NARRATOR if is_narrator else MessageRole.CHARACTER,
            created_at=datetime.utcnow()
        )
        await message.insert()
        return message

    @classmethod
    async def create_user_message(
        cls,
        conversation: Any,  # 避免直接使用Conversation类型
        content: str,
        sequence: int
    ) -> "ConversationMessage":
        """创建用户消息
        
        Args:
            conversation: 对话对象
            content: 消息内容
            sequence: 消息序号
            
        Returns:
            ConversationMessage: 创建的消息对象
        """
        message = cls(
            conversation=conversation,
            content=content,
            sequence=sequence,
            role=MessageRole.USER
        )
        await message.insert()
        return message 