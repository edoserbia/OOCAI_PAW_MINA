from datetime import datetime
from typing import Optional, Literal
from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    """用户模型
    
    用于存储用户信息和认证状态
    """
    wallet_address: Indexed(str) = Field(description="钱包地址")  # 索引
    wallet_type: str = Field(default="ethereum", description="钱包类型：ethereum 或 mina")  # 钱包类型
    username: str = Field(default_factory=lambda: "", description="用户名，默认为钱包地址后8位")
    paw_access_token: Optional[Indexed(str, unique=True)] = Field(default=None, description="访问令牌")  # 唯一索引
    token_expires_at: Optional[datetime] = Field(default=None, description="令牌过期时间")
    last_login: Optional[datetime] = Field(default=None, description="最后登录时间")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = [
            [("wallet_address", 1), ("wallet_type", 1)],  # 钱包地址和类型的复合唯一索引
            [("paw_access_token", 1)]  # 访问令牌唯一索引
        ]

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    @classmethod
    async def get_by_wallet(cls, wallet_address: str, wallet_type: str = "ethereum") -> Optional["User"]:
        """通过钱包地址和类型获取用户
        
        Args:
            wallet_address: 钱包地址
            wallet_type: 钱包类型，默认为ethereum
            
        Returns:
            Optional[User]: 用户对象，不存在则返回None
        """
        return await cls.find_one({"wallet_address": wallet_address, "wallet_type": wallet_type})

    @classmethod
    async def get_by_token(cls, access_token: str) -> Optional["User"]:
        """通过访问令牌获取用户
        
        Args:
            access_token: 访问令牌
            
        Returns:
            Optional[User]: 用户对象，不存在则返回None
        """
        return await cls.find_one(cls.paw_access_token == access_token)

    @staticmethod
    def generate_default_username(wallet_address: str) -> str:
        """生成默认用户名（钱包地址后8位）
        
        Args:
            wallet_address: 钱包地址
            
        Returns:
            str: 默认用户名
        """
        return wallet_address[-8:]

    async def update_token(self, access_token: str, expires_at: datetime) -> None:
        """更新用户的访问令牌
        
        Args:
            access_token: 新的访问令牌
            expires_at: 令牌过期时间
        """
        self.paw_access_token = access_token
        self.token_expires_at = expires_at
        self.last_login = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        await self.save()

    async def update_username(self, new_username: str) -> None:
        """更新用户名
        
        Args:
            new_username: 新的用户名
        """
        self.username = new_username
        self.updated_at = datetime.utcnow()
        await self.save()

    async def logout(self) -> None:
        """用户退出登录，使当前令牌失效"""
        self.paw_access_token = None
        self.token_expires_at = None
        self.updated_at = datetime.utcnow()
        await self.save() 