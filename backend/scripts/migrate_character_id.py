#!/usr/bin/env python3
import asyncio
import os
import sys
from pathlib import Path

# 添加backend目录到Python路径
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import motor.motor_asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from config.settings import settings
from models.user import User
from models.character import Character
from models.story import Story
from models.conversation import Conversation
from models.message import Message


async def init_mongodb(mongodb_url: str):
    """初始化MongoDB连接和Beanie ODM
    
    Args:
        mongodb_url: MongoDB连接URL
    """
    # 创建数据库连接
    client = AsyncIOMotorClient(mongodb_url)
    
    # 从URL中获取数据库名称，如果没有则使用默认值
    db_name = client.get_database().name or settings.MONGODB_DB
    
    # 初始化Beanie，注册所有模型
    await init_beanie(
        database=client[db_name],
        document_models=[
            User,
            Message,
            Conversation,
            Story,
            Character
        ]
    )

    print("MongoDB连接已初始化")


async def migrate_characters():
    """迁移角色数据，移除character_id字段"""
    # 获取所有角色
    characters = await Character.find_all().to_list()
    
    # 创建角色ID到对象ID的映射
    character_map = {char.character_id: char for char in characters}
    
    # 更新故事中的角色引用
    stories = await Story.find_all().to_list()
    for story in stories:
        story.characters = [character_map[char_id] for char_id in story.characters]
        await story.save()
    print(f"已更新 {len(stories)} 个故事的角色引用")
    
    # 更新消息中的角色引用
    messages = await Message.find_all().to_list()
    for message in messages:
        if message.character_id:
            message.character = character_map[message.character_id]
            message.character_id = None
            await message.save()
    print(f"已更新 {len(messages)} 条消息的角色引用")


async def main():
    """主函数"""
    # 初始化数据库连接
    await init_mongodb(settings.MONGODB_URL)
    
    # 执行迁移
    await migrate_characters()
    
    print("数据迁移完成")


if __name__ == "__main__":
    asyncio.run(main()) 