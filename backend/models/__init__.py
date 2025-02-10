"""数据模型包"""

# 基础模型
from .user import User
from .character import Character
from .story import Story
from .music import Music

# 消息相关模型
from .conversation_message import MessageRole
from .conversation import Conversation
from .conversation_message import ConversationMessage

# 其他模型
from .other_agent import OtherAgent
from .llm import LLM, LLMType

# 重建模型
ConversationMessage.model_rebuild()
Conversation.model_rebuild()

__all__ = [
    "User",
    "Character",
    "Story",
    "Music",
    "Conversation",
    "ConversationMessage",
    "MessageRole",
    "OtherAgent",
    "LLM",
    "LLMType"
] 