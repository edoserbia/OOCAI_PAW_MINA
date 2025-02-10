from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CharacterBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    background: Optional[str] = None
    image_prompt: Optional[str] = None
    system_prompt: Optional[str] = None
    character_type: str = Field(..., pattern="^(narrator|character)$")

class CharacterCreate(CharacterBase):
    pass

class CharacterUpdate(CharacterBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    character_type: Optional[str] = Field(None, pattern="^(narrator|character)$")

class CharacterInDB(CharacterBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CharacterResponse(CharacterInDB):
    pass