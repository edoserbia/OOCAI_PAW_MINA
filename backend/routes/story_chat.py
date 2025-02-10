from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Security, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from beanie import PydanticObjectId
from models.story import Story
from models.character import Character
from models.conversation import Conversation
from models.conversation_message import ConversationMessage, MessageRole
from models.chat import HistoryMessage
from services.chat import ChatService
from utils.auth import get_current_user
from models.user import User
from pydantic import BaseModel, Field
from typing import Dict
import json
from datetime import datetime
from pydantic import validator


router = APIRouter(prefix="/story_chat", tags=["story_chat"])

# 创建安全依赖
oauth2_scheme = HTTPBearer()


class SelectSpeakersRequest(BaseModel):
    """选择说话角色请求模型"""
    history_length: int = Field(default=25, ge=1)  # 历史消息长度限制
    user_message: str  # 用户消息
    history_messages: List[HistoryMessage]  # 历史消息列表
    character_names: List[str]  # 可选的角色名称列表

    class Config:
        json_schema_extra = {
            "example": {
                "history_length": 25,
                "user_message": "你好，大家今天过得怎么样？",
                "history_messages": [
                    {
                        "role": MessageRole.USER,
                        "content": "我们开始聊天吧"
                    },
                    {
                        "role": MessageRole.NARRATOR,
                        "content": "阳光明媚的下午，三个朋友相聚在咖啡厅里"
                    },
                    {
                        "role": MessageRole.CHARACTER,
                        "character_name": "小惠",
                        "content": "今天天气真好啊，我特别喜欢这样的下午~"
                    }
                ],
                "character_names": ["旁白", "小惠", "小静"]
            }
        }


class SelectSpeakersResponse(BaseModel):
    """选择说话角色响应模型"""
    speakers: List[str]  # 说话角色名称列表

    class Config:
        json_schema_extra = {
            "example": {
                "speakers": ["小静", "旁白"]
            }
        }


class GenerateResponseRequest(BaseModel):
    """生成角色回复请求模型"""
    history_length: int = Field(default=25, ge=1)  # 历史消息长度限制
    character_id: str  # 角色ID
    user_message: str  # 用户消息
    history_messages: List[HistoryMessage]  # 历史消息列表
    conversation_id: str  # 对话ID
    last_message_id: str  # 最后一条消息的ID
    is_first_response: bool = Field(default=False)  # 是否是第一个回复角色

    class Config:
        json_schema_extra = {
            "example": {
                "history_length": 25,
                "character_id": "67756a67e021c3660f29462a",  # 示例ID，需要替换为实际的角色ID
                "user_message": "小惠，你最近在忙些什么呢？",
                "history_messages": [
                    {
                        "role": MessageRole.USER,
                        "content": "大家好啊"
                    },
                    {
                        "role": MessageRole.NARRATOR,
                        "content": "咖啡厅里飘着香醇的咖啡香气，阳光透过落地窗洒在桌上"
                    },
                    {
                        "role": MessageRole.CHARACTER,
                        "character_name": "小静",
                        "content": "这里的环境真的很适合聊天呢"
                    }
                ],
                "conversation_id": "1234567890",
                "last_message_id": "0987654321",
                "is_first_response": True
            }
        }


class ErrorResponse(BaseModel):
    """错误响应模型"""
    detail: str  # 错误详情
    traceback: str = None  # 错误栈信息

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Failed to generate response",
                "traceback": "Traceback (most recent call last):\n  ..."
            }
        }


class GetHistoryMessagesRequest(BaseModel):
    """获取历史消息的请求模型"""
    conversation_id: str
    last_message_time: datetime = Field(
        default_factory=datetime.utcnow,
        description="ISO格式的UTC时间字符串，例如：2024-01-21T17:34:40.312Z"
    )

    @validator('last_message_time')
    def ensure_naive_utc(cls, v):
        """确保时间是UTC naive datetime"""
        if v.tzinfo is not None:
            # 如果有时区信息，转换为UTC naive datetime
            return v.replace(tzinfo=None)
        return v


@router.post(
    "/select-speakers",
    response_model=SelectSpeakersResponse,
    responses={
        200: {
            "description": "成功选择说话角色",
            "model": SelectSpeakersResponse
        },
        401: {
            "description": "未授权访问",
            "model": Dict[str, str]
        },
        500: {
            "description": "服务器内部错误",
            "model": ErrorResponse
        }
    }
)
async def select_speakers(
    request: SelectSpeakersRequest,
    auth: HTTPAuthorizationCredentials = Security(oauth2_scheme)
):
    """选择下一组说话的角色
    
    Args:
        request: 请求对象，包含用户消息、历史消息和可选角色列表
        auth: 认证信息
        
    Returns:
        SelectSpeakersResponse: 响应对象，包含说话角色列表
    """
    try:
        # 验证用户身份
        await get_current_user(auth)
        
        # 选择说话角色
        chat_service = ChatService()
        speakers = await chat_service.select_next_speakers(
            history_length=request.history_length,
            history_messages=request.history_messages,
            user_message=request.user_message,
            character_names=request.character_names
        )
        
        return SelectSpeakersResponse(speakers=speakers)
        
    except Exception as e:
        # 获取错误栈信息
        import traceback
        error_stack = traceback.format_exc()
        
        # 返回带有错误栈的错误响应
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(
                detail=str(e),
                traceback=error_stack
            ).dict()
        )


@router.post(
    "/generate-response",
    responses={
        200: {
            "description": "成功生成角色回复（流式响应）",
            "content": {
                "text/event-stream": {
                    "example": "这是一个很棒的下午！我刚刚..."
                }
            }
        },
        401: {
            "description": "未授权访问",
            "model": Dict[str, str]
        },
        404: {
            "description": "角色不存在",
            "model": Dict[str, str]
        },
        500: {
            "description": "服务器内部错误",
            "content": {
                "text/event-stream": {
                    "example": "ERROR: {\"detail\": \"Failed to generate response\", \"traceback\": \"...\"}"
                }
            }
        }
    }
)
async def generate_response(
    request: GenerateResponseRequest,
    current_user: User = Depends(get_current_user)
):
    """生成角色回复"""
    try:
        # 获取对话
        conversation = await Conversation.get(request.conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # 获取last_message_id对应的消息，以获取其sequence
        last_message = await ConversationMessage.get(PydanticObjectId(request.last_message_id))
        if not last_message:
            raise HTTPException(status_code=404, detail="Last message not found")
        
        # 根据is_first_response决定sequence的计算方式
        if request.is_first_response:
            # 第一个回复角色，需要保存用户消息
            user_sequence = last_message.sequence + 1
            # 创建用户消息
            user_message = ConversationMessage(
                conversation=conversation,
                content=request.user_message,
                role=MessageRole.USER,
                sequence=user_sequence
            )
            await user_message.create()
            # 角色消息的sequence在用户消息之后
            character_sequence = user_sequence + 1
        else:
            # 不是第一个回复角色，不保存用户消息
            # 角色消息的sequence直接在上一条消息之后
            character_sequence = last_message.sequence + 1

        # 获取关联的故事
        story = await conversation.story.fetch()
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # 获取角色信息
        character = await Character.get(PydanticObjectId(request.character_id))
        if not character:
            raise HTTPException(
                status_code=404,
                detail=f"Character {request.character_id} not found"
            )
        
        chat_service = ChatService()
        
        async def generate():
            full_response = ""  # 用于累积完整的响应
            try:
                async for chunk in chat_service.generate_character_response(
                    character_name=character.name,
                    character_system_prompt=character.system_prompt,
                    history_length=request.history_length,
                    history_messages=request.history_messages,
                    user_message=request.user_message
                ):
                    full_response += chunk
                    yield f"data: {chunk}\n\n"
                    
                # 生成完成后，保存角色回复
                character_message = ConversationMessage(
                    conversation=conversation,  # 使用conversation对象
                    role=MessageRole.CHARACTER if character.name != "Narrator" else MessageRole.NARRATOR,
                    content=full_response,
                    character_name=character.name,  # 总是设置角色名称
                    character=character,  # 添加角色引用
                    sequence=character_sequence  # 使用计算好的sequence
                )
                await character_message.create()
                
            except Exception as e:
                # 获取错误栈信息
                import traceback
                error_stack = traceback.format_exc()
                
                # 返回错误信息
                error_response = ErrorResponse(
                    detail=str(e),
                    traceback=error_stack
                )
                yield f"data: ERROR: {error_response.json()}\n\n"
                
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "X-Accel-Buffering": "no"  # 禁用nginx缓冲
            }
        )
        
    except HTTPException as e:
        # 如果是HTTP异常（包括404和401），直接抛出
        raise e
            
    except Exception as e:
        # 获取错误栈信息
        import traceback
        error_stack = traceback.format_exc()
        
        # 返回错误信息
        error_response = ErrorResponse(
            detail=str(e),
            traceback=error_stack
        )
        return StreamingResponse(
            iter([f"ERROR: {error_response.json()}"]),
            media_type="text/event-stream"
        ) 


@router.post("/history-messages", response_model=List[HistoryMessage])
async def get_history_messages(
    request: GetHistoryMessagesRequest,
    current_user: User = Depends(get_current_user)
) -> List[HistoryMessage]:
    """获取历史消息
    
    Args:
        request: 请求参数，包含对话ID和最后消息时间
    
    Returns:
        List[HistoryMessage]: 历史消息列表
    """
    # 获取对话
    conversation = await Conversation.get(request.conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # 获取故事
    story = await conversation.story.fetch()
    
    # 构建查询条件
    query = {
        "conversation.$id": PydanticObjectId(conversation.id),  # 使用$id来查询DBRef引用
        "created_at": {"$lte": request.last_message_time}  # MongoDB中存储的是naive UTC datetime
    }
    
    print(f"查询历史消息参数: conversation_id={conversation.id}, last_message_time={request.last_message_time}")
    print(f"查询条件: {query}")
    
    # 获取消息并按时间排序，限制返回条数
    messages = await ConversationMessage.find(query).sort(-ConversationMessage.created_at).limit(story.history_length).to_list()
    
    print(f"查询到消息数量: {len(messages)}")
    for msg in messages:
        print(f"消息: id={msg.id}, created_at={msg.created_at}, content={msg.content[:50]}...")
        # 确保比较的两个时间都是naive datetime
        msg_time = msg.created_at.replace(tzinfo=None) if msg.created_at.tzinfo else msg.created_at
        query_time = request.last_message_time.replace(tzinfo=None) if request.last_message_time.tzinfo else request.last_message_time
        print(f"消息时间比较: message_time={msg_time}, query_time={query_time}, is_less={msg_time <= query_time}")
    
    # 返回消息时按时间正序
    messages.reverse()
    
    # 转换消息格式
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "id": str(msg.id),  # 将ObjectId转换为字符串
            "role": msg.role,
            "content": msg.content,
            "character_name": msg.character_name,
            "sequence": msg.sequence,
            "created_at": msg.created_at.isoformat()  # 将datetime转换为ISO格式字符串
        })
    
    return formatted_messages 