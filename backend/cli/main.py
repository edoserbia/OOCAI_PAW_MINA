import sys
from pathlib import Path

# 将 backend 目录添加到 Python 路径，确保可以导入其他模块
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

# 加载环境变量配置
from dotenv import load_dotenv
load_dotenv(backend_dir / ".env")

# 导入所有模型以确保它们被正确注册到数据库
from models import *

import click
from typing import Optional
import asyncio
from rich.console import Console
from rich.prompt import Prompt
from rich.panel import Panel

from services.conversation import ConversationService
from services.story import StoryService
from config.database import SessionLocal
from models.conversation import Conversation
from schemas.conversation import ConversationCreate
from schemas.message import UserMessageCreate

# 创建控制台对象，用于美化输出
console = Console()

@click.group()
def cli():
    """多角色对话故事系统命令行工具"""
    pass

@cli.command()
@click.option('--story-id', type=int, required=True, help='故事ID')
def start_conversation(story_id: int):
    """
    开始一个新的对话
    
    工作流程：
    1. 创建数据库会话
    2. 根据故事ID创建新的对话
    3. 显示故事背景和开场白
    4. 进入交互式对话循环：
       - 获取用户输入
       - 处理用户消息
       - 显示AI角色回复
       - 如果需要继续对话，重复处理AI回复
    """
    db = SessionLocal()
    try:
        # 获取故事信息
        story = StoryService.get_story(db, story_id)
        if not story:
            raise click.ClickException("Story not found")
            
        # 获取角色信息
        characters = {
            char.id: char for char in 
            db.query(Character).filter(
                Character.id.in_(story.setting["character_ids"])
            ).all()
        }
        
        # 创建新对话
        conversation = ConversationService.create_conversation(
            db=db,
            conversation=ConversationCreate(story_id=story_id)
        )
        
        # 显示故事开始
        console.print("\n[bold]故事开始[/bold]\n")
        
        # 显示故事背景
        console.print(Panel(
            story.setting["background"],
            title="[故事背景]",
            border_style="blue"
        ))
        
        # 显示开场白消息
        for opening_msg in story.setting["opening_messages"]:
            character_id = opening_msg["character_id"]
            if character_id in characters:
                character = characters[character_id]
                console.print(Panel(
                    f"[{character.name}] {opening_msg['content']}",
                    title=f"[{character.name}]",
                    border_style="blue"
                ))
        
        # 开始交互式对话循环
        while True:
            # 获取用户输入
            user_input = Prompt.ask("\n[bold cyan]你的回复[/bold cyan]")
            
            # 检查是否退出对话
            if user_input.lower() in ['exit', 'quit', '退出']:
                console.print("[bold yellow]结束对话[/bold yellow]")
                break
                
            # 处理用户消息并获取AI回复
            is_user_turn = True  # 标记是否是用户的回合
            while True:
                # 如果不是用户回合，使用占位符消息
                current_input = user_input if is_user_turn else "[继续对话]"
                
                messages, need_user_input = ConversationService.add_user_message(
                    db=db,
                    conversation_id=conversation.id,
                    message=UserMessageCreate(content=current_input),
                    save_user_message=is_user_turn  # 只在用户回合保存消息
                )
                
                # 显示AI角色的回复消息
                for msg in messages:
                    # 构建标题，包含角色名称
                    title = f"[{msg['name']}]" if msg.get('name') else f"[{msg['role']}]"
                    
                    # 显示消息内容
                    console.print(Panel(
                        msg["content"],
                        title=title,
                        border_style="green"
                    ))
                
                # 如果需要用户输入，跳出内部循环
                if need_user_input:
                    break
                
                # 如果不需要用户输入，等待一小段时间后继续
                import time
                time.sleep(1)  # 等待1秒，让对话看起来更自然
                
                # 继续处理AI回复，这次不保存用户消息
                is_user_turn = False
                
    finally:
        # 确保数据库连接被正确关闭
        db.close()

@cli.command()
def list_stories():
    """
    列出所有可用的故事
    
    工作流程：
    1. 创建数据库会话
    2. 获取所有故事信息
    3. 格式化显示每个故事的详细信息
    """
    db = SessionLocal()
    try:
        # 获取所有可用故事
        stories = StoryService.get_stories(db)
        
        # 显示故事列表
        console.print("\n[bold]可用的故事列表：[/bold]\n")
        for story in stories:
            console.print(Panel(
                f"{story.description}\n\n"
                f"角色数量: {len(story.setting['character_ids'])}",
                title=f"[cyan]#{story.id} {story.title}[/cyan]",
                border_style="blue"
            ))
            
    finally:
        # 确保数据库连接被正确关闭
        db.close()

if __name__ == '__main__':
    cli()