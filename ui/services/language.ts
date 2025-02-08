import { API_CONFIG, fetchApi } from '@/config/api';

export interface Language {
  id: string;
  language: string;
  created_at: string;
  updated_at: string;
}

// 获取所有支持的语言
export const getLanguages = async (): Promise<Language[]> => {
  const response = await fetchApi(API_CONFIG.PATHS.LANGUAGES);
  return response.json();
};

// 获取浏览器语言
export const getBrowserLanguage = (): string => {
  const lang = navigator.language.toLowerCase();
  return lang.startsWith('zh') ? '中文' : 'English';
};

// 从缓存获取当前语言
export const getCurrentLanguage = (): string => {
  return localStorage.getItem('currentLanguage') || getBrowserLanguage();
};

// 保存当前语言到缓存
export const setCurrentLanguage = (language: string): void => {
  localStorage.setItem('currentLanguage', language);
}; 