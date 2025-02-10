from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from beanie import PydanticObjectId

from models.language import Language
from schemas.language import (
    LanguageCreate,
    LanguageResponse
)
from utils.auth import get_current_user

router = APIRouter()

@router.get("/languages", response_model=List[LanguageResponse])
async def get_languages(
    current_user = Depends(get_current_user)
):
    """获取所有语言
    
    Args:
        current_user: 当前登录用户
        
    Returns:
        List[LanguageResponse]: 语言列表
    """
    languages = await Language.find_all().to_list()
    
    return [
        LanguageResponse(
            id=str(language.id),
            language=language.language,
            created_at=language.created_at,
            updated_at=language.updated_at
        )
        for language in languages
    ]

@router.post("/languages", response_model=LanguageResponse)
async def create_language(
    language_data: LanguageCreate,
    current_user = Depends(get_current_user)
):
    """创建语言
    
    Args:
        language_data: 语言数据
        current_user: 当前登录用户
        
    Returns:
        LanguageResponse: 创建的语言
    """
    # 检查语言是否已存在
    existing = await Language.find_one({"language": language_data.language})
    if existing:
        raise HTTPException(status_code=400, detail="Language already exists")
    
    # 创建语言
    now = datetime.utcnow()
    language = Language(
        language=language_data.language,
        created_at=now,
        updated_at=now
    )
    await language.insert()
    
    return LanguageResponse(
        id=str(language.id),
        language=language.language,
        created_at=language.created_at,
        updated_at=language.updated_at
    )

@router.get("/languages/{language_id}", response_model=LanguageResponse)
async def get_language(
    language_id: str,
    current_user = Depends(get_current_user)
):
    """获取单个语言
    
    Args:
        language_id: 语言ID
        current_user: 当前登录用户
        
    Returns:
        LanguageResponse: 语言详情
    """
    try:
        language = await Language.get(PydanticObjectId(language_id))
    except:
        raise HTTPException(status_code=404, detail="Language not found")
    
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    return LanguageResponse(
        id=str(language.id),
        language=language.language,
        created_at=language.created_at,
        updated_at=language.updated_at
    )

@router.put("/languages/{language_id}", response_model=LanguageResponse)
async def update_language(
    language_id: str,
    language_data: LanguageCreate,
    current_user = Depends(get_current_user)
):
    """更新语言
    
    Args:
        language_id: 语言ID
        language_data: 更新的语言数据
        current_user: 当前登录用户
        
    Returns:
        LanguageResponse: 更新后的语言
    """
    try:
        language = await Language.get(PydanticObjectId(language_id))
    except:
        raise HTTPException(status_code=404, detail="Language not found")
    
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # 检查新语言名称是否已存在
    if language_data.language != language.language:
        existing = await Language.find_one({"language": language_data.language})
        if existing:
            raise HTTPException(status_code=400, detail="Language already exists")
    
    language.language = language_data.language
    language.updated_at = datetime.utcnow()
    await language.save()
    
    return LanguageResponse(
        id=str(language.id),
        language=language.language,
        created_at=language.created_at,
        updated_at=language.updated_at
    )

@router.delete("/languages/{language_id}", status_code=204)
async def delete_language(
    language_id: str,
    current_user = Depends(get_current_user)
):
    """删除语言
    
    Args:
        language_id: 语言ID
        current_user: 当前登录用户
    """
    try:
        language = await Language.get(PydanticObjectId(language_id))
    except:
        raise HTTPException(status_code=404, detail="Language not found")
    
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    await language.delete() 