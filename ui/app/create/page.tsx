'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateSelector } from '@/components/template-selector'
import { TemplateDetails } from '@/components/template-details'
import { BackgroundImageBlock } from '@/components/background-image-block'
import { ConfirmationModal } from '@/components/confirmation-modal'
import { TemplateConfig, getActiveTemplateConfigs } from '@/lib/templateConfigs'
import { CharacterCreationModal } from '@/components/character-creation-modal'
import { BackgroundImageModal } from '@/components/background-image-modal'
import { publishStory } from '@/services/story'

interface TemplateData {
  formData: Record<string, any>
  characters: Array<{ id: string; name: string; avatar: string; voice?: string }>
  backgroundImage: string
  backgroundMusic?: {
    id: string
    name: string
    url: string
  }
}

export default function CreatePage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateData, setTemplateData] = useState<Record<string, TemplateData>>({})
  const [dailyCreatedAgents, setDailyCreatedAgents] = useState(0)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false)
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false)
  const maxDailyAgents = 10 // This could be fetched from an API or environment variable

  const selectedTemplate = templates.find(t => t._id === selectedTemplateId) || null

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (isLoggedIn !== 'true') {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getActiveTemplateConfigs()
        // 确保每个模板都有必要的字段
        const processedData = data.map(template => ({
          ...template,
          _id: template._id || template.id, // 兼容处理
        }))
        setTemplates(processedData)
        setLoading(false)
      } catch (err) {
        setError('Failed to load templates')
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleTemplateSelect = (template: TemplateConfig) => {
    if (hasUnsavedChanges) {
      setIsConfirmationModalOpen(true)
      setPendingTemplateId(template._id)
    } else {
      switchTemplate(template._id)
    }
  }

  const switchTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateData[templateId]) {
      setTemplateData(prev => ({
        ...prev,
        [templateId]: {
          formData: {},
          characters: [],
          backgroundImage: ''
        }
      }))
    }
    setHasUnsavedChanges(false)
  }

  const handlePublish = async () => {
    if (!selectedTemplateId || !templateData[selectedTemplateId]) {
      alert('Please select a template first');
      return;
    }

    const currentTemplate = templates.find(t => t._id === selectedTemplateId);
    if (!currentTemplate) {
      alert('Template not found');
      return;
    }

    const data = templateData[selectedTemplateId];
    
    // 检查是否选择了至少一个角色（不包括旁白）
    const nonNarratorCharacters = data.characters.filter(char => char.id !== 'narrator');
    if (nonNarratorCharacters.length === 0) {
      alert('Please select at least one character (excluding narrator)');
      return;
    }

    // 检查所有必填字段是否已填写
    const requiredFields = Object.keys(data.formData).filter(key => 
      currentTemplate.components.some(comp => 
        comp.id === key && comp.required
      )
    );
    
    const missingFields = requiredFields.filter(field => !data.formData[field]);
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // 检查背景图片是否已生成
    if (!data.backgroundImage) {
      alert('Please generate a background image first');
      return;
    }

    try {
      console.log('[Story Publish] Starting story publishing process...');
      
      // 构建模板内容字符串
      let templateContent = '';
      currentTemplate.components.forEach(comp => {
        if (comp.type === 'TextInput' || comp.type === 'OpeningLineInput') {
          const value = data.formData[comp.id];
          if (value) {
            templateContent += `${comp.title}:\n${value}\n\n`;
          }
        }
      });

      // 获取开场白信息
      const openingMessages = currentTemplate.components
        .filter(comp => comp.type === 'OpeningLineInput')
        .flatMap(comp => {
          const messages = data.formData[comp.id];
          if (Array.isArray(messages)) {
            return messages.map(msg => ({
              content: msg.content,
              character: msg.characterId
            }));
          }
          return [];
        })
        .filter(msg => msg.content);

      console.log('[Story Publish] Opening messages prepared:', openingMessages);

      // 获取故事名称
      const storyNameComponent = currentTemplate.components.find(comp => comp.id === 'story-name');
      const storyName = storyNameComponent ? data.formData[storyNameComponent.id] : 'Untitled Story';

      // 从localStorage获取钱包类型
      const walletType = localStorage.getItem('wallet_type');
      console.log('[Story Publish] Current wallet type:', walletType);

      // 发布故事
      console.log('[Story Publish] Publishing story with data:', {
        template_id: selectedTemplateId,
        story_name: storyName,
        characters_count: data.characters.length,
        has_background_music: !!data.formData.background_music,
        has_background_image: !!data.backgroundImage,
        wallet_type: walletType
      });

      const response = await publishStory({
        template_id: selectedTemplateId,
        template_content: templateContent,
        characters: data.characters.map(char => char.id),
        background_music_id: data.formData.background_music || '',
        bg_image_url: data.backgroundImage,
        story_name: storyName,
        opening_messages: openingMessages,
        settings: {
          template_id: selectedTemplateId,
          components: currentTemplate.components,
          form_data: data.formData,
          characters: data.characters,
          background_music: data.backgroundMusic || null,
          background_image: data.backgroundImage
        },
        language: navigator.language || 'en',
        wallet_type: walletType // 使用从localStorage获取的钱包类型
      });

      console.log('[Story Publish] Story published successfully:', {
        story_id: response.id,
        transaction_hash: response.transactionHash
      });

      // 发布成功后的处理
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('[Story Publish] Failed to publish story:', error);
      alert('Failed to publish story. Please try again.');
    }
  };

  const handleDataChange = (data: Partial<TemplateData>) => {
    if (selectedTemplateId) {
      console.log('handleDataChange called with:', {
        data,
        currentTemplateData: templateData[selectedTemplateId]
      });

      // 如果更新的是表单数据
      if (data.formData) {
        // 检查是否更新了背景音乐
        if ('background_music' in data.formData) {
          const musicId = data.formData.background_music;
          // 如果选择了音乐，添加音乐信息
          if (musicId) {
            data.backgroundMusic = {
              id: musicId,
              name: `Music ${musicId}`, // 这里应该从音乐列表中获取实际名称
              url: `/music/${musicId}.mp3` // 这里应该是实际的音乐URL
            };
          } else {
            // 如果取消选择音乐，清除音乐信息
            data.backgroundMusic = undefined;
          }
        }
      }

      const newTemplateData = {
        ...templateData[selectedTemplateId],
        ...data,
        formData: {
          ...templateData[selectedTemplateId].formData,
          ...(data.formData || {})
        }
      };

      console.log('Setting new template data:', newTemplateData);

      setTemplateData(prev => ({
        ...prev,
        [selectedTemplateId]: newTemplateData
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleConfirmationModalConfirm = () => {
    setIsConfirmationModalOpen(false)
    if (pendingTemplateId) {
      switchTemplate(pendingTemplateId)
      setPendingTemplateId(null)
    } else if (pendingNavigation) {
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
  }

  const handleConfirmationModalCancel = () => {
    setIsConfirmationModalOpen(false)
    setPendingTemplateId(null)
    setPendingNavigation(null)
  }

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setIsConfirmationModalOpen(true)
      setPendingNavigation(path)
    } else {
      router.push(path)
    }
  }

  const handleAddCharacter = (character: { id: string; name: string; avatar: string; icon?: string; voice?: string }) => {
    if (selectedTemplateId) {
      handleDataChange({ 
        characters: [
          ...templateData[selectedTemplateId].characters, 
          {
            id: character.id,
            name: character.name,
            avatar: character.icon || character.avatar, // 优先使用icon，如果没有则使用avatar
            voice: character.voice
          }
        ] 
      });
      setIsCharacterModalOpen(false);
    }
  }

  const handleAddBackgroundImage = (backgroundImage: string) => {
    if (selectedTemplateId && backgroundImage) {
      const updatedData = {
        ...templateData[selectedTemplateId],
        backgroundImage
      };
      setTemplateData(prev => ({
        ...prev,
        [selectedTemplateId]: updatedData
      }));
      setHasUnsavedChanges(true);
    }
  };

  // 确保在组件渲染时正确传递背景图片
  const currentBackgroundImage = selectedTemplateId && templateData[selectedTemplateId] 
    ? templateData[selectedTemplateId].backgroundImage 
    : '';

  if (loading) {
    return <div>Loading templates...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (localStorage.getItem('isLoggedIn') !== 'true') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Create Agent</h1>
      <nav className="mb-4">
        <button 
          className="text-white mr-4 hover:text-amber-500" 
          onClick={() => handleNavigation('/stories')}
        >
          Stories
        </button>
        <button 
          className="text-white mr-4 hover:text-amber-500" 
          onClick={() => handleNavigation('/profiles')}
        >
          Profiles
        </button>
      </nav>
      <div className="flex gap-4 h-[calc(100vh-150px)]">
        <div className="w-[280px] bg-gray-800 rounded-lg p-4 overflow-y-auto">
          <TemplateSelector 
            templates={templates} 
            onSelect={handleTemplateSelect}
            dailyCreatedAgents={dailyCreatedAgents}
            maxDailyAgents={maxDailyAgents}
          />
        </div>
        <div className="flex-1 min-w-[650px] bg-gray-800 rounded-lg p-4 overflow-y-auto">
          <div className="max-w-[800px] mx-auto">
            <TemplateDetails 
              template={selectedTemplate}
              templateData={selectedTemplateId ? templateData[selectedTemplateId] : null}
              onDataChange={handleDataChange}
              onPublish={handlePublish}
              isPublishDisabled={dailyCreatedAgents >= maxDailyAgents}
              onOpenCharacterModal={() => setIsCharacterModalOpen(true)}
              onOpenBackgroundModal={() => setIsBackgroundModalOpen(true)}
            />
          </div>
        </div>
        <div className="w-[350px] bg-gray-800 rounded-lg p-4">
          <BackgroundImageBlock
            backgroundImage={currentBackgroundImage}
            onBackgroundImageChange={handleAddBackgroundImage}
            hasSelectedTemplate={!!selectedTemplateId}
          />
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleConfirmationModalCancel}
        onConfirm={handleConfirmationModalConfirm}
        message="退出当前模板，会清空已编辑内容。是否确认？"
      />
      <CharacterCreationModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onAddCharacter={handleAddCharacter}
      />
      <BackgroundImageModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        onAddBackgroundImage={handleAddBackgroundImage}
      />
    </div>
  )
}

