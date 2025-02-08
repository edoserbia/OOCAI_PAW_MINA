'use client'

import { useState, useRef, useEffect } from 'react'
import { ProfileHeader } from '@/components/profile-header'
import { AgentCard } from '@/components/agent-card'
import { cn } from "@/lib/utils"
import { NameChangeModal } from '@/components/name-change-modal'
import { getAuthState } from '@/services/auth'

type TabValue = 'all' | 'normal' | 'premium'

export default function ProfilesPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isNameChangeModalOpen, setIsNameChangeModalOpen] = useState(false)
  const [isFirstNameChange, setIsFirstNameChange] = useState(true)
  const [points, setPoints] = useState(1250) // This should be fetched from your backend
  const [avatarUrl, setAvatarUrl] = useState('https://img.oocstorage.icu/file/oocstorage/paw_logo.png')
  const { username } = getAuthState()
  const [currentUsername, setCurrentUsername] = useState(username || 'User')

  const agents = [
    {
      id: 1,
      title: "My lifestyle",
      intro: "Once upon a time, a brave knight saved a princess. The knight embarked on a grand adventure to rescue the princess.",
      nftStatus: "9995/10000",
      status: 'available' as const,
      image: "https://s3.bmp.ovh/imgs/2024/12/19/9224eec739140da2.png",
      mintCost: "0.02 ETH"
    },
    {
      id: 2,
      title: "Adventure Time",
      intro: "Join Finn and Jake on their epic quests across the Land of Ooo. Magical adventures await! Discover new realms and face challenging foes in this exciting journey.",
      nftStatus: "8500/10000",
      status: 'premium' as const,
      image: "https://s3.bmp.ovh/imgs/2024/12/19/9224eec739140da2.png",
      mintCost: "0.05 ETH"
    },
    {
      id: 3,
      title: "Crypto Journey",
      intro: "Embark on a thrilling adventure through the world of cryptocurrency and blockchain technology. Learn about mining, trading, and the future of finance.",
      nftStatus: "10000/10000",
      status: 'minted' as const,
      image: "https://s3.bmp.ovh/imgs/2024/12/19/9224eec739140da2.png",
      mintDate: "2023-05-15",
      expirationDate: "2024-05-15"
    },
    {
      id: 4,
      title: "Space Odyssey",
      intro: "Explore the vast reaches of space in this interstellar adventure. Discover new worlds and alien civilizations. Uncover the mysteries of the universe in this cosmic journey.",
      nftStatus: "5000/10000",
      status: 'under_review' as const,
      image: "https://s3.bmp.ovh/imgs/2024/12/19/9224eec739140da2.png"
    },
    {
      id: 5,
      title: "Expired Agent",
      intro: "This agent's lifecycle has expired. It showcases the renewal option for expired minted agents.",
      nftStatus: "10000/10000",
      status: 'minted' as const,
      image: "https://s3.bmp.ovh/imgs/2024/12/19/9224eec739140da2.png",
      mintDate: "2022-05-15",
      expirationDate: "2023-05-15"
    },
  ]

  const filteredAgents = agents.filter(agent => {
    if (activeTab === 'all') return true
    if (activeTab === 'normal') return agent.status === 'available'
    if (activeTab === 'premium') return agent.status === 'premium'
    return true
  })

  // Custom scroll handling
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      container.scrollTop += e.deltaY
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const handleNameChange = (newName: string) => {
    if (!isFirstNameChange) {
      setPoints(prevPoints => prevPoints - 50)
    }
    setCurrentUsername(newName)
    setIsFirstNameChange(false)
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl)
    // Here you would typically upload the image to your backend
    console.log('Avatar updated:', newAvatarUrl)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <ProfileHeader 
          userName={currentUsername} 
          onEditName={() => setIsNameChangeModalOpen(true)}
          points={points}
          onAvatarUpdate={handleAvatarUpdate}
        />
        
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-white">My Agent</h2>
            <button className="text-gray-400 hover:text-white">
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="2"/>
                <text x="12" y="17" textAnchor="middle" fill="currentColor" fontSize="14">?</text>
              </svg>
            </button>
          </div>

          <div className="border-b border-gray-800">
            <div className="flex gap-8">
              {(['all', 'normal', 'premium'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-4 py-2 text-gray-400 relative -mb-[1px]",
                    activeTab === tab && "text-white"
                  )}
                >
                  <span className="capitalize">{tab}</span>
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx global>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} {...agent} />
            ))}
          </div>
        </div>
      </div>
      <NameChangeModal
        isOpen={isNameChangeModalOpen}
        onClose={() => setIsNameChangeModalOpen(false)}
        onChangeName={handleNameChange}
        currentName={currentUsername}
        isFirstChange={isFirstNameChange}
        points={points}
      />
    </div>
  )
}

