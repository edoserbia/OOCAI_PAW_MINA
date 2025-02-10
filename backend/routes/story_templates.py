from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from models.story_template import StoryTemplate
from config.mongodb import get_database
from bson import ObjectId

router = APIRouter()

@router.get("/story-templates", response_model=List[StoryTemplate])
async def get_story_templates(
    status: Optional[str] = Query(None, description="Filter by status (active/inactive)")
):
    """获取故事模板列表"""
    db = await get_database()
    query = {}
    if status:
        query["status"] = status

    templates = await db.story_templates.find(query).to_list(length=None)
    return [StoryTemplate.from_mongo(template) for template in templates]

@router.get("/story-templates/{template_id}", response_model=StoryTemplate)
async def get_story_template(template_id: str):
    """获取单个故事模板详情"""
    db = await get_database()
    template = await db.story_templates.find_one({"id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return StoryTemplate.from_mongo(template)

@router.post("/story-templates", response_model=StoryTemplate)
async def create_story_template(template: StoryTemplate):
    """创建新的故事模板"""
    db = await get_database()
    template_dict = template.to_mongo()
    template_dict["created_at"] = datetime.utcnow()
    template_dict["updated_at"] = datetime.utcnow()
    
    result = await db.story_templates.insert_one(template_dict)
    created_template = await db.story_templates.find_one({"_id": result.inserted_id})
    return StoryTemplate.from_mongo(created_template)

@router.put("/story-templates/{template_id}", response_model=StoryTemplate)
async def update_story_template(template_id: str, template: StoryTemplate):
    """更新故事模板"""
    db = await get_database()
    template_dict = template.to_mongo()
    template_dict["updated_at"] = datetime.utcnow()
    
    result = await db.story_templates.update_one(
        {"id": template_id},
        {"$set": template_dict}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
        
    updated_template = await db.story_templates.find_one({"id": template_id})
    return StoryTemplate.from_mongo(updated_template)

@router.delete("/story-templates/{template_id}")
async def delete_story_template(template_id: str):
    """删除故事模板"""
    db = await get_database()
    result = await db.story_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"} 