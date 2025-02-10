from datetime import datetime
from typing import Optional

from beanie import Document, Indexed
from pydantic import Field


class APIKey(Document):
    """API密钥模型
    
    用于管理DeepSeek API密钥，支持负载均衡和自动重试
    """
    key: Indexed(str, unique=True)  # API密钥
    usage_count: int = 0  # 使用次数
    last_used: Optional[datetime] = None  # 最后使用时间
    status: str = "active"  # 状态：active/inactive
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "api_keys"
        
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    async def get_next_available_key(cls) -> Optional["APIKey"]:
        """获取下一个可用的API密钥
        
        使用轮询策略，选择使用次数最少的活跃密钥
        
        Returns:
            Optional[APIKey]: 可用的API密钥，如果没有则返回None
        """
        key = await cls.find(
            {"status": "active"}
        ).sort(
            "usage_count"
        ).first()
        
        if key:
            key.usage_count += 1
            key.last_used = datetime.utcnow()
            await key.save()
            
        return key

    @classmethod
    async def mark_key_inactive(cls, key: str) -> None:
        """将API密钥标记为不可用
        
        Args:
            key: API密钥
        """
        api_key = await cls.find_one({"key": key})
        if api_key:
            api_key.status = "inactive"
            await api_key.save()

    @classmethod
    async def reset_usage_counts(cls) -> None:
        """重置所有API密钥的使用次数
        
        通常在每天开始时调用
        """
        await cls.find_all().update({"$set": {"usage_count": 0}}) 