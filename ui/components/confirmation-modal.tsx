import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message: string
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, message }: ConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">确认操作</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 text-white" />
          </Button>
        </div>
        <p className="text-white mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button variant="default" onClick={onConfirm}>
            确认
          </Button>
        </div>
      </div>
    </div>
  )
}

