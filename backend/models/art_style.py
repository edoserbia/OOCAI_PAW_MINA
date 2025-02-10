from datetime import datetime
from typing import Optional
from beanie import Document, Indexed

class ArtStyle(Document):
    """艺术风格模型
    用于存储角色和背景的艺术风格类型
    """
    name: Indexed(str, unique=True)  # 风格名称
    image: str  # 风格示例图片URL
    keyword: str  # 生成图片时使用的关键词
    status: str = "active"  # 状态：active/inactive
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "art_styles"  # 集合名称
        
    class Config:
        schema_extra = {
            "example": {
                "name": "Heavy Impasto",
                "image": "https://example.com/image.png",
                "keyword": "Heavy Impasto",
                "status": "active"
            }
        } 