import { API_CONFIG, fetchApi } from '../config/api';

interface UploadImageResponse {
    filename: string;
    url: string;
}

/**
 * 获取图片完整URL
 * @param filename - 图片文件名
 * @returns 完整的图片URL
 */
export function getImageUrl(filename: string): string {
    if (!filename) {
        console.warn('Empty filename provided to getImageUrl');
        return '/placeholder.png';
    }
    
    try {
        // 如果已经是完整的URL，直接返回
        if (filename.startsWith('http')) {
            return filename;
        }
        
        // 确保文件名格式正确
        const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
        
        // 构建完整的URL
        return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_CONFIG.PATHS.IMAGES.GET(cleanFilename)}`;
    } catch (error) {
        console.error('Error generating image URL:', error);
        return '/placeholder.png';
    }
}

// 上传图片
export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Only images are allowed.');
    }

    // 验证文件大小（例如限制为10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchApi(API_CONFIG.PATHS.IMAGES.UPLOAD, {
        method: 'POST',
        // 不设置Content-Type，让浏览器自动设置multipart/form-data
        headers: {
            // 移除默认的Content-Type，让浏览器自动设置
            'Accept': 'application/json',
        },
        body: formData
    });

    const result = await response.json();
    if (!result.filename || !result.url) {
        throw new Error('Invalid response from server');
    }

    return result;
}; 