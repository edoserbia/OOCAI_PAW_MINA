import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getArtStyles } from '@/services/art-style'
import { generateBackgroundImage } from '@/services/background-image'
import { ArtStyle } from '@/types/art-style'
import { useToast } from '@/components/ui/use-toast'
import { ProgressBar } from './progress-bar'

interface BackgroundImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBackgroundImage?: (imageUrl: string) => void;
}

export function BackgroundImageModal({ isOpen, onClose, onAddBackgroundImage }: BackgroundImageModalProps) {
  const { toast } = useToast()
  const [artStyles, setArtStyles] = useState<ArtStyle[]>([])
  const [selectedStyle, setSelectedStyle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])

  // 重置状态
  const resetState = () => {
    setSelectedStyle('')
    setDescription('')
    setGeneratedImages([])
  }

  // 当模态框关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      resetState()
    }
  }, [isOpen])

  // 获取艺术风格列表
  useEffect(() => {
    const fetchArtStyles = async () => {
      try {
        setIsLoading(true)
        const response = await getArtStyles({ status: 'active' })
        if (response && Array.isArray(response.art_styles) && response.art_styles.length > 0) {
          setArtStyles(response.art_styles)
        } else {
          console.error('No art styles found:', response)
          setArtStyles([])
          toast({
            title: "No Art Styles Available",
            description: "Please try again later",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Failed to fetch art styles:', error)
        setArtStyles([])
        toast({
          title: "Fetch Art Styles Failed",
          description: error instanceof Error ? error.message : "Unknown Error",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      fetchArtStyles()
    }
  }, [isOpen, toast])

  // 生成背景图片
  const handleGenerateImages = async () => {
    if (isGenerating || !selectedStyle || !description) return;

    try {
      setIsGenerating(true);
      setGeneratedImages([]);

      // 获取选中风格的关键词
      const selectedArtStyle = artStyles.find(style => style.name === selectedStyle);
      if (!selectedArtStyle) {
        throw new Error('Selected art style not found');
      }

      // 调用生成接口
      const response = await generateBackgroundImage({
        style_keyword: selectedArtStyle.keyword,
        background_description: description
      });

      console.log('Generated image response:', response);
      
      // 更新生成的图片
      setGeneratedImages([response.image_url]);

      toast({
        title: "Background Generated Successfully",
        description: "Your background image has been generated",
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to generate background:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 完成选择
  const handleComplete = () => {
    console.log('Completing with image:', generatedImages[0]);
    if (generatedImages.length > 0 && onAddBackgroundImage) {
      const imageUrl = generatedImages[0];
      console.log('Sending image URL to parent:', imageUrl);
      onAddBackgroundImage(imageUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-7xl m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Generate Background Image</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 text-white" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 左侧：风格选择和描述输入 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Art Style</label>
              <div className="h-[280px] overflow-y-auto">
                <div className="grid grid-cols-4 gap-4 p-1">
                  {isLoading ? (
                    <div className="col-span-4 text-center py-8 text-white">Loading art styles...</div>
                  ) : artStyles.length === 0 ? (
                    <div className="col-span-4 text-center py-8 text-white">No art styles available</div>
                  ) : (
                    artStyles.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => setSelectedStyle(style.name)}
                        className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:border-amber-400 ${
                          selectedStyle === style.name ? 'border-amber-500 bg-gray-800' : 'border-gray-700 hover:bg-gray-800'
                        }`}
                      >
                        <div className="w-full aspect-square relative mb-2 rounded-md overflow-hidden">
                          <img 
                            src={style.image}
                            alt={style.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-white text-center font-medium">{style.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Background Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the background scene you want to generate"
                className="w-full bg-gray-800 text-white h-24"
              />
            </div>

            <Button 
              onClick={handleGenerateImages}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={!selectedStyle || !description || isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Background'}
            </Button>
          </div>

          {/* 右侧：生成的图片展示 */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
            <div className="bg-gray-800 rounded-lg p-4 h-[400px] flex flex-col">
              {/* 进度条 */}
              {isGenerating && (
                <div className="mb-4">
                  <ProgressBar isGenerating={isGenerating} />
                </div>
              )}
              
              {/* 图片预览区域 */}
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                {generatedImages.length > 0 ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img
                      src={generatedImages[0]}
                      alt="Generated Background"
                      className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {isGenerating ? 'Generating background...' : 'No background generated yet'}
                  </div>
                )}
              </div>
            </div>
            
            {generatedImages.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  onClick={handleGenerateImages}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Generate Another'}
                </Button>
                <Button 
                  onClick={handleComplete}
                  className="w-full bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Please wait...' : 'Confirm'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

