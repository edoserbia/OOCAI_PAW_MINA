import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { TemplateConfig, ComponentConfig } from '@/lib/templateConfigs'
import * as UIComponents from '@/components/ui-components'
import { CharacterCreationModal } from '@/components/character-creation-modal'
import { VoiceSelectionModal } from '@/components/voice-selection-modal'
import { PlusCircle, ChevronDown, ChevronUp, Music, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { getNarratorCharacter } from '@/services/character'
import { MusicSelection } from './music-selection'

interface TemplateComponent {
  type: string
  id: string
  title: string
  width?: string | number
  height?: string | number
  placeholder?: string
  options?: string[]
}

interface TemplateDetailsProps {
  template: TemplateConfig | null
  templateData: {
    formData: Record<string, any>
    characters: Array<{ id: string; name: string; avatar: string; voice?: string }>
    backgroundImage: string
  } | null
  onDataChange: (newData: Partial<{
    formData: Record<string, any>
    characters: Array<{ id: string; name: string; avatar: string; voice?: string }>
    backgroundImage: string
  }>) => void
  onPublish: () => void
  isPublishDisabled: boolean
  onOpenCharacterModal: () => void
  onOpenBackgroundModal: () => void
}

export function TemplateDetails({ 
  template, 
  templateData, 
  onDataChange, 
  onPublish, 
  isPublishDisabled,
  onOpenCharacterModal,
  onOpenBackgroundModal
}: TemplateDetailsProps) {
  const [isFormValid, setIsFormValid] = useState(false)
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [isIntroExpanded, setIsIntroExpanded] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishProgress, setPublishProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const publishTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [selectedCharacters, setSelectedCharacters] = useState<Array<{
    id: string
    name: string
    avatar: string
    icon: string
  }>>([])
  const [narratorCharacter, setNarratorCharacter] = useState<{
    id: string
    name: string
    avatar: string
    icon: string
  } | null>(null)

  const formValidation = useMemo(() => {
    if (!template || !templateData) {
      console.log('Form validation failed: template or templateData is missing');
      return false;
    }

    // 计算非 narrator 角色数量
    const nonNarratorCount = templateData.characters.length - 1; // 减去 narrator
    const characterValid = nonNarratorCount >= 1 && nonNarratorCount <= template.maxCharacters;
    
    console.log('Character validation:', {
      totalCharacters: templateData.characters.length,
      nonNarratorCount,
      maxCharacters: template.maxCharacters,
      isValid: characterValid
    });

    // 只检查必填的文本输入
    const textInputsValid = template.components.every((component) => {
      if (component.type === 'CharacterSelection') {
        return true;
      }
      
      const value = templateData.formData[component.id];
      
      if (component.type === 'TextInput') {
        const isValid = !!value && value.trim() !== '';
        console.log(`Text input validation for ${component.id}:`, {
          value: value,
          isValid: isValid
        });
        return isValid;
      }
      
      if (component.type === 'OpeningLineInput') {
        // 检查是否是数组且至少有一个有效的开场白
        const isValid = Array.isArray(value) && value.length > 0 && value.some(
          item => item.content && item.content.trim() !== '' && item.characterId
        );
        console.log(`Opening line validation for ${component.id}:`, {
          value: value,
          isValid: isValid
        });
        return isValid;
      }
      
      return true;
    });

    console.log('Form validation status:', {
      characterValid,
      textInputsValid,
      backgroundMusicValue: templateData.formData.background_music
    });

    // 只检查文本输入是否有效
    return textInputsValid;
  }, [template, templateData]);

  useEffect(() => {
    setIsFormValid(formValidation);
  }, [formValidation]);

  useEffect(() => {
    const fetchNarrator = async () => {
      try {
        const narrator = await getNarratorCharacter()
        setNarratorCharacter({
          id: narrator.id,
          name: narrator.name,
          avatar: narrator.image_url || '',
          icon: narrator.icon_url || ''
        })
        
        if (template && templateData && !templateData.characters.some(char => char.id === narrator.id)) {
          const updatedCharacters = [
            { 
              id: narrator.id, 
              name: narrator.name, 
              avatar: narrator.icon_url || '' 
            },
            ...templateData.characters
          ];
          onDataChange({ characters: updatedCharacters });
        }
      } catch (error) {
        console.error('Failed to fetch narrator:', error)
      }
    }

    if (template) {
      fetchNarrator()
    }
  }, [template]);

  const handleInputChange = useCallback((id: string, value: string | string[]) => {
    console.log('handleInputChange called:', {
      id,
      value,
      currentValue: templateData?.formData[id],
      formData: templateData?.formData
    });

    if (!templateData) return;

    // 特殊处理背景音乐
    if (id === 'background_music') {
      const newFormData = {
        ...templateData.formData,
        [id]: value
      };

      console.log('Updating form data with music:', {
        id,
        value,
        newFormData
      });

      onDataChange({
        formData: newFormData
      });
      return;
    }

    // 处理其他输入
    if (templateData.formData[id] !== value) {
      const newFormData = {
        ...templateData.formData,
        [id]: value
      };

      console.log('Updating form data:', {
        id,
        value,
        newFormData
      });

      onDataChange({
        formData: newFormData
      });
    }
  }, [templateData, onDataChange]);

  const handleAddCharacter = useCallback((character: { id: string; name: string; avatar: string; icon: string }) => {
    if (template && templateData) {
      if (!templateData.characters.some(char => char.id === character.id)) {
        const updatedCharacters = [
          ...templateData.characters,
          { 
            id: character.id, 
            name: character.name, 
            avatar: character.icon || character.avatar
          }
        ];
        onDataChange({ characters: updatedCharacters });
      }
    }
    setIsCharacterModalOpen(false);
  }, [template, templateData, onDataChange]);

  const handleRemoveCharacter = useCallback((characterId: string) => {
    setSelectedCharacters(prev => {
      if (prev.some(char => char.id === characterId)) {
        return prev.filter(char => char.id !== characterId);
      }
      return prev;
    });
  }, []);

  const handleVoiceSelection = useCallback((voice: string) => {
    if (selectedCharacterId && templateData) {
      const targetChar = templateData.characters.find(char => char.id === selectedCharacterId);
      if (targetChar && targetChar.voice !== voice) {
        const updatedCharacters = templateData.characters.map((char) =>
          char.id === selectedCharacterId ? { ...char, voice } : char
        );
        onDataChange({ characters: updatedCharacters });
      }
    }
    setIsVoiceModalOpen(false);
    setSelectedCharacterId(null);
  }, [selectedCharacterId, templateData, onDataChange]);

  const handleRemoveVoice = useCallback((characterId: string) => {
    if (templateData) {
      const targetChar = templateData.characters.find(char => char.id === characterId);
      if (targetChar && targetChar.voice) {
        const updatedCharacters = templateData.characters.map((char) =>
          char.id === characterId ? { ...char, voice: undefined } : char
        );
        onDataChange({ characters: updatedCharacters });
      }
    }
  }, [templateData, onDataChange]);

  const renderComponent = useCallback((component: ComponentConfig) => {
    if (component.type === 'CharacterSelection') {
      return null;
    }
    
    const Component = UIComponents[component.type as keyof typeof UIComponents];
    if (!Component) {
      return null;
    }

    const width = component.width ? (
      typeof component.width === 'number' ? component.width : undefined
    ) : undefined;

    const height = component.height ? (
      typeof component.height === 'number' ? component.height : undefined
    ) : undefined;

    return (
      <Component
        key={component.id}
        id={component.id}
        title={component.title}
        width={width}
        height={height}
        placeholder={component.placeholder}
        options={component.options}
        value={templateData?.formData[component.id] || ''}
        onChange={(value: string | string[]) => handleInputChange(component.id, value)}
        characters={templateData?.characters}
      />
    );
  }, [templateData, handleInputChange]);

  const filteredCharacters = useMemo(() => {
    if (!templateData || !narratorCharacter) return [];
    return templateData.characters.filter(char => char.id !== narratorCharacter.id);
  }, [templateData?.characters, narratorCharacter]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (publishTimeoutRef.current) {
        clearTimeout(publishTimeoutRef.current)
      }
    }
  }, [])

  // 开始发布进度条
  const startPublishProgress = () => {
    setIsPublishing(true)
    setPublishProgress(0)

    // 每100ms更新一次进度,总共20秒
    progressIntervalRef.current = setInterval(() => {
      setPublishProgress(prev => {
        if (prev >= 99) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
          return 99
        }
        return prev + 1
      })
    }, 200)

    // 20秒后重置状态
    publishTimeoutRef.current = setTimeout(() => {
      setIsPublishing(false)
      setPublishProgress(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }, 20000)
  }

  // 处理发布点击
  const handlePublishClick = async () => {
    startPublishProgress()
    try {
      // 调用发布API
      await onPublish()
    } catch (error) {
      console.error('Publishing failed:', error)
      // 发布失败时重置状态
      setIsPublishing(false)
      setPublishProgress(0)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (publishTimeoutRef.current) {
        clearTimeout(publishTimeoutRef.current)
      }
    }
  }

  if (!template || !templateData) {
    return (
      <div className="text-center text-white">
        Please select an agent template
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">{template.name}</h2>
      <div>
        <Button
          onClick={() => setIsIntroExpanded(!isIntroExpanded)}
          variant="ghost"
          className="flex items-center text-white hover:text-amber-500 transition-colors"
        >
          <span className="mr-2">Template Introduction</span>
          {isIntroExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        {isIntroExpanded && (
          <p className="mt-2 text-gray-300 text-sm">{template.introduction}</p>
        )}
      </div>
      <div className="space-y-6">
        {template.components.map((component) => {
          if (component.type === 'CharacterSelection') {
            return (
              <div key={component.id}>
                <h3 className="text-lg font-medium text-white mb-3">{component.title}</h3>
                <div className="flex flex-wrap gap-4">
                  {templateData.characters.map((character) => (
                    <div key={character.id} className="flex items-start space-x-2">
                      <div className="flex flex-col items-center w-16 relative">
                        <Image
                          src={character.avatar}
                          alt={character.name}
                          width={64}
                          height={64}
                          className="rounded-full w-16 h-16"
                        />
                        <span className="mt-2 text-xs text-white text-center">{character.name}</span>
                        {narratorCharacter && character.id !== narratorCharacter.id && (
                          <button
                            onClick={() => {
                              const updatedCharacters = templateData.characters.filter(
                                char => char.id !== character.id
                              );
                              onDataChange({ characters: updatedCharacters });
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-start space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCharacterId(character.id)
                            setIsVoiceModalOpen(true)
                          }}
                          className="h-16 px-3 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors"
                        >
                          <Music className="w-5 h-5 text-white mr-2" />
                          <span className="text-sm text-white">
                            {character.voice ? character.voice : "Add Voice"}
                          </span>
                        </button>
                        {character.voice && (
                          <button
                            onClick={() => handleRemoveVoice(character.id)}
                            className="h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center hover:bg-red-700 transition-colors"
                            aria-label="Remove voice"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {templateData.characters.filter(char => 
                    narratorCharacter && char.id !== narratorCharacter.id
                  ).length < template.maxCharacters && (
                    <button
                      onClick={onOpenCharacterModal}
                      className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                    >
                      <PlusCircle className="w-8 h-8 text-white" />
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Characters: {templateData.characters.filter(char => 
                    narratorCharacter && char.id !== narratorCharacter.id
                  ).length} / {template.maxCharacters}
                </p>
              </div>
            )
          }
          return renderComponent(component)
        })}
        
        <div className="mt-6">
          <MusicSelection
            id="background_music"
            title="Background Music"
            value={templateData?.formData.background_music || ''}
            onChange={(value) => handleInputChange('background_music', value)}
            width="100%"
            placeholder="Select background music"
          />
        </div>
      </div>
      <div className="mt-8">
        <div className="relative">
          <button
            className={`w-full px-6 py-2 rounded-lg text-white font-semibold ${
              !isFormValid || isPublishing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
            onClick={handlePublishClick}
            disabled={!isFormValid || isPublishing}
          >
            {isPublishing ? (
              <div className="flex items-center justify-center">
                <span>Publishing</span>
                <div className="ml-2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${publishProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              'Publish'
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-400">
          Form valid: {isFormValid ? 'Yes' : 'No'}, 
          Characters: {(templateData?.characters.length ?? 1) - 1} / {template?.maxCharacters ?? 0},
          Background Image: {templateData?.backgroundImage ? 'Set' : 'Not set'}
        </p>
      </div>
      <CharacterCreationModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onAddCharacter={handleAddCharacter}
      />
      <VoiceSelectionModal
        isOpen={isVoiceModalOpen}
        onClose={() => {
          setIsVoiceModalOpen(false)
          setSelectedCharacterId(null)
        }}
        onSelectVoice={handleVoiceSelection}
      />
    </div>
  )
}

