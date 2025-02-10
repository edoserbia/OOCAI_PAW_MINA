from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional

from models.other_agent import OtherAgent
from schemas.other_agent import OtherAgentCreate, OtherAgentUpdate

class OtherAgentService:
    @staticmethod
    def get_agent_by_name(db: Session, name: str) -> Optional[OtherAgent]:
        """根据名称获取agent"""
        return db.query(OtherAgent).filter(OtherAgent.name == name).first()

    @staticmethod
    def get_agent(db: Session, agent_id: int) -> Optional[OtherAgent]:
        """根据ID获取agent"""
        return db.query(OtherAgent).filter(OtherAgent.id == agent_id).first()

    @staticmethod
    def get_agents(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[OtherAgent]:
        """获取agent列表"""
        return db.query(OtherAgent).offset(skip).limit(limit).all()

    @staticmethod
    def create_agent(db: Session, agent: OtherAgentCreate) -> OtherAgent:
        """创建新agent"""
        db_agent = OtherAgent(**agent.model_dump())
        try:
            db.add(db_agent)
            db.commit()
            db.refresh(db_agent)
            return db_agent
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent with this name already exists"
            )

    @staticmethod
    def update_agent(
        db: Session,
        agent_id: int,
        agent: OtherAgentUpdate
    ) -> Optional[OtherAgent]:
        """更新agent信息"""
        db_agent = OtherAgentService.get_agent(db, agent_id)
        if not db_agent:
            return None

        agent_data = agent.model_dump(exclude_unset=True)
        for key, value in agent_data.items():
            setattr(db_agent, key, value)

        try:
            db.commit()
            db.refresh(db_agent)
            return db_agent
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent update failed"
            )

    @staticmethod
    def delete_agent(db: Session, agent_id: int) -> bool:
        """删除agent"""
        db_agent = OtherAgentService.get_agent(db, agent_id)
        if not db_agent:
            return False
        
        try:
            db.delete(db_agent)
            db.commit()
            return True
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Agent deletion failed"
            ) 