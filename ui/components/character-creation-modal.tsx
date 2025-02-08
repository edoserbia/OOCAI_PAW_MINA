import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getArtStyles } from '@/services/art-style'
import { getImageUrl, uploadImage } from '@/services/image'
import { getPromptTemplate } from '@/services/prompt-template'
import { getAIModels } from '@/services/ai'
import { generateAvatar, createCharacter } from '@/services/character-avatar'
import { getCharacterList, deleteCharacter } from '@/services/character'
import { ArtStyle } from '@/types/art-style'
import { useToast } from '@/components/ui/use-toast'
import { API_CONFIG, fetchApi } from '@/config/api'

// 添加进度组件
const GenerationProgress = ({ isGenerating }: { isGenerating: boolean }) => {
  const [progress, setProgress] = useState(1)
  const [isBlinking, setIsBlinking] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const startTime = useRef<number | null>(null)

  useEffect(() => {
    if (isGenerating) {
      startTime.current = Date.now()
      setProgress(1)
      setIsBlinking(false)

      // 每3秒更新一次进度，15秒内从1%到99%
      progressInterval.current = setInterval(() => {
        const elapsed = Date.now() - (startTime.current || 0)
        if (elapsed >= 15000) {
          // 15秒后如果还没完成，开始闪烁
          setProgress(99)
          setIsBlinking(true)
        } else {
          // 计算当前进度（1-99）
          const newProgress = Math.min(99, Math.floor((elapsed / 15000) * 98) + 1)
          setProgress(newProgress)
        }
      }, 3000)

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
      }
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
      setProgress(0)
      setIsBlinking(false)
    }
  }, [isGenerating])

  if (!isGenerating) return null

  return (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center">
      <div className="w-4/5 bg-gray-700 rounded-full h-2.5 mb-4">
        <div 
          className="bg-amber-500 h-2.5 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className={`text-white text-sm ${isBlinking ? 'animate-pulse' : ''}`}>
        {isBlinking ? 'Still generating...' : `Generating... ${progress}%`}
      </p>
    </div>
  )
}

interface CharacterCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCharacter: (character: { id: string; name: string; avatar: string; icon: string }) => void
}

export function CharacterCreationModal({ isOpen, onClose, onAddCharacter }: CharacterCreationModalProps) {
  const { toast } = useToast()
  const [artStyles, setArtStyles] = useState<ArtStyle[]>([])
  const [artStyle, setArtStyle] = useState('')
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [personality, setPersonality] = useState('')
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referenceImageDescription, setReferenceImageDescription] = useState('')
  const [generatedAvatar, setGeneratedAvatar] = useState('')
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDescriptionValid, setIsDescriptionValid] = useState(false)
  const [isNameValid, setIsNameValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [i2tPromptTemplate, setI2tPromptTemplate] = useState('')
  const [i2tModel, setI2tModel] = useState('')
  const [generatedIconUrl, setGeneratedIconUrl] = useState<string>('')
  const [imagePrompt, setImagePrompt] = useState<string>('')
  const [selectedLLMId, setSelectedLLMId] = useState<string>('')
  const [characters, setCharacters] = useState<any[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string>(''); // 添加删除状态，存储正在删除的角色ID

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
    } else {
      // 当模态框关闭时重置状态
      setArtStyles([])
      setArtStyle('')
    }
  }, [isOpen, toast])

  // 获取I2T提示词模板和模型
  useEffect(() => {
    const fetchI2TResources = async () => {
      try {
        // 获取I2T提示词模板
        console.log('Fetching I2T prompt template...')
        const template = await getPromptTemplate('i2t_character')
        console.log('Received template:', template)
        
        // 确保模板内容存在
        if (template && template.content) {
          console.log('Setting I2T prompt template:', template.content)
          setI2tPromptTemplate(template.content)
        } else {
          console.error('Template content is missing:', template)
          throw new Error('Template content is missing')
        }

        // 获取I2T模型列表
        console.log('Fetching I2T models...')
        const models = await getAIModels({ type: 'i2t' })
        console.log('Received models:', models)
        
        // 验证模型数据
        if (!Array.isArray(models)) {
          console.error('Models response is not an array:', models)
          throw new Error('Invalid models response format')
        }

        if (models.length > 0) {
          // 选择第一个可用的模型
          const availableModel = models.find(model => model.status === 'active')
          if (availableModel) {
            console.log('Selected I2T model:', availableModel)
            setI2tModel(availableModel.llm_id)
          } else {
            console.warn('No active I2T models found in:', models)
            toast({
              title: "No Active I2T Models Available",
              description: "Please try again later",
              variant: "destructive"
            })
          }
        } else {
          console.warn('Empty models list received')
          toast({
            title: "No I2T Models Available",
            description: "Please try again later",
            variant: "destructive"
          })
        }

        // 获取other类型的LLM模型列表
        const llmModels = await getAIModels({ type: 'other' })
        if (llmModels.length > 0) {
          const availableModel = llmModels.find(model => model.status === 'active')
          if (availableModel) {
            console.log('Selected LLM model:', availableModel)
            setSelectedLLMId(availableModel.llm_id)
          } else {
            console.warn('No active LLM models found')
            toast({
              title: "No Active LLM Models Available",
              description: "Please try again later",
              variant: "destructive"
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch resources:', error)
        toast({
          title: "Failed to Load Resources",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        })
      }
    }

    if (isOpen) {
      fetchI2TResources()
    }
  }, [isOpen, toast])

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setArtStyle('')
      setDescription('')
      setName('')
      setPersonality('')
      setReferenceImage(null)
      setReferenceImageDescription('')
      setGeneratedAvatar('')
      setGeneratedAvatars([])
      setIsGenerating(false)
      setIsDescriptionValid(false)
      setIsNameValid(false)
    }
  }, [isOpen])

  // 处理参考图片上传
  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setReferenceImage(file)
        // 上传图片
        console.log('Uploading image...')
        const uploadResult = await uploadImage(file)
        console.log('Upload result:', uploadResult)
        
        // 如果有I2T模型和提示词模板，则生成图片描述
        console.log('Current I2T model:', i2tModel)
        console.log('Current I2T prompt template:', i2tPromptTemplate)
        if (i2tModel && i2tPromptTemplate) {
          console.log('Preparing I2T request...')
          const i2tRequest = {
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: i2tPromptTemplate
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: uploadResult.url
                    }
                  }
                ]
              }
            ],
            model_id: i2tModel,
            stream: false
          }
          console.log('I2T request:', i2tRequest)

          console.log('Calling I2T API...')
          const response = await fetchApi(API_CONFIG.PATHS.AI.I2T.CHAT_COMPLETIONS, {
            method: 'POST',
            body: JSON.stringify(i2tRequest)
          })
          console.log('I2T API response:', response)

          const result = await response.json()
          console.log('I2T result:', result)
          // 保存描述到状态中，但不显示在界面上
          const description = result.choices[0].message.content
          setReferenceImageDescription(description)
          
          // 显示上传成功提示
          toast({
            title: "Image Uploaded Successfully",
            description: "Image has been processed and ready for character creation",
            variant: "default"
          })
        } else {
          console.warn('Missing I2T model or prompt template')
          toast({
            title: "Image Upload Incomplete",
            description: "Could not process image description. Please try again.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Failed to process reference image:', error)
        toast({
          title: "Image Processing Failed",
          description: error instanceof Error ? error.message : "Unknown Error",
          variant: "destructive"
        })
      }
    }
  }

  const handleGenerateAvatar = async () => {
    if (isGenerating || !isDescriptionValid || !isNameValid || !artStyle) {
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedAvatars([]);

      // 获取用于生成提示词的LLM模型
      const promptModels = await getAIModels({ type: 'other' });
      const promptModel = promptModels.find(model => model.status === 'active');
      if (!promptModel) {
        throw new Error('No active prompt generation model available');
      }

      // 获取用于生成图片的T2I模型
      const t2iModels = await getAIModels({ type: 't2i' });
      const t2iModel = t2iModels.find(model => model.status === 'active');
      if (!t2iModel) {
        throw new Error('No active T2I model available');
      }

      // 调用生成头像接口
      const response = await generateAvatar({
        llm_id_for_prompt: promptModel.llm_id,
        llm_id_for_t2i: t2iModel.llm_id,
        art_style_keyword: artStyle,
        character_description: description,
        personality: personality,
        reference_image_description: referenceImageDescription || ''
      });

      // 更新生成的头像
      setGeneratedAvatars([response.image_url]);
      setGeneratedAvatar(response.image_url);
      setGeneratedIconUrl(response.icon_url);
      setImagePrompt(description);  // 使用角色描述作为图片提示词

      toast({
        title: "Avatar Generated Successfully",
        description: "Your character avatar has been generated",
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to generate avatar:', error);
      toast({
        title: "Avatar Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCharacter = async () => {
    if (!name || !generatedAvatar || !generatedIconUrl || !selectedLLMId) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields and generate an avatar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const params = {
        llm_id: selectedLLMId,
        character_name: name,
        character_description: description,
        personality: personality,
        language: navigator.language.startsWith('zh') ? 'Chinese' : 'English',
        image_prompt: imagePrompt,
        image_url: generatedAvatar,
        icon_url: generatedIconUrl
      };

      // 调用创建角色接口
      const response = await createCharacter(params);

      if (!response || !response.character_id) {
        throw new Error('Invalid response from server');
      }

      // 先关闭模态框，提升用户体验
      onClose();

      // 异步处理回调，不阻塞UI
      setTimeout(() => {
        // 调用父组件的回调函数
        onAddCharacter({
          id: response.character_id,
          name,
          avatar: generatedAvatar,
          icon: generatedIconUrl
        });

        toast({
          title: "Character Created Successfully",
          description: "Your character has been created",
          variant: "default"
        });
      }, 0);

    } catch (error) {
      console.error('Failed to create character:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        try {
          const errorDetail = JSON.parse(error.message);
          if (errorDetail.detail) {
            errorMessage = errorDetail.detail;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Character Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // 获取角色列表
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        console.log('Fetching character list...');
        const characterList = await getCharacterList();
        console.log('Fetched characters:', characterList);
        setCharacters(characterList);
      } catch (error) {
        console.error('Failed to fetch characters:', error);
        toast({
          title: "Failed to Load Characters",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
      }
    };

    if (isOpen) {
      fetchCharacters();
    }
  }, [isOpen, toast]);

  // 处理角色选择
  const handleSelectCharacter = (character: any) => {
    setSelectedCharacterId(character.id);
    onAddCharacter({
      id: character.id,
      name: character.name,
      avatar: character.icon_url, // 使用icon_url而不是avatar_url
      icon: character.icon_url
    });
    onClose();
  };

  // 处理角色删除
  const handleDeleteCharacter = async (characterId: string) => {
    try {
      setIsDeleting(characterId);
      
      // 调用删除角色服务
      await deleteCharacter(characterId);

      // 从列表中移除被删除的角色
      setCharacters(prevCharacters => prevCharacters.filter(char => char.id !== characterId));

      toast({
        title: "Character Deleted",
        description: "Character has been successfully deleted",
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to delete character:', error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete character",
        variant: "destructive"
      });
    } finally {
      setIsDeleting('');
    }
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-7xl m-4 h-[95vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Create Character</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 text-white" />
          </Button>
        </div>
        <div className="flex gap-6 flex-1 min-h-0">
          {/* 左侧角色列表 */}
          <div className="w-1/5 bg-gray-800 rounded-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-4">Your Characters</h3>
            <div className="space-y-4">
              {Array.isArray(characters) && characters.length > 0 ? (
                characters.map((character) => (
                  <div
                    key={character.id}
                    className={`bg-gray-700 rounded-lg p-3 transition-all hover:bg-gray-600 ${
                      selectedCharacterId === character.id ? 'ring-2 ring-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {character.icon_url && (
                          <img
                            src={character.icon_url}
                            alt={character.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Failed to load character icon:', character.icon_url);
                              e.currentTarget.src = '/placeholder-avatar.png';
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">{character.name || 'Unnamed'}</h4>
                        <p className="text-gray-300 text-xs truncate">{character.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => handleSelectCharacter(character)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm py-1"
                        disabled={isDeleting === character.id}
                      >
                        Select
                      </Button>
                      <Button
                        onClick={() => handleDeleteCharacter(character.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3"
                        disabled={isDeleting === character.id}
                      >
                        {isDeleting === character.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No characters created yet
                </div>
              )}
            </div>
          </div>

          {/* 中间创建表单 */}
          <div className="w-[45%] flex flex-col space-y-4 overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Character Description <span className="text-red-500">*</span></label>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setIsDescriptionValid(e.target.value.trim().length > 0)
                }}
                placeholder="Describe gender, hairstyle, facial expression, skin color, clothing, etc."
                className={`w-full bg-gray-800 text-white h-24 ${!isDescriptionValid && description.length > 0 ? 'border-red-500' : ''}`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Character Name <span className="text-red-500">*</span></label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setIsNameValid(e.target.value.trim().length > 0)
                }}
                className={`w-full bg-gray-800 text-white ${!isNameValid && name.length > 0 ? 'border-red-500' : ''}`}
                required
              />
            </div>
            <div className="flex-1 min-h-0">
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
                        onClick={() => setArtStyle(style.name)}
                        className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all hover:border-amber-400 ${
                          artStyle === style.name ? 'border-amber-500 bg-gray-800' : 'border-gray-700 hover:bg-gray-800'
                        }`}
                      >
                        <div className="w-full aspect-square relative mb-2 rounded-md overflow-hidden">
                          <img 
                            src={getImageUrl(style.image)} 
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
              <label className="block text-sm font-medium text-white mb-1">Personality</label>
              <Textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-gray-800 text-white h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Reference Image (Optional)</label>
              <Input
                type="file"
                onChange={handleReferenceImageUpload}
                className="w-full bg-gray-800 text-white"
                accept="image/*"
              />
            </div>
            <Button 
              onClick={handleGenerateAvatar} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={isGenerating || !isDescriptionValid || !isNameValid || !artStyle}
            >
              {isGenerating ? 'Generating...' : 'Generate Avatar'}
            </Button>
          </div>

          {/* 右侧预览 */}
          <div className="w-[35%] flex flex-col space-y-4 min-h-0">
            <h3 className="text-lg font-medium text-white">Generated Avatars</h3>
            <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-4">
              {generatedAvatars.map((avatar, index) => (
                <div
                  key={index}
                  className={`relative bg-gray-800 rounded-lg overflow-hidden ${
                    generatedAvatar === avatar ? 'ring-2 ring-amber-500' : ''
                  }`}
                  style={{ 
                    width: '100%',
                    height: '750px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={avatar}
                    alt={`Generated Avatar ${index + 1}`}
                    className="max-w-full max-h-full w-auto h-auto object-contain hover:object-cover transition-all duration-300 cursor-pointer"
                    onClick={() => setGeneratedAvatar(avatar)}
                  />
                  <GenerationProgress isGenerating={isGenerating} />
                </div>
              ))}
              {/* 如果没有生成的图片，显示占位符 */}
              {generatedAvatars.length === 0 && (
                <div 
                  className="relative bg-gray-800 rounded-lg overflow-hidden w-full"
                  style={{ 
                    height: '750px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isGenerating ? (
                    <GenerationProgress isGenerating={isGenerating} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      No avatar generated yet
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button 
              onClick={handleAddCharacter} 
              disabled={!name || !generatedAvatar || isCreating} 
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              {isCreating ? 'Creating...' : 'Complete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

