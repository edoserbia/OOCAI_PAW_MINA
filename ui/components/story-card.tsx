'use client'

import { useState, useRef, useEffect } from 'react'
import { Heart, MessageCircle, Share2, Bitcoin, Mic, Type, Send, Brackets, FileText } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Image from 'next/image'
import { CommentsPanel } from './comments-panel'
import { RewardPanel } from './reward-panel'
import { ThinkingAnimation } from './thinking-animation'
import { createConversation, selectSpeakers, generateResponse, getHistoryMessages, checkConversation } from '@/services/story'

interface StoryCardProps {
  id: string;
  title: string;
  intro: string;
  messages: Array<{
    content: string;
    character_id: string;
  }>;
  likes: string;
  rewards: string;
  background: string;
  date?: string;
  characters: number;
  avatar_url?: string;
  characterIcons: string[];
  characterDetails: Array<{
    id: string;
    name: string;
    description: string;
    image_url?: string;
    icon_url?: string;
    character_type: string;
  }>;
  backgroundMusic?: string;
  created_by: string;
  creator_name: string;
  comments_count: string;
  onPanelOpenChange: (isOpen: boolean) => void;
  onConversationIdChange: (conversationId: string | null) => void;
  onNewMessages: (messages: Array<{
    type: 'user' | 'agent';
    content: string;
    character?: string;
    character_id?: string;
  }>) => void;
  initialMessages?: Array<{
    type: 'user' | 'agent';
    content: string;
    character?: string;
    character_id?: string;
  }>;
}

interface HistoryMessage {
  id: string;
  content: string;
  role: string;
  character_name?: string;
  sequence: number;
  created_at: string;
}

export function StoryCard({ 
  id, 
  title, 
  intro, 
  messages, 
  likes, 
  rewards, 
  background,
  date,
  characters = 0,
  avatar_url,
  characterIcons,
  characterDetails,
  backgroundMusic,
  created_by,
  creator_name,
  comments_count,
  onPanelOpenChange,
  onConversationIdChange,
  onNewMessages,
  initialMessages = []
}: StoryCardProps) {
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const [isLiked, setIsLiked] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice')
  const [textInput, setTextInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'agent', content: string, character?: string, isOpening?: boolean}>>([
    // 开场白消息
    ...messages.map(msg => ({
      type: 'agent' as const,
      content: msg.content,
      character: characterDetails.find(char => char.id === msg.character_id)?.name || 'Unknown Character',
      isOpening: true
    })),
    // 历史对话中的最后一组消息（如果有）
    ...(initialMessages.length > 0 ? [
      // 找到最后一个用户消息的索引
      ...initialMessages.slice(Math.max(0, initialMessages.findLastIndex(msg => msg.type === 'user')))
    ] : [])
  ])

  const [voiceButtonColor, setVoiceButtonColor] = useState<'gray' | 'black' | 'white' | 'red'>('gray')
  const [voiceInputType, setVoiceInputType] = useState<'dialogue' | 'action' | 'cancel'>('dialogue')
  const [touchStartPosition, setTouchStartPosition] = useState({ x: 0, y: 0 })
  const voiceInputRef = useRef<string>('')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mousePosition = useMousePosition()
  const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false)
  const [isRewardPanelOpen, setIsRewardPanelOpen] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null)
  const [isInputDisabled, setIsInputDisabled] = useState(false)
  const [isIntroExpanded, setIsIntroExpanded] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isFirstResponse, setIsFirstResponse] = useState(true)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isResponseComplete, setIsResponseComplete] = useState(false)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, streamingMessage, isAiThinking])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPanelOpen) return;
    if (inputMode !== 'voice') return
    const touch = e.touches[0]
    setTouchStartPosition({ x: touch.clientX, y: touch.clientY })
    setVoiceButtonColor('black')
    setIsRecording(true)
    voiceInputRef.current = ''
    console.log('Recording started')
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (isPanelOpen || !isRecording) return;

    const buttonRect = buttonRef.current?.getBoundingClientRect();
    if (!buttonRect) return;

    const deltaX = clientX - touchStartPosition.x;
    const deltaY = clientY - touchStartPosition.y;

    if (deltaY < -20) {
      setVoiceButtonColor('red');
      setVoiceInputType('cancel');
      console.log('Cancel state activated');
    } else if (deltaY >= 0 && voiceInputType === 'cancel') {
      setVoiceButtonColor('black');
      setVoiceInputType('dialogue');
      console.log('Returned to dialogue state');
    } else if (Math.abs(deltaX) > 50) {
      setVoiceButtonColor('white');
      setVoiceInputType('action');
      console.log('Action state activated');
    } else {
      setVoiceButtonColor('black');
      setVoiceInputType('dialogue');
      console.log('Dialogue state activated');
    }
  };

  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (isRecording) {
        handleMove(e.clientX, e.clientY);
      }
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
    };
  }, [isRecording, handleMove]);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanelOpen) return;
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleInputEnd = () => {
    if (isPanelOpen) return
    if (!isRecording) return
    setIsRecording(false)
    setVoiceButtonColor('gray')

    console.log(`Input ended. Type: ${voiceInputType}`)

    const voiceResult = voiceInputRef.current || "This is a simulated voice message."

    if (voiceInputType === 'cancel') {
      console.log('Input cancelled')
    } else if (voiceInputType === 'action') {
      handleUserInput(`(${voiceResult})`)
    } else {
      handleUserInput(voiceResult)
    }

    setVoiceInputType('dialogue')
    voiceInputRef.current = ''
  }

  const handleTouchEnd = handleInputEnd

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanelOpen) return;
    if (inputMode !== 'voice') return
    setTouchStartPosition({ x: e.clientX, y: e.clientY })
    setVoiceButtonColor('black')
    setIsRecording(true)
    voiceInputRef.current = ''
    console.log('Mouse down, recording started')
  }

  useEffect(() => {
    const handleDocumentMouseUp = () => {
      if (isRecording) {
        handleInputEnd();
      }
    };

    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [isRecording, handleInputEnd]);

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        voiceInputRef.current += 'Simulating voice input...'
      }, 500)
      return () => clearInterval(interval)
    }
  }, [isRecording])

  const handleSendText = () => {
    if (textInput.trim()) {
      handleUserInput(textInput.trim())
      setTextInput('')
    }
  }

  const addMessage = (type: 'user' | 'agent', content: string, character?: string, character_id?: string) => {
    setChatMessages(prevMessages => {
      if (type === 'agent') {
        // 如果是AI回复，添加到当前轮次
        const lastUserMessage = prevMessages[prevMessages.length - 1];
        const newMessages = [
          lastUserMessage, // 只保留最后一条用户消息
          {
            type,
            content,
            character: character || 'Unknown Character',
            character_id
          }
        ]
        // 在所有AI回复完成后，在useEffect中更新历史记录
        return newMessages
      } else {
        // 如果是用户消息，开始新的轮次，不保留开场白
        return [{ type, content }]
      }
    })
  }

  // 使用useEffect监听chatMessages的变化，当有完整对话时更新历史记录
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1]
    if (lastMessage?.type === 'agent') {
      // 只有当最后一条消息是AI回复时，才更新历史记录
      console.log('[StoryCard] Updating history with messages:', chatMessages)
      onNewMessages(chatMessages)
    }
  }, [chatMessages, onNewMessages])

  const handleUserInput = async (content: string) => {
    try {
      let currentConversationId = conversationId;
      
      // 重置响应完成状态
      setIsResponseComplete(false)
      
      // 如果没有conversationId，说明是第一次对话，需要创建对话
      if (!currentConversationId) {
        // 创建对话时传入初始消息
        const conversation = await createConversation(
          id,
          messages.map(msg => ({
            content: msg.content,
            character_id: msg.character_id
          }))
        )
        currentConversationId = conversation.id
        setConversationId(conversation.id)
        setLastMessageId(conversation.last_message_id)
        onConversationIdChange(conversation.id)
      }

      // 添加用户消息到UI
      addMessage('user', content)

      setIsAiThinking(true)
      setIsInputDisabled(true)

      // 获取最新的历史消息，使用当前时间+2秒作为last_message_time
      const futureTime = new Date(Date.now() + 2000)
      // 确保使用UTC时间，格式为: YYYY-MM-DDTHH:mm:ss.SSSZ
      const lastMessageTime = futureTime.toISOString()
      let currentHistoryMessages = await getHistoryMessages(currentConversationId, lastMessageTime)
      
      console.log('获取历史消息时间:', lastMessageTime)
      console.log('获取到的历史消息:', currentHistoryMessages)
      
      // 选择说话角色
      const { speakers } = await selectSpeakers({
        history_length: 25,
        user_message: content,
        history_messages: currentHistoryMessages ? 
          currentHistoryMessages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            character_name: msg.character_name,
            sequence: msg.sequence,
            created_at: msg.created_at
          })) : [],
        character_names: characterDetails.map(char => char.name)
      })
      
      console.log('选择的说话者:', speakers)

      // 依次让每个选中的角色生成回复
      for (let i = 0; i < speakers.length; i++) {
        const speakerName = speakers[i]
        console.log(`正在生成第 ${i + 1} 个角色 ${speakerName} 的回复`)

        // 获取选中角色的ID
        const selectedCharacter = characterDetails.find(char => char.name === speakerName)
        if (!selectedCharacter) {
          throw new Error(`Character not found with name: ${speakerName}`)
        }
        const characterId = selectedCharacter.id

        // 如果不是第一个角色，需要重新获取最新的历史消息
        if (i > 0) {
          const futureTime = new Date(Date.now() + 2000)
          const lastMessageTime = futureTime.toISOString()
          currentHistoryMessages = await getHistoryMessages(currentConversationId, lastMessageTime)
        }

        // 生成回复
        const aiResponse = await generateResponse({
          history_length: 25,
          character_id: characterId,
          user_message: content,
          history_messages: currentHistoryMessages ? 
            currentHistoryMessages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              character_name: msg.character_name,
              sequence: msg.sequence,
              created_at: msg.created_at
            })) : [],
          conversation_id: currentConversationId,
          last_message_id: currentHistoryMessages[currentHistoryMessages.length - 1]?.id || lastMessageId,
          is_first_response: i === 0
        })

        const reader = aiResponse.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        let responseText = ''
        setStreamingMessage('')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const cleanedChunk = chunk.replace(/data: /, '').trim()
          if (cleanedChunk && !cleanedChunk.startsWith('ERROR:')) {
            responseText += cleanedChunk
            setStreamingMessage(responseText)
          }
        }

        // 清除流式消息
        setStreamingMessage(null)

        // 将AI回复添加到消息列表中
        addMessage('agent', responseText, selectedCharacter.name, characterId)
      }

      // 所有角色都回复完成后，设置响应完成状态
      setIsResponseComplete(true)
      console.log('[StoryCard] All responses complete, setting isResponseComplete to true')

      setIsFirstResponse(false)
    } catch (error) {
      console.error('[StoryCard] Failed to generate response:', error)
    } finally {
      setIsAiThinking(false)
      setIsInputDisabled(false)
      setStreamingMessage(null)
    }
  }

  const toggleInputMode = () => {
    setInputMode(prevMode => prevMode === 'voice' ? 'text' : 'voice')
  }

  const handleBracketsClick = () => {
    const input = document.getElementById('chat-input') as HTMLInputElement;
    const newValue = textInput.startsWith('(') ? textInput : `(${textInput})`;
    setTextInput(newValue);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newValue.length - 1, newValue.length - 1);
    }, 0);
  };

  function useMousePosition() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
      const updateMousePosition = (ev: MouseEvent) => {
        setMousePosition({ x: ev.clientX, y: ev.clientY });
      };

      window.addEventListener('mousemove', updateMousePosition);

      return () => {
        window.removeEventListener('mousemove', updateMousePosition);
      };
    }, []);

    return mousePosition;
  }

  const openCommentsPanel = () => {
    setIsCommentsPanelOpen(true);
    setIsPanelOpen(true);
    onPanelOpenChange(true);
  };

  const openRewardPanel = () => {
    setIsRewardPanelOpen(true);
    setIsPanelOpen(true);
    onPanelOpenChange(true);
  };

  const closePanel = () => {
    setIsCommentsPanelOpen(false);
    setIsRewardPanelOpen(false);
    setIsPanelOpen(false);
    onPanelOpenChange(false);
  };

  // 获取故事的对话历史
  const fetchConversationHistory = async (storyId: string) => {
    try {
      // 先检查是否有现有的对话
      const existingConversationId = await checkConversation(storyId);
      
      if (existingConversationId) {
        onConversationIdChange(existingConversationId);
        
        // 获取历史消息，使用当前时间+2秒作为last_message_time
        const futureTime = new Date(Date.now() + 2000);
        const lastMessageTime = futureTime.toISOString();
        const historyMessages = await getHistoryMessages(existingConversationId, lastMessageTime);
        
        if (historyMessages && historyMessages.length > 0) {
          // 转换历史消息格式
          const formattedMessages = historyMessages
            .filter(msg => !msg.is_opening) // 过滤掉开场白消息
            .map(msg => ({
              type: msg.character_name === 'null' ? 'user' as const : 'agent' as const,
              content: msg.content,
              character: msg.character_name === 'null' ? undefined : msg.character_name,
              character_id: msg.character_id
            }));
          
          // 更新消息列表
          setChatMessages([
            ...messages.map(msg => ({
              type: 'agent' as const,
              content: msg.content,
              character: characterDetails.find(char => char.id === msg.character_id)?.name || 'Unknown Character',
              isOpening: true
            })),
            ...formattedMessages
          ]);
          
          // 通知父组件新消息
          onNewMessages(formattedMessages);
        } else {
          // 如果没有历史消息，只显示开场白
          setChatMessages([
            ...messages.map(msg => ({
              type: 'agent' as const,
              content: msg.content,
              character: characterDetails.find(char => char.id === msg.character_id)?.name || 'Unknown Character',
              isOpening: true
            }))
          ]);
        }
      } else {
        // 如果没有对话，只显示开场白
        setChatMessages([
          ...messages.map(msg => ({
            type: 'agent' as const,
            content: msg.content,
            character: characterDetails.find(char => char.id === msg.character_id)?.name || 'Unknown Character',
            isOpening: true
          }))
        ]);
        onConversationIdChange(null);
      }
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
    }
  };

  // 在组件挂载和故事ID变化时获取对话历史
  useEffect(() => {
    if (id) {
      console.log('[StoryCard] Fetching conversation history for story:', id);
      fetchConversationHistory(id);
    }
  }, [id]);

  return (
    <div className="w-full h-full relative">
      {/* Background Image */}
      <div 
        className="w-full h-full relative"
        style={{
          backgroundImage: `url('${background}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Character Avatar Image (in front of background) */}
        {avatar_url && (
          <div 
            className="absolute inset-0 flex items-end justify-center"
          >
            <div
              className="h-[80%] relative"
              style={{
                backgroundImage: `url('${avatar_url}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'bottom center',
                backgroundRepeat: 'no-repeat',
                opacity: '0.95',
                width: 'auto',
                aspectRatio: '1/2',
              }}
            />
          </div>
        )}

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 flex flex-col justify-between p-6">
          {/* Enhanced Title Section */}
          <div className="mt-10">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center space-y-1">
              {/* Title */}
              <div className="w-full text-center">
                <h3 className="text-lg font-semibold text-white bg-black/60 backdrop-blur-sm rounded-lg py-2 px-4 inline-block">
                  {title}
                </h3>
              </div>

              {/* Character Icons */}
              {characterIcons.length > 0 && (
                <div className="flex gap-2 justify-center my-2 flex-wrap">
                  {characterIcons.map((iconUrl, i) => (
                    <div key={i} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
                      <Image
                        src={iconUrl}
                        alt={`Character ${i + 1}`}
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Story intro */}
              <div className="flex items-start space-x-2">
                <FileText className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className={`text-white text-left text-sm ${!isIntroExpanded ? 'line-clamp-2' : ''}`}>
                    {intro}
                  </p>
                  {intro.length > 150 && (
                    <button 
                      onClick={() => setIsIntroExpanded(!isIntroExpanded)}
                      className="text-blue-400 text-sm hover:text-blue-300 transition-colors mt-1"
                    >
                      {isIntroExpanded ? 'Less' : 'More'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Messages Section */}
          <div className="flex-grow flex flex-col justify-end mb-52">
            <div 
              className={`space-y-3 max-h-[calc(100vh-450px)] pr-2 pt-4 ${
                isAiThinking || streamingMessage 
                  ? 'overflow-hidden' 
                  : 'overflow-y-auto custom-scrollbar'
              }`}
              ref={messagesEndRef}
              onWheel={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.3);
                  border-radius: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.4);
                }
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.5);
                }
              `}</style>
              {chatMessages.map((message, index) => (
                <div 
                  key={index}
                  className={`flex ${message.type === 'agent' ? 'justify-start' : 'justify-end'} mb-2`}
                >
                  <div 
                    className={`rounded-2xl px-4 py-2 max-w-[80%] relative ${
                      message.type === 'agent'
                        ? 'bg-gray-200/70' // 所有消息都使用70%透明度
                        : 'bg-gray-900/70'   // 用户消息透明
                    }`}
                  >
                    {message.type === 'agent' && message.character && (
                      <div className="absolute -top-3 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white">
                        {message.character}
                      </div>
                    )}
                    {message.content.split(/($$[^)]+$$)/).map((part, i) => (
                      <span 
                        key={i} 
                        className={
                          part.startsWith('(') && part.endsWith(')')
                            ? message.type === 'agent' 
                              ? 'text-gray-500' 
                              : 'text-gray-400'    
                            : message.type === 'agent'
                              ? 'text-black'    
                              : 'text-white'    
                        }
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex justify-start mb-2">
                  <div className="rounded-2xl px-4 py-2 bg-gray-200">
                    <ThinkingAnimation />
                  </div>
                </div>
              )}
              {streamingMessage !== null && (
                <div className="flex justify-start mb-2">
                  <div className="rounded-2xl px-4 py-2 bg-gray-200 max-w-[80%] relative">
                    <div className="absolute -top-3 left-2 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white">
                      {(() => {
                        const characterIndex = Math.floor((chatMessages.length + 1) / 2);
                        const character = characterDetails[characterIndex];
                        return character ? character.name : `Character ${characterIndex + 1}`;
                      })()}
                    </div>
                    {streamingMessage.split(/($$[^)]+$$)/).map((part, i) => (
                      <span 
                        key={i} 
                        className={
                          part.startsWith('(') && part.endsWith(')')
                            ? 'text-gray-300'
                            : 'text-black'
                        }
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-6">
            {/* User Info and Actions */}
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border border-white/20">
                  <AvatarImage src="https://img.oocstorage.icu/file/oocstorage/paw_logo.png" />
                  <AvatarFallback>BJ</AvatarFallback>
                </Avatar>
                <div className="text-white text-sm">
                  <div className="font-medium">{creator_name}</div>
                  <div className="text-xs text-white/60">{formatWalletAddress(created_by)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-6">
                <button 
                  className="flex flex-col items-center"
                  onClick={openRewardPanel}
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full">
                    <Bitcoin className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-white text-xs">Reward</span>
                </button>

                <button 
                  className="flex flex-col items-center"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full">
                    <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                  </div>
                  <span className="text-white text-xs">{likes}</span>
                </button>

                <button 
                  className="flex flex-col items-center"
                  onClick={openCommentsPanel}
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-xs">{comments_count}</span>
                </button>

                <button className="flex flex-col items-center">
                  <div className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-full">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                </button>
              </div>
            </div>

            {/* Input Section */}
            <div className="space-y-2">
              {inputMode === 'voice' ? (
                <div className="flex items-center gap-2">
                  <button
                    ref={buttonRef}
                    className={`flex-1 h-12 px-6 rounded-full backdrop-blur-sm flex items-center justify-center gap-2 transition-colors
                      ${voiceButtonColor === 'gray' ? 'bg-gray-300 text-gray-700' :
                        voiceButtonColor === 'black' ? 'bg-black text-white' : 
                        voiceButtonColor === 'white' ? 'bg-white text-black' : 
                        'bg-red-500 text-white'}
                      ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onTouchStart={isInputDisabled ? undefined : handleTouchStart}
                    onTouchMove={isInputDisabled ? undefined : handleTouchMove}
                    onTouchEnd={isInputDisabled ? undefined : handleTouchEnd}
                    onMouseDown={isInputDisabled ? undefined : handleMouseDown}
                    disabled={isInputDisabled}
                  >
                    <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">
                      {isRecording ? 
                        (voiceInputType === 'dialogue' ? 'Recording...' : 
                         voiceInputType === 'action' ? 'Recording action...' : 
                         'Slide down to cancel') : 
                        'Hold to speak'}
                    </span>
                  </button>
                  <button
                    onClick={toggleInputMode}
                    className={`w-12 h-12 flex items-center justify-center bg-gray-200/80 text-gray-900 rounded-full ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Switch to text input"
                    disabled={isInputDisabled}
                  >
                    <Type className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    id="chat-input"
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isInputDisabled) {
                        e.preventDefault();
                        handleSendText();
                      }
                    }}
                    placeholder="Type your message..."
                    className={`flex-1 h-12 px-4 rounded-full bg-gray-200/80 text-gray-900 placeholder-gray-500 ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isInputDisabled}
                  />
                  <button
                    onClick={handleBracketsClick}
                    className={`w-12 h-12 flex items-center justify-center bg-gray-200/80 text-gray-900 rounded-full ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Add parentheses"
                    disabled={isInputDisabled}
                  >
                    <Brackets className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleInputMode}
                    className={`w-12 h-12 flex items-center justify-center bg-gray-200/80 text-gray-900 rounded-full ${isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Switch to voice input"
                    disabled={isInputDisabled}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-center text-white/70">Remember: Everything PAW says is just for fun!</p>
            </div>
          </div>
        </div>
      </div>
      <CommentsPanel 
        isOpen={isCommentsPanelOpen} 
        onClose={closePanel} 
      />
      <RewardPanel
        isOpen={isRewardPanelOpen}
        onClose={closePanel}
        totalRewards={rewards}
      />
    </div>
  )
}

