// API 基础配置
export const API_CONFIG = {
  // API 基础URL
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  // API 版本前缀
  API_PREFIX: '/api/v1',
  // 完整的 API URL
  get API_URL() {
    return `${this.BASE_URL}${this.API_PREFIX}`
  },
  // API 路径
  PATHS: {
    // 认证相关
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
    },
    // AI相关
    AI: {
      MODELS: '/ai/models',  // 获取AI模型列表
      I2T: {
        CHAT_COMPLETIONS: '/ai/i2t/chat/completions',  // 图片转文字
      },
    },
    // 艺术风格相关
    ART_STYLES: {
      LIST: '/art-styles/',
    },
    // 图片相关
    IMAGES: {
      GET: (filename: string) => `/images/${filename}`,
      UPLOAD: '/images/upload',  // 添加图片上传路径
    },
    // 语言相关
    LANGUAGES: '/languages',
    // 提示词模板
    PROMPT_TEMPLATES: {
      GET: (type: string) => `/prompt-templates/${type}`,
    },
    // 角色头像
    CHARACTER_AVATAR: {
      GENERATE: '/character-avatar/generate',
      CREATE: '/character-avatar/create'
    },
    CHARACTERS: {
      LIST: '/characters/list',
      DETAIL: (id: string) => `/characters/${id}`,
      UPDATE: (id: string) => `/characters/${id}`,
      DELETE: (id: string) => `/characters/${id}`,
      NARRATOR: '/narrator',
    },
    // Story Template APIs
    STORY_TEMPLATES: '/story-templates',
    STORY_TEMPLATE_DETAIL: (id: string) => `/story-templates/${id}`,
    LLM: {
      GENERATE_BACKGROUND: '/llm/generate/story-background-image',
    },
    // 音乐相关
    MUSIC: {
      LIST: '/music',
      TYPES: '/music/types',
      DETAIL: (id: string) => `/music/${id}`,
      CREATE: '/music',
      UPDATE: (id: string) => `/music/${id}`,
      DELETE: (id: string) => `/music/${id}`,
    },
    PUBLISH_STORY: '/story/publish',
    GET_STORIES: '/story/get_unstarted_stories',  // 获取故事列表
    GET_STARTED_STORIES: '/story/get_started_stories',
    // 对话相关
    STORY_CHAT: {
      SELECT_SPEAKERS: '/story_chat/select-speakers',  // 选择说话角色
      GENERATE_RESPONSE: '/story_chat/generate-response',  // 生成角色回复
      HISTORY_MESSAGES: '/story_chat/history-messages',  // 获取历史消息
    },
    CONVERSATION: {
      CREATE: '/conversation',  // 创建对话
      CHECK: (storyId: string) => `/conversation/${storyId}`,  // 检查故事是否有对话
    },
  },
  // 不需要认证的路径列表
  PUBLIC_PATHS: [
    '/auth/login',
    '/auth/register',
    '/images'  // 图片访问不需要认证
  ]
} as const

// 获取认证token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

// 检查是否是公共路径
const isPublicPath = (path: string): boolean => {
  return API_CONFIG.PUBLIC_PATHS.some(publicPath => path.endsWith(publicPath))
}

// API 请求工具函数
export async function fetchApi(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_CONFIG.API_URL}${path}`
  const token = getAuthToken()
  
  // 检查是否是FormData请求
  const isFormData = options.body instanceof FormData
  
  const defaultHeaders = {
    // 只有非FormData请求才设置Content-Type
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    // 只有非公共路径才添加认证头
    ...(token && !isPublicPath(path) ? { 'Authorization': `Bearer ${token}` } : {}),
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      // 如果是401错误，可能是token过期，需要重新登录
      if (response.status === 401 && !isPublicPath(path)) {
        // 清除本地token和其他登录信息
        localStorage.removeItem('token')
        localStorage.removeItem('wallet_address')
        localStorage.removeItem('token_expires_at')
        // 重定向到登录页
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      
      // 尝试获取错误详情
      const errorText = await response.text()
      throw new Error(`API request failed: ${errorText || response.statusText}`)
    }

    return response
  } catch (error) {
    console.error('API request error:', error)
    throw error
  }
} 