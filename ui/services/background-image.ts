import { API_CONFIG, fetchApi } from '../config/api';

interface GenerateBackgroundImageRequest {
  style_keyword: string;
  background_description: string;
}

interface GenerateBackgroundImageResponse {
  image_url: string;
  prompt?: string;  // 可选的提示词，用于调试
}

/**
 * 生成故事背景图片
 * @param params - 请求参数
 * @returns Promise<GenerateBackgroundImageResponse>
 */
export const generateBackgroundImage = async (
  params: GenerateBackgroundImageRequest
): Promise<GenerateBackgroundImageResponse> => {
  try {
    console.log('Generating background image with params:', params);
    const response = await fetchApi(API_CONFIG.PATHS.LLM.GENERATE_BACKGROUND, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    const data = await response.json();
    console.log('Generate background image response:', data);
    
    if (!data || !data.image_url) {
      throw new Error('Invalid response data structure');
    }
    
    return data;
  } catch (error) {
    console.error('Error in generateBackgroundImage:', error);
    throw error;
  }
}; 