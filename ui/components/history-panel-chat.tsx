'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { getHistoryMessages } from '@/services/story'
import { ChevronUp } from 'lucide-react'

interface HistoryMessage {
  id: string
  content: string
  character_id: string
  character?: string
  sequence: number
  created_at: string
  role?: 'user' | 'assistant'
}

interface HistoryPanelProps {
  conversationId: string | null
  characterDetails: Array<{
    id: string
    name: string
    description: string
    image_url?: string
    icon_url?: string
    character_type: string
  }>
  latestMessages?: Array<{
    type: 'user' | 'agent'
    content: string
    character?: string
    character_id?: string
  }>
  isResponseComplete?: boolean
}

export function HistoryPanel({ 
  conversationId, 
  characterDetails, 
  latestMessages,
  isResponseComplete 
}: HistoryPanelProps) {
  const [messages, setMessages] = useState<HistoryMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSequenceRef = useRef<number>(0)
  const isLoadingRef = useRef<boolean>(false)

  // 监听latestMessages的变化
  useEffect(() => {
    // 如果latestMessages为空数组，清空历史消息
    if (latestMessages && latestMessages.length === 0) {
      setMessages([]);
      setHasMore(true);
      lastSequenceRef.current = 0;
    }
  }, [latestMessages]);

  // 监听conversationId的变化
  useEffect(() => {
    // 如果conversationId为null，清空历史消息
    if (conversationId === null) {
      setMessages([]);
      setHasMore(true);
      lastSequenceRef.current = 0;
    }
  }, [conversationId]);

  // 加载历史消息
  const loadMessages = useCallback(async (lastMessageTime?: string) => {
    if (!conversationId || isLoadingRef.current) {
      console.log('[HistoryPanel] Skip loading messages:', { 
        conversationId, 
        isLoading: isLoadingRef.current 
      });
      return;
    }

    console.log('[HistoryPanel] Loading messages:', { 
      conversationId, 
      lastMessageTime,
      isResponseComplete 
    });

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      // 如果没有提供lastMessageTime，使用当前时间+2秒
      const queryTime = lastMessageTime || new Date(Date.now() + 2000).toISOString();
      const newMessages = await getHistoryMessages(conversationId, queryTime);
      console.log('[HistoryPanel] Received messages:', newMessages);
      
      if (!newMessages || newMessages.length === 0) {
        console.log('[HistoryPanel] No messages received');
        setHasMore(false);
        return;
      }

      setMessages(prevMessages => {
        // 为历史消息添加必要的字段
        const processedMessages: HistoryMessage[] = newMessages.map(msg => {
          // 查找角色名称
          const character = !msg.character_name || msg.character_name === 'null'
            ? 'You'
            : msg.character_name;

          return {
            id: msg.id,
            content: msg.content,
            character_id: msg.character_id || '',
            character: character,
            sequence: msg.sequence || 0,
            created_at: msg.created_at || new Date().toISOString(),
            role: !msg.character_name || msg.character_name === 'null' ? 'user' : 'assistant'
          };
        });

        console.log('[HistoryPanel] Processed messages:', processedMessages);

        // 合并消息并去重
        const combined = lastMessageTime 
          ? [...prevMessages, ...processedMessages]
          : processedMessages; // 如果是首次加载（没有lastMessageTime），直接使用新消息
        const unique = Array.from(new Map(combined.map(msg => [msg.id, msg])).values());
        const sorted = unique.sort((a, b) => a.sequence - b.sequence);

        console.log('[HistoryPanel] Final sorted messages:', sorted);
        return sorted;
      });

      // 如果返回的消息数量等于20，说明可能还有更多消息
      setHasMore(newMessages.length === 20);
    } catch (error) {
      console.error('[HistoryPanel] Failed to load history messages:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [conversationId, isResponseComplete]);

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    if (messages.length > 0) {
      const earliestMessage = messages[0]
      const lastMessageTime = new Date(earliestMessage.created_at)
      lastMessageTime.setSeconds(lastMessageTime.getSeconds() - 1)
      loadMessages(lastMessageTime.toISOString())
    }
  }, [messages, loadMessages])

  // 当所有response返回后，刷新历史消息
  useEffect(() => {
    console.log('[HistoryPanel] Response complete status changed:', { 
      isResponseComplete, 
      conversationId,
      messagesCount: messages.length,
      latestMessagesCount: latestMessages?.length 
    });

    // 只有当对话完成且有新消息时才刷新历史
    if (isResponseComplete && conversationId && latestMessages && latestMessages.length > 0) {
      console.log('[HistoryPanel] Loading all history messages after response complete');
      // 重新加载所有历史消息
      setMessages([]); // 清空当前消息，确保获取最新的完整历史
      loadMessages();
    }
  }, [isResponseComplete, conversationId, latestMessages, loadMessages]);

  // 当conversationId改变时初始化
  useEffect(() => {
    if (conversationId) {
      console.log('[HistoryPanel] ConversationId changed, initializing messages:', conversationId);
      setMessages([]);
      setHasMore(true);
      loadMessages();
    }
  }, [conversationId, loadMessages]);

  // 监听最新消息，但不直接更新UI
  useEffect(() => {
    if (latestMessages && latestMessages.length > 0) {
      console.log('[HistoryPanel] New messages received, waiting for response complete:', latestMessages)
    }
  }, [latestMessages])

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  // 将消息按对话分组
  const groupedMessages = messages.reduce<Array<HistoryMessage[]>>((groups, message) => {
    if (message.role === 'user') {
      groups.push([message])
    } else if (groups.length > 0) {
      // 将AI回复添加到最后一组
      groups[groups.length - 1].push(message)
    } else {
      // 如果没有用户消息组，创建一个新组
      groups.push([message])
    }
    return groups
  }, [])

  console.log('[HistoryPanel] Grouped messages:', groupedMessages)

  return (
    <div className="w-[calc(28rem*1.2)] h-full bg-gray-900/70 backdrop-blur-sm text-white overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <div className="text-xs text-gray-400">
          {messages.length} messages loaded
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6"
      >
        {hasMore && (
          <button
            onClick={handleLoadMore}
            className="w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <ChevronUp className="w-4 h-4" />
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        )}
        
        {!hasMore && messages.length > 0 && (
          <div className="text-center text-sm text-gray-500 py-2">
            No more history
          </div>
        )}

        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            {group.map((message) => (
              <div 
                key={message.id} 
                className={`space-y-1 ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}
              >
                <div 
                  className={`text-xs text-gray-400 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}
                >
                  {message.character}
                </div>
                <div 
                  className={`rounded-lg p-3 text-sm max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-gray-700/50' 
                      : 'bg-gray-800/50'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
      `}</style>
    </div>
  )
} 