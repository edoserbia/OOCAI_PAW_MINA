from typing import Optional, Dict, Any, AsyncGenerator, Literal
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from models.llm import LLM
from models.prompt_template import PromptTemplate
from config.settings import settings
from utils.auth import get_current_user
from utils.image import save_download_file, get_image_url
from routes.ai import T2ISubmitRequest, submit_t2i_task
import httpx
import json
import asyncio
import base64
import traceback

router = APIRouter(prefix="/llm", tags=["llm"])

class ChatMessage(BaseModel):
    """OpenAI格式的聊天消息"""
    role: Literal["system", "user", "assistant", "function"] = Field(
        description="消息角色：system-系统提示, user-用户输入, assistant-AI回复, function-函数调用"
    )
    content: str = Field(description="消息内容")
    name: Optional[str] = Field(None, description="function调用时的函数名称")

class ChatCompletionRequest(BaseModel):
    """Chat completion请求模型"""
    model_id: str = Field(description="LLM模型ID")
    messages: list[ChatMessage] = Field(description="消息列表，符合OpenAI格式")
    stream: bool = Field(default=False, description="是否流式返回")
    temperature: Optional[float] = Field(None, description="温度参数，控制随机性")
    max_tokens: Optional[int] = Field(None, description="最大生成token数")
    top_p: Optional[float] = Field(None, description="核采样参数")
    presence_penalty: Optional[float] = Field(None, description="存在惩罚参数")
    frequency_penalty: Optional[float] = Field(None, description="频率惩罚参数")

    class Config:
        json_schema_extra = {
            "example": {
                "model_id": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "你是一个有帮助的AI助手。"},
                    {"role": "user", "content": "你好，请介绍一下你自己。"}
                ],
                "stream": False,
                "temperature": 0.7
            }
        }

class GenerateBackgroundRequest(BaseModel):
    """生成背景图片请求模型"""
    style_keyword: str = Field(..., description="艺术风格关键词", example="Comics")
    background_description: str = Field(..., description="背景描述", example="snow mountain")

    class Config:
        json_schema_extra = {
            "example": {
                "style_keyword": "Comics",
                "background_description": "snow mountain"
            }
        }

class GenerateBackgroundResponse(BaseModel):
    """生成背景图片响应模型"""
    image_url: str
    prompt: str

async def _stream_chat_completion(
    url: str,
    headers: Dict[str, str],
    json_data: Dict[str, Any]
) -> AsyncGenerator[str, None]:
    """流式返回chat completion结果
    
    Args:
        url: API URL
        headers: 请求头
        json_data: 请求数据
    """
    async with httpx.AsyncClient() as client:
        try:
            async with client.stream('POST', url, headers=headers, json=json_data, timeout=60.0) as response:
                if response.status_code != 200:
                    error_detail = await response.aread()
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"LLM API error: {error_detail.decode()}"
                    )
                
                async for line in response.aiter_lines():
                    if line.strip():
                        if line.startswith('data: '):
                            line = line[6:]  # 移除'data: '前缀
                        if line.strip() == '[DONE]':
                            break
                        try:
                            yield line + '\n'
                        except Exception as e:
                            raise HTTPException(
                                status_code=500,
                                detail=f"Error parsing stream response: {str(e)}"
                            )
        except (httpx.TimeoutException, httpx.RequestError) as e:
            raise HTTPException(status_code=500, detail=f"Stream request error: {str(e)}")

async def _update_usage(llm: LLM):
    """更新模型使用次数"""
    try:
        await llm.increment_usage()
    except Exception as e:
        print(f"Error updating usage count: {str(e)}")

@router.post("/chat/completions")
async def chat_completion(
    request: ChatCompletionRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
) -> Any:
    """Chat completion接口
    
    Args:
        request: 请求数据
        background_tasks: 后台任务
        current_user: 当前用户
        
    Returns:
        如果stream=True，返回StreamingResponse
        否则返回完整的响应数据
    """
    # 获取LLM模型配置
    llm = await LLM.find_one({"llm_id": request.model_id})
    if not llm:
        raise HTTPException(status_code=404, detail="LLM model not found")
    
    # 构建请求数据
    json_data = {
        "model": llm.settings.model,
        "messages": [msg.dict(exclude_none=True) for msg in request.messages],
        "stream": request.stream,
        "temperature": request.temperature or llm.settings.temperature,
        "max_tokens": request.max_tokens or llm.settings.max_tokens,
        "top_p": request.top_p or llm.settings.top_p,
        "presence_penalty": request.presence_penalty or llm.settings.presence_penalty,
        "frequency_penalty": request.frequency_penalty or llm.settings.frequency_penalty
    }
    
    # 移除None值
    json_data = {k: v for k, v in json_data.items() if v is not None}
    
    headers = {
        "Authorization": f"Bearer {llm.api_key}",
        "Content-Type": "application/json"
    }
    
    url = f"{llm.settings.base_url}/chat/completions"
    
    try:
        if request.stream:
            # 流式返回
            background_tasks.add_task(_update_usage, llm)
            return StreamingResponse(
                _stream_chat_completion(url, headers, json_data),
                media_type="text/event-stream"
            )
        else:
            # 一次性返回
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers=headers,
                    json=json_data,
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"LLM API error: {response.text}"
                    )
                
                # 更新使用次数
                background_tasks.add_task(_update_usage, llm)
                
                return response.json()
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request error: {str(e)}") 

@router.post("/generate/story-background-image", response_model=GenerateBackgroundResponse)
async def generate_story_background_image(
    request: GenerateBackgroundRequest,
    current_user = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """生成故事背景图片
    
    Args:
        request: 请求参数
        current_user: 当前用户(通过依赖注入)
        background_tasks: 后台任务
        
    Returns:
        GenerateBackgroundResponse: 生成的图片URL和提示词
    """
    try:
        # 1. 获取用于构建提示词的LLM模型
        prompt_llm = await LLM.find_one({"type": "other", "status": "active"})
        if not prompt_llm:
            raise HTTPException(status_code=404, detail="No active prompt generation model found")

        # 2. 获取背景图片生成的提示词模板
        prompt_template = await PromptTemplate.find_one({"type": "t2i_background"})
        if not prompt_template:
            raise HTTPException(status_code=404, detail="No active background prompt template found")

        # 3. 构建并获取图片生成提示词
        prompt_input = f"art style: {request.style_keyword}\n{request.background_description}\n{prompt_template.content}"
        chat_request = ChatCompletionRequest(
            model_id=prompt_llm.llm_id,
            messages=[{
                "role": "user",
                "content": prompt_input
            }]
        )
        prompt_response = await chat_completion(chat_request, background_tasks, current_user)
        
        if not prompt_response or not prompt_response.get("choices"):
            raise HTTPException(status_code=500, detail="Failed to generate image prompt")
            
        t2i_prompt = prompt_response["choices"][0]["message"]["content"]

        # 4. 获取可用的T2I模型
        t2i_model = await LLM.find_one({"type": "t2i", "status": "active"})
        if not t2i_model:
            raise HTTPException(status_code=404, detail="No active T2I model found")

        # 5. 生成图片
        t2i_request = T2ISubmitRequest(
            model_id=t2i_model.llm_id,
            prompt=t2i_prompt
        )
        t2i_response = await submit_t2i_task(t2i_request, background_tasks)
        
        if not t2i_response or not t2i_response.get("images"):
            raise HTTPException(status_code=500, detail="Failed to generate image")

        # 获取生成的图片URL
        image_url = t2i_response["images"][0]["url"]
        if not image_url.startswith(('http://', 'https://')):
            image_url = f"{settings.BACKEND_BASE_URL}{image_url}"
        
        # 下载图片
        async with httpx.AsyncClient() as client:
            response = await client.get(image_url)
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to download generated image")
            
            # 保存图片
            image_filename = await save_download_file(response.content)
            if not image_filename:
                raise HTTPException(status_code=500, detail="Failed to save image")

        return GenerateBackgroundResponse(
            image_url=get_image_url(image_filename),
            prompt=t2i_prompt
        )

    except Exception as e:
        error_detail = f"Error generating image: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        print(error_detail)  # 打印错误到服务器日志
        raise HTTPException(
            status_code=500,
            detail=error_detail
        ) 