from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from config.settings import settings
from config.mongodb import connect_to_mongo, close_mongo_connection
from models.user import User
from models.conversation_message import ConversationMessage
from models.conversation import Conversation
from models.story import Story
from models.character import Character
from models.story_template import StoryTemplate
from models.other_agent import OtherAgent
from models.llm import LLM
from models.prompt_template import PromptTemplate
from models.art_style import ArtStyle
from models.language import Language
from models.character_system_prompt_post import CharacterSystemPromptPost
from models.music import Music

from routes import (
    auth,
    llm,
    ai,
    prompt_templates,
    character_avatar,
    images,
    art_styles,
    character_system_prompt_posts,
    languages,
    characters,
    story_templates,
    music,
    story,
    story_chat,
    conversation
)

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["认证"])
app.include_router(images.router, prefix=settings.API_V1_PREFIX)
app.include_router(llm.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(art_styles.router, prefix=settings.API_V1_PREFIX, tags=["艺术风格"])
app.include_router(character_system_prompt_posts.router, prefix=settings.API_V1_PREFIX, tags=["角色系统提示词补充"])
app.include_router(languages.router, prefix=settings.API_V1_PREFIX, tags=["语言"])
app.include_router(prompt_templates.router, prefix=settings.API_V1_PREFIX)
app.include_router(character_avatar.router, prefix=settings.API_V1_PREFIX)
app.include_router(characters.router, prefix=settings.API_V1_PREFIX, tags=["characters"])
app.include_router(story_templates.router, prefix=settings.API_V1_PREFIX, tags=["story-templates"])
app.include_router(music.router, prefix=settings.API_V1_PREFIX, tags=["music"])
app.include_router(story.router, prefix=settings.API_V1_PREFIX, tags=["story"])
app.include_router(story_chat.router, prefix=settings.API_V1_PREFIX, tags=["story_chat"])
app.include_router(conversation.router, prefix=settings.API_V1_PREFIX, tags=["conversation"])

@app.on_event("startup")
async def startup_event():
    """启动事件处理"""
    # 连接MongoDB
    await connect_to_mongo()
    
    # 初始化Beanie
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.MONGODB_DB],
        document_models=[
            User,
            ConversationMessage,
            Conversation,
            Story,
            Character,
            StoryTemplate,
            OtherAgent,
            LLM,
            PromptTemplate,
            ArtStyle,
            Language,
            CharacterSystemPromptPost,
            Music
        ]
    )

@app.on_event("shutdown")
async def shutdown_event():
    """关闭事件处理"""
    await close_mongo_connection()

@app.get("/")
async def root():
    """根路由"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/api/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.DEBUG
    ) 