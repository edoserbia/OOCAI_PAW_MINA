import React, { useEffect, useState, useRef } from 'react'
import { MusicService, Music } from '../services/music'
import { PlayCircle, PauseCircle, ChevronDown, ChevronUp } from 'lucide-react'

export interface MusicSelectionProps {
  id: string
  title: string
  value?: string
  onChange?: (value: string) => void
  width?: string | number
  height?: number
  placeholder?: string
}

/**
 * 音乐选择组件
 * 支持按类型筛选和试听音乐
 */
export const MusicSelection: React.FC<MusicSelectionProps> = ({
  id,
  title,
  value,
  onChange,
  width = '100%',
  placeholder = "Select background music"
}) => {
  // 下拉框状态
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  // 音乐列表
  const [musicList, setMusicList] = useState<Music[]>([])
  // 音乐类型列表
  const [musicTypes, setMusicTypes] = useState<string[]>([])
  // 选中的音乐类型
  const [selectedType, setSelectedType] = useState<string>('')
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 当前播放的音乐ID
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null)
  // 音频元素引用
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('')
  // 选中的音乐
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null)
  // 是否选择了No music
  const [isNoMusic, setIsNoMusic] = useState(false)

  // 获取音乐列表和类型
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [musicResponse, typesResponse] = await Promise.all([
          MusicService.getMusicList(),
          MusicService.getMusicTypes()
        ])
        setMusicList(musicResponse.items)
        setMusicTypes(typesResponse.types)
        
        // 如果有value，找到对应的音乐并设置
        if (value) {
          const music = musicResponse.items.find(m => m.id === value)
          if (music) {
            setSelectedMusic(music)
            setIsNoMusic(false)
          }
        }
      } catch (error) {
        console.error('Failed to fetch music data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [value])

  // 处理音乐播放
  const handlePlayMusic = (musicId: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation() // 防止触发选择事件
    if (playingMusicId === musicId) {
      audioRef.current?.pause()
      setPlayingMusicId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(url)
      audioRef.current.play()
      setPlayingMusicId(musicId)
    }
  }

  // 停止播放当前音乐
  const stopCurrentMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setPlayingMusicId(null)
    }
  }

  // 组件卸载时停止播放
  useEffect(() => {
    return () => {
      stopCurrentMusic()
    }
  }, [])

  // 处理音乐选择
  const handleMusicSelect = (music: Music | null) => {
    setSelectedMusic(music)
    setIsNoMusic(!music)
    onChange?.(music?.id || '')
    setIsDropdownOpen(false)
    stopCurrentMusic()
  }

  // 处理类型选择
  const handleTypeSelect = (type: string) => {
    setSelectedType(type === selectedType ? '' : type)
    setSearchKeyword('')
  }

  // 过滤后的音乐列表
  const filteredMusicList = musicList.filter(music => 
    music && music.name && // 确保音乐对象和名称存在
    (!selectedType || music.type === selectedType) && // 按类型筛选
    (music.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    music.type.toLowerCase().includes(searchKeyword.toLowerCase()))
  )

  return (
    <div className="mb-4" style={{ width }}>
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {title}
      </label>
      <div className="relative w-full">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg flex justify-between items-center hover:bg-gray-600 cursor-pointer"
        >
          <span>{isNoMusic ? "No music" : (selectedMusic ? selectedMusic.name : placeholder)}</span>
          {isDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {isDropdownOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg shadow-lg">
            <div className="p-2">
              <input
                type="text"
                placeholder="Search music..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
              />
              
              {/* 音乐类型网格 */}
              <div className="flex flex-wrap gap-1.5 mb-3 p-1.5 bg-gray-900/50 rounded-lg">
                {musicTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-200 ${
                      selectedType === type
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border-t border-gray-700">
              {/* No music 选项 */}
              <div
                onClick={() => handleMusicSelect(null)}
                className={`px-3 py-2 hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
                  isNoMusic ? 'bg-gray-700' : ''
                }`}
              >
                <div className="text-white font-medium">No music</div>
              </div>

              {loading ? (
                <div className="p-4 text-center text-gray-400">Loading...</div>
              ) : filteredMusicList.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No music found</div>
              ) : (
                filteredMusicList.map((music, index) => (
                  <div
                    key={`music-${music.id || index}`}
                    onClick={() => handleMusicSelect(music)}
                    className={`px-3 py-2 hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
                      selectedMusic?.id === music.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white">{music.name}</div>
                        <div className="text-sm text-gray-400">{music.type}</div>
                      </div>
                      <button
                        onClick={(e) => handlePlayMusic(music.id, music.url, e)}
                        className="text-amber-500 hover:text-amber-400 transition-colors duration-200"
                      >
                        {playingMusicId === music.id ? (
                          <PauseCircle size={24} />
                        ) : (
                          <PlayCircle size={24} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 