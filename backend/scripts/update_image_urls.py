#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path

# 添加backend目录到Python路径
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from config.settings import settings
from models.character import Character
from models.story import Story
from models.art_style import ArtStyle
from models.user import User
from models.conversation import Conversation
from models.conversation_message import ConversationMessage
from models.other_agent import OtherAgent
from models.llm import LLM
from models.prompt_template import PromptTemplate
from models.character_system_prompt_post import CharacterSystemPromptPost
from models.language import Language
from models.music import Music

# 原七牛云域名和新的B2存储域名
OLD_BASE_URL = "http://spin8vphz.hd-bkt.clouddn.com"
NEW_BASE_URL = "https://img.oocstorage.icu/file/oocstorage"

async def init_mongodb():
    """初始化MongoDB连接"""
    # 创建数据库连接
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    # 初始化Beanie，注册所有模型
    await init_beanie(
        database=client[settings.MONGODB_DB],
        document_models=[
            User,
            Character,
            Story,
            Conversation,
            ConversationMessage,
            OtherAgent,
            LLM,
            PromptTemplate,
            ArtStyle,
            CharacterSystemPromptPost,
            Language,
            Music
        ]
    )
    print("MongoDB连接已初始化")

async def update_character_urls():
    """更新角色图片URL"""
    characters = await Character.find_all().to_list()
    update_count = 0
    
    for character in characters:
        updated = False
        if character.icon_url and OLD_BASE_URL in character.icon_url:
            character.icon_url = character.icon_url.replace(OLD_BASE_URL, NEW_BASE_URL)
            updated = True
        
        if character.image_url and OLD_BASE_URL in character.image_url:
            character.image_url = character.image_url.replace(OLD_BASE_URL, NEW_BASE_URL)
            updated = True
        
        if updated:
            await character.save()
            update_count += 1
    
    print(f"已更新 {update_count} 个角色的图片URL")

async def update_story_urls():
    """更新故事图片URL"""
    stories = await Story.find_all().to_list()
    update_count = 0
    
    for story in stories:
        updated = False
        if story.bg_image_url and OLD_BASE_URL in story.bg_image_url:
            story.bg_image_url = story.bg_image_url.replace(OLD_BASE_URL, NEW_BASE_URL)
            updated = True
        
        if story.icon_url and OLD_BASE_URL in story.icon_url:
            story.icon_url = story.icon_url.replace(OLD_BASE_URL, NEW_BASE_URL)
            updated = True
        
        if updated:
            await story.save()
            update_count += 1
    
    print(f"已更新 {update_count} 个故事的图片URL")

async def update_art_style_urls():
    """更新艺术风格图片URL"""
    art_styles = await ArtStyle.find_all().to_list()
    update_count = 0
    
    for art_style in art_styles:
        if art_style.image and OLD_BASE_URL in art_style.image:
            art_style.image = art_style.image.replace(OLD_BASE_URL, NEW_BASE_URL)
            await art_style.save()
            update_count += 1
    
    print(f"已更新 {update_count} 个艺术风格的图片URL")

async def main():
    """主函数"""
    print("开始更新数据库中的图片URL...")
    
    # 初始化MongoDB连接
    await init_mongodb()
    
    # 更新各个集合中的图片URL
    await update_character_urls()
    await update_story_urls()
    await update_art_style_urls()
    
    print("所有图片URL更新完成！")

if __name__ == "__main__":
    asyncio.run(main()) 