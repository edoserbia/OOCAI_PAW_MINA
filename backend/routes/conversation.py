from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from models.conversation import Conversation
from models.conversation_message import ConversationMessage
from models.story import Story
from models.user import User
from models.character import Character
from utils.auth import get_current_user
import traceback
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["conversation"])

class MessageRequest(BaseModel):
    """消息请求模型"""
    content: str = Field(..., description="消息内容")
    character_id: str = Field(..., description="角色ID")

class CreateConversationRequest(BaseModel):
    """创建对话请求模型"""
    story_id: str = Field(..., description="故事ID")
    messages: List[MessageRequest] = Field(..., description="初始消息列表")

    class Config:
        json_schema_extra = {
            "example": {
                "story_id": "65f2a6d7e021c3660f294629",
                "messages": [
                    {
                        "content": "你好，我是小明",
                        "character_id": "65f2a6d7e021c3660f294630"
                    }
                ]
            }
        }

class CreateConversationResponse(BaseModel):
    """创建对话响应模型"""
    id: str = Field(..., description="对话ID")
    story_id: str = Field(..., description="故事ID")
    status: str = Field(..., description="对话状态")
    created_at: datetime = Field(..., description="创建时间")
    last_message_id: str = Field(..., description="最后一条消息ID")

@router.post("/conversation", response_model=CreateConversationResponse)
async def create_conversation(
    request: CreateConversationRequest,
    current_user: User = Depends(get_current_user)
) -> CreateConversationResponse:
    """创建新对话
    
    Args:
        request: 创建对话请求
        current_user: 当前用户
        
    Returns:
        CreateConversationResponse: 创建的对话信息
        
    Raises:
        HTTPException: 故事不存在时抛出404错误
    """
    try:
        # 记录请求数据
        logger.info(f"Creating conversation with request: {request.dict()}")
        
        # 获取故事信息
        try:
            story = await Story.get(PydanticObjectId(request.story_id))
            logger.info(f"Found story: {story.dict() if story else None}")
        except Exception as e:
            logger.error(f"Error getting story: {str(e)}\n{traceback.format_exc()}")
            raise HTTPException(
                status_code=404,
                detail=f"Story not found or invalid story_id: {str(e)}"
            )
            
        if not story:
            logger.error(f"Story not found with id: {request.story_id}")
            raise HTTPException(
                status_code=404,
                detail="Story not found"
            )
            
        # 创建新对话
        try:
            conversation = Conversation(
                story=story,
                user_id=str(current_user.id),
                status="active",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            await conversation.insert()
            logger.info(f"Created conversation: {conversation.dict()}")
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}\n{traceback.format_exc()}")
            raise

        # 创建初始消息
        last_message = None
        try:
            for i, msg in enumerate(request.messages, 1):
                message = await ConversationMessage.create_character_message(
                    conversation=conversation,
                    character=await Character.get(PydanticObjectId(msg.character_id)),
                    content=msg.content,
                    sequence=i,
                    is_narrator=False
                )
                last_message = message
                logger.info(f"Created message {i}: {message.dict()}")
        except Exception as e:
            logger.error(f"Error creating messages: {str(e)}\n{traceback.format_exc()}")
            raise
        
        # 如果没有初始消息，创建一个空的系统消息作为第一条消息
        if not last_message:
            try:
                last_message = await ConversationMessage.create_character_message(
                    conversation=conversation,
                    character=await Character.get(PydanticObjectId(request.messages[0].character_id)),
                    content="",
                    sequence=1,
                    is_narrator=True
                )
                logger.info(f"Created initial system message: {last_message.dict()}")
            except Exception as e:
                logger.error(f"Error creating initial system message: {str(e)}\n{traceback.format_exc()}")
                raise
        
        response = CreateConversationResponse(
            id=str(conversation.id),
            story_id=str(story.id),
            status=conversation.status,
            created_at=conversation.created_at,
            last_message_id=str(last_message.id)
        )
        logger.info(f"Returning response: {response.dict()}")
        return response
        
    except Exception as e:
        error_msg = f"Failed to create conversation: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )

@router.get("/conversation/{story_id}")
async def check_conversation(
    story_id: str,
    current_user: User = Depends(get_current_user)
) -> dict:
    """检查用户是否有与特定故事的对话
    
    Args:
        story_id: 故事ID
        current_user: 当前用户
        
    Returns:
        dict: 包含conversation_id的字典，如果没有则为None
    """
    try:
        logger.info(f"Checking conversation for story_id={story_id}, user_id={current_user.id}")
        
        # 先获取故事对象
        story = await Story.get(PydanticObjectId(story_id))
        if not story:
            logger.error(f"Story not found: {story_id}")
            raise HTTPException(status_code=404, detail="Story not found")
        
        conversation = await Conversation.find_one({
            "story.$id": story.id,  # 使用 DBRef 的 id 字段
            "user_id": str(current_user.id),  # 确保 user_id 是字符串
            "status": "active"
        }, sort=[("created_at", -1)])
        
        logger.info(f"Found conversation: {conversation.id if conversation else None}")
        
        return {
            "conversation_id": str(conversation.id) if conversation else None
        }
    except Exception as e:
        logger.error(f"Error checking conversation: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check conversation: {str(e)}"
        ) 