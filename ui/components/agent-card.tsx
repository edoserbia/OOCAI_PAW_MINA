import { Heart, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'

interface AgentCardProps {
  title: string
  intro: string
  nftStatus: string
  status: 'available' | 'premium' | 'under_review' | 'minted'
  image: string
  mintDate?: string
  mintCost?: string
  expirationDate?: string
}

export function AgentCard({ title, intro, nftStatus, status, image, mintDate, mintCost, expirationDate }: AgentCardProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (status === 'minted' && expirationDate) {
      const interval = setInterval(() => {
        const expiration = new Date(expirationDate).getTime()
        const now = new Date().getTime()
        const distance = expiration - now

        if (distance < 0) {
          clearInterval(interval)
          setTimeLeft('Expired')
          setIsExpired(true)
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          setTimeLeft(`${days}d ${hours}h ${minutes}m`)
          setIsExpired(false)
        }
      }, 1000 * 60) // Update every minute

      return () => clearInterval(interval)
    }
  }, [status, expirationDate])

  const handleRenew = () => {
    // Here you would implement the logic to renew the agent
    console.log('Renewing agent for 0.01 ETH')
  }

  return (
    <div className="relative group overflow-hidden rounded-2xl">
      {/* Background Image */}
      <div className="aspect-[4/5] relative">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
        />
      </div>

      {/* Overlay Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {/* Title */}
        <div className="w-full text-center">
          <h3 className="text-lg font-semibold text-white bg-black/60 backdrop-blur-sm rounded-lg py-2 px-4 inline-block">
            {title}
          </h3>
        </div>

        {/* Center Content */}
        <div className="flex flex-col items-center space-y-4">
          {/* NFT Status */}
          <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-sm text-white">{nftStatus}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {status === 'available' && (
            <div className="flex flex-col items-center">
              <button className="w-full max-w-[200px] py-2 rounded-lg text-sm font-medium bg-gray-800 text-white">
                NFT mint
              </button>
              {mintCost && (
                <span className="mt-2 text-xs text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  Mint cost: {mintCost}
                </span>
              )}
            </div>
          )}
          {status === 'premium' && (
            <div className="flex flex-col items-center">
              <button className="w-full max-w-[200px] py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-700 text-white">
                NFT mint
              </button>
              {mintCost && (
                <span className="mt-2 text-xs text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  Mint cost: {mintCost}
                </span>
              )}
            </div>
          )}
          {status === 'under_review' && (
            <div className="w-full max-w-[200px] py-2 rounded-lg text-sm font-medium bg-gray-700 text-white text-center">
              Under Review
            </div>
          )}
          {status === 'minted' && mintDate && (
            <div className="flex flex-col items-center gap-1 text-xs text-white">
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
                <span>Minted on {mintDate}</span>
              </div>
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-amber-400">
                NFT valid for 1 year
              </div>
            </div>
          )}
        </div>

        {/* Intro */}
        <div className="w-full relative h-[2.5em]">
          <p className="text-xs text-white bg-black/60 backdrop-blur-sm rounded-lg py-2 px-3 line-clamp-2 overflow-hidden absolute inset-0">
            {intro}
          </p>
        </div>
      </div>
    </div>
  )
}

