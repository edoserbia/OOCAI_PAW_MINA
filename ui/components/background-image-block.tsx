import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BackgroundImageModal } from '@/components/background-image-modal'
import { useToast } from '@/components/ui/use-toast'

interface BackgroundImageBlockProps {
  onBackgroundImageChange: (image: string) => void
  backgroundImage: string
  hasSelectedTemplate?: boolean
}

export function BackgroundImageBlock({ 
  onBackgroundImageChange, 
  backgroundImage,
  hasSelectedTemplate = false
}: BackgroundImageBlockProps) {
  const { toast } = useToast()
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false)

  const handleAddBackgroundImage = (image: string) => {
    console.log('BackgroundImageBlock receiving image:', image);
    if (image) {
      console.log('Passing image to parent:', image);
      onBackgroundImageChange(image);
    }
    setIsBackgroundModalOpen(false);
  }

  const handleGenerateClick = () => {
    if (!hasSelectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a story template first before generating a background image.",
        variant: "destructive"
      });
      return;
    }
    setIsBackgroundModalOpen(true);
  }

  useEffect(() => {
    console.log('BackgroundImageBlock backgroundImage prop updated:', backgroundImage);
  }, [backgroundImage]);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium text-white mb-3">Background Image</h3>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 bg-gray-700 rounded-lg p-4 flex flex-col">
          {backgroundImage ? (
            <div className="flex-1 relative min-h-0 flex items-center justify-center overflow-hidden">
              <img
                src={backgroundImage}
                alt="Background"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                onError={(e) => console.error('Image failed to load:', e)}
              />
            </div>
          ) : (
            <div className="flex-1 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <div className="mt-4">
          <Button 
            onClick={handleGenerateClick}
            className={`w-full ${hasSelectedTemplate ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-500'} text-white`}
          >
            {backgroundImage ? 'Change Background' : 'Generate Background'}
          </Button>
        </div>
      </div>
      <BackgroundImageModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        onAddBackgroundImage={handleAddBackgroundImage}
      />
    </div>
  )
}

