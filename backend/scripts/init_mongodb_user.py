#!/usr/bin/env python3
import sys
from pathlib import Path
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure

# 添加backend目录到Python路径
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from config.settings import settings

async def init_mongodb_users():
    """初始化MongoDB用户"""
    print("开始初始化MongoDB用户...")
    
    try:
        # 连接MongoDB（不使用认证）
        client = AsyncIOMotorClient(f"mongodb://{settings.MONGODB_HOST}:{settings.MONGODB_PORT}")
        
        # 在admin数据库创建root用户
        admin_db = client.admin
        try:
            await admin_db.command(
                "createUser",
                {
                    "user": "admin",
                    "pwd": "admin_password",  # 请修改为安全的密码
                    "roles": [{"role": "root", "db": "admin"}]
                }
            )
            print("创建admin用户成功")
        except OperationFailure as e:
            if e.code == 51003:  # 用户已存在
                print("admin用户已存在")
            else:
                raise
        
        # 在应用数据库创建应用用户
        app_db = client[settings.MONGODB_DB]
        try:
            await app_db.command(
                "createUser",
                {
                    "user": settings.MONGODB_USER,
                    "pwd": settings.MONGODB_PASSWORD,
                    "roles": [
                        {"role": "readWrite", "db": settings.MONGODB_DB}
                    ]
                }
            )
            print(f"创建应用用户 {settings.MONGODB_USER} 成功")
        except OperationFailure as e:
            if e.code == 51003:  # 用户已存在
                print(f"应用用户 {settings.MONGODB_USER} 已存在")
            else:
                raise
                
        print("MongoDB用户初始化完成")
        print("\n接下来需要：")
        print("1. 修改 /etc/mongod.conf，启用认证：")
        print("security:")
        print("  authorization: enabled")
        print("\n2. 重启 MongoDB 服务：")
        print("sudo systemctl restart mongod")
        
    except Exception as e:
        print(f"初始化MongoDB用户失败: {str(e)}")
        raise
    finally:
        await client.close()

def main():
    """主函数"""
    asyncio.run(init_mongodb_users())

if __name__ == "__main__":
    main() 