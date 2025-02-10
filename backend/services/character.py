from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional

from models.character import Character
from schemas.character import CharacterCreate, CharacterUpdate

class CharacterService:
    @staticmethod
    def get_character(db: Session, character_id: int) -> Optional[Character]:
        return db.query(Character).filter(Character.id == character_id).first()

    @staticmethod
    def get_characters(db: Session, skip: int = 0, limit: int = 100) -> List[Character]:
        return db.query(Character).offset(skip).limit(limit).all()

    @staticmethod
    def create_character(db: Session, character: CharacterCreate) -> Character:
        db_character = Character(**character.model_dump())
        try:
            db.add(db_character)
            db.commit()
            db.refresh(db_character)
            return db_character
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Character with this name already exists"
            )

    @staticmethod
    def update_character(
        db: Session, 
        character_id: int, 
        character: CharacterUpdate
    ) -> Optional[Character]:
        db_character = CharacterService.get_character(db, character_id)
        if not db_character:
            return None
        
        # 不允许修改旁白角色的类型
        if character_id == 1 and character.character_type is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change narrator character type"
            )

        character_data = character.model_dump(exclude_unset=True)
        for key, value in character_data.items():
            setattr(db_character, key, value)

        try:
            db.commit()
            db.refresh(db_character)
            return db_character
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Character update failed"
            )

    @staticmethod
    def delete_character(db: Session, character_id: int) -> bool:
        if character_id == 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete narrator character"
            )
            
        db_character = CharacterService.get_character(db, character_id)
        if not db_character:
            return False
        
        try:
            db.delete(db_character)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Character is being used in stories and cannot be deleted"
            )