from typing import List, Optional, Dict, Any
import traceback
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from models.story import Story, OpeningMessage
from models.character import Character
from models.music import Music
from models.llm import LLM
from models.user import User
from utils.auth import get_current_user
from routes.llm import ChatCompletionRequest, chat_completion
from config.mongodb import get_database
from bson import ObjectId

router = APIRouter()

class PublishStoryRequest(BaseModel):
    """发布故事请求模型"""
    template_id: str = Field(..., description="故事模板ID")
    template_content: str = Field(..., description="模板内容（每个Component的文本项名称+换行+填入文本内容+换行换行）")
    characters: List[str] = Field(..., description="选择的角色ID列表（MongoDB ObjectId字符串）")
    background_music_id: Optional[str] = Field(None, description="选择的背景音乐ID")
    bg_image_url: str = Field(..., description="生成的背景图片URL")
    story_name: str = Field(..., description="故事名称")
    opening_messages: List[OpeningMessage] = Field(default_factory=list, description="开场白列表")
    settings: dict = Field(..., description="所有components的前端代码和用户选择信息")
    language: str = Field(..., description="浏览器语言")

    class Config:
        json_schema_extra = {
            "example": {
                "template_id": "free-creation",
                "template_content": "Title: My Story\nContent: Once upon a time...\n\n",
                "characters": ["67756a67e021c3660f294629", "67756a67e021c3660f29462a"],  # Narrator和小惠
                "background_music_id": "67826549efec43a02d951b61",  # Upbeat Pop
                "bg_image_url": "http://example.com/image.jpg",
                "story_name": "My Adventure",
                "opening_messages": [
                    {
                        "content": "Hello everyone!",
                        "character": "67756a67e021c3660f294629"  # Narrator的ID
                    }
                ],
                "settings": {
                    "components": "..."
                },
                "language": "en"
            }
        }

class PublishStoryResponse(BaseModel):
    """发布故事响应模型"""
    id: str = Field(..., description="创建的故事ID")

class GetStoriesResponse(BaseModel):
    """获取故事列表响应模型"""
    id: str = Field(..., description="故事ID")
    title: str = Field(..., description="故事名称")
    intro: str = Field(..., description="故事简介(generated_background)")
    messages: List[Dict[str, str]] = Field(default_factory=list, description="开场白列表，包含content和character_id")
    likes: str = Field(..., description="点赞数")
    rewards: str = Field(..., description="打赏数")
    background: str = Field(..., description="背景图片URL")
    date: Optional[str] = Field(None, description="创建时间")
    characters: int = Field(..., description="参与角色数量")
    avatar_url: Optional[str] = Field(None, description="第一个非Narrator角色的形象图片URL")
    characterIcons: List[str] = Field(default_factory=list, description="所有参与角色的icon_url列表(不包括Narrator)")
    characterDetails: List[Dict[str, Any]] = Field(default_factory=list, description="所有角色的详细信息，包含可选的image_url和icon_url")
    backgroundMusic: Optional[str] = Field(None, description="背景音乐URL")
    created_by: str = Field(..., description="创建者钱包地址")
    creator_name: str = Field(..., description="创建者用户名")
    comments_count: str = Field(..., description="评论数量")

@router.post("/story/publish", response_model=PublishStoryResponse)
async def publish_story(
    request: PublishStoryRequest,
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
) -> PublishStoryResponse:
    """发布故事
    
    Args:
        request: 发布故事请求
        current_user: 当前用户
        background_tasks: 后台任务
        
    Returns:
        PublishStoryResponse: 创建的故事ID
    """
    try:
        print("\n=== 开始处理发布故事请求 ===")
        print(f"用户: {current_user.wallet_address}")
        print(f"故事名称: {request.story_name}")
        print(f"模板ID: {request.template_id}")
        print(f"角色ID列表: {request.characters}")
        print(f"背景音乐ID: {request.background_music_id}")
        print(f"语言：{request.language}")
        
        # 1. 获取故事模板
        print("\n1. 正在获取故事模板...")
        db = await get_database()
        try:
            template = await db.story_templates.find_one({"_id": ObjectId(request.template_id)})
            if not template:
                print(f"未找到ID为 {request.template_id} 的模板")
                raise HTTPException(status_code=404, detail=f"Template {request.template_id} not found")
            print(f"获取到模板: {template['name']}")
        except Exception as e:
            error_stack = traceback.format_exc()
            print(f"获取模板时出错: {str(e)}")
            print(f"错误栈信息:\n{error_stack}")
            raise HTTPException(
                status_code=404,
                detail=f"Error getting template {request.template_id}: {str(e)}"
            )

        # 2. 获取type=other的LLM模型
        print("\n2. 正在获取LLM模型...")
        llm = await LLM.find_one({"type": "other"})
        if not llm:
            raise HTTPException(status_code=404, detail="No available LLM found")
        print(f"获取到LLM模型: {llm.llm_id}")

        # 3. 获取角色信息
        print("\n3. 正在获取角色信息...")
        print("检查数据库中的角色...")
        # 获取当前用户创建的角色和Narrator
        all_characters = await Character.find(
            {
                "$or": [
                    {"created_by": current_user.wallet_address},
                    {"character_type": "narrator"}
                ]
            }
        ).to_list()
        print(f"数据库中共有 {len(all_characters)} 个角色")
        print("数据库中的角色ID列表:")
        for char in all_characters:
            print(f"- ID: {char.id}, Name: {char.name}, Type: {char.character_type}, Created by: {char.created_by}")
        
        characters = []
        for char_id in request.characters:
            print(f"\n正在获取角色 {char_id}")
            try:
                # 确保只能获取当前用户的角色和Narrator
                character = await Character.find_one(
                    {
                        "_id": ObjectId(char_id),
                        "$or": [
                            {"created_by": current_user.wallet_address},
                            {"character_type": "narrator"}
                        ]
                    }
                )
                if not character:
                    print(f"未找到ID为 {char_id} 的角色，或该角色不属于当前用户")
                    raise HTTPException(
                        status_code=404, 
                        detail=f"Character {char_id} not found or not owned by current user"
                    )
                print(f"成功获取角色: {character.name}")
                characters.append(character)
            except Exception as e:
                error_stack = traceback.format_exc()
                print(f"获取角色时出错: {str(e)}")
                print(f"错误栈信息:\n{error_stack}")
                raise HTTPException(
                    status_code=404,
                    detail=f"Error getting character {char_id}: {str(e)}"
                )
        print(f"成功获取 {len(characters)} 个角色")

        # 4. 生成故事背景
        print("\n4. 正在生成故事背景...")
        # 构建角色信息
        character_info = "\n角色信息：\n"
        for char in characters:
            if char.character_type != "narrator":
                character_info += f"- {char.name}:\n"
                character_info += f"  描述: {char.description}\n"
                character_info += f"  性格: {char.personality}\n\n"
        
        background_prompt = f"{request.template_content}\n{character_info}\n{template['hidden_background_prompt']}\n\n生成语言必须为{request.language}!!!!"
        print(f"背景提示词: {background_prompt}")
        background_chat_request = ChatCompletionRequest(
            model_id=llm.llm_id,
            messages=[
                {
                    "role": "user",
                    "content": background_prompt
                }
            ]
        )
        background_response = await chat_completion(background_chat_request, background_tasks, current_user)
        generated_background = background_response["choices"][0]["message"]["content"]
        print(f"生成的背景: {generated_background}")

        # 5. 生成故事结束条件
        print("\n5. 正在生成故事结束条件...")
        target_prompt = f"{request.template_content}\n{character_info}\n{template['hidden_target_prompt']}\n\n生成语言必须为{request.language}!!!!"
        print(f"目标提示词: {target_prompt}")
        target_chat_request = ChatCompletionRequest(
            model_id=llm.llm_id,
            messages=[
                {
                    "role": "user",
                    "content": target_prompt
                }
            ]
        )
        target_response = await chat_completion(target_chat_request, background_tasks, current_user)
        generated_target = target_response["choices"][0]["message"]["content"]
        print(f"生成的结束条件: {generated_target}")

        # 6. 获取背景音乐信息
        print("\n6. 正在获取背景音乐信息...")
        background_music = None
        if request.background_music_id:
            print(f"正在获取音乐 {request.background_music_id}")
            background_music = await Music.get(request.background_music_id)
            if not background_music:
                raise HTTPException(status_code=404, detail=f"Music {request.background_music_id} not found")
            print(f"获取到音乐: {background_music.name}")

        # 7. 处理开场白
        print("\n7. 正在处理开场白...")
        opening_messages = []
        if request.opening_messages:
            print(f"收到 {len(request.opening_messages)} 条开场白")
            # 先找到 Narrator 角色
            narrator = next((char for char in characters if char.character_type == "narrator"), None)
            if not narrator:
                print("警告：未找到Narrator角色")
                raise HTTPException(status_code=400, detail="Narrator character not found")
            print(f"找到Narrator角色，ID: {narrator.id}")
            
            for msg in request.opening_messages:
                print(f"处理开场白: {msg}")
                # 如果character为空，使用Narrator的ID
                character_id = msg.character if msg.character else str(narrator.id)
                print(f"使用的角色ID: {character_id}")
                
                opening_messages.append(OpeningMessage(
                    content=msg.content,
                    character=character_id
                ))
            print(f"处理完成，共有 {len(opening_messages)} 条有效开场白")

        # 8. 创建故事
        print("\n8. 正在创建故事...")
        story = await Story.create_story(
            story_name=request.story_name,
            bg_image_prompt="",  # 已经有生成的图片，不需要提示词
            characters=characters,
            wallet_address=current_user.wallet_address,
            settings=request.settings,
            opening_messages=opening_messages,  # 使用处理后的开场白列表
            background_music=background_music,
            generated_background=generated_background,
            generated_target=generated_target,
            bg_image_url=request.bg_image_url,
            icon_url=None,
            language=request.language
        )
        print(f"故事创建成功，ID: {story.id}")

        print("\n=== 故事发布完成 ===\n")
        return PublishStoryResponse(id=str(story.id))

    except Exception as e:
        # 获取完整的错误栈信息
        error_stack = traceback.format_exc()
        print(f"\n!!! 发布故事时出错 !!!")
        print(f"Error stack trace:\n{error_stack}")  # 打印到服务器日志
        raise HTTPException(
            status_code=500,
            detail=f"Failed to publish story: {str(e)}\nStack trace:\n{error_stack}"
        ) 

@router.get("/story/get_unstarted_stories", response_model=List[GetStoriesResponse])
async def get_unstarted_stories(
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 10
):
    """获取用户未开始对话的故事列表
    
    Args:
        current_user: 当前用户
        page: 页码，从1开始
        limit: 每页数量
        
    Returns:
        List[GetStoriesResponse]: 故事列表
    """
    try:
        # 计算跳过的数量
        skip = (page - 1) * limit
        
        # 获取所有故事
        stories = await Story.find().skip(skip).limit(limit).to_list()
        
        # 获取用户已经开始对话的故事ID列表
        from models.conversation import Conversation
        started_story_ids = set()
        conversations = await Conversation.find({"user_id": str(current_user.id)}).to_list()
        for conv in conversations:
            story = await conv.story.fetch()
            if story:
                started_story_ids.add(str(story.id))
        
        # 构建响应数据
        response_data = []
        for story in stories:
            # 如果故事已经开始对话，跳过
            if str(story.id) in started_story_ids:
                continue
                
            try:
                # 获取创建者用户名
                creator = await User.get_by_wallet(story.created_by)
                creator_name = creator.username if creator and creator.username else story.created_by[-8:]
                
                # 获取第一个非Narrator角色的image_url作为avatar_url
                avatar_url = None
                character_icons = []
                character_details = []
                
                # 获取实际的Character对象
                characters = []
                for char_link in story.characters:
                    try:
                        char = await char_link.fetch()
                        if char:
                            characters.append(char)
                            if char.name.lower() != "narrator":
                                if avatar_url is None:
                                    avatar_url = char.image_url
                                if char.icon_url:
                                    character_icons.append(char.icon_url)
                            # 构建角色详细信息
                            character_details.append({
                                "id": str(char.id),
                                "name": char.name,
                                "description": char.description,
                                "image_url": char.image_url,
                                "icon_url": char.icon_url,
                                "character_type": char.character_type
                            })
                    except Exception as char_error:
                        error_stack = traceback.format_exc()
                        print(f"获取角色信息时出错: {str(char_error)}")
                        print(f"错误栈信息:\n{error_stack}")
                        continue
                
                messages = []
                for msg in story.opening_messages:
                    try:
                        # 处理character字段，确保是字符串类型
                        character_id = msg.character
                        if isinstance(character_id, int):
                            # 如果是整数，转换为对应角色的ID字符串
                            try:
                                character = characters[character_id - 1]
                                character_id = str(character.id)
                            except (IndexError, AttributeError) as e:
                                error_stack = traceback.format_exc()
                                print(f"处理角色ID时出错: {str(e)}")
                                print(f"错误栈信息:\n{error_stack}")
                                continue
                        
                        # 验证角色ID是否存在于character_details中
                        if not any(char['id'] == character_id for char in character_details):
                            print(f"警告：开场白中的角色ID {character_id} 不在character_details中")
                            continue
                        
                        messages.append({
                            "content": msg.content,
                            "character_id": character_id
                        })
                    except Exception as msg_error:
                        error_stack = traceback.format_exc()
                        print(f"处理开场白消息时出错: {str(msg_error)}")
                        print(f"错误栈信息:\n{error_stack}")
                        continue
                
                background_music_url = None
                if story.background_music:
                    try:
                        music = await story.background_music.fetch()
                        if music:
                            background_music_url = music.url
                    except Exception as music_error:
                        error_stack = traceback.format_exc()
                        print(f"获取背景音乐时出错: {str(music_error)}")
                        print(f"错误栈信息:\n{error_stack}")
                
                # 构建响应数据
                response_data.append(
                    GetStoriesResponse(
                        id=str(story.id),
                        title=story.story_name,
                        intro=story.generated_background or "",
                        messages=messages,
                        likes=str(story.likes),
                        rewards=str(story.retweet),  # 使用retweet字段作为rewards
                        background=story.bg_image_url or "",
                        date=story.created_at.strftime("%Y-%m-%d"),
                        characters=len([c for c in characters if c.name.lower() != "narrator"]),
                        avatar_url=avatar_url,
                        characterIcons=character_icons,
                        characterDetails=character_details,
                        backgroundMusic=background_music_url,
                        created_by=story.created_by,
                        creator_name=creator_name,
                        comments_count=str(story.comments_count)
                    )
                )
            except Exception as story_error:
                error_stack = traceback.format_exc()
                print(f"处理故事数据时出错: {str(story_error)}")
                print(f"错误栈信息:\n{error_stack}")
                continue
        
        return response_data
        
    except Exception as e:
        # 获取完整的错误栈信息
        error_stack = traceback.format_exc()
        print(f"\n!!! 获取故事列表时出错 !!!")
        print(f"Error stack trace:\n{error_stack}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stories: {str(e)}"
        ) 

@router.get("/story/get_started_stories", response_model=List[GetStoriesResponse])
async def get_started_stories(
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 10
):
    """获取用户已开始对话的故事列表
    
    Args:
        current_user: 当前用户
        page: 页码，从1开始
        limit: 每页数量
        
    Returns:
        List[GetStoriesResponse]: 故事列表
    """
    try:
        # 计算跳过的数量
        skip = (page - 1) * limit
        
        # 获取用户已经开始对话的故事ID列表
        from models.conversation import Conversation
        started_story_ids = set()
        conversations = await Conversation.find({"user_id": str(current_user.id)}).to_list()
        for conv in conversations:
            story = await conv.story.fetch()
            if story:
                started_story_ids.add(str(story.id))
        
        # 获取这些故事的详细信息
        stories = []
        for story_id in list(started_story_ids)[skip:skip+limit]:
            story = await Story.get(story_id)
            if story:
                stories.append(story)
        
        # 构建响应数据
        response_data = []
        for story in stories:
            try:
                # 获取创建者用户名
                creator = await User.get_by_wallet(story.created_by)
                creator_name = creator.username if creator and creator.username else story.created_by[-8:]
                
                # 获取第一个非Narrator角色的image_url作为avatar_url
                avatar_url = None
                character_icons = []
                character_details = []
                
                # 获取实际的Character对象
                characters = []
                for char_link in story.characters:
                    try:
                        char = await char_link.fetch()
                        if char:
                            characters.append(char)
                            if char.name.lower() != "narrator":
                                if avatar_url is None:
                                    avatar_url = char.image_url
                                if char.icon_url:
                                    character_icons.append(char.icon_url)
                            # 构建角色详细信息
                            character_details.append({
                                "id": str(char.id),
                                "name": char.name,
                                "description": char.description,
                                "image_url": char.image_url,
                                "icon_url": char.icon_url,
                                "character_type": char.character_type
                            })
                    except Exception as char_error:
                        error_stack = traceback.format_exc()
                        print(f"获取角色信息时出错: {str(char_error)}")
                        print(f"错误栈信息:\n{error_stack}")
                        continue
                
                # 处理开场白消息
                messages = []
                for msg in story.opening_messages:
                    try:
                        # 处理character字段，确保是字符串类型
                        character_id = msg.character
                        if isinstance(character_id, int):
                            # 如果是整数，转换为对应角色的ID字符串
                            try:
                                character = characters[character_id - 1]
                                character_id = str(character.id)
                            except (IndexError, AttributeError) as e:
                                error_stack = traceback.format_exc()
                                print(f"处理角色ID时出错: {str(e)}")
                                print(f"错误栈信息:\n{error_stack}")
                                continue
                        
                        # 验证角色ID是否存在于character_details中
                        if not any(char['id'] == character_id for char in character_details):
                            print(f"警告：开场白中的角色ID {character_id} 不在character_details中")
                            continue
                        
                        messages.append({
                            "content": msg.content,
                            "character_id": character_id
                        })
                    except Exception as msg_error:
                        error_stack = traceback.format_exc()
                        print(f"处理开场白消息时出错: {str(msg_error)}")
                        print(f"错误栈信息:\n{error_stack}")
                        continue
                
                # 获取背景音乐URL
                background_music_url = None
                if story.background_music:
                    try:
                        music = await story.background_music.fetch()
                        if music:
                            background_music_url = music.url
                    except Exception as music_error:
                        error_stack = traceback.format_exc()
                        print(f"获取背景音乐时出错: {str(music_error)}")
                        print(f"错误栈信息:\n{error_stack}")
                
                # 构建响应数据
                response_data.append(
                    GetStoriesResponse(
                        id=str(story.id),
                        title=story.story_name,
                        intro=story.generated_background or "",
                        messages=messages,
                        likes=str(story.likes),
                        rewards=str(story.retweet),  # 使用retweet字段作为rewards
                        background=story.bg_image_url or "",
                        date=story.created_at.strftime("%Y-%m-%d"),
                        characters=len([c for c in characters if c.name.lower() != "narrator"]),
                        avatar_url=avatar_url,
                        characterIcons=character_icons,
                        characterDetails=character_details,
                        backgroundMusic=background_music_url,
                        created_by=story.created_by,
                        creator_name=creator_name,
                        comments_count=str(story.comments_count)
                    )
                )
            except Exception as story_error:
                error_stack = traceback.format_exc()
                print(f"处理故事数据时出错: {str(story_error)}")
                print(f"错误栈信息:\n{error_stack}")
                continue
        
        return response_data
        
    except Exception as e:
        # 获取完整的错误栈信息
        error_stack = traceback.format_exc()
        print(f"\n!!! 获取故事列表时出错 !!!")
        print(f"Error stack trace:\n{error_stack}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get stories: {str(e)}"
        ) 