from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId
from beanie import PydanticObjectId

from models.character import Character
from models.conversation_message import ConversationMessage
from models.user import User
from models.story import Story
from utils.auth import get_current_user

router = APIRouter()

class CharacterUpdate(BaseModel):
    """角色更新请求模型"""
    name: Optional[str] = None
    description: Optional[str] = None
    personality: Optional[str] = None
    system_prompt: Optional[str] = None
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    icon_url: Optional[str] = None

class CharacterResponse(BaseModel):
    """角色响应模型"""
    id: str
    name: str
    description: str
    personality: str
    system_prompt: str
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    icon_url: Optional[str] = None
    created_at: str
    updated_at: str

class CharacterListResponse(BaseModel):
    """角色列表响应模型"""
    id: str
    name: str
    description: str
    personality: str
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    icon_url: Optional[str] = None
    created_at: str
    updated_at: str

@router.get("/characters/list", response_model=List[CharacterListResponse])
async def list_characters(current_user: User = Depends(get_current_user)):
    """获取用户创建的角色列表
    
    Args:
        current_user: 当前用户
        
    Returns:
        List[CharacterListResponse]: 角色列表
    """
    characters = await Character.get_user_characters(current_user.wallet_address)
    return [
        CharacterListResponse(
            id=str(char.id),
            name=char.name,
            description=char.description,
            personality=char.personality,
            image_prompt=char.image_prompt,
            image_url=char.image_url,
            icon_url=char.icon_url,
            created_at=char.created_at.isoformat(),
            updated_at=char.updated_at.isoformat()
        ) for char in characters
    ]

@router.get("/characters/{character_id}", response_model=CharacterResponse)
async def get_character(
    character_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取角色详情
    
    Args:
        character_id: 角色ID
        current_user: 当前用户
        
    Returns:
        CharacterResponse: 角色详情
    """
    character = await Character.get(ObjectId(character_id))
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    if character.created_by != current_user.wallet_address:
        raise HTTPException(status_code=403, detail="Not your character")
    
    return CharacterResponse(
        id=str(character.id),
        name=character.name,
        description=character.description,
        personality=character.personality,
        system_prompt=character.system_prompt,
        image_prompt=character.image_prompt,
        image_url=character.image_url,
        icon_url=character.icon_url,
        created_at=character.created_at.isoformat(),
        updated_at=character.updated_at.isoformat()
    )

@router.put("/characters/{character_id}", response_model=CharacterResponse)
async def update_character(
    character_id: str,
    update_data: CharacterUpdate,
    current_user: User = Depends(get_current_user)
):
    """更新角色信息
    
    Args:
        character_id: 角色ID
        update_data: 更新数据
        current_user: 当前用户
        
    Returns:
        CharacterResponse: 更新后的角色详情
    """
    character = await Character.get(ObjectId(character_id))
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    if character.created_by != current_user.wallet_address:
        raise HTTPException(status_code=403, detail="Not your character")
    
    # 只更新提供的字段
    update_dict = update_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(character, key, value)
    
    await character.save()
    
    return CharacterResponse(
        id=str(character.id),
        name=character.name,
        description=character.description,
        personality=character.personality,
        system_prompt=character.system_prompt,
        image_prompt=character.image_prompt,
        image_url=character.image_url,
        icon_url=character.icon_url,
        created_at=character.created_at.isoformat(),
        updated_at=character.updated_at.isoformat()
    )

@router.delete("/characters/{character_id}")
async def delete_character(
    character_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除角色
    
    Args:
        character_id: 角色ID
        current_user: 当前用户
        
    Returns:
        dict: 删除结果
    """
    # 获取角色
    character = await Character.get(PydanticObjectId(character_id))
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
        
    # 验证权限
    if character.created_by != current_user.wallet_address:
        raise HTTPException(status_code=403, detail="Not authorized to delete this character")
    
    # 从当前用户创建的故事中移除角色引用
    stories = await Story.find(
        {
            "created_by": current_user.wallet_address,
            "characters._id": PydanticObjectId(character_id)
        }
    ).to_list()
    
    for story in stories:
        story.characters = [c for c in story.characters if str(c.id) != character_id]
        await story.save()
    
    # 删除角色
    await character.delete()
    
    return {"message": "Character deleted successfully"}

@router.get("/narrator", response_model=CharacterListResponse)
async def get_narrator_character(
    current_user: User = Depends(get_current_user)
):
    """获取旁白角色
    
    Returns:
        CharacterListResponse: 旁白角色信息（不包含system_prompt）
    """
    # 使用Character模型查找旁白角色
    character = await Character.find_one({"character_type": "narrator"})
    
    if not character:
        raise HTTPException(
            status_code=404,
            detail="Narrator character not found"
        )
    
    return CharacterListResponse(
        id=str(character.id),
        name=character.name,
        description=character.description,
        personality=character.personality,
        image_prompt=character.image_prompt,
        image_url=character.image_url,
        icon_url=character.icon_url,
        created_at=character.created_at.isoformat(),
        updated_at=character.updated_at.isoformat()
    ) 