import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from 'next/image'

interface NameChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onChangeName: (newName: string) => void
  currentName: string
  isFirstChange: boolean
  points: number
}

export function NameChangeModal({ isOpen, onClose, onChangeName, currentName, isFirstChange, points }: NameChangeModalProps) {
  const [newName, setNewName] = useState(currentName)

  const handleSubmit = () => {
    if (newName.trim() && newName !== currentName) {
      onChangeName(newName.trim())
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-800 text-white border border-gray-700 flex flex-col items-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Change Username</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <Input
            id="name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white text-lg"
            placeholder="Enter new username"
          />
          <p className="text-sm text-gray-400 text-center whitespace-nowrap">
            First change is free, subsequent changes will cost 50 points.
          </p>
        </div>
        <DialogFooter className="flex-col items-center space-y-4">
          <Button 
            onClick={handleSubmit} 
            disabled={!isFirstChange && points < 50}
            className="bg-amber-500 hover:bg-amber-600 text-white flex items-center space-x-2 px-6 py-3"
          >
            <Image
              src="https://img.oocstorage.icu/file/oocstorage/paw_logo.png"
              alt="PAW Points"
              width={24}
              height={24}
            />
            <span>Change Name</span>
            <span className="text-sm font-semibold">
              ({isFirstChange ? 'Free' : '50 Points'})
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

