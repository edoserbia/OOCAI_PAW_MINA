'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { StoryCard } from '@/components/story-card'
import { HistoryPanel } from '@/components/history-panel'
import { getStories, checkConversation, getHistoryMessages } from '@/services/story'

interface Story {
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
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [latestMessages, setLatestMessages] = useState<Array<{
    type: 'user' | 'agent';
    content: string;
    character?: string;
    character_id?: string;
  }>>([])
  const [isResponseComplete, setIsResponseComplete] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const lastScrollTime = useRef(Date.now())
  const currentPage = useRef(1)
  const isLoadingMore = useRef(false)
  const hasMoreStories = useRef(true)
  const prevStoryId = useRef<string | null>(null)

  // 加载故事列表
  const loadStories = useCallback(async (page: number) => {
    try {
      if (!hasMoreStories.current) return;
      
      console.log(`[Stories] Loading page ${page}...`);
      const data = await getStories(page)
      console.log(`[Stories] Loaded ${data.length} stories for page ${page}`);
      
      if (data.length === 0) {
        console.log('[Stories] No more stories available');
        hasMoreStories.current = false;
        return;
      }
      
      if (page === 1) {
        setStories(data)
      } else {
        setStories(prev => [...prev, ...data])
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to load stories:', err)
      setError('Failed to load stories')
      setLoading(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    loadStories(1)
  }, [loadStories])

  // 更新历史消息
  const updateChatHistory = useCallback(async (storyId: string) => {
    try {
      // 检查是否有conversation
      const conversationId = await checkConversation(storyId);
      
      // 如果没有conversation，保持历史消息为空
      if (!conversationId) {
        setCurrentConversationId(null);
        setLatestMessages([]);
        return;
      }
      
      // 如果有conversation，设置ID并获取历史消息
      setCurrentConversationId(conversationId);
      const historyMessages = await getHistoryMessages(conversationId);
      if (historyMessages && historyMessages.length > 0) {
        const formattedMessages = historyMessages
          .filter(msg => !msg.is_opening) // 过滤掉开场白消息
          .map(msg => ({
            type: msg.character_name === 'null' ? 'user' as const : 'agent' as const,
            content: msg.content,
            character: msg.character_name === 'null' ? undefined : 
                      msg.character_name === null ? undefined : msg.character_name,
            character_id: msg.character_id
          }));
        setLatestMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to update chat history:', error);
      // 发生错误时也清空历史消息
      setCurrentConversationId(null);
      setLatestMessages([]);
    }
  }, []);

  // 在故事切换时更新历史消息
  useEffect(() => {
    if (stories.length > 0 && currentStoryIndex >= 0 && currentStoryIndex < stories.length) {
      const currentStory = stories[currentStoryIndex];
      
      // 只有当故事ID真正改变时才更新历史
      if (currentStory.id !== prevStoryId.current) {
        console.log('[Stories] Story changed, updating history:', { 
          prevId: prevStoryId.current, 
          newId: currentStory.id 
        });
        
        // 更新前一个故事ID
        prevStoryId.current = currentStory.id;
        
        // 立即清空历史消息和会话ID
        setLatestMessages([]);
        setCurrentConversationId(null);
        
        // 获取新故事的对话历史
        updateChatHistory(currentStory.id);
      }
    }
  }, [currentStoryIndex, stories, updateChatHistory]);

  const scrollToNextStory = useCallback((direction: 'up' | 'down') => {
    if (isPanelOpen) return; // 如果面板打开，禁止滑动
    const now = Date.now()
    if (isScrollingRef.current || now - lastScrollTime.current < 300) return
    
    isScrollingRef.current = true
    lastScrollTime.current = now

    setCurrentStoryIndex(prevIndex => {
      let nextIndex
      if (direction === 'up') {
        nextIndex = Math.max(0, prevIndex - 1)
      } else {
        nextIndex = Math.min(stories.length - 1, prevIndex + 1)
      }
      
      // 如果到达倒数第二个故事，加载更多
      if (direction === 'down' && nextIndex >= stories.length - 2) {
        if (!isLoadingMore.current && hasMoreStories.current) {
          isLoadingMore.current = true
          currentPage.current += 1
          loadStories(currentPage.current).finally(() => {
            isLoadingMore.current = false
          })
        }
      }
      
      return nextIndex
    })

    setTimeout(() => {
      isScrollingRef.current = false
    }, 300)
  }, [isPanelOpen, stories.length, loadStories])

  // 监听当前索引，当接近末尾时预加载更多故事
  useEffect(() => {
    const remainingStories = stories.length - (currentStoryIndex + 1); // +1 因为currentStoryIndex是从0开始的
    console.log(`[Stories] Current index: ${currentStoryIndex}, Total stories: ${stories.length}, Remaining: ${remainingStories}`);
    console.log(`[Stories] Loading state: isLoadingMore=${isLoadingMore.current}, hasMore=${hasMoreStories.current}`);
    
    // 当剩余未浏览的故事小于等于3个时，预加载更多故事
    if (remainingStories <= 3 && !isLoadingMore.current && hasMoreStories.current) {
      console.log('[Stories] Triggering preload of next page');
      isLoadingMore.current = true;
      currentPage.current += 1;
      loadStories(currentPage.current).finally(() => {
        console.log('[Stories] Finished loading next page');
        isLoadingMore.current = false;
      });
    }
  }, [currentStoryIndex, stories.length, loadStories]);

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let touchStart = 0
    let touchEnd = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEnd = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      const swipeDistance = touchStart - touchEnd
      
      if (Math.abs(swipeDistance) > 50) {
        if (swipeDistance > 0) {
          scrollToNextStory('down')
        } else {
          scrollToNextStory('up')
        }
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.deltaY > 0) {
        scrollToNextStory('down')
      } else {
        scrollToNextStory('up')
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [scrollToNextStory])

  // 处理对话ID变化
  const handleConversationIdChange = (conversationId: string | null) => {
    setCurrentConversationId(conversationId)
    setLatestMessages([]) // 清空最新消息
    setIsResponseComplete(false) // 重置响应完成状态
  }

  // 处理新消息
  const handleNewMessages = useCallback((messages: Array<{
    type: 'user' | 'agent';
    content: string;
    character?: string;
    character_id?: string;
  }>) => {
    setLatestMessages(messages)
    // 当收到新消息时，设置响应完成状态为 true
    setIsResponseComplete(true)
  }, [])

  // 添加一个 useEffect 用于记录 HistoryPanel 的渲染信息
  useEffect(() => {
    console.log('[StoriesPage] Rendering HistoryPanel with:', {
      conversationId: currentConversationId,
      characterDetailsCount: stories[currentStoryIndex]?.characterDetails?.length,
      latestMessagesCount: latestMessages.length,
      isResponseComplete
    });
  }, [currentConversationId, currentStoryIndex, stories, latestMessages, isResponseComplete]);

  if (loading && stories.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading stories...</div>
      </div>
    )
  }

  if (error && stories.length === 0) {
    return (
      <div className="h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center backdrop-filter backdrop-blur-sm">
      <div className="flex gap-6 w-full max-w-[calc(28rem*1.2*2+2rem)] h-[calc(100vh-40px)]">
        <div className="flex-shrink-0 w-[calc(28rem*1.2)] h-full bg-gray-800 rounded-3xl overflow-hidden">
          <div 
            ref={containerRef}
            className="relative w-full h-full"
          >
            {stories.map((story, index) => (
              <div
                key={story.id}
                className="absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-out"
                style={{
                  transform: `translateY(${(index - currentStoryIndex) * 100}%)`,
                }}
              >
                <StoryCard 
                  {...story} 
                  onPanelOpenChange={setIsPanelOpen}
                  onConversationIdChange={handleConversationIdChange}
                  onNewMessages={handleNewMessages}
                />
              </div>
            ))}
          </div>
        </div>

        {/* History Panel */}
        <div className="flex-shrink-0 h-full rounded-3xl overflow-hidden">
          <HistoryPanel 
            conversationId={currentConversationId}
            characterDetails={stories[currentStoryIndex]?.characterDetails || []}
            latestMessages={latestMessages}
            isResponseComplete={isResponseComplete}
          />
        </div>
      </div>
    </div>
  )
}

