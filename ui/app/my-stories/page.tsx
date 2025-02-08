'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getStartedStories } from '@/services/story';
import { Story } from '@/types/story';
import Image from 'next/image';
import Link from 'next/link';

export default function MyStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentPage = useRef(1);
  const isLoadingMore = useRef(false);
  const hasMoreStories = useRef(true);

  // 加载故事列表
  const loadStories = useCallback(async (page: number) => {
    try {
      if (!hasMoreStories.current) return;
      
      console.log(`[MyStories] Loading page ${page}...`);
      const data = await getStartedStories(page);
      console.log(`[MyStories] Loaded ${data.length} stories for page ${page}`);
      
      if (data.length === 0) {
        console.log('[MyStories] No more stories available');
        hasMoreStories.current = false;
        return;
      }
      
      if (page === 1) {
        setStories(data);
      } else {
        setStories(prev => [...prev, ...data]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load stories:', err);
      setError('Failed to load stories');
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadStories(1);
  }, [loadStories]);

  // 处理滚动加载
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore.current || !hasMoreStories.current) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        isLoadingMore.current = true;
        currentPage.current += 1;
        loadStories(currentPage.current).finally(() => {
          isLoadingMore.current = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadStories]);

  if (loading && stories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading stories...</div>
      </div>
    );
  }

  if (error && stories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">No stories found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black p-8">
      <h1 className="text-3xl font-bold text-white mb-8">My Stories</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {stories.map((story) => (
          <Link 
            key={story.id} 
            href={`/chat/${story.id}`}
            className="block bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative h-48">
              {/* 背景图片 */}
              {story.background && (
                <Image
                  src={story.background}
                  alt={story.title}
                  fill
                  className="object-cover"
                />
              )}
              {/* 角色图片 */}
              {story.avatar_url && (
                <div className="absolute bottom-0 right-0 w-32 h-32">
                  <Image
                    src={story.avatar_url}
                    alt="Character"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold text-white mb-2">{story.title}</h2>
              <p className="text-gray-400 text-sm line-clamp-2">{story.intro}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <span>{story.characters} characters</span>
                  <span>•</span>
                  <span>{story.date}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>{story.likes} likes</span>
                  <span>{story.comments_count} comments</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {isLoadingMore.current && (
        <div className="text-center mt-8">
          <div className="text-white">Loading more stories...</div>
        </div>
      )}
    </div>
  );
} 