from typing import List
from fastapi import APIRouter, Depends, HTTPException
from models.prompt_template import PromptTemplate
from schemas.prompt_template import PromptTemplateResponse
from utils.auth import get_current_user

router = APIRouter()

@router.get("/prompt-templates/{type}", response_model=List[PromptTemplateResponse])
async def get_prompt_templates_by_type(
    type: str,
    current_user = Depends(get_current_user)
):
    """获取指定类型的提示词模板
    
    Args:
        type: 模板类型
        current_user: 当前登录用户
        
    Returns:
        List[PromptTemplateResponse]: 提示词模板列表
    """
    templates = await PromptTemplate.find({"type": type}).to_list()
    
    return [
        PromptTemplateResponse(
            prompt_id=template.prompt_id,
            type=template.type,
            content=template.content,
            created_at=template.created_at,
            updated_at=template.updated_at
        )
        for template in templates
    ] 