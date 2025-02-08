'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const scrollbarHideStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }
`;

interface Reply {
  id: number
  user: string
  avatar: string
  content: string
  likes: number
  time: string
  isAuthor?: boolean
  isLiked: boolean
  replyTo: {
    user: string;
    commentId: number;
  };
}

interface Comment {
  id: number
  user: string
  avatar: string
  content: string
  likes: number
  time: string
  isAuthor?: boolean
  isLiked: boolean
  replies: Reply[]
  isExpanded: boolean;
}

interface CommentsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function CommentsPanel({ isOpen, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: 'User1',
      avatar: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-2-7Csmt4QTEimQiNe5rtjKP8ltLSmy7w.png',
      content: 'This is a main comment',
      likes: 10,
      time: '2 hours ago',
      isAuthor: true,
      isLiked: false,
      isExpanded: false,
      replies: [
        {
          id: 2,
          user: 'User2',
          avatar: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-2-7Csmt4QTEimQiNe5rtjKP8ltLSmy7w.png',
          content: 'This is a reply to the main comment',
          likes: 5,
          time: '1 hour ago',
          isAuthor: false,
          isLiked: false,
          replyTo: {
            user: 'User1',
            commentId: 1
          }
        },
        {
          id: 3,
          user: 'User3',
          avatar: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-2-7Csmt4QTEimQiNe5rtjKP8ltLSmy7w.png',
          content: 'This is another reply to the main comment',
          likes: 2,
          time: '30 minutes ago',
          isAuthor: false,
          isLiked: false,
          replyTo: {
            user: 'User1',
            commentId: 1
          }
        }
      ]
    },
    {
      id: 4,
      user: 'User4',
      avatar: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-2-7Csmt4QTEimQiNe5rtjKP8ltLSmy7w.png',
      content: 'This is another main comment',
      likes: 3,
      time: '1 hour ago',
      isAuthor: false,
      isLiked: false,
      isExpanded: false,
      replies: []
    }
  ])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<{ user: string; commentId: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      if (replyingTo) {
        const newReply: Reply = {
          id: Date.now(),
          user: 'CurrentUser',
          avatar: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-2-7Csmt4QTEimQiNe5rtjKP8ltLSmy7w.png',
          content: newComment,
          likes: 0,
          time: 'Just now',
          isLiked: false,
          replyTo: replyingTo
        }

        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === replyingTo.commentId
              ? { ...comment, replies: [...comment.replies, newReply] }
              : comment
          )
        )
      } else {
        const newCommentObj: Comment = {
          id: Date.now(),
          user: 'CurrentUser',
          avatar: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-2-7Csmt4QTEimQiNe5rtjKP8ltLSmy7w.png',
          content: newComment,
          likes: 0,
          time: 'Just now',
          isLiked: false,
          replies: [],
          isExpanded: false
        }

        setComments(prevComments => [...prevComments, newCommentObj])
      }

      setNewComment('')
      setReplyingTo(null)
    }
  }

  const toggleReply = (user: string, commentId: number) => {
    setReplyingTo(prev => 
      prev && prev.commentId === commentId
        ? null
        : { user, commentId }
    )
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  const handleLike = (commentId: number, replyId?: number) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        if (replyId) {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply => 
                reply.id === replyId
                  ? { 
                      ...reply, 
                      isLiked: !reply.isLiked,
                      likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1 
                    }
                  : reply
              )
            }
          }
        } else if (comment.id === commentId) {
          return { 
            ...comment, 
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 
          }
        }
        return comment
      })
    )
  }

  const toggleReplies = (commentId: number) => {
    setComments(prevComments =>
      prevComments.map(comment =>
        comment.id === commentId
          ? { ...comment, isExpanded: !comment.isExpanded }
          : comment
      )
    )
  }

  const renderCommentContent = (item: Comment | Reply, isReply: boolean = false) => (
    <div key={item.id} className={`flex space-x-3 ${isReply ? 'ml-8 mt-4' : ''}`}>
      <Avatar className="w-8 h-8">
        <AvatarImage src={item.avatar} />
        <AvatarFallback>{item.user[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex justify-between">
          <div className="flex-grow pr-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-200">{item.user}</h3>
              {item.isAuthor && (
                <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">Author</span>
              )}
            </div>
            <p className="mt-1 text-gray-300 break-words">
              {isReply && (
                <span className="text-gray-400">
                  回复 {(item as Reply).replyTo.user}：
                </span>
              )}
              {item.content}
            </p>
          </div>
          <button 
            className="flex flex-col items-center self-start ml-2"
            onClick={() => handleLike(isReply ? (item as Reply).replyTo.commentId : item.id, isReply ? item.id : undefined)}
          >
            <Heart className={`h-5 w-5 ${item.isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
            <span className="text-xs text-gray-400">{item.likes}</span>
          </button>
        </div>
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
          <span>{item.time}</span>
          <button 
            className="hover:text-gray-200 transition-colors"
            onClick={() => toggleReply(item.user, isReply ? (item as Reply).replyTo.commentId : item.id)}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  )

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="mb-6">
      {renderCommentContent(comment)}
      {comment.replies.length > 0 && (
        <div className="flex justify-center mt-2">
          <button 
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
            onClick={() => toggleReplies(comment.id)}
          >
            {comment.isExpanded ? 'Hide Replies' : `Show Replies (${comment.replies.length})`}
          </button>
        </div>
      )}
      {comment.isExpanded && (
        <div className="mt-4">
          {comment.replies.map(reply => renderCommentContent(reply, true))}
        </div>
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <style>{scrollbarHideStyles}</style>
      <div 
        ref={panelRef}
        className="bg-gray-900 bg-opacity-95 backdrop-blur-md w-full h-2/3 rounded-t-3xl flex flex-col animate-slide-up"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Comments {comments.length}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-300 hover:text-gray-100 transition-colors">
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {comments.map(comment => (
            <React.Fragment key={comment.id}>
              {renderComment(comment)}
            </React.Fragment>
          ))}
        </div>
        <div className="p-4 border-t border-gray-700 flex flex-col space-y-2">
          {replyingTo && (
            <div className="text-sm text-gray-400 flex justify-between items-center">
              <span>Reply to: {replyingTo.user}</span>
              <button 
                className="text-gray-500 hover:text-gray-300 transition-colors"
                onClick={() => setReplyingTo(null)}
              >
                Cancel reply
              </button>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder={replyingTo ? `Reply to ${replyingTo.user}...` : "Add a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
              className="flex-1 bg-gray-800 bg-opacity-50 border-gray-600 text-gray-100 placeholder-gray-400"
            />
            <Button onClick={handleSubmitComment} className="bg-gray-700 hover:bg-gray-600 text-gray-100">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

