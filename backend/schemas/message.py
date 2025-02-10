from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MessageBase(BaseModel):
    conversation_id: int
    role: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1)

class MessageInDB(MessageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MessageResponse(MessageInDB):
    pass

class UserMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

class AIMessageResponse(BaseModel):
    messages: list[MessageResponse]
    summary: Optional[str] = None
    status: str