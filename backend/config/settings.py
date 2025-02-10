from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """应用配置类
    
    所有配置项都从环境变量中读取，使用pydantic进行类型验证
    """
    # MongoDB配置
    MONGODB_HOST: str = "localhost"
    MONGODB_PORT: int = 27017
    MONGODB_USER: str = "mac_user"
    MONGODB_PASSWORD: str = "mac_password"
    MONGODB_DB: str = "multi_agent_chat"

    @property
    def MONGODB_URL(self) -> str:
        """构建MongoDB连接URL
        使用admin数据库进行认证，然后访问应用数据库
        """
        if self.MONGODB_USER and self.MONGODB_PASSWORD:
            return f"mongodb://{self.MONGODB_USER}:{self.MONGODB_PASSWORD}@{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DB}?authSource=admin"
        return f"mongodb://{self.MONGODB_HOST}:{self.MONGODB_PORT}/{self.MONGODB_DB}"

    # DeepSeek API配置
    DEEPSEEK_API_KEYS: List[str] = ["sk-db694a6d237d41abae4ee52a16627dba"]
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_TEMPERATURE: float = 1.5
    DEEPSEEK_MAX_TOKENS: int = 2000
    DEEPSEEK_TOP_P: float = 0.9
    DEEPSEEK_PRESENCE_PENALTY: float = 0.6
    DEEPSEEK_FREQUENCY_PENALTY: float = 0.6

    # Other Agents LLM配置
    OTHER_AGENT_MODEL: str = "deepseek-chat"
    OTHER_AGENT_API_KEY: str = "sk-db694a6d237d41abae4ee52a16627dba"
    OTHER_AGENT_BASE_URL: str = "https://api.deepseek.com/v1"
    OTHER_AGENT_TEMPERATURE: float = 0.1
    OTHER_AGENT_MAX_TOKENS: int = 500
    OTHER_AGENT_TOP_P: float = 0.9
    OTHER_AGENT_PRESENCE_PENALTY: float = 0.1
    OTHER_AGENT_FREQUENCY_PENALTY: float = 0.1

    # 应用配置
    APP_NAME: str = "PAW"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # 安全配置
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24小时

    # Web3配置
    WEB3_PROVIDER_URL: str = "https://eth-mainnet.g.alchemy.com/v2/your-api-key"
    CHAIN_ID: int = 1  # 以太坊主网

    # 缓存配置
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS配置
    CORS_ORIGINS: List[str] = ["*"]

    # 对话配置
    DEFAULT_HISTORY_LENGTH: int = 5
    DEFAULT_SUMMARY_LENGTH: int = 200

    # 限流配置
    RATE_LIMIT_PER_MINUTE: int = 100

    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # 故事对话 LLM 配置
    DASHSCOPE_API_KEY: Optional[str] = Field(default="")
    DASHSCOPE_BASE_URL: Optional[str] = Field(default="")
    DASHSCOPE_MODEL: Optional[str] = Field(default="")

    # 图片存储配置
    IMAGE_STORAGE_PATH: str = "./static/images"
    BACKEND_BASE_URL: str = "http://localhost:8000/images"

    # 阿里云文生图配置
    T2I_MODEL: Optional[str] = Field(default="flux-schnell")
    T2I_API_KEY: Optional[str] = Field(default="sk-5ef04f9bc6554a409a73d2874213e0f9")
    T2I_BASE_URL: Optional[str] = Field(default="https://api.302.ai")
    T2I_DEFAULT_SIZE: str = "512*1024"
    T2I_DEFAULT_STEPS: int = 4
    T2I_DEFAULT_GUIDANCE: float = 3.5

    # 阿里云图生文配置
    I2T_MODEL: Optional[str] = Field(default="qwen-vl-plus")
    I2T_API_KEY: Optional[str] = Field(default="sk-5ef04f9bc6554a409a73d2874213e0f9")
    I2T_BASE_URL: Optional[str] = Field(default="https://dashscope.aliyuncs.com/compatible-mode/v1")

    # B2存储配置
    B2_KEY_ID: str = Field(default="00429b305193cd50000000002", description="Backblaze B2 Key ID")
    B2_APPLICATION_KEY: str = Field(default="K004pLL63MAiwM/sn3I5rVkbt9SOzT0", description="Backblaze B2 Application Key")
    B2_ENDPOINT_URL: str = Field(default="s3.us-west-004.backblazeb2.com", description="Backblaze B2 Endpoint URL")
    B2_BUCKET_NAME: str = Field(default="oocsorage", description="Backblaze B2 Bucket Name")
    B2_CDN_URL: str = Field(default="https://img.oocstorage.icu/file/oocstorage", description="Backblaze B2 CDN URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def get_deepseek_api_keys(self) -> List[str]:
        """获取DeepSeek API密钥列表
        
        将环境变量中的逗号分隔字符串转换为列表
        """
        if isinstance(self.DEEPSEEK_API_KEYS, str):
            return [key.strip() for key in self.DEEPSEEK_API_KEYS.split(",") if key.strip()]
        return self.DEEPSEEK_API_KEYS


# 创建全局配置对象
settings = Settings()