from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from beanie import Document, Indexed
from pydantic import Field


# 系统提示词目录
PROMPTS_DIR = Path(__file__).parent.parent / "system_prompts"


def read_system_prompt(filename: str) -> str:
    """从文件读取系统提示词
    
    Args:
        filename: 提示词文件名
        
    Returns:
        str: 提示词内容
    """
    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as f:
        return f.read().strip()


class OtherAgent(Document):
    """其他代理模型
    
    用于存储辅助代理的信息，如对话选择器等
    """
    agent_id: Indexed(str, unique=True)  # 代理ID，如'summarizer'
    name: str  # 代理名称
    description: str  # 代理描述
    system_prompt: str  # 代理系统提示词
    settings: Dict[str, Any] = Field(default_factory=dict)  # 代理设置
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "other_agents"
        indexes = [
            "agent_id"
        ]
        
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    async def get_agent(cls, agent_id: str) -> "OtherAgent":
        """获取指定ID的代理
        
        Args:
            agent_id: 代理ID
            
        Returns:
            OtherAgent: 代理对象
        """
        return await cls.find_one({"agent_id": agent_id}) 