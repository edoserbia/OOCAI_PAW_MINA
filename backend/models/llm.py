from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from beanie import Document, Indexed
from pydantic import BaseModel


class LLMType(str, Enum):
    """LLM类型枚举"""
    CHAT = "chat"  # 对话模型
    OTHER = "other"  # 其他模型
    T2I = "t2i"  # 文生图模型
    I2T = "i2t"  # 图生文模型


class LLMSettings(BaseModel):
    """LLM设置"""
    base_url: Optional[str] = None  # API基础URL
    model: str  # 模型名称
    temperature: Optional[float] = None  # 温度参数
    max_tokens: Optional[int] = None  # 最大token数
    top_p: Optional[float] = None  # 采样参数
    presence_penalty: Optional[float] = None  # 存在惩罚
    frequency_penalty: Optional[float] = None  # 频率惩罚
    size: Optional[str] = None  # 图片生成尺寸，仅用于t2i类型
    seed: Optional[int] = None  # 随机种子，仅用于t2i类型
    steps: Optional[int] = None  # 生成步数，仅用于t2i类型，用于flux-schnell
    n: Optional[int] = None  # 生成步数n，仅用于t2i类型，用于stable diffusion
    guidance: Optional[float] = None  # 指导度量值，仅用于t2i类型


class LLM(Document):
    """LLM模型集合"""
    llm_id: Indexed(str, unique=True)  # LLM ID
    type: Indexed(str)  # LLM类型
    api_key: str  # API密钥
    usage_count: int = 0  # 使用次数
    last_used: Optional[datetime] = None  # 最后使用时间
    settings: LLMSettings  # LLM设置
    status: str = "active"  # 状态：active/inactive
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "llms"

    class Config:
        schema_extra = {
            "example": {
                "llm_id": "flux-schnell-1",
                "type": "t2i",
                "api_key": "sk-xxx",
                "settings": {
                    "model": "flux-schnell",
                    "size": "1024*1024",
                    "steps": 4,
                    "guidance": 3.5
                }
            }
        }

    @classmethod
    async def get_least_used_model(cls, type: str) -> Optional["LLM"]:
        """获取使用次数最少的指定类型模型"""
        models = await cls.find(
            {"type": type, "status": "active"}
        ).sort("usage_count").to_list()
        return models[0] if models else None

    @classmethod
    async def get_least_recent_model(cls, type: str) -> Optional["LLM"]:
        """获取最久未使用的指定类型模型
        
        Args:
            type: 模型类型（chat/other/t2i/i2t）
            
        Returns:
            Optional[LLM]: 最久未使用的模型，如果没有则返回None
            
        Note:
            - 如果模型从未使用过（last_used为None），会被优先返回
            - 如果所有模型都从未使用过，则返回第一个模型
            - 只返回状态为active的模型
        """
        # 先查找未使用过的模型
        models = await cls.find(
            {"type": type, "status": "active", "last_used": None}
        ).to_list()
        if models:
            return models[0]
        
        # 如果所有模型都使用过，返回最久未使用的
        models = await cls.find(
            {"type": type, "status": "active"}
        ).sort("last_used").to_list()
        return models[0] if models else None

    @classmethod
    async def create_llm(cls, llm_id: str, type: str, api_key: str, settings: Dict[str, Any]) -> "LLM":
        """创建新的LLM配置
        
        Args:
            llm_id: LLM ID
            type: LLM类型
            api_key: API密钥
            settings: LLM设置
            
        Returns:
            LLM: 创建的LLM对象
        """
        llm = cls(
            llm_id=llm_id,
            type=type,
            api_key=api_key,
            settings=LLMSettings(**settings),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await llm.insert()
        return llm

    async def increment_usage(self):
        """增加使用次数"""
        self.usage_count += 1
        self.last_used = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        await self.save() 