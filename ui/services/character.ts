import { API_CONFIG, fetchApi } from '../config/api';

interface GenerateAvatarResponse {
    image_url: string;
}

interface ProcessAvatarResponse {
    image_url: string;
    icon_url: string;
}

interface CreateCharacterResponse {
    id: string;  // MongoDB的_id
}

interface Character {
    id: string;
    name: string;
    description: string;
    personality: string;
    system_prompt: string;
    image_prompt?: string;
    image_url?: string;
    icon_url?: string;
    created_at: string;
    updated_at: string;
}

interface CharacterUpdate {
    name?: string;
    description?: string;
    personality?: string;
    system_prompt?: string;
    image_prompt?: string;
    image_url?: string;
    icon_url?: string;
}

// 生成角色头像
export const generateAvatar = async (params: {
    llm_id_for_prompt: string;
    llm_id_for_t2i: string;
    art_style_keyword: string;
    character_description: string;
    personality: string;
    reference_image_description?: string;
}): Promise<GenerateAvatarResponse> => {
    const response = await fetchApi(API_CONFIG.PATHS.CHARACTER_AVATAR.GENERATE, {
        method: 'POST',
        body: JSON.stringify(params)
    });
    return response.json();
};

// 处理角色头像
export const processAvatar = async (params: {
    image_filename: string;
}): Promise<ProcessAvatarResponse> => {
    const response = await fetchApi(API_CONFIG.PATHS.CHARACTER_AVATAR.PROCESS, {
        method: 'POST',
        body: JSON.stringify(params)
    });
    return response.json();
};

// 创建角色
export const createCharacter = async (params: {
    llm_id: string;
    character_name: string;
    character_description: string;
    personality: string;
    language: string;
    image_prompt: string;
    image_url: string;
    icon_url: string;
}): Promise<CreateCharacterResponse> => {
    const response = await fetchApi(API_CONFIG.PATHS.CHARACTER_AVATAR.CREATE, {
        method: 'POST',
        body: JSON.stringify(params)
    });
    return response.json();
};

// 获取用户创建的角色列表
export const getCharacterList = async (): Promise<Character[]> => {
    try {
        const response = await fetchApi(API_CONFIG.PATHS.CHARACTERS.LIST);
        const data = await response.json();
        console.log('Character list response:', data);
        return data || [];
    } catch (error) {
        console.error('Failed to fetch character list:', error);
        throw error;
    }
};

// 获取角色详情
export const getCharacter = async (characterId: string): Promise<Character> => {
    const response = await fetchApi(API_CONFIG.PATHS.CHARACTERS.DETAIL(characterId), {
        method: 'GET'
    });
    return response.json();
};

// 更新角色信息
export const updateCharacter = async (characterId: string, data: CharacterUpdate): Promise<Character> => {
    const response = await fetchApi(API_CONFIG.PATHS.CHARACTERS.UPDATE(characterId), {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    return response.json();
};

// 删除角色
export const deleteCharacter = async (characterId: string): Promise<void> => {
    await fetchApi(API_CONFIG.PATHS.CHARACTERS.DELETE(characterId), {
        method: 'DELETE'
    });
};

/**
 * 获取旁白角色
 * @returns Promise with narrator character data
 */
export const getNarratorCharacter = async (): Promise<Character> => {
  try {
    const response = await fetchApi(API_CONFIG.PATHS.CHARACTERS.NARRATOR);
    return response.json();
  } catch (error) {
    console.error('Failed to get narrator character:', error);
    throw error;
  }
}; 