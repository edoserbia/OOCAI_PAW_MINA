import { API_CONFIG, fetchApi } from '../config/api';

interface GenerateAvatarRequest {
    llm_id_for_prompt: string;
    llm_id_for_t2i: string;
    art_style_keyword: string;
    character_description: string;
    personality: string;
    reference_image_description?: string;
}

interface GenerateAvatarResponse {
    image_url: string;
    icon_url: string;
}

interface CreateCharacterRequest {
    llm_id: string;
    character_name: string;
    character_description: string;
    personality: string;
    language: string;
    image_prompt: string;
    image_url: string;
    icon_url: string;
}

interface CreateCharacterResponse {
    character_id: string;
}

// 生成角色头像
export const generateAvatar = async (params: GenerateAvatarRequest): Promise<GenerateAvatarResponse> => {
    console.log('Generating avatar with params:', params);
    const response = await fetchApi(API_CONFIG.PATHS.CHARACTER_AVATAR.GENERATE, {
        method: 'POST',
        body: JSON.stringify(params)
    });
    return response.json();
};

// 创建角色
export const createCharacter = async (params: CreateCharacterRequest): Promise<CreateCharacterResponse> => {
    console.log('Creating character with params:', params);
    try {
        const response = await fetchApi(API_CONFIG.PATHS.CHARACTER_AVATAR.CREATE, {
            method: 'POST',
            body: JSON.stringify(params)
        });
        
        const data = await response.json();
        console.log('Create character response:', data);
        
        // 检查响应数据结构
        if (!data || !data.id) {
            console.error('Invalid response data:', data);
            throw new Error('Invalid response data structure');
        }
        
        return {
            character_id: data.id
        };
    } catch (error) {
        console.error('Error in createCharacter:', error);
        throw error;
    }
}; 