from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .settings import settings

# 创建全局数据库客户端
client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None

async def get_database() -> AsyncIOMotorDatabase:
    """获取数据库连接
    
    Returns:
        AsyncIOMotorDatabase: MongoDB数据库连接
    """
    return db

async def close_mongo_connection():
    """关闭MongoDB连接"""
    if client:
        client.close()

async def connect_to_mongo():
    """连接到MongoDB"""
    global client, db
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.MONGODB_DB]
        # 测试连接
        await client.admin.command('ping')
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e 