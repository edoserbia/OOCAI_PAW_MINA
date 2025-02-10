from typing import List, Optional, Dict, Any
from datetime import datetime
from beanie import Document, Link, Indexed
from pydantic import Field


class StoryTemplate(Document):
    """故事模板模型"""
    name: str = Field(description="模板名称")  # 模板名称
    thumbnail: str = Field(description="缩略图URL")  # 缩略图URL
    introduction: str = Field(description="模板介绍")  # 模板介绍
    components: List[Dict[str, Any]] = Field(description="组件配置列表")  # 组件配置列表，允许任意JSON内容
    maxCharacters: int = Field(description="最大角色数量")  # 最大角色数量
    history_length: int = Field(default=25, description="历史对话长度")  # 历史对话长度，默认25
    hidden_background_prompt: str = Field(description="用于生成故事背景的提示词")  # 用于生成故事背景的提示词
    hidden_target_prompt: str = Field(description="用于生成故事目标的提示词")  # 用于生成故事目标的提示词
    status: str = Field(default="active", description="模板状态")  # 模板状态：active/inactive
    created_at: datetime = Field(default_factory=datetime.utcnow)  # 创建时间
    updated_at: datetime = Field(default_factory=datetime.utcnow)  # 更新时间

    class Settings:
        name = "story_templates"
        indexes = [
            "name",
            "status"
        ]

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def to_mongo(self):
        """转换为MongoDB文档格式"""
        return {
            "name": self.name,
            "thumbnail": self.thumbnail,
            "introduction": self.introduction,
            "components": self.components,  # 直接存储组件列表
            "maxCharacters": self.maxCharacters,
            "history_length": self.history_length,
            "hidden_background_prompt": self.hidden_background_prompt,
            "hidden_target_prompt": self.hidden_target_prompt,
            "status": self.status,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

    @classmethod
    def from_mongo(cls, data):
        """从MongoDB文档格式转换为模型实例"""
        if not data:
            return None
        return cls(**data) 