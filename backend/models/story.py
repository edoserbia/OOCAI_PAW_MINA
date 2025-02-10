from datetime import datetime
from typing import List, Dict, Any, Optional, TYPE_CHECKING, ForwardRef, Union
from beanie import Document, Indexed, Link
from pydantic import Field, BaseModel
from bson import ObjectId

if TYPE_CHECKING:
    from .character import Character
    from .music import Music
else:
    Character = ForwardRef("Character")
    Music = ForwardRef("Music")


class OpeningMessage(BaseModel):
    """开场白模型"""
    content: str  # 开场白内容
    character: Union[str, int]  # 关联的角色ID（MongoDB ObjectId字符串或整数索引）

    class Config:
        json_encoders = {
            ObjectId: str
        }


class Story(Document):
    """故事模型
    
    用于存储故事信息，包括标题、背景、设定等
    """
    story_name: str  # 故事名称（用户填写）
    generated_background: Optional[str] = None  # 生成的故事背景
    generated_target: Optional[str] = None  # 故事目标
    bg_image_prompt: str  # 背景图片生成提示词
    bg_image_url: Optional[str] = None  # 背景图片URL
    icon_url: Optional[str] = None  # 故事图标URL
    history_length: int = 25  # 历史对话长度
    created_by: Indexed(str)  # 创建者钱包地址
    characters: List[Link[Character]]  # 角色列表
    background_music: Optional[Link[Music]] = None  # 关联的背景音乐
    opening_messages: List[OpeningMessage] = Field(default_factory=list)  # 开场白列表
    settings: Dict[str, Any] = Field(default_factory=dict)  # 故事设置，JSON格式
    likes: int = 0  # 被喜欢次数
    comments_count: int = 0  # 评论数量
    retweet: int = 0  # 被转发次数
    played: int = 0  # 被多少用户玩过
    language: str = "中文"  # 创建者所使用语言
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "stories"
        indexes = [
            "created_by",
            ("created_by", "story_name")
        ]
        
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    async def create_story(
        cls,
        story_name: str,
        bg_image_prompt: str,
        characters: List[Character],
        wallet_address: str,
        settings: Dict[str, Any],
        opening_messages: Optional[List[Dict[str, Any]]] = None,
        background_music: Optional[Music] = None,
        generated_background: Optional[str] = None,
        generated_target: Optional[str] = None,
        bg_image_url: Optional[str] = None,
        icon_url: Optional[str] = None,
        history_length: int = 25,
        language: str = "中文"
    ) -> "Story":
        """创建新故事
        
        Args:
            story_name: 故事名称
            bg_image_prompt: 背景图片生成提示词
            characters: 角色列表
            wallet_address: 创建者钱包地址
            settings: 故事设置
            opening_messages: 开场白列表
            background_music: 关联的背景音乐
            generated_background: 生成的故事背景
            generated_target: 故事目标
            bg_image_url: 背景图片URL
            icon_url: 故事图标URL
            history_length: 历史对话长度
            language: 创建者使用的语言
            
        Returns:
            Story: 创建的故事对象
        """
        # 确保第一个角色是旁白
        if not characters or characters[0].character_type != "narrator":
            raise ValueError("First character must be narrator")

        # 处理开场白列表
        opening_messages_list = []
        if opening_messages:
            for msg in opening_messages:
                # 如果msg已经是OpeningMessage对象，直接使用
                if isinstance(msg, OpeningMessage):
                    opening_messages_list.append(msg)
                # 否则，从字典创建OpeningMessage对象
                else:
                    opening_messages_list.append(OpeningMessage(**msg))

        story = cls(
            story_name=story_name,
            bg_image_prompt=bg_image_prompt,
            bg_image_url=bg_image_url,
            icon_url=icon_url,
            history_length=history_length,
            created_by=wallet_address,
            characters=characters,
            background_music=background_music,
            opening_messages=opening_messages_list,
            generated_background=generated_background,
            generated_target=generated_target,
            settings=settings,
            language=language
        )
        await story.insert()
        return story

    @classmethod
    async def get_user_stories(cls, wallet_address: str) -> list["Story"]:
        """获取用户创建的所有故事
        
        Args:
            wallet_address: 用户钱包地址
            
        Returns:
            list[Story]: 故事列表
        """
        return await cls.find(
            {"created_by": wallet_address}
        ).sort(
            "created_at"
        ).to_list() 