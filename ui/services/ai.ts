import { API_CONFIG, fetchApi } from '../config/api';

interface AIModel {
    llm_id: string;
    type: string;
    settings: Record<string, any>;
    usage_count: number;
    last_used?: string;
    status: string;
}

interface I2TMessage {
    role: string;
    content: {
        text?: string;
        type: string;
        image_url?: {
            url: string;
        };
    }[];
}

interface I2TRequest {
    messages: I2TMessage[];
    model_id: string;
    stream: boolean;
}

interface I2TResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

interface GetAIModelsParams {
    type?: string;
    llm_id?: string;
}

// 获取AI模型列表
export const getAIModels = async (params?: GetAIModelsParams): Promise<AIModel[]> => {
    const queryParams = new URLSearchParams();
    if (params?.type) {
        queryParams.append('type', params.type);
    }
    if (params?.llm_id) {
        queryParams.append('llm_id', params.llm_id);
    }

    const url = `${API_CONFIG.PATHS.AI.MODELS}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetchApi(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.json();
};

// 图片转文字
export const imageToText = async (
    modelId: string,
    promptTemplate: string,
    imageUrl: string
): Promise<string> => {
    const request: I2TRequest = {
        messages: [
            {
                role: 'user',
                content: [
                    {
                        text: promptTemplate,
                        type: 'text'
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl
                        }
                    }
                ]
            }
        ],
        model_id: modelId,
        stream: false
    };

    const response = await fetchApi(API_CONFIG.PATHS.AI.I2T.CHAT_COMPLETIONS, {
        method: 'POST',
        body: JSON.stringify(request)
    });

    const result: I2TResponse = await response.json();
    return result.choices[0].message.content;
}; 