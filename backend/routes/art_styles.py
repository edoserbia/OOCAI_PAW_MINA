from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from models.art_style import ArtStyle
from models.user import User
from utils.auth import get_current_user

router = APIRouter(
    prefix="/art-styles",
    tags=["art_styles"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/", response_model=List[ArtStyle])
async def get_art_styles(
    status: Optional[str] = Query(None, description="筛选状态：active/inactive"),
    current_user: User = Depends(get_current_user)
) -> List[ArtStyle]:
    """获取艺术风格列表
    
    Args:
        status: 可选，筛选状态 active/inactive
        current_user: 当前用户（通过依赖注入获取）
        
    Returns:
        List[ArtStyle]: 艺术风格列表
    """
    # 构建查询条件
    query = {}
    if status:
        query["status"] = status
        
    # 查询数据库
    art_styles = await ArtStyle.find(query).to_list()
    return art_styles 