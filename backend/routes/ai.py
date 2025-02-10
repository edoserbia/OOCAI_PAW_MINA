from typing import Optional, Dict, Any, AsyncGenerator, Literal, Union, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from models.llm import LLM
from utils.auth import get_current_user
from utils.image import save_download_file, get_image_url
from config.settings import settings
import httpx
import json
import asyncio
from datetime import datetime
import uuid

router = APIRouter(prefix="/ai", tags=["ai"])

class ImageUrlContent(BaseModel):
    """图片URL内容"""
    url: str = Field(description="图片URL")

class TextContent(BaseModel):
    """文本内容"""
    type: Literal["text"] = "text"
    text: str = Field(description="文本内容")

class ImageUrlWrapper(BaseModel):
    """图片URL包装器"""
    type: Literal["image_url"] = "image_url"
    image_url: ImageUrlContent = Field(description="图片URL内容")

class I2TChatMessage(BaseModel):
    """图生文聊天消息"""
    role: Literal["system", "user", "assistant"] = Field(
        description="消息角色：system-系统提示, user-用户输入, assistant-AI回复"
    )
    content: Union[str, List[Union[TextContent, ImageUrlWrapper]]] = Field(
        description="消息内容，可以是字符串或包含文本和图片URL的列表"
    )

class I2TChatCompletionRequest(BaseModel):
    """图生文Chat completion请求模型"""
    model_id: str = Field(description="LLM模型ID")
    messages: list[I2TChatMessage] = Field(description="消息列表")
    stream: bool = Field(default=False, description="是否流式返回")
    temperature: Optional[float] = Field(None, description="温度参数，控制随机性")
    max_tokens: Optional[int] = Field(None, description="最大生成token数")
    top_p: Optional[float] = Field(None, description="核采样参数")
    presence_penalty: Optional[float] = Field(None, description="存在惩罚参数")
    frequency_penalty: Optional[float] = Field(None, description="频率惩罚参数")

    class Config:
        json_schema_extra = {
            "example": {
                "model_id": "qwen-vl-plus-1",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "描述一下这个图片"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": "http://vd1261kq672.vicp.fun:45271/api/v1/images/bbb29707-fda1-434d-bc87-b9d4d6089783.png"
                                }
                            }
                        ]
                    }
                ],
                "stream": False
            }
        }

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

@router.post("/i2t/chat/completions")
async def i2t_chat_completion(
    request: I2TChatCompletionRequest,
    background_tasks: BackgroundTasks,  
    current_user = Depends(get_current_user)
) -> Any:
    """图生文Chat completion接口
    
    Args:
        request: 请求数据
        background_tasks: 后台任务
        current_user: 当前用户
        
    Returns:
        如果stream=True，返回StreamingResponse
        否则返回完整的响应数据
    """
    # 获取LLM模型配置
    llm = await LLM.find_one({"llm_id": request.model_id, "type": "i2t"})
    if not llm:
        raise HTTPException(status_code=404, detail="I2T model not found")
    
    # 构建请求数据
    json_data = {
        "model": llm.settings.model,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content if isinstance(msg.content, str) else [
                    content.dict(exclude_none=True) for content in msg.content
                ]
            }
            for msg in request.messages
        ],
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

class T2ISubmitRequest(BaseModel):
    """文生图任务提交请求"""
    model_id: str = Field(
        description="模型ID",
        example="302/flux-schnell-1"
    )
    prompt: str = Field(
        description="图片生成提示词",
        example="Extreme close-up of a single tiger eye, direct frontal view. Detailed iris and pupil. Sharp focus on eye texture and color. Natural lighting to capture authentic eye shine and depth. The word \"FLUX\" is painted over it in big, white brush strokes with visible texture."
    )

class ImageInfo(BaseModel):
    """图片信息"""
    url: str = Field(
        description="图片URL",
        example="http://vd1261kq672.vicp.fun:45271/api/v1/images/63cf2caa-e23c-44a1-931b-4a600edb0554.png"
    )
    width: int = Field(
        description="图片宽度",
        example=1024
    )
    height: int = Field(
        description="图片高度",
        example=1024
    )
    content_type: str = Field(
        description="图片类型",
        example="image/jpeg"
    )

class Timings(BaseModel):
    """时间信息"""
    inference: float = Field(
        description="推理时间",
        example=0.4707870101556182
    )

class T2ISubmitResponse(BaseModel):
    """文生图任务提交响应"""
    images: List[ImageInfo] = Field(
        description="生成的图片列表"
    )
    timings: Timings = Field(
        description="时间信息"
    )
    seed: int = Field(
        description="随机种子",
        example=2477538274
    )
    has_nsfw_concepts: List[bool] = Field(
        description="是否包含不适内容",
        example=[False]
    )
    prompt: str = Field(
        description="原始提示词"
    )

@router.post("/ai/t2i/submit", 
    response_model=T2ISubmitResponse,
    summary="提交文生图任务",
    description="提交文生图任务并直接返回生成的图片。生成的图片会自动下载并保存到本地，返回的图片URL是本地服务器的URL。"
)
async def submit_t2i_task(
    request: T2ISubmitRequest,
    background_tasks: BackgroundTasks
):
    """
    提交文生图任务并直接返回生成的图片
    
    - **model_id**: 模型ID，例如 "302/flux-schnell-1"
    - **prompt**: 图片生成提示词
    
    生成的图片会自动下载并保存到本地，返回的图片URL是本地服务器的URL。
    """
    # 获取LLM模型配置
    llm = await LLM.find_one({"llm_id": request.model_id, "type": "t2i"})
    if not llm:
        raise HTTPException(status_code=404, detail="T2I model not found")
    
    size = llm.settings.size.replace("*", "x")
    
    # 构建请求数据
    json_data = {
        "prompt": request.prompt,
        "image_size": {
            "width": int(size.split("x")[0]),
            "height": int(size.split("x")[1])
        },
        "num_inference_steps": llm.settings.steps or 4
    }
    
    # 移除None值
    json_data = {k: v for k, v in json_data.items() if v is not None}
    
    headers = {
        "Authorization": f"Bearer {llm.api_key}",
        "Content-Type": "application/json"
    }
    
    url = f"{llm.settings.base_url}/302/submit/{llm.settings.model}"
    
    print(f"Request URL: {url}")
    print(f"Request headers: {headers}")
    print(f"Request JSON: {json_data}")
    
    try:
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
                    detail=f"Task submit error: {response.text}"
                )
            
            # 更新使用次数
            background_tasks.add_task(_update_usage, llm)
            
            # 获取响应数据
            response_data = response.json()
            
            # 下载并保存图片
            image_url = response_data["images"][0]["url"]
            async with httpx.AsyncClient() as client:
                img_response = await client.get(image_url)
                if img_response.status_code != 200:
                    raise HTTPException(
                        status_code=img_response.status_code,
                        detail="Failed to download image"
                    )
                
                # 保存图片并获取文件名
                filename = await save_download_file(img_response.content)
                if not filename:
                    raise HTTPException(
                        status_code=500,
                        detail="Failed to save image"
                    )
                
                # 构建本地图片URL
                local_url = get_image_url(filename)
                
                # 修改响应中的图片URL
                response_data["images"][0]["url"] = local_url
                
                return response_data
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Task submit timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Task submit error: {str(e)}")

class ModelResponse(BaseModel):
    """模型信息响应"""
    llm_id: str = Field(description="模型ID")
    type: str = Field(description="模型类型：chat/other/t2i/i2t")
    settings: Dict[str, Any] = Field(description="模型设置")
    usage_count: int = Field(description="使用次数")
    last_used: Optional[datetime] = Field(description="最后使用时间")
    status: str = Field(description="状态：active/inactive")

@router.get("/models", response_model=List[ModelResponse])
async def get_models(
    type: Optional[str] = None,
    llm_id: Optional[str] = None,
    current_user = Depends(get_current_user)
) -> List[ModelResponse]:
    """获取可用模型列表
    
    Args:
        type: 可选，模型类型筛选(chat/other/t2i/i2t)
        llm_id: 可选，模型ID筛选
        current_user: 当前用户
        
    Returns:
        模型列表
    """
    # 构建查询条件
    query = {"status": "active"}
    if type:
        query["type"] = type
    if llm_id:
        query["llm_id"] = llm_id
        
    # 查询模型
    models = await LLM.find(query).to_list()
    
    # 转换响应格式
    return [
        ModelResponse(
            llm_id=model.llm_id,
            type=model.type,
            settings=model.settings.dict(),  # 转换为字典
            usage_count=model.usage_count,
            last_used=model.last_used or datetime.now(),  # 确保有默认值
            status=model.status
        )
        for model in models
    ]

@router.get("/models/least-used/{type}", response_model=ModelResponse)
async def get_least_used_model(
    type: str,
    current_user = Depends(get_current_user)
) -> ModelResponse:
    """获取指定类型中最长时间未使用的模型
    
    Args:
        type: 模型类型(chat/other/t2i/i2t)
        current_user: 当前用户
        
    Returns:
        模型信息
    """
    # 查询指定类型的可用模型，按最后使用时间升序排序
    model = await LLM.find_one(
        {"type": type, "status": "active"},
        sort=[("last_used", 1)]  # 1表示升序
    )
    
    if not model:
        raise HTTPException(
            status_code=404,
            detail=f"No active models found for type: {type}"
        )
    
    # 转换响应格式
    return ModelResponse(
        llm_id=model.llm_id,
        type=model.type,
        settings=model.settings.dict(),  # 转换为字典
        usage_count=model.usage_count,
        last_used=model.last_used or datetime.now(),  # 确保有默认值
        status=model.status
    )
