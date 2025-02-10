import os
from typing import List, Dict, Tuple, Optional
from openai import OpenAI
from sqlalchemy.orm import Session
from models.conversation import Conversation
from models.conversation_message import ConversationMessage
from models.character import Character
from models.story import Story
from services.other_agent import OtherAgentService
from services.story import StoryService
from config.settings import (
    OTHER_AGENT_MODEL,
    OTHER_AGENT_API_KEY,
    OTHER_AGENT_BASE_URL,
    OTHER_AGENT_TEMPERATURE
)

class LLMService:
    def __init__(self, story_setting: dict, characters: Dict[int, Character], db: Session):
        # 故事对话使用的 LLM 客户端
        self.client = OpenAI(
            api_key=story_setting["config"]["api_key"],
            base_url=story_setting["config"]["base_url"]
        )
        self.model = story_setting["config"]["model"]
        self.temperature = story_setting["config"]["temperature"]
        
        # other_agents 使用的 LLM 客户端
        self.other_agent_client = OpenAI(
            api_key=OTHER_AGENT_API_KEY,
            base_url=OTHER_AGENT_BASE_URL
        )
        self.other_agent_model = OTHER_AGENT_MODEL
        self.other_agent_temperature = OTHER_AGENT_TEMPERATURE
        
        self.setting = story_setting
        self.history_length = story_setting["config"]["history_length"]
        self.summary_length = story_setting["config"]["summary_length"]
        self.characters = characters
        self.db = db

        # 获取speaker_selection agent的系统提示词
        speaker_selection_agent = OtherAgentService.get_agent_by_name(db, "speaker_selection")
        
        if not speaker_selection_agent:
            raise ValueError("Required agent (speaker_selection) not found in database")
            
        self.speaker_selection_prompt = speaker_selection_agent.system_prompt

    def process_user_message(
        self,
        conversation: Conversation,
        user_message: str
    ) -> Tuple[List[Dict[str, str]], bool]:
        """处理用户消息并返回AI回复
        
        Returns:
            Tuple[List[Dict[str, str]], bool]: 
            - AI回复消息列表，每个消息包含：
              - role: 角色类型
              - content: 回复内容
              - name: 角色名称
              - character_id: 角色ID
            - 是否需要用户输入（True表示需要用户输入，False表示角色会继续对话）
        """
        # 获取对话历史并转换为API格式
        messages = self._get_conversation_history(conversation)
        api_messages = messages
        
        # 选择下一组说话的角色
        next_speakers = self._select_next_speakers(api_messages)
        
        # 生成所有选中角色的回复
        all_ai_messages = []
        for speaker in next_speakers:
            # 将之前的回复添加到API消息中
            current_api_messages = api_messages + [
                {"role": "assistant", "content": f"[{msg['name']}:] {msg['content']}"}
                for msg in all_ai_messages
            ]
            
            # 查找角色ID
            character_id = None
            for char_id, char in self.characters.items():
                if char.name == speaker:
                    character_id = char_id
                    break
                    
            if character_id is not None:
                ai_messages = self._generate_character_response(f"character_{character_id}", current_api_messages)
                all_ai_messages.extend(ai_messages)
            else:
                print(f"警告：未找到角色 {speaker}")  # 添加日志，方便调试
        
        # 所有选中的角色都回复完毕后，返回所有消息并指示需要用户输入
        return all_ai_messages, True

    def _get_conversation_history(self, conversation: Conversation) -> List[Dict[str, str]]:
        """获取对话历史，并将角色类型标准化
        
        如果历史对话不足 history_length，则包含：
        1. 系统消息（故事背景和角色描述）
        2. 开场白消息
        3. 历史对话
        
        如果历史对话超过 history_length，则只包含最近的 history_length 条对话
        """
        messages = []
        
        # 获取最近的对话历史
        recent_messages = conversation.messages[-self.history_length:]
        
        # 如果历史对话不足 history_length，添加背景和开场白
        if len(conversation.messages) <= self.history_length:
            # 添加故事背景和角色描述作为第一条系统消息
            story_background = self.setting.get("background", "")
            
            # 获取所有角色的描述（包括旁白）
            character_descriptions = []
            for char_id, char in self.characters.items():
                character_descriptions.append(f"- {char.name}：{char.description}")
            
            # 构建系统消息
            system_content = (
                f"故事背景：\n{story_background}\n\n"
                f"参与角色：\n" + "\n".join(character_descriptions)
            )
            messages.append({
                "role": "system",
                "content": system_content
            })
            
            # 添加开场白消息
            for opening_msg in self.setting.get("opening_messages", []):
                character_id = opening_msg["character_id"]
                if character_id in self.characters:
                    character = self.characters[character_id]
                    if character.character_type == "narrator":
                        messages.append({
                            "role": "assistant",
                            "content": f"[旁白:] （{opening_msg['content']}）"
                        })
                    else:
                        messages.append({
                            "role": "assistant",
                            "content": f"[{character.name}:] {opening_msg['content']}"
                        })
        
        # 添加对话历史
        for msg in recent_messages:
            content = msg.content.replace("\n", " ")  # 先处理换行
            
            # 如果是旁白角色，使用括号包裹内容
            if msg.role == "narrator":
                messages.append({
                    "role": "assistant",
                    "content": f"[旁白:] （{content}）"
                })
            # 如果是用户，使用 user 角色类型
            elif msg.role == "user":
                messages.append({
                    "role": "user",
                    "content": content
                })
            # 如果是其他角色，使用 assistant 角色类型，并在内容前加上角色名
            else:
                character_id = int(msg.role.split("_")[1])
                if character_id in self.characters:
                    character = self.characters[character_id]
                    messages.append({
                        "role": "assistant",
                        "content": f"[{character.name}:] {content}"
                    })
        return messages

    def _select_next_speakers(self, api_messages: List[Dict[str, str]]) -> List[str]:
        """选择下一组说话的角色
        
        Returns:
            List[str]: 角色名称列表
        """
        # 构建对话历史字符串
        context = []
        for msg in api_messages:
            if msg["role"] == "user":
                context.append(f"用户: {msg['content']}")
            elif msg["role"] == "assistant":
                # 从内容中提取角色名和对话内容
                import re
                match = re.match(r'\[([^\]]+):\]\s*(.+)', msg["content"])
                if match:
                    name, content = match.groups()
                    if name == "旁白":
                        context.append(f"旁白: {content}")
                    else:
                        context.append(f"{name}: {content}")
            elif msg["role"] == "system" and "故事背景" not in msg["content"]:
                context.append(msg["content"])

        # 构建可选角色列表
        available_roles = []
        for char in self.characters.values():
            available_roles.append(f"- {char.name}")
        
        # 将可选角色列表添加到提示词中
        prompt = self.speaker_selection_prompt.replace("{context}", "\n".join(context))
        prompt += "\n\n# 可选择的角色\n" + "\n".join(available_roles)
        
        # 使用 other_agent_client 调用 LLM 选择角色
        response = self.other_agent_client.chat.completions.create(
            model=self.other_agent_model,
            temperature=self.other_agent_temperature,
            messages=[
                {"role": "system", "content": prompt}
            ]
        )
        
        # 解析JSON响应
        import json
        try:
            result = json.loads(response.choices[0].message.content.strip())
            return result.get("speakers", [])
        except json.JSONDecodeError:
            # 如果解析失败，返回一个默认角色
            return [next(char.name for char in self.characters.values() if char.character_type != "narrator")]


    def _generate_character_response(
        self,
        character_role: str,
        api_messages: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """生成角色回复
        
        Returns:
            List[Dict[str, str]]: 包含以下字段的消息列表：
            - role: 角色类型 (narrator 或 character_X)
            - content: 回复内容
            - name: 角色名称
            - character_id: 角色ID
        """
        import re
        
        # 获取角色的system prompt
        character_id = int(character_role.split("_")[1])
        if character_id not in self.characters:
            raise ValueError(f"Character {character_id} not found")
            
        character = self.characters[character_id]
        
        # 构建历史对话上下文
        context_messages = []
               
        # 添加其他对话消息
        for msg in api_messages:
            if msg["role"] == "user":
                context_messages.append(f"用户：{msg['content']}")
            elif msg["role"] == "assistant":
                # 从内容中提取角色名和对话内容
                match = re.match(r'\[([^\]]+):\]\s*(.+)', msg["content"])
                if match:
                    name, content = match.groups()
                    if name == "旁白":
                        # 移除已有的括号（如果有的话）
                        content = content.strip('（）()') 
                        context_messages.append(f"旁白：（{content}）")
                    else:
                        context_messages.append(f"{name}：{content}")
        
        # 将历史对话上下文拼接到character_prompt
        full_prompt = (
            f"{character.system_prompt}\n\n"
            "# 历史对话上下文\n"
            f"{chr(10).join(context_messages)}\n\n"
        )

        # 生成回复
        response = self.client.chat.completions.create(
            model=self.model,
            temperature=self.temperature,
            messages=[
                {"role": "system", "content": full_prompt}
            ]
        )
        
        # 获取回复内容并处理
        content = response.choices[0].message.content.strip()
        
        # 移除所有换行
        content = content.replace("\n", " ")
        
        # 使用正则表达式移除所有 [XXX] 格式的文本
        content = re.sub(r'\[[^\]]*\]', '', content).strip()
        
        # 如果是旁白，用括号包裹内容
        if character.character_type == "narrator":
            content = f"（{content}）"
        
        # 构建回复消息
        return [{
            "role": character_role,  # 保持原有的role类型
            "content": content,
            "name": character.name,
            "character_id": character_id
        }]

    def _generate_summary(self, messages: List[Dict[str, str]]) -> Optional[str]:
        """生成对话摘要"""
        # 转换消息为API支持的格式
        api_messages = self._convert_to_api_messages(messages)

        system_prompt = self.setting["agents"]["summary"]["system_prompt"]
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                *api_messages
            ]
        )
        return response.choices[0].message.content