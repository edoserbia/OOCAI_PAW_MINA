from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime

from models.music import Music
from models.user import User
from utils.auth import get_current_user

router = APIRouter()

class MusicCreate(BaseModel):
    """音乐创建请求模型"""
    name: str
    url: str
    type: str

class MusicUpdate(BaseModel):
    """音乐更新请求模型"""
    name: Optional[str] = None
    url: Optional[str] = None
    type: Optional[str] = None

class MusicResponse(BaseModel):
    """音乐响应模型"""
    id: str
    name: str
    url: str
    type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/music", response_model=dict)
async def get_music_list(type: Optional[str] = None):
    """获取音乐列表
    
    Args:
        type: 可选的音乐类型过滤
        
    Returns:
        包含音乐列表的字典
    """
    if type:
        music_list = await Music.get_music_by_type(type)
    else:
        music_list = await Music.get_all_music()
    
    return {
        "total": len(music_list),
        "items": music_list
    }

@router.get("/music/types", response_model=dict)
async def get_music_types():
    """获取所有音乐类型
    
    Returns:
        包含音乐类型列表的字典
    """
    # 从数据库中获取所有音乐
    music_list = await Music.get_all_music()
    # 提取所有不重复的类型
    types = list(set(music.type for music in music_list))
    return {"types": sorted(types)}

@router.get("/music/{music_id}", response_model=MusicResponse)
async def get_music_detail(music_id: str):
    """获取音乐详情
    
    Args:
        music_id: 音乐ID
        
    Returns:
        音乐详情
        
    Raises:
        HTTPException: 音乐不存在时抛出404错误
    """
    music = await Music.get(music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
    return music

@router.post("/music", response_model=MusicResponse, status_code=201)
async def create_music(
    music: MusicCreate,
    current_user: User = Depends(get_current_user)
):
    """创建新音乐
    
    Args:
        music: 音乐创建请求模型
        current_user: 当前登录用户
        
    Returns:
        创建的音乐详情
    """
    return await Music.create_music(
        name=music.name,
        url=music.url,
        type=music.type
    )

@router.put("/music/{music_id}", response_model=MusicResponse)
async def update_music(
    music_id: str,
    music_update: MusicUpdate,
    current_user: User = Depends(get_current_user)
):
    """更新音乐
    
    Args:
        music_id: 音乐ID
        music_update: 音乐更新请求模型
        current_user: 当前登录用户
        
    Returns:
        更新后的音乐详情
        
    Raises:
        HTTPException: 音乐不存在时抛出404错误
    """
    music = await Music.get(music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
    
    # 更新非空字段
    update_data = music_update.dict(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(music, key, value)
        music.updated_at = datetime.utcnow()
        await music.save()
    
    return music

@router.delete("/music/{music_id}", status_code=204)
async def delete_music(
    music_id: str,
    current_user: User = Depends(get_current_user)
):
    """删除音乐
    
    Args:
        music_id: 音乐ID
        current_user: 当前登录用户
        
    Raises:
        HTTPException: 音乐不存在时抛出404错误
    """
    music = await Music.get(music_id)
    if not music:
        raise HTTPException(status_code=404, detail="Music not found")
    
    await music.delete() 