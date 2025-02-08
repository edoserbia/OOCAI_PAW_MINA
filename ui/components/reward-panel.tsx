'use client'

import { useState, useEffect } from 'react'
import { X, Bitcoin, EclipseIcon as Ethereum } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface RewardPanelProps {
  isOpen: boolean
  onClose: () => void
  totalRewards: string
}

interface Donor {
  id: number
  avatar: string
  name: string
}

const cryptoCurrencies = [
  { id: 'btc', name: 'Bitcoin', icon: Bitcoin },
  { id: 'eth', name: 'Ethereum', icon: Ethereum },
  { id: 'ooc', name: 'OOC', icon: () => 'OOC' },
]

export function RewardPanel({ isOpen, onClose, totalRewards }: RewardPanelProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(cryptoCurrencies[0].id)
  const [amount, setAmount] = useState('')
  const [donors, setDonors] = useState<Donor[]>([])
  const [isLoading, setIsLoading] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  useEffect(() => {
    // Simulating fetching donors data
    const fakeDonors = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      avatar: '/placeholder.svg',
      name: `Donor ${i + 1}`,
    }))
    setDonors(fakeDonors)
  }, [])

  const handleReward = () => {
    const rewardAmount = parseFloat(amount);
    if (rewardAmount <= 0) {
      alert("Please enter a valid reward amount");
      return;
    }
    setIsLoading(true);
    console.log(`Rewarding ${rewardAmount} ${selectedCurrency}`);
    setTimeout(() => {
      setIsLoading(false);
      setShowThanks(true);
      setAmount('');
    }, 2000);
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 bg-opacity-95 backdrop-blur-md w-full max-w-md rounded-2xl flex flex-col animate-slide-up">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">Reward Creator</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-300 transition-colors">
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Select cryptocurrency" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {cryptoCurrencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id} className="text-gray-100">
                    <div className="flex items-center">
                      <currency.icon className="w-4 h-4 mr-2" />
                      {currency.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 50, 100].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => setAmount(preset.toString())}
                className="flex-1"
              >
                {preset}
              </Button>
            ))}
          </div>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
          />
          <Button 
            onClick={handleReward} 
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100"
            disabled={isLoading || showThanks}
          >
            {isLoading ? 'Processing...' : showThanks ? 'Rewarded' : 'Confirm Reward'}
          </Button>
          {isLoading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300"></div>
              <p className="mt-2 text-gray-300">Processing...</p>
            </div>
          )}
          {showThanks && (
            <div className="text-center text-green-400">
              <p>Thank you for your reward!</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Reward History</h3>
          <p className="text-sm text-gray-400 mb-2">Total Rewards: {totalRewards}</p>
          <div className="grid grid-cols-8 gap-2">
            {donors.slice(0, 24).map((donor) => (
              <Avatar key={donor.id} className="w-8 h-8">
                <AvatarImage src={donor.avatar} alt={donor.name} />
                <AvatarFallback>{donor.name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

