from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import traceback
import random
from models.other_agent import OtherAgent
from models.chat import HistoryMessage
from models.llm import LLM, LLMType
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionChunk
from models.conversation_message import MessageRole
import re
import asyncio


class ChatService:
    """对话服务
    
    处理用户输入、选择说话角色、生成角色回复等功能
    """
    
    def __init__(self):
        """初始化对话服务"""
        self.max_retries = 3  # 最大重试次数

    async def _get_llm_client(self, llm_type: LLMType) -> tuple[AsyncOpenAI, Dict[str, Any]]:
        """获取LLM客户端和配置
        
        Args:
            llm_type: LLM类型（other或chat）
            
        Returns:
            tuple: (OpenAI客户端, 模型参数字典)
            
        Raises:
            ValueError: 当找不到可用的LLM模型时
        """
        # 获取指定类型的所有LLM模型
        llms = await LLM.find({"type": llm_type}).to_list()
        if not llms:
            raise ValueError(f"No available LLM model found for type: {llm_type}")
        
        # 随机选择一个模型（简单的负载均衡）
        llm = random.choice(llms)
        
        # 创建OpenAI客户端
        client = AsyncOpenAI(
            api_key=llm.api_key,
            base_url=llm.settings.base_url or "https://api.openai.com/v1"
        )
        
        # 构建模型参数
        model_params = {
            "model": llm.settings.model,
            "temperature": llm.settings.temperature or 0.7,
            "max_tokens": llm.settings.max_tokens or 2000,
            "top_p": llm.settings.top_p or 1.0,
            "presence_penalty": llm.settings.presence_penalty or 0.0,
            "frequency_penalty": llm.settings.frequency_penalty or 0.0
        }
        
        return client, model_params

    async def select_next_speakers(
        self,
        history_length: int,
        history_messages: List[HistoryMessage],
        user_message: str,
        character_names: List[str]
    ) -> List[str]:
        """选择下一组说话的角色
        
        Args:
            history_length: 历史消息长度限制
            history_messages: 历史消息列表
            user_message: 用户输入的消息
            character_names: 可选的角色名称列表
            
        Returns:
            List[str]: 角色名称列表
            
        Raises:
            Exception: 当所有重试都失败时抛出异常
        """
        # 获取对话选择器的提示词
        speaker_selector = await OtherAgent.find_one({"agent_id": "speaker_selector"})
        if not speaker_selector:
            raise ValueError("Speaker selection agent not found")
            
        # 构建对话历史
        context = []
        for msg in history_messages[-history_length:]:
            if msg.role == MessageRole.USER:
                context.append(f"User: {msg.content}")
            elif msg.role == MessageRole.NARRATOR:
                context.append(f"Narrator: ({msg.content})")
            else:  # character
                context.append(f"{msg.character_name}: {msg.content}")
        
        # 添加用户最新消息
        context.append(f"User: {user_message}")
            
        # 替换提示词中的变量
        prompt = speaker_selector.system_prompt.replace(
            "{context}", "\n".join(context)
        ).replace(
            "{character_names}", f"[{', '.join(character_names)}]"
        )
        
        last_error = None
        for attempt in range(self.max_retries):
            try:
                # 获取LLM客户端和配置
                client, model_params = await self._get_llm_client(LLMType.OTHER)
                
                # 调用LLM选择说话角色
                response = await client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": prompt}
                    ],
                    **model_params
                )
                
                result = response.choices[0].message.content.strip()
                
                # 使用正则表达式提取[]中的内容
                pattern = r'\[(.*?)\]'
                matches = re.findall(pattern, result)
                
                if matches:
                    # 取第一个匹配的[]内容，并转换为列表
                    # 处理每个名称：去除空格和引号
                    selected_names = [name.strip().strip('"\'') for name in matches[0].split(',')]
                    
                    # 验证返回的角色名称是否都在可选列表中
                    if all(name in character_names for name in selected_names):
                        return selected_names
                    else:
                        print(f"Available character names: {character_names}")
                        print(f"Selected names after processing: {selected_names}")
                        raise ValueError(f"Invalid character names in response: {selected_names}")
                else:
                    raise ValueError(f"No character names found in brackets in response: {result}")
                    
            except Exception as e:
                last_error = e
                error_stack = traceback.format_exc()
                print(f"Attempt {attempt + 1} failed with error:\n{error_stack}")
                
                # 如果是最后一次尝试，使用备选方案
                if attempt == self.max_retries - 1:
                    print("All attempts failed, using fallback solution")
                    # 返回 Narrator 作为备选方案
                    return ["Narrator"]
        
        # 如果所有尝试都失败，抛出最后一个错误
        raise last_error

    async def generate_character_response(
        self,
        character_name: str,
        character_system_prompt: str,
        history_length: int,
        history_messages: List[HistoryMessage],
        user_message: str
    ) -> AsyncGenerator[str, None]:
        """生成角色回复
        
        Args:
            character_name: 角色名称
            character_system_prompt: 角色系统提示词
            history_length: 历史消息长度限制
            history_messages: 历史消息列表
            user_message: 用户输入的消息
            
        Yields:
            str: 生成的回复内容片段
            
        Raises:
            Exception: 当所有重试都失败时抛出异常
        """
        # 构建历史对话上下文
        context_messages = []
        
        # 添加历史消息
        for msg in history_messages[-history_length:]:
            if msg.role == MessageRole.USER:
                context_messages.append(f"用户：{msg.content}")
            elif msg.role == MessageRole.NARRATOR:
                # 移除已有的括号（如果有的话）
                content = msg.content.strip('（）()')
                context_messages.append(f"Narrator：（{content}）")
            else:  # character
                context_messages.append(f"{msg.character_name}：{msg.content}")
        
        # 添加用户最新消息
        context_messages.append(f"用户：{user_message}")
        
        # 将历史对话上下文拼接到character_prompt
        full_prompt = (
            f"{character_system_prompt}\n\n"
            "# 历史对话上下文\n"
            f"{chr(10).join(context_messages)}\n\n"
            f"你就是{character_name}，你直接生成需要说的话就行，要回应用户所说的最新的话（称呼用户应该是“你”或者'You'），不需要输出其他内容，也不需要{character_name}:来开头"
        )
        
        last_error = None
        for attempt in range(self.max_retries):
            try:
                # 获取LLM客户端和配置
                client, model_params = await self._get_llm_client(LLMType.CHAT)
                
                # 调用LLM生成回复
                stream = await client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": full_prompt}
                    ],
                    stream=True,
                    **model_params
                )
                
                # 用于累积完整的回复
                full_response = ""
                
                # 流式接收回复
                async for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        
                        # 检测语言
                        is_english = bool(re.search(r'[a-zA-Z]', content))
                        
                        
                        # 对每个chunk进行处理
                        # 如果是英文，保留空格，如果是中文，去除空格
                        # if not is_english:
                        #     content = re.sub(r'\s+', '', content)
                        content = re.sub(r'\[[^\]]*\]', '', content)
                        
                        # 如果是旁白，且这是第一个chunk，添加开始括号
                        if character_name == "Narrator" and not full_response.startswith("（"):
                            content = f"（{content}"
                            
                        # 如果是最后一个chunk且是旁白，添加结束括号
                        if character_name == "Narrator" and chunk.choices[0].finish_reason == "stop":
                            content = f"{content}）"
                            
                        # 发送处理后的chunk
                        yield content
                        
                        # 添加延迟以模拟打字效果
                        await asyncio.sleep(0.03)
                
                # 成功完成后返回
                return
                    
            except Exception as e:
                last_error = e
                error_stack = traceback.format_exc()
                print(f"Attempt {attempt + 1} failed with error:\n{error_stack}")
                
                # 如果不是最后一次尝试，继续重试
                if attempt < self.max_retries - 1:
                    continue
                    
                # 如果是最后一次尝试，抛出错误
                raise last_error 