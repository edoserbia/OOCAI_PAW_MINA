from pydantic import BaseModel, Field, conlist
from typing import Optional, List, Dict, Any
from datetime import datetime

class OpeningMessage(BaseModel):
    character_id: int
    content: str

class AgentConfig(BaseModel):
    system_prompt: str
    end_conditions: Optional[List[Dict[str, str]]] = None

class StoryAgents(BaseModel):
    role_selection: AgentConfig
    summary: AgentConfig
    finish: AgentConfig

class StoryConfig(BaseModel):
    history_length: int = Field(default=5, ge=1)
    summary_length: int = Field(default=200, ge=50)
    model: str = "qwen-plus"
    base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"

class StorySetting(BaseModel):
    background: str
    character_ids: conlist(int, min_length=1)  # 至少包含旁白角色
    opening_messages: List[OpeningMessage]
    agents: StoryAgents
    config: StoryConfig

class StoryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    setting: StorySetting

class StoryCreate(StoryBase):
    pass

class StoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    setting: Optional[StorySetting] = None

class StoryInDB(StoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StoryResponse(StoryInDB):
    pass