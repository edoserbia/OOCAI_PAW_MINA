import os
import random
import traceback
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from PIL import Image
import face_recognition
import requests
from models.character import Character
from models.character_system_prompt_post import CharacterSystemPromptPost
from models.llm import LLM
from models.prompt_template import PromptTemplate
from models.user import User
from utils.auth import get_current_user
from utils.image import save_download_file, get_image_url
from utils.rmbg import background_remover
from config.settings import settings
from routes.llm import ChatCompletionRequest, chat_completion
from routes.ai import T2ISubmitRequest, T2ISubmitResponse, submit_t2i_task
import io
import numpy as np

router = APIRouter()

class CreateCharacterRequest(BaseModel):
    """创建角色请求模型"""
    llm_id: str = Field(..., description="LLM ID", example="other-agent")
    character_name: str = Field(..., description="角色名称", example="Alex")
    character_description: str = Field(..., description="角色描述", example="Cute boy")
    personality: str = Field(..., description="性格特征", example="at High School")
    language: str = Field(..., description="语言", example="English")
    image_prompt: str = Field(..., description="图片生成提示词", example="")
    image_url: str = Field(..., description="角色图片URL", example="http://vd1261kq672.vicp.fun:45271/9dcc0a08-37ed-4901-9b97-d172022978a0.png")
    icon_url: str = Field(..., description="角色头像图标URL", example="http://vd1261kq672.vicp.fun:45271/9dcc0a08-37ed-4901-9b97-d172022978a0_icon.png")

    class Config:
        json_schema_extra = {
            "example": {
                "llm_id": "other-agent",
                "character_name": "Alex",
                "character_description": "Cute boy",
                "personality": "at High School",
                "language": "English",
                "image_prompt": "",
                "image_url": "http://vd1261kq672.vicp.fun:45271/9dcc0a08-37ed-4901-9b97-d172022978a0.png",
                "icon_url": "http://vd1261kq672.vicp.fun:45271/9dcc0a08-37ed-4901-9b97-d172022978a0_icon.png"
            }
        }

class CreateCharacterResponse(BaseModel):
    """创建角色响应模型"""
    id: str  # MongoDB的_id


class GenerateAvatarRequest(BaseModel):
    """生成角色头像请求模型"""
    llm_id_for_prompt: str = Field(..., description="用于生成提示词的LLM ID", example="other-agent")
    llm_id_for_t2i: str = Field(..., description="用于生成图片的LLM ID", example="302/flux-schnell-1")
    art_style_keyword: str = Field(..., description="艺术风格关键词", example="Heavy Impasto")
    character_description: str = Field(..., description="角色描述", example="女生，可爱")
    personality: str = Field(..., description="性格特征", example="性格温柔，看起来好欺负")
    reference_image_description: Optional[str] = Field(None, description="参考图片描述", example="蓝发碧眼")

    class Config:
        json_schema_extra = {
            "example": {
                "llm_id_for_prompt": "other-agent",
                "llm_id_for_t2i": "302/flux-schnell-1",
                "art_style_keyword": "Heavy Impasto",
                "character_description": "女生，可爱",
                "personality": "性格温柔，看起来好欺负",
                "reference_image_description": "蓝发碧眼"
            }
        }

class GenerateAvatarResponse(BaseModel):
    """生成角色头像响应模型"""
    image_url: str
    icon_url: str

@router.post("/character-avatar/generate", response_model=GenerateAvatarResponse)
async def generate_avatar(
    request: GenerateAvatarRequest,
    current_user = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """生成角色头像
    
    Args:
        request: 请求参数
        current_user: 当前登录用户
        background_tasks: 后台任务
        
    Returns:
        GenerateAvatarResponse: 生成的图片URL和头像图标URL
    """
    try:
        # 获取提示词模板
        prompt_template = await PromptTemplate.find_one({"type": "t2i_character"})
        if not prompt_template:
            raise HTTPException(status_code=404, detail="Prompt template not found")
        
        # 构建第一阶段提示词
        prompt_parts = [
            f"Art Style: {request.art_style_keyword}",
            f"Character Description: {request.character_description}",
            f"Personality: {request.personality}"
        ]
        
        if request.reference_image_description:
            prompt_parts.append(f"Reference Image: {request.reference_image_description}")
            
        prompt_parts.append(f"Task: {prompt_template.content}")
        
        prompt_1st = "\n".join(prompt_parts)
        print(f"First stage prompt: {prompt_1st}")  # 调试信息
        
        # 调用LLM生成图片提示词
        chat_request = ChatCompletionRequest(
            model_id=request.llm_id_for_prompt,
            messages=[
                {
                    "role": "user",
                    "content": prompt_1st
                }
            ]
        )
        
        response = await chat_completion(chat_request, background_tasks, current_user)
        print(f"LLM response: {response}")  # 调试信息
        prompt_image = response["choices"][0]["message"]["content"]
        print(f"Generated image prompt: {prompt_image}")  # 调试信息

        # 调用文生图接口生成图片
        t2i_request = T2ISubmitRequest(
            model_id=request.llm_id_for_t2i,
            prompt=prompt_image
        )
        
        # 调用文生图接口
        t2i_response = await submit_t2i_task(t2i_request, background_tasks)
        print(f"T2I response: {t2i_response}")  # 调试信息
        
        # 返回生成的图片URL
        if not t2i_response["images"]:
            raise HTTPException(status_code=500, detail="Failed to generate image")
            
        # 获取生成的图片URL
        image_url = t2i_response["images"][0]["url"]
        if not image_url.startswith(('http://', 'https://')):
            image_url = f"{settings.BACKEND_BASE_URL}{image_url}"
        
        # 下载图片
        response = requests.get(image_url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to download generated image")
        
        # 去除背景
        image_bytes = background_remover.remove_background(response.content)
        
        # 处理头像图标
        try:
            # 将图片字节数据转换为PIL Image对象
            pil_image = Image.open(io.BytesIO(image_bytes))
            # 转换为RGB模式（如果是RGBA或其他模式）
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            # 调整大小为512x1024
            pil_image = pil_image.resize((512, 1024))
            
            # 将PIL Image转换为numpy数组供face_recognition使用
            image_array = np.array(pil_image)
            
            # 检测人脸位置
            face_locations = face_recognition.face_locations(image_array)
            
            if face_locations:
                # 使用第一个检测到的人脸
                top, right, bottom, left = face_locations[0]
                face_image = Image.fromarray(image_array[top:bottom, left:right])
            else:
                # 计算中心裁剪的坐标
                width, height = pil_image.size
                left = (width - 512) // 2
                top = (height - 512) // 2
                right = left + 512
                bottom = top + 512
                # 裁剪中心区域
                face_image = pil_image.crop((left, top, right, bottom))
            
            # 调整大小为128x128
            face_image = face_image.resize((128, 128))
            
            # 创建一个字节缓冲区来保存图标
            icon_buffer = io.BytesIO()
            face_image.save(icon_buffer, format='PNG')
            icon_bytes = icon_buffer.getvalue()
            
            # 保存图片和图标到存储
            image_filename = await save_download_file(image_bytes)
            if not image_filename:
                raise HTTPException(status_code=500, detail="Failed to save image")
                
            # 保存图标，使用相同的基础文件名但添加_icon后缀
            icon_filename = await save_download_file(icon_bytes)
            if not icon_filename:
                raise HTTPException(status_code=500, detail="Failed to save icon")
            
            # 返回处理后的图片URL和头像图标URL
            return GenerateAvatarResponse(
                image_url=get_image_url(image_filename),
                icon_url=get_image_url(icon_filename)
            )
            
        except Exception as e:
            error_detail = f"Image processing error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            print(error_detail)  # 打印错误到服务器日志
            raise HTTPException(
                status_code=500,
                detail=error_detail
            )
        
    except Exception as e:
        error_detail = f"Error generating image: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        print(error_detail)  # 打印错误到服务器日志
        raise HTTPException(
            status_code=500,
            detail=error_detail
        ) 
    

@router.post("/character-avatar/create", response_model=CreateCharacterResponse)
async def create_character(
    request: CreateCharacterRequest,
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
) -> CreateCharacterResponse:
    """创建新角色
    
    Args:
        request: 创建角色请求
        current_user: 当前用户
        background_tasks: 后台任务
        
    Returns:
        CreateCharacterResponse: 创建的角色ID
    """
    # 获取系统提示词
    system_prompt_post = await CharacterSystemPromptPost.find_one({
        "type": "description",
        "language": request.language
    })
    if not system_prompt_post:
        raise HTTPException(status_code=404, detail=f"System prompt post not found for language {request.language}")
    
    requirement_prompt_post = await CharacterSystemPromptPost.find_one({
        "type": "requirements",
        "language": request.language
    })
    if not requirement_prompt_post:
        raise HTTPException(status_code=404, detail=f"Requirement prompt post not found for language {request.language}")

    reference_system_prompt = f"""
    {system_prompt_post.content}
    """


    # 构造LLM输入提示词
    llm_input = f"""
    Character Name: {request.character_name}
    Character Description: {request.character_description}
    Personality: {request.personality}
    
    # Reference System Prompt: 
    {reference_system_prompt}

    # TASK:
    你要为上面的人物生成一个系统提示词。

    # 要求：
    * 系统提示词要符合人物的性格
    * 系统提示词必须！！必须！！严格的遵循参考系统提示词的格式
    * 系统提示词的每个符号都必须严格遵循参考系统提示词的格式
    * 系统提示词的第一行从: Your are {request.character_name}.开始
    * 如果人物的性格未指定，则随机生成一个人物的性格，根据随机数 {random.randint(1, 100000)}，不要按照参考的来
    * 系统提示词必须使用{request.language}语言

    """
    
    # 调用LLM生成系统提示词
    llm = await LLM.find_one({"llm_id": request.llm_id})
    if not llm:
        raise HTTPException(status_code=404, detail=f"LLM {request.llm_id} not found")
    
    chat_completion_request = ChatCompletionRequest(
        model_id=request.llm_id,
        messages=[{
            "role": "user",
            "content": llm_input
        }]
    )
    response = await chat_completion(chat_completion_request, background_tasks, current_user)
    system_prompt = response["choices"][0]["message"]["content"]
    system_prompt += f'\n\n{requirement_prompt_post.content}\n 角色必须说{request.language}语言!!!!'
    # 创建角色
    character = Character(
        name=request.character_name,
        description=request.character_description,
        personality=request.personality,
        system_prompt=system_prompt,
        created_by=current_user.wallet_address,
        image_prompt=request.image_prompt,
        image_url=request.image_url,
        icon_url=request.icon_url
    )
    await character.insert()
    
    return CreateCharacterResponse(id=str(character.id)) 