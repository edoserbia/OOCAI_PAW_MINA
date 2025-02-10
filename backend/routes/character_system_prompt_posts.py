from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from beanie import PydanticObjectId

from models.character_system_prompt_post import CharacterSystemPromptPost
from schemas.character_system_prompt_post import (
    CharacterSystemPromptPostCreate,
    CharacterSystemPromptPostResponse
)
from utils.auth import get_current_user

router = APIRouter()

@router.get("/system-prompt-posts", response_model=List[CharacterSystemPromptPostResponse])
async def get_system_prompt_posts(
    type: Optional[str] = Query(None, pattern="^(description|requirements)$"),
    language: Optional[str] = Query(None, pattern="^(中文|English)$"),
    current_user = Depends(get_current_user)
):
    """获取所有角色系统提示词补充
    
    Args:
        type: 可选，筛选类型：description/requirements
        language: 可选，筛选语言：中文/English
        current_user: 当前登录用户
    
    Returns:
        List[CharacterSystemPromptPostResponse]: 提示词补充列表
    """
    # 构建查询条件
    query = {}
    if type:
        query["type"] = type
    if language:
        query["language"] = language
        
    posts = await CharacterSystemPromptPost.find(query).to_list()
    
    return [
        CharacterSystemPromptPostResponse(
            id=str(post.id),
            type=post.type,
            language=post.language,
            content=post.content,
            created_at=post.created_at,
            updated_at=post.updated_at
        )
        for post in posts
    ]

@router.post("/system-prompt-posts", response_model=CharacterSystemPromptPostResponse)
async def create_system_prompt_post(
    post_data: CharacterSystemPromptPostCreate,
    current_user = Depends(get_current_user)
):
    """创建角色系统提示词补充
    
    Args:
        post_data: 提示词补充数据
        current_user: 当前登录用户
        
    Returns:
        CharacterSystemPromptPostResponse: 创建的提示词补充
    """
    now = datetime.utcnow()
    post = CharacterSystemPromptPost(
        type=post_data.type,
        language=post_data.language,
        content=post_data.content,
        created_at=now,
        updated_at=now
    )
    await post.insert()
    
    return CharacterSystemPromptPostResponse(
        id=str(post.id),
        type=post.type,
        language=post.language,
        content=post.content,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.get("/system-prompt-posts/{post_id}", response_model=CharacterSystemPromptPostResponse)
async def get_system_prompt_post(
    post_id: str,
    current_user = Depends(get_current_user)
):
    """获取单个角色系统提示词补充
    
    Args:
        post_id: 提示词补充ID
        current_user: 当前登录用户
        
    Returns:
        CharacterSystemPromptPostResponse: 提示词补充详情
    """
    try:
        post = await CharacterSystemPromptPost.get(PydanticObjectId(post_id))
    except:
        raise HTTPException(status_code=404, detail="System prompt post not found")
    
    if not post:
        raise HTTPException(status_code=404, detail="System prompt post not found")
    
    return CharacterSystemPromptPostResponse(
        id=str(post.id),
        type=post.type,
        language=post.language,
        content=post.content,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.put("/system-prompt-posts/{post_id}", response_model=CharacterSystemPromptPostResponse)
async def update_system_prompt_post(
    post_id: str,
    post_data: CharacterSystemPromptPostCreate,
    current_user = Depends(get_current_user)
):
    """更新角色系统提示词补充
    
    Args:
        post_id: 提示词补充ID
        post_data: 更新的提示词补充数据
        current_user: 当前登录用户
        
    Returns:
        CharacterSystemPromptPostResponse: 更新后的提示词补充
    """
    try:
        post = await CharacterSystemPromptPost.get(PydanticObjectId(post_id))
    except:
        raise HTTPException(status_code=404, detail="System prompt post not found")
    
    if not post:
        raise HTTPException(status_code=404, detail="System prompt post not found")
    
    post.type = post_data.type
    post.language = post_data.language
    post.content = post_data.content
    post.updated_at = datetime.utcnow()
    await post.save()
    
    return CharacterSystemPromptPostResponse(
        id=str(post.id),
        type=post.type,
        language=post.language,
        content=post.content,
        created_at=post.created_at,
        updated_at=post.updated_at
    )

@router.delete("/system-prompt-posts/{post_id}", status_code=204)
async def delete_system_prompt_post(
    post_id: str,
    current_user = Depends(get_current_user)
):
    """删除角色系统提示词补充
    
    Args:
        post_id: 提示词补充ID
        current_user: 当前登录用户
    """
    try:
        post = await CharacterSystemPromptPost.get(PydanticObjectId(post_id))
    except:
        raise HTTPException(status_code=404, detail="System prompt post not found")
    
    if not post:
        raise HTTPException(status_code=404, detail="System prompt post not found")
    
    await post.delete() 