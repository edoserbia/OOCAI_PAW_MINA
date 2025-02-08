import { API_CONFIG } from '../config/api';
import { TemplateConfig } from '../lib/templateConfigs';

/**
 * 获取所有故事模板
 * @param status - 可选的状态过滤（active/inactive）
 * @returns Promise<TemplateConfig[]>
 */
export const getStoryTemplates = async (status?: string): Promise<TemplateConfig[]> => {
  try {
    const url = new URL(`${API_CONFIG.API_URL}/story-templates`);
    if (status) {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch story templates');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching story templates:', error);
    throw error;
  }
};

/**
 * 获取单个故事模板
 * @param templateId - 模板ID
 * @returns Promise<TemplateConfig>
 */
export const getStoryTemplate = async (templateId: string): Promise<TemplateConfig> => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/story-templates/${templateId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch story template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching story template:', error);
    throw error;
  }
};

/**
 * 创建新的故事模板
 * @param template - 模板配置
 * @returns Promise<TemplateConfig>
 */
export const createStoryTemplate = async (template: TemplateConfig): Promise<TemplateConfig> => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/story-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      throw new Error('Failed to create story template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating story template:', error);
    throw error;
  }
};

/**
 * 更新故事模板
 * @param templateId - 模板ID
 * @param template - 更新的模板配置
 * @returns Promise<TemplateConfig>
 */
export const updateStoryTemplate = async (
  templateId: string,
  template: TemplateConfig
): Promise<TemplateConfig> => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/story-templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      throw new Error('Failed to update story template');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating story template:', error);
    throw error;
  }
};

/**
 * 删除故事模板
 * @param templateId - 模板ID
 * @returns Promise<void>
 */
export const deleteStoryTemplate = async (templateId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/story-templates/${templateId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete story template');
    }
  } catch (error) {
    console.error('Error deleting story template:', error);
    throw error;
  }
}; 