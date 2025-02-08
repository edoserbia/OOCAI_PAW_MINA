import { API_CONFIG } from '@/config/api';
import { fetchApi } from '@/config/api';
import ZkappWorkerClient from '../app/zkappWorkerClient';

// 智能合约相关配置
const ZKAPP_ADDRESS = 'B62qnFBcDJA52TNz87KK4ZpG44vEWKKr5jrMjSGegXGwiVjX3XhC5A9';
const TRANSACTION_FEE = 0.1;

// ... existing code ...

interface PublishStoryRequest {
    template_id: string;
    template_content: string;
    characters: string[];
    background_music_id?: string;
    bg_image_url: string;
    story_name: string;
    opening_messages: Array<{
        content: string;
        character: string;
    }>;
    settings: any;
    language: string;
    wallet_type?: string;  // 添加钱包类型字段
}

interface PublishStoryResponse {
    id: string;
}

interface GetStoriesResponse {
    id: string;
    title: string;
    intro: string;
    messages: Array<{
        content: string;
        character_id: string;
    }>;
    likes: string;
    rewards: string;
    background: string;
    date?: string;
    characters: number;
    avatar_url?: string;
    characterIcons: string[];
    characterDetails: Array<{
        id: string;
        name: string;
        description: string;
        image_url?: string;
        icon_url?: string;
        character_type: string;
    }>;
    backgroundMusic?: string;
    created_by: string;
    creator_name: string;
    comments_count: string;
}

// 对话相关接口类型定义
interface CreateConversationRequest {
    story_id: string;
    messages: Array<{
        content: string;
        character_id: string;
    }>;
}

interface CreateConversationResponse {
    id: string;
    story_id: string;
    status: string;
    created_at: string;
    last_message_id: string;
}

interface SelectSpeakersRequest {
    history_length: number;
    user_message: string;
    history_messages: Array<{
        id: string;
        content: string;
        character_id: string;
        role: string;
        sequence: number;
        created_at: string;
    }>;
    character_names: string[];
}

interface SelectSpeakersResponse {
    selected_character_id: string;
}

interface GenerateResponseRequest {
    history_length: number;
    character_id: string;
    user_message: string;
    history_messages: Array<{
        content: string;
        character_id: string;
    }>;
    conversation_id: string;
    last_message_id: string;
    is_first_response: boolean;
}

interface HistoryMessage {
    id: string;
    content: string;
    character_id: string;
    character_name: string | null;
    is_opening?: boolean;
    sequence: number;
    created_at: string;
    role: string;
}

/**
 * 发布故事并记录到智能合约
 * @param data 发布故事请求数据
 * @returns 发布的故事ID和智能合约交互结果
 */
export const publishStory = async (data: PublishStoryRequest): Promise<{
  id: string;
  transactionHash?: string;
}> => {
    console.log('[Story Service] Starting story publishing process...');
    
    // 先调用API发布故事
    console.log('[Story Service] Calling API to publish story...');
    const response = await fetchApi(API_CONFIG.PATHS.PUBLISH_STORY, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    console.log('[Story Service] Story published to API successfully:', result);

    let transactionHash: string | undefined;

    // 如果是Mina钱包类型，则进行智能合约交互
    if (data.wallet_type === 'mina') {
        try {
            console.log('[Story Service] Starting Mina blockchain interaction...');
            
            // 初始化智能合约客户端
            console.log('[Story Service] Initializing zkApp worker client...');
            const zkappWorkerClient = new ZkappWorkerClient();
            
            // 设置网络为Devnet
            console.log('[Story Service] Setting network to Devnet...');
            await zkappWorkerClient.setActiveInstanceToDevnet();

            // 获取Mina钱包实例
            console.log('[Story Service] Getting Mina wallet instance...');
            const mina = (window as any).mina;
            if (!mina) {
                throw new Error('Mina wallet not found');
            }

            // 请求连接钱包
            console.log('[Story Service] Requesting wallet connection...');
            const publicKeyBase58: string = (await mina.requestAccounts())[0];
            console.log('[Story Service] Connected to Mina account:', publicKeyBase58);

            // 加载并编译合约
            console.log('[Story Service] Loading smart contract...');
            await zkappWorkerClient.loadContract();
            console.log('[Story Service] Compiling smart contract...');
            await zkappWorkerClient.compileContract();

            // 初始化合约实例
            console.log('[Story Service] Initializing contract instance with address:', ZKAPP_ADDRESS);
            await zkappWorkerClient.initZkappInstance(ZKAPP_ADDRESS);

            // 创建记录Story的交易
            console.log('[Story Service] Creating recordStory transaction for story ID:', result.id);
            await zkappWorkerClient.createRecordStoryTransaction(result.id);

            // 生成交易证明
            console.log('[Story Service] Generating transaction proof...');
            await zkappWorkerClient.proveTransaction();

            // 获取交易JSON并发送
            console.log('[Story Service] Getting transaction JSON...');
            const transactionJSON = await zkappWorkerClient.getTransactionJSON();

            // 发送交易
            console.log('[Story Service] Sending transaction to blockchain...');
            const { hash } = await mina.sendTransaction({
                transaction: transactionJSON,
                feePayer: {
                    fee: TRANSACTION_FEE,
                    memo: '',
                },
            });

            console.log('[Story Service] Story recorded on blockchain successfully!');
            console.log('[Story Service] Transaction hash:', hash);
            transactionHash = hash;
        } catch (error) {
            console.error('[Story Service] Failed to record story on blockchain:', error);
            // 注意：即使智能合约交互失败，我们仍然返回API的结果
            // 因为故事已经在中心化服务器上创建成功
        }
    } else {
        console.log('[Story Service] Skipping blockchain interaction - not a Mina wallet');
    }

    console.log('[Story Service] Story publishing process completed:', {
        story_id: result.id,
        transaction_hash: transactionHash
    });

    return {
        id: result.id,
        transactionHash
    };
};

/**
 * 获取故事列表
 * @param page 页码，从1开始
 * @param limit 每页数量
 * @returns 故事列表
 */
export const getStories = async (page: number = 1, limit: number = 10): Promise<GetStoriesResponse[]> => {
    const response = await fetchApi(`${API_CONFIG.PATHS.GET_STORIES}?page=${page}&limit=${limit}`, {
        method: 'GET',
    });
    return response.json();
};

/**
 * 创建对话
 * @param storyId 故事ID
 * @param messages 初始消息列表
 * @returns 创建的对话信息
 */
export const createConversation = async (
    storyId: string, 
    messages: Array<{content: string, character_id: string}>
): Promise<CreateConversationResponse> => {
    const response = await fetchApi(API_CONFIG.PATHS.CONVERSATION.CREATE, {
        method: 'POST',
        body: JSON.stringify({ 
            story_id: storyId,
            messages: messages 
        }),
    });
    return response.json();
};

/**
 * 选择说话角色
 * @param data 选择说话角色请求数据
 * @returns 选择的角色ID
 */
export const selectSpeakers = async (data: SelectSpeakersRequest): Promise<SelectSpeakersResponse> => {
    const response = await fetchApi(API_CONFIG.PATHS.STORY_CHAT.SELECT_SPEAKERS, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
};

/**
 * 生成角色回复
 * @param data 生成回复请求数据
 * @returns 流式响应
 */
export const generateResponse = async (data: GenerateResponseRequest): Promise<Response> => {
    return await fetchApi(API_CONFIG.PATHS.STORY_CHAT.GENERATE_RESPONSE, {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

/**
 * 获取历史消息
 * @param conversationId 对话ID
 * @param lastMessageTime ISO格式的UTC时间字符串
 * @returns 历史消息列表
 */
export const getHistoryMessages = async (conversationId: string, lastMessageTime?: string): Promise<HistoryMessage[]> => {
    // 如果没有提供lastMessageTime，使用当前时间加2秒
    const queryTime = lastMessageTime || new Date(Date.now() + 2000).toISOString()
    console.log('查询历史消息，时间参数:', queryTime)
    
    return fetchApi(API_CONFIG.PATHS.STORY_CHAT.HISTORY_MESSAGES, {
        method: 'POST',
        body: JSON.stringify({
            conversation_id: conversationId,
            last_message_time: queryTime
        })
    }).then(response => response.json())
}

export async function checkConversation(storyId: string): Promise<string | null> {
  try {
    const response = await fetchApi(API_CONFIG.PATHS.CONVERSATION.CHECK(storyId), {
      method: 'GET'
    });
    const data = await response.json();
    return data.conversation_id;
  } catch (error) {
    console.error('Failed to check conversation:', error);
    return null;
  }
}

/**
 * 获取用户已有对话的故事列表
 * @param page 页码，从1开始
 * @param limit 每页数量
 * @returns 故事列表
 */
export const getStartedStories = async (page: number = 1, limit: number = 10): Promise<GetStoriesResponse[]> => {
    const response = await fetchApi(`${API_CONFIG.PATHS.GET_STARTED_STORIES}?page=${page}&limit=${limit}`, {
        method: 'GET',
    });
    return response.json();
}; 