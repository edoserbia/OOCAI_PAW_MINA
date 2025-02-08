'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface RewardRecord {
  id: number
  donor: string
  agentStory: string
  time: string
  amount: string
  tokenType: string
}

export default function RewardHistoryPage() {
  const [rewardHistory, setRewardHistory] = useState<RewardRecord[]>([
    {
      id: 1,
      donor: "0xAbC...123",
      agentStory: "My lifestyle",
      time: "2023-05-15 14:30",
      amount: "0.5",
      tokenType: "ETH"
    },
    {
      id: 2,
      donor: "0xDeF...456",
      agentStory: "Adventure Time",
      time: "2023-05-14 09:15",
      amount: "100",
      tokenType: "USDT"
    },
    {
      id: 3,
      donor: "0xGhI...789",
      agentStory: "Crypto Journey",
      time: "2023-05-13 18:45",
      amount: "50",
      tokenType: "OOC"
    },
    // Add more mock data as needed
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/profiles" className="text-white hover:text-amber-400 transition-colors mr-4">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Reward History</h1>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-white">Donor</th>
                <th className="p-3 text-white">Agent Story</th>
                <th className="p-3 text-white">Time</th>
                <th className="p-3 text-white">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rewardHistory.map((record) => (
                <tr key={record.id} className="border-b border-gray-700">
                  <td className="p-3 text-gray-300">{record.donor}</td>
                  <td className="p-3 text-gray-300">{record.agentStory}</td>
                  <td className="p-3 text-gray-300">{record.time}</td>
                  <td className="p-3 text-gray-300">{record.amount} {record.tokenType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

