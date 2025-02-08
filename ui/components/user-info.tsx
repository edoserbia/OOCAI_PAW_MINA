'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { logout, getAuthState } from '@/services/auth'

interface UserInfoProps {
  avatarUrl?: string
  onLogout: () => void
}

export function UserInfo({ 
  avatarUrl = '', 
  onLogout 
}: UserInfoProps) {
  const [showLogout, setShowLogout] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { toast } = useToast()
  const { username, walletAddress } = getAuthState()

  const toggleLogout = () => setShowLogout(!showLogout)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      setShowLogout(false)
      if (onLogout) {
        onLogout()
      }
    } catch (error) {
      console.error('Logout error:', error)
      toast({
        title: "Logout Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  // 处理钱包地址显示
  const displayAddress = walletAddress ? 
    `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 
    'Wallet Not Connected'

  return (
    <div className="relative">
      <div 
        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        onClick={toggleLogout}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={username || 'User Avatar'} />
          <AvatarFallback>{username ? username[0].toUpperCase() : '?'}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {username || 'Unknown User'}
          </span>
          <span className="text-xs text-gray-400">{displayAddress}</span>
        </div>
      </div>
      {showLogout && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-full left-0 mb-2 w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </Button>
      )}
    </div>
  )
}

