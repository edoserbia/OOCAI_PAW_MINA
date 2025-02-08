'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Language, getLanguages, getCurrentLanguage, setCurrentLanguage, getBrowserLanguage } from '@/services/language'

// 默认语言选项
const defaultLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
]

// 根据语言名称获取语言对象
const getLanguageByName = (name: string) => {
  return defaultLanguages.find(lang => lang.name === name) || defaultLanguages[0]
}

export function LanguageSelector() {
  // 状态管理
  const [isOpen, setIsOpen] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  // 初始化时使用浏览器语言
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // 优先使用localStorage中保存的语言
    const savedLanguage = getCurrentLanguage()
    if (savedLanguage) {
      return getLanguageByName(savedLanguage)
    }
    // 如果没有保存的语言，则使用浏览器语言
    const browserLanguage = getBrowserLanguage()
    return getLanguageByName(browserLanguage)
  })
  const [isLoading, setIsLoading] = useState(true)

  // 初始化加载语言列表
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const languageList = await getLanguages()
        setLanguages(languageList)
      } catch (error) {
        console.error('Failed to fetch languages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLanguages()
  }, [])

  const toggleDropdown = () => setIsOpen(!isOpen)

  const selectLanguage = (language: typeof defaultLanguages[0]) => {
    setSelectedLanguage(language)
    setIsOpen(false)
    // 更新应用的语言设置
    setCurrentLanguage(language.name)
  }

  if (isLoading) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
      >
        <span>{selectedLanguage.name}</span>
        <ChevronDown className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 w-full mb-2 origin-bottom-right bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {defaultLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => selectLanguage(language)}
                className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700"
              >
                {language.name}
                {language.code === selectedLanguage.code && (
                  <Check className="w-5 h-5 ml-2" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

