import { API_CONFIG, fetchApi } from '../config/api'

// 音乐类型定义
export interface Music {
  id: string
  name: string
  url: string
  type: string
  created_at: string
  updated_at: string
}

// 创建音乐请求参数
export interface CreateMusicParams {
  name: string
  url: string
  type: string
}

// 更新音乐请求参数
export interface UpdateMusicParams {
  name?: string
  url?: string
  type?: string
}

// 音乐列表响应
export interface MusicListResponse {
  total: number
  items: Music[]
}

// 音乐类型列表响应
export interface MusicTypesResponse {
  types: string[]
}

/**
 * 音乐服务类
 * 处理所有与音乐相关的API请求
 */
export class MusicService {
  /**
   * 获取音乐列表
   * @param type 可选的音乐类型过滤
   * @returns 音乐列表响应
   */
  static async getMusicList(type?: string): Promise<MusicListResponse> {
    const queryParams = type ? `?type=${encodeURIComponent(type)}` : ''
    const response = await fetchApi(`${API_CONFIG.PATHS.MUSIC.LIST}${queryParams}`)
    return response.json()
  }

  /**
   * 获取所有音乐类型
   * @returns 音乐类型列表
   */
  static async getMusicTypes(): Promise<MusicTypesResponse> {
    const response = await fetchApi(API_CONFIG.PATHS.MUSIC.TYPES)
    return response.json()
  }

  /**
   * 获取音乐详情
   * @param musicId 音乐ID
   * @returns 音乐详情
   */
  static async getMusicDetail(musicId: string): Promise<Music> {
    const response = await fetchApi(API_CONFIG.PATHS.MUSIC.DETAIL(musicId))
    return response.json()
  }

  /**
   * 创建新音乐
   * @param params 创建音乐参数
   * @returns 创建的音乐详情
   */
  static async createMusic(params: CreateMusicParams): Promise<Music> {
    const response = await fetchApi(API_CONFIG.PATHS.MUSIC.CREATE, {
      method: 'POST',
      body: JSON.stringify(params)
    })
    return response.json()
  }

  /**
   * 更新音乐
   * @param musicId 音乐ID
   * @param params 更新音乐参数
   * @returns 更新后的音乐详情
   */
  static async updateMusic(musicId: string, params: UpdateMusicParams): Promise<Music> {
    const response = await fetchApi(API_CONFIG.PATHS.MUSIC.UPDATE(musicId), {
      method: 'PUT',
      body: JSON.stringify(params)
    })
    return response.json()
  }

  /**
   * 删除音乐
   * @param musicId 音乐ID
   */
  static async deleteMusic(musicId: string): Promise<void> {
    await fetchApi(API_CONFIG.PATHS.MUSIC.DELETE(musicId), {
      method: 'DELETE'
    })
  }
} 