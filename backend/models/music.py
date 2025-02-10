from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field


class Music(Document):
    """音乐模型
    
    用于存储背景音乐信息
    """
    name: Indexed(str, unique=True)  # 音乐名称
    url: str  # 音乐URL
    type: str  # 音乐类型：upbeat/relaxing/dramatic/mysterious/epic等
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "music"  # 集合名称
        indexes = [
            "name",  # unique
            "type"   # 按类型查询
        ]
        
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    async def create_music(
        cls,
        name: str,
        url: str,
        type: str,
    ) -> "Music":
        """创建新的音乐记录
        
        Args:
            name: 音乐名称
            url: 音乐URL
            type: 音乐类型
            
        Returns:
            Music: 创建的音乐对象
        """
        music = cls(
            name=name,
            url=url,
            type=type
        )
        await music.insert()
        return music

    @classmethod
    async def get_all_music(cls) -> list["Music"]:
        """获取所有音乐
        
        Returns:
            list[Music]: 音乐列表
        """
        return await cls.find().to_list()

    @classmethod
    async def get_music_by_type(cls, type: str) -> list["Music"]:
        """获取指定类型的音乐
        
        Args:
            type: 音乐类型
            
        Returns:
            list[Music]: 音乐列表
        """
        return await cls.find({"type": type}).to_list() 