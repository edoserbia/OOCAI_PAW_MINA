'use client'

import { useState } from 'react'
import { X, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Voice {
  id: string
  name: string
  gender: 'Male' | 'Female'
  ageGroup: 'Child' | 'Teenager' | 'Young Adult' | 'Adult' | 'Middle Age' | 'Senior'
  personality: string
  region: string
  audioUrl: string
}

interface VoiceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectVoice: (voice: string) => void
}

const voices: Voice[] = [
  {
    id: '1',
    name: 'Energetic Girl',
    gender: 'Female',
    ageGroup: 'Young Adult',
    personality: 'Cheerful',
    region: 'Canada',
    audioUrl: '/sample-audio.mp3'
  },
  {
    id: '2',
    name: 'Decent Boy',
    gender: 'Male',
    ageGroup: 'Young Adult',
    personality: 'Decent',
    region: 'England',
    audioUrl: '/sample-audio.mp3'
  },
  {
    id: '3',
    name: 'Kind-hearted Girl',
    gender: 'Female',
    ageGroup: 'Young Adult',
    personality: 'Calm',
    region: 'Latin America',
    audioUrl: '/sample-audio.mp3'
  },
  {
    id: '4',
    name: 'Charming Santa',
    gender: 'Male',
    ageGroup: 'Senior',
    personality: 'Attractive',
    region: 'US (General)',
    audioUrl: '/sample-audio.mp3'
  },
  {
    id: '5',
    name: 'Confident Woman',
    gender: 'Female',
    ageGroup: 'Young Adult',
    personality: 'Clear and firm',
    region: 'US (General)',
    audioUrl: '/sample-audio.mp3'
  },
  {
    id: '6',
    name: 'Sweet Girl',
    gender: 'Female',
    ageGroup: 'Teenager',
    personality: 'Sweet',
    region: 'US (General)',
    audioUrl: '/sample-audio.mp3'
  },
]

export function VoiceSelectionModal({ isOpen, onClose, onSelectVoice }: VoiceSelectionModalProps) {
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [selectedAge, setSelectedAge] = useState<string>('all')
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  if (!isOpen) return null

  const filteredVoices = voices.filter(voice => {
    if (selectedGender !== 'all' && voice.gender.toLowerCase() !== selectedGender) return false
    if (selectedAge !== 'all' && voice.ageGroup.replace(' ', '').toLowerCase() !== selectedAge) return false
    return true
  })

  const handlePlay = (voiceId: string, audioUrl: string) => {
    if (playingVoiceId === voiceId) {
      audioElement?.pause()
      setPlayingVoiceId(null)
      setAudioElement(null)
    } else {
      audioElement?.pause()
      const audio = new Audio(audioUrl)
      audio.addEventListener('ended', () => {
        setPlayingVoiceId(null)
        setAudioElement(null)
      })
      audio.play()
      setPlayingVoiceId(voiceId)
      setAudioElement(audio)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl w-[700px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Select Voice</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-gray-400" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setSelectedGender('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedGender === 'all' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              All Gender
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedGender('male')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedGender === 'male' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              Male
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedGender('female')}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedGender === 'female' ? 'bg-white/10 text-white' : 'text-gray-400'
              }`}
            >
              Female
            </Button>
          </div>

          <Select value={selectedAge} onValueChange={setSelectedAge}>
            <SelectTrigger className="w-[130px] bg-transparent border-gray-700 text-white focus:ring-1 focus:ring-gray-700">
              <SelectValue placeholder="All Age" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white focus:bg-gray-700 focus:text-white">All Age</SelectItem>
              <SelectItem value="child" className="text-white focus:bg-gray-700 focus:text-white">Child</SelectItem>
              <SelectItem value="teenager" className="text-white focus:bg-gray-700 focus:text-white">Teenager</SelectItem>
              <SelectItem value="youngadult" className="text-white focus:bg-gray-700 focus:text-white">Young Adult</SelectItem>
              <SelectItem value="adult" className="text-white focus:bg-gray-700 focus:text-white">Adult</SelectItem>
              <SelectItem value="middleage" className="text-white focus:bg-gray-700 focus:text-white">Middle Age</SelectItem>
              <SelectItem value="senior" className="text-white focus:bg-gray-700 focus:text-white">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Voice List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredVoices.map((voice) => (
            <div
              key={voice.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-lg bg-gray-700 flex-shrink-0"
                  onClick={() => handlePlay(voice.id, voice.audioUrl)}
                >
                  <Play className={`h-5 w-5 ${playingVoiceId === voice.id ? 'text-amber-500' : 'text-white'}`} />
                </Button>
                <div className="space-y-2 flex-1">
                  <h3 className="text-white font-medium">{voice.name}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                      {voice.gender}
                    </span>
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                      {voice.ageGroup}
                    </span>
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                      {voice.personality}
                    </span>
                    <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs">
                      {voice.region}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="bg-white text-gray-900 hover:bg-gray-200 ml-4 flex-shrink-0"
                onClick={() => onSelectVoice(voice.name)}
              >
                Use
              </Button>
            </div>
          ))}
        </div>
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #2D3748;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #4A5568;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #718096;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #4A5568 #2D3748;
          }
        `}</style>
      </div>
    </div>
  )
}

