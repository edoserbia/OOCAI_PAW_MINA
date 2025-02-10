from datetime import datetime
from typing import Optional, Dict, Any

from beanie import Document, Indexed, Link
from pydantic import Field

from .user import User


class Character(Document):
    """角色模型
    
    用于存储角色信息，包括名称、头像、性格特征和背景故事
    """
    name: str  # 角色名称
    description: str  # 角色描述
    personality: str  # 角色性格特征
    image_prompt: Optional[str] = None  # 角色图片生成提示词
    system_prompt: str  # 角色系统提示词
    character_type: str = "character"  # 角色类型：narrator或character
    created_by: Optional[str] = None  # 创建者钱包地址，旁白角色为None
    image_url: Optional[str] = None  # 角色大图URL
    icon_url: Optional[str] = None  # 角色头像URL
    settings: Dict[str, Any] = Field(default_factory=dict)  # 用户填写的角色设置
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "characters"
        indexes = [
            "created_by",
        ]
        
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    async def get_narrator(cls) -> "Character":
        """获取旁白角色"""
        return await cls.find_one({"character_type": "narrator"})

    @classmethod
    async def get_user_characters(cls, wallet_address: str) -> list["Character"]:
        """获取用户创建的所有角色
        
        Args:
            wallet_address: 用户钱包地址
            
        Returns:
            list[Character]: 角色列表
        """
        return await cls.find(
            {"created_by": wallet_address}
        ).sort(
            "created_at"
        ).to_list()

    @classmethod
    async def create_character(
        cls,
        name: str,
        description: str,
        background: str,
        system_prompt: str,
        wallet_address: str,
        image_prompt: Optional[str] = None,
        image_url: Optional[str] = None,
        icon_url: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None,
        character_type: str = "character"
    ) -> "Character":
        """创建新角色
        
        Args:
            name: 角色名称
            description: 角色描述
            background: 角色背景/性格特征
            system_prompt: 角色系统提示词
            wallet_address: 创建者钱包地址
            image_prompt: 角色图片生成提示词
            image_url: 角色大图URL
            icon_url: 角色头像URL
            settings: 用户填写的角色设置
            character_type: 角色类型
            
        Returns:
            Character: 创建的角色对象
        """
        character = cls(
            name=name,
            description=description,
            personality=background,
            system_prompt=system_prompt,
            created_by=wallet_address,
            image_prompt=image_prompt,
            image_url=image_url,
            icon_url=icon_url,
            settings=settings or {},
            character_type=character_type
        )
        await character.insert()
        return character 