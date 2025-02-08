'use client'

import { useRef, useState, useEffect } from 'react'
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from 'lucide-react'

interface AvatarEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImage: string) => void
  imageUrl: string
}

export function AvatarEditorModal({ isOpen, onClose, onSave, imageUrl }: AvatarEditorModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState(200)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const selectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (imageUrl && imageRef.current) {
      const img = new Image()
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height })
        const containerSize = containerRef.current?.offsetWidth || 0
        const scale = containerSize / Math.max(img.width, img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale
        const initialSize = Math.min(200, scaledWidth, scaledHeight)
        setSize(initialSize)
        setPosition({
          x: (containerSize - initialSize) / 2,
          y: (containerSize - initialSize) / 2
        })
      }
      img.src = imageUrl
    }
  }, [imageUrl])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === selectorRef.current) {
      setIsDragging(true)
    } else if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return
    
    const container = containerRef.current?.getBoundingClientRect()
    
    if (!container) return

    if (isDragging) {
      const newX = e.clientX - container.left - size / 2
      const newY = e.clientY - container.top - size / 2

      setPosition({
        x: Math.max(0, Math.min(newX, container.width - size)),
        y: Math.max(0, Math.min(newY, container.height - size))
      })
    } else if (isResizing) {
      const newSize = Math.min(
        Math.max(100, e.clientX - container.left - position.x),
        container.width - position.x,
        container.height - position.y
      )
      setSize(newSize)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const handleSave = () => {
    if (!imageRef.current || !containerRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const containerSize = containerRef.current.offsetWidth
    const scale = Math.max(imageSize.width, imageSize.height) / containerSize
    
    canvas.width = size
    canvas.height = size

    ctx.drawImage(
      imageRef.current,
      position.x * scale,
      position.y * scale,
      size * scale,
      size * scale,
      0,
      0,
      size,
      size
    )

    const croppedImage = canvas.toDataURL('image/png')
    onSave(croppedImage)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-800 p-0 border-gray-700">
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white text-center">Edit Profile Picture</h2>
          </div>

          {/* Editor Area */}
          <div 
            className="flex-1 relative overflow-hidden bg-gray-900"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageUrl ? (
              <>
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Profile"
                  className="w-full h-full object-contain"
                />
                <div
                  ref={selectorRef}
                  className="absolute border-2 border-white rounded-full cursor-move"
                  style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <div className="absolute inset-0 bg-black opacity-50 rounded-full pointer-events-none" />
                  <div className="absolute -right-2 -bottom-2 w-5 h-5 bg-white rounded-full cursor-se-resize resize-handle" />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full text-gray-400">
                No image selected
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-gray-700 flex justify-center space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!imageUrl}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

