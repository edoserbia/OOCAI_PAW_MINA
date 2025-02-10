from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional, Tuple, Dict

from models.conversation import Conversation
from models.message import Message
from models.story import Story
from models.character import Character
from schemas.conversation import ConversationCreate, ConversationUpdate
from schemas.message import MessageCreate, UserMessageCreate
from services.story import StoryService
from services.llm import LLMService

class ConversationService:
    # 缓存每个对话的LLM服务实例
    _llm_services: Dict[int, LLMService] = {}

    @staticmethod
    def get_conversation(db: Session, conversation_id: int) -> Optional[Conversation]:
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def get_conversations(
        db: Session, 
        story_id: Optional[int] = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Conversation]:
        query = db.query(Conversation)
        if story_id:
            query = query.filter(Conversation.story_id == story_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def create_conversation(db: Session, conversation: ConversationCreate) -> Conversation:
        # 验证故事是否存在
        story = StoryService.get_story(db, conversation.story_id)
        if not story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Story not found"
            )

        db_conversation = Conversation(**conversation.model_dump())
        try:
            db.add(db_conversation)
            db.commit()
            db.refresh(db_conversation)

            # 获取所有相关角色信息
            characters = {
                char.id: char for char in 
                db.query(Character).filter(
                    Character.id.in_(story.setting["character_ids"])
                ).all()
            }
            
            # 创建并缓存LLM服务实例
            ConversationService._llm_services[db_conversation.id] = LLMService(
                story_setting=story.setting,
                characters=characters,
                db=db
            )
            
            return db_conversation
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conversation creation failed"
            )

    @staticmethod
    def update_conversation(
        db: Session, 
        conversation_id: int, 
        conversation: ConversationUpdate
    ) -> Optional[Conversation]:
        db_conversation = ConversationService.get_conversation(db, conversation_id)
        if not db_conversation:
            return None

        conversation_data = conversation.model_dump(exclude_unset=True)
        for key, value in conversation_data.items():
            setattr(db_conversation, key, value)

        try:
            db.commit()
            db.refresh(db_conversation)
            return db_conversation
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conversation update failed"
            )

    @staticmethod
    def add_user_message(
        db: Session,
        conversation_id: int,
        message: UserMessageCreate,
        save_user_message: bool = True
    ) -> Tuple[List[Dict[str, str]], bool]:
        """添加用户消息并获取AI回复
        
        Args:
            db: 数据库会话
            conversation_id: 对话ID
            message: 用户消息
            save_user_message: 是否保存用户消息到数据库（角色继续对话时为False）
        
        Returns:
            Tuple[List[Dict[str, str]], bool]:
            - AI回复消息列表，每个消息包含：
              - role: 角色类型
              - content: 回复内容
              - name: 角色名称
              - character_id: 角色ID（如果是角色回复）
            - 是否需要用户输入（True表示需要用户输入，False表示角色会继续对话）
        """
        # 获取对话和故事信息
        conversation = ConversationService.get_conversation(db, conversation_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )

        # 获取缓存的LLM服务实例
        llm_service = ConversationService._llm_services.get(conversation_id)
        if not llm_service:
            # 如果没有缓存的实例（可能是服务重启），重新创建一个
            story = StoryService.get_story(db, conversation.story_id)
            characters = {
                char.id: char for char in 
                db.query(Character).filter(
                    Character.id.in_(story.setting["character_ids"])
                ).all()
            }
            llm_service = LLMService(
                story_setting=story.setting,
                characters=characters,
                db=db
            )
            ConversationService._llm_services[conversation_id] = llm_service
        
        try:
            # 只有在需要时才创建和保存用户消息
            if save_user_message:
                # 创建用户消息
                user_message = MessageCreate(
                    conversation_id=conversation_id,
                    role="user",
                    content=message.content
                )
                db_user_message = Message(**user_message.model_dump())
                db.add(db_user_message)
                db.commit()
            
            # 调用LLM服务处理用户消息
            ai_messages, need_user_input = llm_service.process_user_message(
                conversation=conversation,
                user_message=message.content if save_user_message else ""
            )

            # 保存AI回复消息
            db_ai_messages = []
            response_messages = []
            for ai_msg in ai_messages:
                # 创建数据库消息
                db_message = Message(
                    conversation_id=conversation_id,
                    role=ai_msg["role"],
                    content=ai_msg["content"],
                    name=ai_msg.get("name")
                )
                db.add(db_message)
                db_ai_messages.append(db_message)

                # 准备返回的消息
                response_msg = {
                    "role": ai_msg["role"],
                    "content": ai_msg["content"],
                    "name": ai_msg.get("name")
                }
                
                # 如果是角色回复，添加角色ID
                if ai_msg["role"].startswith("character_"):
                    character_id = int(ai_msg["role"].split("_")[1])
                    response_msg["character_id"] = character_id
                
                response_messages.append(response_msg)

            db.commit()
            return response_messages, need_user_input
            
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add user message"
            )

    @staticmethod
    def _add_opening_messages(
        db: Session,
        conversation: Conversation,
        story: Story
    ) -> List[Message]:
        messages = []
        # 获取所有角色信息
        characters = {
            char.id: char for char in 
            db.query(Character).filter(
                Character.id.in_(story.setting["character_ids"])
            ).all()
        }
        
        for opening_msg in story.setting["opening_messages"]:
            character_id = opening_msg["character_id"]
            character = characters.get(character_id)
            message = Message(
                conversation_id=conversation.id,
                role=f"character_{character_id}",
                content=opening_msg["content"],
                name=character.name if character else None
            )
            db.add(message)
            messages.append(message)
        db.commit()
        return messages