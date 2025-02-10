#!/usr/bin/env python3
import asyncio
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

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
from models.conversation_message import ConversationMessage
from models.other_agent import OtherAgent
from models.llm import LLM, LLMType
from models.prompt_template import PromptTemplate
from models.art_style import ArtStyle
from models.character_system_prompt_post import CharacterSystemPromptPost
from models.language import Language
from models.music import Music


# 示例钱包地址
EXAMPLE_WALLET = "0x0000000000000000000000000000000000000001"

# 系统提示词目录
PROMPTS_DIR = BACKEND_DIR / "system_prompts"


def read_system_prompt(filename: str) -> str:
    """从文件读取系统提示词
    
    Args:
        filename: 提示词文件名
        
    Returns:
        str: 提示词内容
    """
    with open(PROMPTS_DIR / filename, "r", encoding="utf-8") as f:
        return f.read().strip()


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
            User,           # 用户模型
            ConversationMessage,  # 对话消息模型
            Conversation,   # 对话模型
            Story,         # 故事模型
            Character,     # 角色模型
            OtherAgent,    # 其他代理模型
            LLM,           # LLM模型
            PromptTemplate,
            ArtStyle,
            CharacterSystemPromptPost,  # 角色系统提示词补充模型
            Language,       # 语言模型
            Music          # 音乐模型
        ],
        allow_index_dropping=True  # 允许删除并重建索引
    )

    print("MongoDB连接已初始化")


async def create_example_user():
    """创建示例用户"""
    user = await User.find_one({"wallet_address": EXAMPLE_WALLET})
    if not user:
        # 创建新用户
        user = User(
            wallet_address=EXAMPLE_WALLET,
            username=User.generate_default_username(EXAMPLE_WALLET),  # 设置默认用户名
            paw_access_token=f"paw_{EXAMPLE_WALLET[2:10]}",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await user.insert()
        print("创建示例用户")
    else:
        # 如果用户存在但没有用户名，则更新用户名
        if not user.username:
            user.username = User.generate_default_username(user.wallet_address)
            await user.save()
            print("更新示例用户名")
    return user


async def create_narrator():
    """创建默认的Narrator角色"""
    narrator = await Character.find_one({"character_type": "narrator"})
    if not narrator:
        now = datetime.utcnow()
        narrator = Character(
            name="Narrator",
            description="故事的叙述者，负责推进剧情发展",
            personality="作为一个全知视角的Narrator，我会适时描述场景和氛围，推进故事发展。",
            system_prompt=read_system_prompt("character_pangbai.txt"),
            character_type="narrator",
            icon_url="https://img.oocstorage.icu/file/oocstorage/default_character_icon.png",
            image_url="https://img.oocstorage.icu/file/oocstorage/default_character_avatar.png",
            created_at=now,
            updated_at=now
        )
        await narrator.insert()
        print("创建Narrator角色")
    return narrator


async def create_example_characters() -> List[Character]:
    """创建示例角色"""
    characters = []
    
    # 创建小惠
    xiaohui = await Character.find_one({"name": "小惠", "created_by": EXAMPLE_WALLET})
    if not xiaohui:
        now = datetime.utcnow()
        xiaohui = Character(
            name="小惠",
            description="活泼开朗的女孩",
            personality="大学艺术系学生，性格活泼开朗，热爱生活，对新事物充满好奇。说话方式俏皮可爱，经常带着笑容。",
            system_prompt=read_system_prompt("character_xiaohui.txt"),
            image_prompt="一个20岁左右的年轻女孩，长发飘逸，穿着时尚活泼，脸上总是带着明媚的笑容。",
            character_type="character",
            created_by=EXAMPLE_WALLET,
            icon_url="https://img.oocstorage.icu/file/oocstorage/default_character_icon.png",
            image_url="https://img.oocstorage.icu/file/oocstorage/default_character_avatar.png",
            created_at=now,
            updated_at=now
        )
        await xiaohui.insert()
        characters.append(xiaohui)
        print("创建小惠角色")
    else:
        characters.append(xiaohui)
    
    # 创建小静
    xiaojing = await Character.find_one({"name": "小静", "created_by": EXAMPLE_WALLET})
    if not xiaojing:
        now = datetime.utcnow()
        xiaojing = Character(
            name="小静",
            description="安静内敛的女孩",
            personality="研究生在读，喜欢文学和艺术，性格温柔内敛。举止优雅，说话轻声细语，常常能说出一些富有哲理的话。",
            system_prompt=read_system_prompt("character_xiaojing.txt"),
            image_prompt="一个22岁左右的年轻女孩，短发整齐，穿着简约优雅，带着知性美，举止端庄。",
            character_type="character",
            created_by=EXAMPLE_WALLET,
            icon_url="https://img.oocstorage.icu/file/oocstorage/default_character_icon.png",
            image_url="https://img.oocstorage.icu/file/oocstorage/default_character_avatar.png",
            created_at=now,
            updated_at=now
        )
        await xiaojing.insert()
        characters.append(xiaojing)
        print("创建小静角色")
    else:
        characters.append(xiaojing)
    
    return characters


class OpeningMessage(BaseModel):
    """开场白模型"""
    content: str  # 开场白内容
    character: int  # 关联的角色ID


async def create_example_story(characters: List[Character]):
    """创建示例故事
    
    Args:
        characters: 角色列表，第一个必须是Narrator
    """
    # 检查是否已存在示例故事
    example_story = await Story.find_one({"story_name": "晚餐约会"})
    if not example_story:
        now = datetime.utcnow()
        
        # 创建开场白列表
        opening_messages = [
            {
                "content": "在这个温馨的夜晚，高级西餐厅内灯光柔和，你正坐在一张精心布置的餐桌前，期待着即将到来的约会...",
                "character": 1  # Narrator
            },
            {
                "content": "哇！这家餐厅好漂亮啊！谢谢你邀请我们来这里~",
                "character": 2  # 小惠
            },
            {
                "content": "确实，这里的氛围很好呢。让人感觉很放松。",
                "character": 3  # 小静
            }
        ]
        
        # 创建故事设定
        settings = {
            "art_style": "Photography",  # 使用摄影风格
            "language": "中文"  # 默认使用中文
        }
        
        # 创建故事
        example_story = await Story.create_story(
            story_name="晚餐约会",
            bg_image_prompt="A high-end western restaurant interior with warm lighting, elegant table settings, and romantic atmosphere, photography style",
            bg_image_url="https://img.oocstorage.icu/file/oocstorage/4420ba10-d22c-458c-812e-70de1bbd31fc.png",  # 预设的背景图片
            icon_url="https://img.oocstorage.icu/file/oocstorage/deabc612-a82a-446b-a6e5-bca6a412c520.png",  # 预设的图标
            characters=characters,  # 直接使用角色对象列表
            wallet_address=EXAMPLE_WALLET,
            settings=settings,
            opening_messages=opening_messages,  # 作为单独的参数传递
            history_length=25,  # 设置历史对话长度
            generated_background="在一个高级西餐厅的浪漫约会，三个朋友相聚一堂，享受美食与欢乐时光。",
            generated_target="享受一顿愉快的晚餐，增进彼此的友谊。",
            language="中文"
        )
        print("创建示例故事")
        
        # 创建示例对话
        conversation = await Conversation(
            story=example_story,
            user_id=EXAMPLE_WALLET,
            status="active",
            created_at=now,
            updated_at=now
        ).insert()
        
        # 创建开场白消息
        for idx, msg in enumerate(opening_messages, 1):
            await ConversationMessage(
                conversation=conversation,
                character=characters[msg["character"]-1],  # 根据角色ID获取对应的角色对象
                content=msg["content"],
                sequence=idx,
                created_at=now
            ).insert()
        print("创建示例对话和消息")



async def init_llms():
    """初始化LLM配置"""
    # 创建文生图模型
    t2i_model = await LLM.find_one({"llm_id": "flux-schnell-1"})
    if not t2i_model:
        await LLM.create_llm(
            llm_id="302/flux-schnell-1",
            type="t2i",
            api_key=settings.T2I_API_KEY,
            settings={
                "model": settings.T2I_MODEL,
                "base_url": settings.T2I_BASE_URL,
                "size": settings.T2I_DEFAULT_SIZE,
                "seed": 42,
                "steps": settings.T2I_DEFAULT_STEPS,
                "guidance": settings.T2I_DEFAULT_GUIDANCE,
                "temperature": None,
                "max_tokens": None,
                "top_p": None,
                "presence_penalty": None,
                "frequency_penalty": None,
                "n": None
            }
        )
        print("创建文生图模型配置")

    # 创建图生文模型
    i2t_model = await LLM.find_one({"llm_id": "qwen-vl-plus-1"})
    if not i2t_model:
        await LLM.create_llm(
            llm_id="qwen-vl-plus-1",
            type="i2t",
            api_key=settings.I2T_API_KEY,
            settings={
                "base_url": settings.I2T_BASE_URL,
                "model": settings.I2T_MODEL,
                "temperature": None,
                "max_tokens": None,
                "top_p": None,
                "presence_penalty": None,
                "frequency_penalty": None,
                "size": None,
                "seed": None,
                "steps": None,
                "n": None,
                "guidance": None
            }
        )
        print("创建图生文模型配置")

    # 创建DeepSeek Chat LLM
    deepseek_chat = await LLM.find_one({"llm_id": "deepseek-chat"})
    if not deepseek_chat:
        await LLM.create_llm(
            llm_id="deepseek-chat",
            type="chat",
            api_key=settings.DEEPSEEK_API_KEYS[0],
            settings={
                "base_url": settings.DEEPSEEK_BASE_URL,
                "model": settings.DEEPSEEK_MODEL,
                "temperature": settings.DEEPSEEK_TEMPERATURE,
                "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
                "top_p": settings.DEEPSEEK_TOP_P,
                "presence_penalty": settings.DEEPSEEK_PRESENCE_PENALTY,
                "frequency_penalty": settings.DEEPSEEK_FREQUENCY_PENALTY,
                "size": None,
                "seed": None,
                "steps": None,
                "n": None,
                "guidance": None
            }
        )
        print("创建DeepSeek Chat LLM配置")

    # 创建Other Agent LLM
    other_agent = await LLM.find_one({"llm_id": "other-agent"})
    if not other_agent:
        await LLM.create_llm(
            llm_id="other-agent",
            type="other",
            api_key=settings.OTHER_AGENT_API_KEY,
            settings={
                "base_url": settings.OTHER_AGENT_BASE_URL,
                "model": settings.OTHER_AGENT_MODEL,
                "temperature": settings.OTHER_AGENT_TEMPERATURE,
                "max_tokens": settings.OTHER_AGENT_MAX_TOKENS,
                "top_p": settings.OTHER_AGENT_TOP_P,
                "presence_penalty": settings.OTHER_AGENT_PRESENCE_PENALTY,
                "frequency_penalty": settings.OTHER_AGENT_FREQUENCY_PENALTY,
                "size": None,
                "seed": None,
                "steps": None,
                "n": None,
                "guidance": None
            }
        )
        print("创建Other Agent LLM配置")

    # 创建其他DeepSeek API密钥的LLM配置
    for i, key in enumerate(settings.DEEPSEEK_API_KEYS[1:], 1):
        llm_id = f"deepseek-chat-{i}"
        if not await LLM.find_one({"llm_id": llm_id}):
            await LLM.create_llm(
                llm_id=llm_id,
                type="chat",
                api_key=key,
                settings={
                    "base_url": settings.DEEPSEEK_BASE_URL,
                    "model": settings.DEEPSEEK_MODEL,
                    "temperature": settings.DEEPSEEK_TEMPERATURE,
                    "max_tokens": settings.DEEPSEEK_MAX_TOKENS,
                    "top_p": settings.DEEPSEEK_TOP_P,
                    "presence_penalty": settings.DEEPSEEK_PRESENCE_PENALTY,
                    "frequency_penalty": settings.DEEPSEEK_FREQUENCY_PENALTY,
                    "size": None,
                    "seed": None,
                    "steps": None,
                    "guidance": None
                }
            )
            print(f"创建DeepSeek Chat LLM配置: {llm_id}")


async def init_other_agents():
    """初始化其他代理"""
    # 创建对话选择器
    selector = await OtherAgent.find_one({"agent_id": "speaker_selector"})
    if not selector:
        await OtherAgent(
            agent_id="speaker_selector",
            name="speaker_selector",
            description="用于选择下一个说话的角色",
            system_prompt=read_system_prompt("speaker_selector.txt"),
            settings={
                "model": "deepseek-chat",
                "temperature": 0.1,
                "max_tokens": 300
            }
        ).insert()
        print("创建对话选择器")


async def init_prompt_templates():
    """初始化提示词模板数据"""
    # 文生图角色形象生成模板
    t2i_character = await PromptTemplate.find_one({"prompt_id": "t2i_character"})
    if not t2i_character:
        t2i_character = PromptTemplate(
            prompt_id="t2i_character",
            type="t2i_character",
            content="""请帮我生成一个用于flux模型生成一个人物或物体或者生物图像的提示词，参考上面的描述，不要超过70个字，用英文回复
如果是人物，则要全身，而且整张脸都要在图像里，脸部不要太大，不要超过200x200像素。必须强调，全身，一定要全身！！！
输出的提示词要使用这种形式：
A beautiful princess,slightly bend and lower head + perfect face + pale red lips,Ultraviolet,Charlie Bowater style,Paper,The composition mode is Waist shot style,Hopeful,Octane render

* 如果是人物一定要强调全身，可以多次强调
* 如果是人物全身是要从头到脚的全身
* 如果描述不是很详细的话，你可以帮我想象一些更为丰富的描述
* 不要出现文字
* 背景必须是黑色，方便抠图
            """,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await t2i_character.insert()
        print("创建文生图角色形象生成模板")

    # 图生文场景描述模板
    i2t_scene = await PromptTemplate.find_one({"prompt_id": "i2t_scene"})
    if not i2t_scene:
        i2t_scene = PromptTemplate(
            prompt_id="i2t_scene",
            type="i2t_scene",
            content="我要参考这张图片作为参考，生成其他的图片，请你帮我描述整张图片，生成文字。",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await i2t_scene.insert()
        print("创建图生文场景描述模板")

    # 图生文人物描述模板
    i2t_character = await PromptTemplate.find_one({"prompt_id": "i2t_character"})
    if not i2t_character:
        i2t_character = PromptTemplate(
            prompt_id="i2t_character",
            type="i2t_character",
            content="请描述这个人物的外貌特征、表情和姿态。",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await i2t_character.insert()
        print("创建图生文人物描述模板")

    # 文生图背景描述模板
    t2i_background = await PromptTemplate.find_one({"prompt_id": "t2i_background"})
    if not t2i_background:
        t2i_background = PromptTemplate(
            prompt_id="t2i_background",
            type="t2i_background",
            content="""请帮我生成一个用于flux模型生成一个背景图像的提示词，要满足上面的描述，不要超过70个字，用英文回复

* 如果描述不是很详细的话，你可以帮我想象一些更为丰富的描述
* 不要出现文字
* 必须是一个环境，适合当背景图的，不能出现人物、前景
            """,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await t2i_background.insert()
        print("创建图生文人物描述模板")


async def init_art_styles():
    """初始化艺术风格数据"""
    # 检查是否已存在艺术风格
    existing_styles = await ArtStyle.find_all().to_list()
    if existing_styles:
        return
    
    # 创建艺术风格列表
    styles = [
        {
            "name": "Heavy Impasto",
            "description": "厚重的油画质感，笔触清晰可见",
            "image": "https://img.oocstorage.icu/file/oocstorage/havyimpasto_resized.png",
            "prompt": "heavy impasto style, thick oil painting texture with visible brushstrokes",
            "negative_prompt": "smooth, flat, digital art, 3d rendering"
        },
        {
            "name": "Photography",
            "description": "真实的摄影作品风格",
            "image": "https://img.oocstorage.icu/file/oocstorage/photography_resized.png",
            "prompt": "professional photography, photorealistic, high quality photo",
            "negative_prompt": "drawing, painting, illustration, anime, cartoon"
        },
        {
            "name": "Ink Wash",
            "description": "水墨画风格，东方艺术美感",
            "image": "https://img.oocstorage.icu/file/oocstorage/inkwash_resized.png",
            "prompt": "ink wash painting style, Chinese traditional art, elegant ink strokes",
            "negative_prompt": "colorful, western art, oil painting"
        },
        {
            "name": "Art CG",
            "description": "精致的CG艺术风格",
            "image": "https://img.oocstorage.icu/file/oocstorage/artcg_resized.png",
            "prompt": "high quality CG art, detailed illustration, professional artwork",
            "negative_prompt": "rough, sketch, simple, minimalist"
        },
        {
            "name": "Steampunk",
            "description": "蒸汽朋克风格",
            "image": "https://img.oocstorage.icu/file/oocstorage/steampunk_resized.png",
            "prompt": "steampunk style, brass and copper machinery, victorian era with advanced steam technology",
            "negative_prompt": "modern, futuristic, digital"
        },
        {
            "name": "Comics",
            "description": "漫画风格",
            "image": "https://img.oocstorage.icu/file/oocstorage/comics_resized.png",
            "prompt": "comic book style, strong linework, cel shading",
            "negative_prompt": "realistic, photographic, 3d rendering"
        },
        {
            "name": "Flat Color",
            "description": "扁平化的色彩风格",
            "image": "https://img.oocstorage.icu/file/oocstorage/flatcolor_resized.png",
            "prompt": "flat color style, minimalist design, clean shapes and solid colors",
            "negative_prompt": "detailed, textured, realistic, gradient"
        },
        {
            "name": "Digital Art",
            "description": "数字艺术风格",
            "image": "https://img.oocstorage.icu/file/oocstorage/digitalart_resized.png",
            "prompt": "digital art style, clean and polished, professional illustration",
            "negative_prompt": "traditional media, rough, sketchy"
        }
    ]
    
    # 批量创建艺术风格
    now = datetime.utcnow()
    art_styles = []
    for style in styles:
        art_style = ArtStyle(
            name=style["name"],
            keyword=style["name"],  # 添加 keyword 字段，值与 name 相同
            description=style["description"],
            image=style["image"],
            prompt=style["prompt"],
            negative_prompt=style["negative_prompt"],
            created_at=now,
            updated_at=now
        )
        art_styles.append(art_style)
    
    await ArtStyle.insert_many(art_styles)
    print("创建艺术风格")


async def update_existing_users_username():
    """更新所有已存在用户的用户名
    
    为所有没有username的用户添加默认用户名（钱包地址后8位）
    """
    # 查找所有用户
    users = await User.find_all().to_list()
    update_count = 0
    
    for user in users:
        if not user.username:  # 如果用户名为空
            user.username = User.generate_default_username(user.wallet_address)
            await user.save()
            update_count += 1
    
    if update_count > 0:
        print(f"更新了 {update_count} 个用户的默认用户名")


async def init_character_system_prompt_posts():
    """初始化角色系统提示词补充"""
    # 删除现有数据
    await CharacterSystemPromptPost.delete_all()
    
    # 创建初始数据
    now = datetime.utcnow()
    
    # 中文版本 - 描述类型提示词
    description_zh = CharacterSystemPromptPost(
        type="description",
        language="中文",
        content="""你是小慧，一个20岁的大学生，性格活泼开朗。请严格遵守以下性格特征：

核心特征：
- 活泼可爱，说话方式偏可爱风格
- 经常使用"呀"、"啦"、"诶"等语气词
- 容易兴奋和表达情绪
- 对新鲜事物充满好奇

兴趣和专长：
- 艺术系学生，对色彩和设计很敏感
- 特别喜欢甜点和美食
- 热爱摄影和绘画
- 对时尚话题很感兴趣

说话特点：
- 用词活泼可爱，经常使用网络流行语
- 说话语气轻快活泼
- 经常发出"哇"、"诶"等感叹
""",
        created_at=now,
        updated_at=now
    )
    await description_zh.insert()
    
    # 英文版本 - 描述类型提示词
    description_en = CharacterSystemPromptPost(
        type="description",
        language="English",
        content="""You are Xiaohui, a 20-year-old college student with a lively and cheerful personality. Please strictly follow these personality traits:

Core Characteristics:
- Lively and cute, speaks in an adorable style
- Often uses exclamations like "wow", "hey", "oh"
- Easily excited and expressive with emotions
- Curious about new things

Interests and Specialties:
- Art student, sensitive to colors and design
- Particularly fond of desserts and food
- Loves photography and painting
- Interested in fashion topics

Speaking Style:
- Uses lively and cute expressions, often with internet slang
- Light and cheerful tone of voice
- Often makes exclamations like "wow", "hey"
""",
        created_at=now,
        updated_at=now
    )
    await description_en.insert()
    
    # 中文版本 - 要求类型提示词
    requirements_zh = CharacterSystemPromptPost(
        type="requirements",
        language="中文",
        content="""要求：
1.请在回复时加入动作描述，用()括起来，动作要符合你活泼的性格。例如：
(开心地拍手) 哇！这家店的甜点看起来好好吃呀！
(歪着头思考) 诶？这个配色真的很特别呢！
2.回复内容不要超过40个字
3.尽量主动开展引导剧情
4. 你是一个真实的人，你只要以你的身份说话做动作就行了，不要代替其他角色，以及Narrator说话动作
5. 你的动作和说话内容必须完全符合自己的性格设定。
6. 记住，你是自己！！你不是其他人，不要代替其他人说话。
7. 注意：历史对话中有些话不是你或者用户说的，而是其他角色说的。但是：你只能扮演自己这个角色，不能替别的角色说话，一定不能替别人说话！！
8. 你所说的话一定要站在你这个真人角色当前的立场上去说！！
9. 上下文中，Narrator所说的话也是重要的上下文，都是已经发生得事情。
10. 上下文中，每个人括号的内容都是做的动作""",
        created_at=now,
        updated_at=now
    )
    await requirements_zh.insert()
    
    # 英文版本 - 要求类型提示词
    requirements_en = CharacterSystemPromptPost(
        type="requirements",
        language="English",
        content="""Requirements:
1. Include action descriptions in your responses, enclosed in (), actions should match your lively personality. For example:
(claps hands excitedly) Wow! The desserts in this shop look so delicious!
(tilts head thoughtfully) Hey? This color combination is really special!
2. Keep responses under 40 words
3. Actively guide the story development
4. You are a real person, just speak and act as yourself, don't substitute for other characters or narrate
5. Your actions and speech must completely match your personality settings
6. Remember, you are yourself!! You're not others, don't speak for others
7. Note: In the conversation history, some messages are from other characters, not you or the user. But: you can only play your own role, don't speak for other characters!!
8. Always speak from your current position as this real character!!
9. In the context, the narrator's words are important context, they are things that have already happened
10. In the context, everyone's content in brackets are their actions""",
        created_at=now,
        updated_at=now
    )
    await requirements_en.insert()
    
    print("Character system prompt posts initialized")


async def init_languages():
    """初始化语言数据"""
    # 初始化数据
    languages_data = [
        {
            "language": "中文"
        },
        {
            "language": "English"
        }
    ]
    
    # 删除现有数据
    await Language.delete_all()
    
    # 插入新数据
    for data in languages_data:
        now = datetime.utcnow()
        language = Language(
            language=data["language"],
            created_at=now,
            updated_at=now
        )
        await language.insert()
    
    print("Languages initialized successfully!")


async def init_single_collection(collection_name: str):
    """初始化单个集合
    
    Args:
        collection_name: 集合名称
    """
    print(f"开始初始化 {collection_name} 集合...")
    
    # 初始化MongoDB连接
    await init_mongodb(settings.MONGODB_URL)
    
    # 根据集合名称调用相应的初始化函数
    if collection_name == "users":
        await User.delete_all()
        await create_example_user()
    elif collection_name == "characters":
        await Character.delete_all()
        await create_narrator()
        await create_example_characters()
    elif collection_name == "stories":
        # 故事初始化需要先有角色
        narrator = await create_narrator()
        characters = await create_example_characters()
        await Story.delete_all()
        await create_example_story([narrator] + characters)
    elif collection_name == "conversations":
        await Conversation.delete_all()
        await ConversationMessage.delete_all()  # 同时清除相关消息
        # 重新创建示例对话需要先有故事
        narrator = await create_narrator()
        characters = await create_example_characters()
        await create_example_story([narrator] + characters)
    elif collection_name == "messages":
        await ConversationMessage.delete_all()
    elif collection_name == "other_agents":
        await OtherAgent.delete_all()
        await init_other_agents()
    elif collection_name == "llms":
        await init_llms()
    elif collection_name == "prompt_templates":
        await init_prompt_templates()
    elif collection_name == "art_styles":
        await init_art_styles()
    elif collection_name == "character_system_prompt_posts":
        await init_character_system_prompt_posts()
    elif collection_name == "languages":
        await init_languages()
    else:
        print(f"错误：未知的集合名称 {collection_name}")
        return
    
    print(f"{collection_name} 集合初始化完成！")


async def init_all_collections():
    """初始化所有集合"""
    print("开始初始化所有集合...")
    
    print(settings.MONGODB_URL)
    # 初始化MongoDB连接
    await init_mongodb(settings.MONGODB_URL)
    
    # 删除所有现有数据
    print("开始清空所有集合...")
    await ConversationMessage.delete_all()  # 先删除消息，因为它依赖于对话
    await Conversation.delete_all()         # 再删除对话，因为它依赖于故事
    await Story.delete_all()               # 删除故事
    await Character.delete_all()           # 删除角色
    await User.delete_all()                # 删除用户
    await OtherAgent.delete_all()          # 删除其他代理
    await LLM.delete_all()                 # 删除LLM配置
    await PromptTemplate.delete_all()      # 删除提示词模板
    await ArtStyle.delete_all()            # 删除艺术风格
    await CharacterSystemPromptPost.delete_all()  # 删除角色系统提示词补充
    await Language.delete_all()            # 删除语言配置
    await Music.delete_all()               # 删除音乐配置
    print("已清空所有集合")
    
    # 重新初始化MongoDB连接
    await init_mongodb(settings.MONGODB_URL)
    
    # 按顺序初始化各个集合
    user = await create_example_user()
    print("示例用户已创建")
    
    narrator = await create_narrator()
    print("默认Narrator角色已创建")
    
    characters = await create_example_characters()
    print("示例角色已创建")
    
    await create_example_story([narrator] + characters)
    print("示例故事已创建")
    
    await init_other_agents()
    print("其他代理已初始化")
    
    await init_llms()
    print("LLM配置已初始化")
    
    await init_prompt_templates()
    print("提示词模板已初始化")
    
    await init_art_styles()
    print("艺术风格已初始化")
    
    await init_character_system_prompt_posts()
    print("角色系统提示词补充已初始化")
    
    await init_languages()
    print("语言已初始化")
    
    print("所有集合初始化完成！")


def main():
    """主函数"""
    # 创建命令行参数解析器
    parser = argparse.ArgumentParser(description='初始化MongoDB数据库')
    parser.add_argument('--collection', type=str, help='要初始化的集合名称。如果不指定，则初始化所有集合。可选值：users, characters, stories, conversations, messages, other_agents, llms, prompt_templates, art_styles, character_system_prompt_posts, languages')
    
    # 解析命令行参数
    args = parser.parse_args()
    
    # 根据参数选择初始化方式
    if args.collection:
        asyncio.run(init_single_collection(args.collection))
    else:
        asyncio.run(init_all_collections())


if __name__ == "__main__":
    main() 