import { API_CONFIG, fetchApi } from '../config/api';

interface PromptTemplate {
    id: string;
    type: string;
    name: string;
    content: string;
    description: string;
    created_at: string;
    updated_at: string;
}

// 获取提示词模板
export const getPromptTemplate = async (type: string): Promise<PromptTemplate> => {
    try {
        const url = `${API_CONFIG.PATHS.PROMPT_TEMPLATES.GET(type)}`;
        console.log('Fetching prompt template from:', url);
        
        const response = await fetchApi(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        const data = await response.json();
        console.log('Prompt template response:', data);
        
        // 检查响应数据的结构
        if (!data) {
            console.error('Empty response data');
            throw new Error('Empty response data');
        }

        // 如果响应是数组，取第一个匹配的模板
        if (Array.isArray(data)) {
            const template = data.find(item => item.type === type);
            if (!template) {
                console.error('No matching template found in array');
                throw new Error('No matching template found');
            }
            return template;
        }

        // 如果响应是单个对象
        if (typeof data === 'object' && data.content) {
            return data;
        }

        console.error('Invalid response structure:', data);
        throw new Error('Invalid prompt template structure');
    } catch (error) {
        console.error(`Failed to fetch prompt template for type ${type}:`, error);
        throw error;
    }
}; 