from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OtherAgentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    system_prompt: str = Field(..., min_length=1)

class OtherAgentCreate(OtherAgentBase):
    pass

class OtherAgentUpdate(BaseModel):
    system_prompt: Optional[str] = Field(None, min_length=1)

class OtherAgentInDB(OtherAgentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OtherAgentResponse(OtherAgentInDB):
    pass 