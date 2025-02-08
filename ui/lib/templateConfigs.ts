// This file defines the structure of templates and the UI components included in each template.
// Non-code developers can modify this file to add new templates or modify existing ones.

// Define the configuration structure for a single UI component
export interface ComponentConfig {
  type: 'TextInput' | 'CharacterSelection' | 'ImageUpload' | 'MusicSelection' | 'VoiceSelection' | 'BackgroundImageGeneration' | 'OpeningLineInput';
  id: string;
  title: string;
  width?: string | number;
  height?: string | number;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  maxOpeningLines?: number;
  minOpeningLines?: number;
}

// Define the configuration structure for an entire template
export interface TemplateConfig {
  _id: string;
  name: string;
  thumbnail: string;
  introduction: string;
  components: ComponentConfig[];
  maxCharacters: number;
  history_length: number;
  hidden_background_prompt: string;
  hidden_target_prompt: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// 从API获取模板配置
import { getStoryTemplates } from '../services/story-template';

// 获取活跃的模板配置
export const getActiveTemplateConfigs = async (): Promise<TemplateConfig[]> => {
  try {
    const templates = await getStoryTemplates('active');
    return templates;
  } catch (error) {
    console.error('Error fetching template configs:', error);
    return [];
  }
};

// 获取所有模板配置
export const getAllTemplateConfigs = async (): Promise<TemplateConfig[]> => {
  try {
    const templates = await getStoryTemplates();
    return templates;
  } catch (error) {
    console.error('Error fetching all template configs:', error);
    return [];
  }
};

