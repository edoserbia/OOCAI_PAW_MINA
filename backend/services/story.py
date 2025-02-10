from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional

from models.story import Story
from schemas.story import StoryCreate, StoryUpdate
from services.character import CharacterService

class StoryService:
    @staticmethod
    def get_story(db: Session, story_id: int) -> Optional[Story]:
        return db.query(Story).filter(Story.id == story_id).first()

    @staticmethod
    def get_stories(db: Session, skip: int = 0, limit: int = 100) -> List[Story]:
        return db.query(Story).offset(skip).limit(limit).all()

    @staticmethod
    def create_story(db: Session, story: StoryCreate) -> Story:
        # 验证故事设置
        StoryService._validate_story_setting(db, story.setting)
        
        db_story = Story(**story.model_dump())
        try:
            db.add(db_story)
            db.commit()
            db.refresh(db_story)
            return db_story
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story creation failed"
            )

    @staticmethod
    def update_story(
        db: Session, 
        story_id: int, 
        story: StoryUpdate
    ) -> Optional[Story]:
        db_story = StoryService.get_story(db, story_id)
        if not db_story:
            return None

        # 如果更新包含setting，验证setting
        if story.setting:
            StoryService._validate_story_setting(db, story.setting)

        story_data = story.model_dump(exclude_unset=True)
        for key, value in story_data.items():
            setattr(db_story, key, value)

        try:
            db.commit()
            db.refresh(db_story)
            return db_story
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story update failed"
            )

    @staticmethod
    def delete_story(db: Session, story_id: int) -> bool:
        db_story = StoryService.get_story(db, story_id)
        if not db_story:
            return False
        
        try:
            db.delete(db_story)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story has active conversations and cannot be deleted"
            )

    @staticmethod
    def _validate_story_setting(db: Session, setting: dict) -> None:
        # 验证角色列表
        character_ids = setting.character_ids
        if not character_ids or character_ids[0] != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Story must start with narrator character (ID=1)"
            )

        # 验证所有角色是否存在
        for char_id in character_ids:
            if not CharacterService.get_character(db, char_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Character with ID {char_id} does not exist"
                )

        # 验证开场白
        opening_messages = setting.opening_messages
        if not opening_messages or opening_messages[0].character_id != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="First opening message must be from narrator character (ID=1)"
            )

        # 验证开场白中的角色是否都在角色列表中
        for msg in opening_messages:
            if msg.character_id not in character_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Character ID {msg.character_id} in opening messages is not in character list"
                )