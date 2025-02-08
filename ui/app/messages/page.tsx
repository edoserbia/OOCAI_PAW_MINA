'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  id: string
  type: 'like' | 'chat' | 'interaction'
  content: string
  timestamp: string
  storyTitle: string
  user?: {
    name: string
    avatar: string
  }
}

type MessagesPageProps = {
  markInteractionsAsRead: () => void;
};

// 模拟API调用
const fetchMessages = async (): Promise<Message[]> => {
  // 在实际应用中，这里应该是一个真正的API调用
  return [
    { id: '1', type: 'like', content: 'You liked', timestamp: '2023-05-15 14:30', storyTitle: 'The Adventure Begins' },
    { id: '2', type: 'chat', content: 'You participated in a chat', timestamp: '2023-05-14 09:15', storyTitle: 'Mystery in the Woods' },
    { id: '3', type: 'interaction', content: 'liked your story', timestamp: '2023-05-13 18:45', storyTitle: 'A Day in the Life', user: { name: 'John Doe', avatar: '/placeholder.svg' } },
    { id: '4', type: 'interaction', content: 'experienced your story agent', timestamp: '2023-05-12 10:30', storyTitle: 'The Time Traveler', user: { name: 'Alice Smith', avatar: '/placeholder.svg' } },
    { id: '5', type: 'interaction', content: 'interacted with your story agent', timestamp: '2023-05-11 16:20', storyTitle: 'The Detective', user: { name: 'Bob Johnson', avatar: '/placeholder.svg' } },
  ];
};

export default function MessagesPage({ markInteractionsAsRead }: MessagesPageProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true)
      try {
        const fetchedMessages = await fetchMessages()
        setMessages(fetchedMessages)
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [])

  const filterMessages = useCallback((type: 'like' | 'chat' | 'interaction') => {
    return messages.filter(message => message.type === type)
  }, [messages])

  const renderMessage = useCallback((message: Message) => (
    <div key={message.id} className="flex items-start space-x-4 p-4 hover:bg-gray-800 rounded-lg transition-colors">
      {message.type === 'interaction' && message.user && (
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={message.user.avatar} alt={message.user.name} />
          <AvatarFallback>{message.user.name[0]}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-white">
            {message.type === 'interaction' 
              ? message.content.includes('experienced') 
                ? `${message.user?.name} experienced your agent story`
                : `${message.user?.name} ${message.content}`
              : message.content
            }
          </p>
          <p className="text-sm text-amber-400">{message.storyTitle}</p>
        </div>
        <p className="text-xs text-gray-500">{message.timestamp}</p>
      </div>
    </div>
  ), [])

  const memoizedLikes = useMemo(() => filterMessages('like').map(renderMessage), [filterMessages, renderMessage])
  const memoizedChats = useMemo(() => filterMessages('chat').map(renderMessage), [filterMessages, renderMessage])
  const memoizedInteractions = useMemo(() => filterMessages('interaction').map(renderMessage), [filterMessages, renderMessage])

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-white">Loading messages...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>
        <Tabs defaultValue="likes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>
          <TabsContent value="likes">
            <ScrollArea className="h-[calc(100vh-200px)] rounded-md border border-gray-800">
              {memoizedLikes}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="chats">
            <ScrollArea className="h-[calc(100vh-200px)] rounded-md border border-gray-800">
              {memoizedChats}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="interactions">
            <ScrollArea className="h-[calc(100vh-200px)] rounded-md border border-gray-800">
              {memoizedInteractions}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

