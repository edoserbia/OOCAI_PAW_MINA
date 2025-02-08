'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStartedStories, checkConversation, getHistoryMessages } from '@/services/story';
import { Story } from '@/types/story';
import { StoryCard } from '@/components/story-card-chat';
import { HistoryPanel } from '@/components/history-panel-chat';

export default function ChatPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [latestMessages, setLatestMessages] = useState<Array<{
    type: 'user' | 'agent';
    content: string;
    character?: string;
    character_id?: string;
  }>>([]);
  const [isResponseComplete, setIsResponseComplete] = useState(false);

  // 加载故事数据和对话历史
  const loadStoryAndHistory = useCallback(async () => {
    try {
      // 加载故事数据
      const stories = await getStartedStories();
      const currentStory = stories.find(s => s.id === storyId);
      if (!currentStory) {
        setError('Story not found');
        setLoading(false);
        return;
      }
      setStory(currentStory);

      // 检查是否有现有对话
      const existingConversationId = await checkConversation(storyId);
      if (existingConversationId) {
        setCurrentConversationId(existingConversationId);
        
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
          
          // 设置最新消息
          setLatestMessages(formattedMessages);
          setIsResponseComplete(true);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load story and history:', err);
      setError('Failed to load story and history');
      setLoading(false);
    }
  }, [storyId]);

  // 初始加载
  useEffect(() => {
    loadStoryAndHistory();
  }, [loadStoryAndHistory]);

  // 处理对话ID变化
  const handleConversationIdChange = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    setLatestMessages([]); // 清空最新消息
    setIsResponseComplete(false); // 重置响应完成状态
  };

  // 处理新消息
  const handleNewMessages = useCallback((messages: Array<{
    type: 'user' | 'agent';
    content: string;
    character?: string;
    character_id?: string;
  }>) => {
    setLatestMessages(messages);
    setIsResponseComplete(true);
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading story...</div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Error: {error || 'Story not found'}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center backdrop-filter backdrop-blur-sm">
      <div className="flex gap-6 w-full max-w-[calc(28rem*1.2*2+2rem)] h-[calc(100vh-40px)]">
        <div className="flex-shrink-0 w-[calc(28rem*1.2)] h-full bg-gray-800 rounded-3xl overflow-hidden">
          <div className="relative w-full h-full">
            <StoryCard
              {...story}
              onPanelOpenChange={setIsPanelOpen}
              onConversationIdChange={handleConversationIdChange}
              onNewMessages={handleNewMessages}
              initialMessages={latestMessages} // 传递初始消息给 StoryCard
            />
          </div>
        </div>

        {/* History Panel */}
        <div className="flex-shrink-0 h-full rounded-3xl overflow-hidden">
          <HistoryPanel
            conversationId={currentConversationId}
            characterDetails={story.characterDetails}
            latestMessages={latestMessages}
            isResponseComplete={isResponseComplete}
          />
        </div>
      </div>
    </div>
  );
} 