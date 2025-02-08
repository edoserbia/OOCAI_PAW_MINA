import { Heart, Users, Edit, Camera } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react';
import { AvatarEditorModal } from '@/components/avatar-editor-modal';

interface ProfileHeaderProps {
  userName: string
  onEditName: () => void
  points: number
  onAvatarUpdate: (newAvatarUrl: string) => void
}

export function ProfileHeader({ userName, onEditName, points, onAvatarUpdate }: ProfileHeaderProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-2-7Csmt4QTEimQiNe5rtjKP8ltLSmy7w.png")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedAvatarUrl = localStorage.getItem('userAvatarUrl')
    if (savedAvatarUrl) {
      setAvatarUrl(savedAvatarUrl)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImage(reader.result as string)
        setIsEditorOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarSave = (croppedImage: string) => {
    setAvatarUrl(croppedImage)
    onAvatarUpdate(croppedImage)
    // 保存到localStorage
    localStorage.setItem('userAvatarUrl', croppedImage)
    setIsEditorOpen(false)
    setSelectedImage(null)
  }

  return (
    <div className="flex items-start gap-6 py-4">
      <div className="flex items-start gap-6 flex-grow">
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-white/20">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback>{userName?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-1.5 bg-gray-800 rounded-full border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{userName}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditName}
              className="text-gray-400 hover:text-white"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-400">0xED005...16HKKHS</p>

          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-white">2.7w</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-white">123</span>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-1-JzMwO2MbH06j0cNTDnHRnK5VqE1Lnc.png"
                alt="PAW Points"
                width={20}
                height={20}
              />
              <div className="flex items-center text-white">
                <span>Points:</span>
                <span className="text-amber-500 ml-1">{points}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Link href="/reward-history" className="text-white hover:text-amber-400 transition-colors self-end">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sleek-cat-paw-icon-1-JzMwO2MbH06j0cNTDnHRnK5VqE1Lnc.png"
          alt="Rewards"
          width={48}
          height={48}
        />
      </Link>
      <AvatarEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleAvatarSave}
        imageUrl={selectedImage || ''}
      />
    </div>
  )
}

