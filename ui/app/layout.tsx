'use client'

import './globals.css'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { PawPrintIcon as Paw, Users, PlusSquare, BookOpen, CheckSquare, Bell, BookmarkIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { UserInfo } from '@/components/user-info'
import { LoginPage } from '@/components/login-page'
import { LanguageSelector } from '@/components/language-selector'
import { generateUserId } from '@/utils/generateUserId'
import { useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

function MainLayout({ children, userName, walletAddress, onLogout }: { 
  children: React.ReactNode, 
  userName: string, 
  walletAddress: string,
  onLogout: () => void 
}) {
  const [hasUnreadInteractions, setHasUnreadInteractions] = useState(false)

  useEffect(() => {
    const checkNewMessages = () => {
      const hasNew = Math.random() < 0.5
      setHasUnreadInteractions(hasNew)
    }

    const interval = setInterval(checkNewMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen bg-[#0f1117]">
      <nav className="w-[240px] flex flex-col p-4 border-r border-gray-800">
        <div className="flex items-center gap-2 px-4 py-3">
          <Image 
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-1-JzMwO2MbH06j0cNTDnHRnK5VqE1Lnc.png"
            alt="PAW Logo"
            width={32}
            height={32}
          />
          <span className="text-2xl font-bold text-amber-400">PAW</span>
        </div>
        
        <div className="mt-8 space-y-2 flex-grow">
          <Link 
            href="/stories" 
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-lg">Stories</span>
          </Link>
          
          <Link 
            href="/my-stories" 
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg"
          >
            <BookmarkIcon className="w-6 h-6" />
            <span className="text-lg">My Stories</span>
          </Link>
          
          <Link 
            href="/create" 
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg"
          >
            <PlusSquare className="w-6 h-6" />
            <span className="text-lg">Create</span>
          </Link>

          <Link 
            href="/messages" 
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg relative"
          >
            <Bell className="w-6 h-6" />
            <span className="text-lg">Messages</span>
            {hasUnreadInteractions && (
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
          </Link>

          <Link 
            href="/tasks" 
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg"
          >
            <CheckSquare className="w-6 h-6" />
            <span className="text-lg">Tasks</span>
          </Link>

          <Link 
            href="/profiles" 
            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 rounded-lg"
          >
            <Users className="w-6 h-6" />
            <span className="text-lg">Profiles</span>
          </Link>
        </div>

        <div className="mt-auto mb-16">
          <LanguageSelector />
        </div>

        <div className="mt-auto mb-4">
          <UserInfo 
            avatarUrl="/placeholder.svg"
            userName={userName}
            walletAddress={walletAddress}
            onLogout={onLogout}
          />
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userWalletAddress, setUserWalletAddress] = useState('')
  const [userName, setUserName] = useState('')
  const router = useRouter()

  const handleLogin = (address: string) => {
    setIsLoggedIn(true)
    setUserWalletAddress(address)
    const newUserName = `user${generateUserId()}`
    setUserName(newUserName)
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userWalletAddress', address)
    localStorage.setItem('userName', newUserName)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserWalletAddress('')
    setUserName('')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userWalletAddress')
    localStorage.removeItem('userName')
    router.push('/')
  }

  useEffect(() => {
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn')
    const storedWalletAddress = localStorage.getItem('userWalletAddress')
    const storedUserName = localStorage.getItem('userName')
    
    if (storedIsLoggedIn === 'true' && storedWalletAddress && storedUserName) {
      setIsLoggedIn(true)
      setUserWalletAddress(storedWalletAddress)
      setUserName(storedUserName)
    }
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <MainLayout
            userName={userName}
            walletAddress={userWalletAddress}
            onLogout={handleLogout}
          >
            {children}
          </MainLayout>
        )}
        <Toaster />
      </body>
    </html>
  )
}

