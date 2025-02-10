import asyncio
import os
import sys
import motor.motor_asyncio
from beanie import init_beanie

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.user import User
from config.settings import settings

async def update_wallet_types():
    """更新现有用户的钱包类型
    
    为所有现有用户添加 wallet_type 字段，默认设置为 'ethereum'
    """
    # 连接数据库
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    
    # 初始化 beanie
    await init_beanie(
        database=client.get_default_database(),
        document_models=[User]
    )
    
    # 使用原生MongoDB查询来查找所有用户
    db = client.get_default_database()
    users_collection = db.get_collection("users")
    
    # 查找所有没有wallet_type字段或wallet_type为null的用户
    cursor = users_collection.find({
        "$or": [
            {"wallet_type": {"$exists": False}},
            {"wallet_type": None}
        ]
    })
    
    updated_count = 0
    print("开始更新用户钱包类型...")
    
    async for user_doc in cursor:
        # 更新用户文档
        result = await users_collection.update_one(
            {"_id": user_doc["_id"]},
            {"$set": {"wallet_type": "ethereum"}}
        )
        if result.modified_count > 0:
            updated_count += 1
            print(f"已更新用户 {user_doc.get('wallet_address', 'Unknown')}")
    
    print(f"\n更新完成！共更新了 {updated_count} 个用户")

if __name__ == "__main__":
    asyncio.run(update_wallet_types()) 