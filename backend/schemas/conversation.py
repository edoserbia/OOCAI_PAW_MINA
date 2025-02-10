from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .message import MessageResponse

class ConversationBase(BaseModel):
    story_id: int
    status: str = Field(default="active", pattern="^(active|finished|error)$")
    summary: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(active|finished|error)$")
    summary: Optional[str] = None

class ConversationInDB(ConversationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(ConversationInDB):
    messages: List[MessageResponse] = []

class ConversationWithOpeningResponse(ConversationResponse):
    opening_messages: List[MessageResponse] = []