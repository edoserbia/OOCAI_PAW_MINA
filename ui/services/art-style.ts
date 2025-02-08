import { API_CONFIG, fetchApi } from '../config/api';
import { GetArtStylesParams, GetArtStylesResponse, ArtStyle } from '../types/art-style';

/**
 * 获取艺术风格列表
 * @param params - 查询参数 { status?: 'active' | 'inactive' }
 * @returns Promise<GetArtStylesResponse>
 * @throws Error 当请求失败时抛出错误
 */
export async function getArtStyles(params?: GetArtStylesParams): Promise<GetArtStylesResponse> {
  try {
    // 检查是否已登录
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('请先登录');
    }

    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (params?.status) {
      queryParams.append('status', params.status);
    }

    // 构建完整的URL
    const url = `${API_CONFIG.PATHS.ART_STYLES.LIST}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Fetching art styles from:', url);

    // 发送请求
    const response = await fetchApi(url, {
      method: 'GET',
    });

    // 解析响应数据
    const data = await response.json();
    console.log('Raw art styles response:', data);
    
    // 检查响应数据结构
    if (!data || !Array.isArray(data)) {
      console.error('Invalid response format:', data);
      return {
        art_styles: [],
        total: 0
      };
    }

    // 处理数组响应
    const processedStyles = data.map((style: any): ArtStyle => ({
      name: style.name || '',
      image: style.image || '',
      keyword: style.keyword || '',
      status: style.status || 'active',
      created_at: style.created_at || new Date().toISOString(),
      updated_at: style.updated_at || new Date().toISOString()
    }));

    console.log('Processed art styles:', processedStyles);

    return {
      art_styles: processedStyles,
      total: processedStyles.length
    };
  } catch (error) {
    console.error('Failed to fetch art styles:', error);
    return {
      art_styles: [],
      total: 0
    };
  }
} 