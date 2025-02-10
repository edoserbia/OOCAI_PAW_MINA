# API 接口文档

## 基础信息

- 基础URL: `http://your-domain/api/v1`
- 所有请求需要包含 `Authorization` 头: `Bearer {paw_access_token}` (除了图片访问接口)
- 所有响应格式均为 JSON
- 时间格式: ISO 8601 UTC

## 接口目录

### 认证相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| Web3钱包登录 | POST | /auth/login | { "wallet_address": "0x...", "signature": "0x..." } |
| 退出登录 | POST | /auth/logout | 无 |

### AI相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 图生文对话 | POST | /ai/i2t/chat/completions | { "model_id": "qwen-vl-plus-1", "messages": [{ "role": "user", "content": [{ "type": "text", "text": "描述图片" }, { "type": "image_url", "image_url": { "url": "图片URL" } }] }] } |
| 文生图任务提交 | POST | /ai/t2i/submit | { "model_id": "302/flux-schnell-1", "prompt": "一只飞翔的老鹰" } |
| 获取可用模型 | GET | /ai/models | query: type (可选，模型类型：chat/other/t2i/i2t), llm_id (可选，模型ID) |
| 获取最长未用模型 | GET | /ai/models/least-used/{type} | path: type (模型类型：chat/other/t2i/i2t) |

### 提示词模板相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 获取指定类型的提示词模板 | GET | /prompt-templates/{type} | path: type (模板类型，如 "t2i_character") |

### 角色头像相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 生成角色头像 | POST | /character-avatar/generate | { "llm_id_for_prompt": "string", "llm_id_for_t2i": "string", "art_style_keyword": "string", "character_description": "string", "personality": "string", "reference_image_description": "string" } |
| 创建角色 | POST | /character-avatar/create | { "llm_id": "string", "character_name": "string", "character_description": "string", "personality": "string", "language": "string", "image_prompt": "string", "image_url": "string", "icon_url": "string" } |

### 故事相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 发布故事 | POST | /story/publish | { "template_id": "模板ID", "template_content": "模板内容", "characters": ["角色ID列表"], "background_music_id": "背景音乐ID", "bg_image_url": "背景图片URL", "story_name": "故事名称", "opening_messages": [{"content": "消息内容", "character": "角色ID"}], "settings": {"components": "组件配置"}, "language": "语言" } |
| 获取未开始对话的故事列表 | GET | /story/get_unstarted_stories | query: page (页码，从1开始), limit (每页数量，默认10) |

### 对话相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 创建新对话 | POST | /conversation | { "story_id": "故事ID", "messages": [{"content": "消息内容", "character_id": "角色ID"}] } |
| 检查故事对话 | GET | /conversation/{story_id} | 无 |
| 获取历史消息 | POST | /story_chat/history-messages | { "conversation_id": "对话ID", "last_message_time": "2024-01-21T17:34:40.312Z" } |
| 选择说话角色 | POST | /story_chat/select-speakers | { "history_length": 25, "user_message": "用户消息", "history_messages": [], "character_names": ["角色名称列表"] } |
| 生成角色回复 | POST | /story_chat/generate-response | { "history_length": 25, "character_id": "角色ID", "user_message": "用户消息", "history_messages": [], "conversation_id": "对话ID", "last_message_id": "最后消息ID", "is_first_response": true } |

### 角色相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 获取用户创建的角色列表 | GET | /characters/list | 无 |
| 获取旁白角色 | GET | /narrator | 无 |
| 获取角色详情 | GET | /characters/{character_id} | 无 |
| 更新角色 | PUT | /characters/{character_id} | { "name": "新角色名称", "avatar": "新头像URL", "personality": "新性格特征", "background": "新角色背景" } |
| 删除角色 | DELETE | /characters/{character_id} | 无 |

### LLM生成相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| LLM问答接口 | POST | /llm/chat/completions | { "model_id": "模型ID", "messages": [], "stream": false } |
| 生成故事背景 | POST | /llm/generate/story-background-image | { "style_keyword": "风格关键词", "background_description": "背景描述" } |


### 图片相关接口
| 接口描述 | 方法 | 路由 | 请求参数 | 是否需要鉴权 |
|---------|------|------|----------|------------|
| 上传图片 | POST | /images/upload | Form Data: file | 是 |
| 图片访问 | GET | /images/{filename} | 无 | 否 |

### 艺术风格相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 获取艺术风格列表 | GET | /art-styles | query: status (可选，筛选状态：active/inactive) |

### 角色系统提示词补充相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 创建提示词补充 | POST | /system-prompt-posts | { "content": "补充的提示词内容" } |
| 获取提示词补充列表 | GET | /system-prompt-posts | query: page, limit |
| 获取提示词补充详情 | GET | /system-prompt-posts/{post_id} | 无 |
| 更新提示词补充 | PUT | /system-prompt-posts/{post_id} | { "content": "新的提示词内容" } |
| 删除提示词补充 | DELETE | /system-prompt-posts/{post_id} | 无 |

### 故事模板相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 获取故事模板列表 | GET | /story-templates | query: status (可选，筛选状态：active/inactive) |
| 获取故事模板详情 | GET | /story-templates/{template_id} | 无 |
| 创建故事模板 | POST | /story-templates | { "id": "模板ID", "name": "模板名称", "thumbnail": "缩略图URL", "introduction": "模板介绍", "components": [], "maxCharacters": 5, "hiddenPrompt": "隐藏提示词" } |
| 更新故事模板 | PUT | /story-templates/{template_id} | { "name": "新模板名称", "thumbnail": "新缩略图URL", "introduction": "新模板介绍", "components": [], "maxCharacters": 5, "hiddenPrompt": "新隐藏提示词" } |
| 删除故事模板 | DELETE | /story-templates/{template_id} | 无 |

### 音乐相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 获取音乐列表 | GET | /music | query: type (可选，音乐类型) |
| 获取音乐类型列表 | GET | /music/types | 无 |
| 获取音乐详情 | GET | /music/{music_id} | 无 |
| 创建音乐 | POST | /music | { "name": "音乐名称", "url": "音乐URL", "type": "音乐类型" } |
| 更新音乐 | PUT | /music/{music_id} | { "name": "新音乐名称", "url": "新音乐URL", "type": "新音乐类型" } |
| 删除音乐 | DELETE | /music/{music_id} | 无 |

### 故事聊天相关接口
| 接口描述 | 方法 | 路由 | 请求参数 |
|---------|------|------|----------|
| 选择说话角色 | POST | /story_chat/select-speakers | { "history_length": 25, "user_message": "用户消息", "history_messages": [], "character_names": ["角色名称列表"] } |
| 生成角色回复 | POST | /story_chat/generate-response | { "history_length": 25, "character_id": "角色ID", "user_message": "用户消息", "history_messages": [], "conversation_id": "对话ID", "is_first_response": true } |
| 获取历史消息 | GET | /story_chat/history-messages | query: conversation_id, last_message_id |

## 角色系统提示词补充接口详情

### 创建提示词补充
```http
POST /system-prompt-posts
Content-Type: application/json

{
    "content": "补充的提示词内容"
}

Response 201:
{
    "id": "post_id",
    "content": "补充的提示词内容",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 获取提示词补充列表
```http
GET /system-prompt-posts?page=1&limit=10

Response 200:
{
    "total": 100,
    "items": [
        {
            "id": "post_id",
            "content": "补充的提示词内容",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 获取提示词补充详情
```http
GET /system-prompt-posts/{post_id}

Response 200:
{
    "id": "post_id",
    "content": "补充的提示词内容",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 更新提示词补充
```http
PUT /system-prompt-posts/{post_id}
Content-Type: application/json

{
    "content": "新的提示词内容"
}

Response 200:
{
    "id": "post_id",
    "content": "新的提示词内容",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 删除提示词补充
```http
DELETE /system-prompt-posts/{post_id}

Response 204
```

## 语言相关接口

### 创建语言
```http
POST /languages
Content-Type: application/json

{
    "language": "中文"
}

Response 201:
{
    "id": "language_id",
    "language": "中文",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 获取所有语言
```http
GET /languages

Response 200:
[
    {
        "id": "language_id",
        "language": "中文",
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": "language_id2",
        "language": "English",
        "created_at": "2024-01-01T00:00:00Z"
    }
]
```

### 获取语言详情
```http
GET /languages/{language_id}

Response 200:
{
    "id": "language_id",
    "language": "中文",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 更新语言
```http
PUT /languages/{language_id}
Content-Type: application/json

{
    "language": "新的语言名称"
}

Response 200:
{
    "id": "language_id",
    "language": "新的语言名称",
    "created_at": "2024-01-01T00:00:00Z"
}
```

#### 删除语言
```http
DELETE /languages/{language_id}

Response 204
```

## 认证接口

### Web3钱包登录

#### 接口定义
```http
POST /auth/login
Content-Type: application/json

Request:
{
    "wallet_address": "0x...",  // 钱包地址
    "signature": "0x..."        // 签名结果
}

Response 200:
{
    "access_token": "paw_xxxxxxxx",  // PAW 访问令牌
    "wallet_address": "0x...",       // 钱包地址
    "expires_at": "2024-01-04T00:00:00Z"  // 令牌过期时间（3天后）
}
```

#### 处理流程
1. 签名验证
   - 验证签名消息格式
   - 使用 web3.eth.accounts.recover 恢复签名地址
   - 验证恢复的地址与提供的钱包地址匹配

2. 令牌处理
   - 检查是否存在有效的访问令牌
   - 如果存在且未过期，返回现有令牌
   - 如果不存在或已过期，生成新的访问令牌（有效期3天）

3. 数据库操作
   - 更新用户的访问令牌和过期时间
   - 更新最后登录时间

### 退出登录

#### 接口定义
```http
POST /auth/logout
Content-Type: application/json
Authorization: Bearer {paw_access_token}

Response 200:
{
    "message": "Successfully logged out"
}
```

#### 处理流程
1. 令牌处理
   - 验证当前访问令牌
   - 生成新的访问令牌（使原令牌失效）
   - 更新数据库中的令牌信息

## 故事接口

### 创建故事
```http
POST /stories
Content-Type: application/json

{
    "title": "晚餐约会",
    "setting": {
        "config": {
            "model": "deepseek-chat",
            "temperature": 1.5,
            "history_length": 25,
            "summary_length": 200
        },
        "background": "在高级西餐厅的约会",
        "character_ids": [1, 2, 3],
        "opening_messages": [
            {
                "content": "在这个温馨的夜晚...",
                "character_id": 1
            }
        ],
        "character_background": "现在我在高级西餐厅..."
    }
}

Response 201:
{
    "id": "story_id",
    "title": "晚餐约会",
    "setting": {...},
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 获取故事列表
```http
GET /stories?page=1&limit=10

Response 200:
{
    "total": 100,
    "items": [
        {
            "id": "story_id",
            "title": "晚餐约会",
            "setting": {...},
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 获取故事详情
```http
GET /stories/{story_id}

Response 200:
{
    "id": "story_id",
    "title": "晚餐约会",
    "setting": {...},
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 更新故事
```http
PUT /stories/{story_id}
Content-Type: application/json

{
    "title": "新标题",
    "setting": {...}
}

Response 200:
{
    "id": "story_id",
    "title": "新标题",
    "setting": {...},
    "updated_at": "2024-01-01T00:00:00Z"
}
```

### 删除故事
```http
DELETE /stories/{story_id}

Response 204
```

### 发布故事
```http
POST /story/publish
Content-Type: application/json

{
    "template_id": "free-creation",
    "template_content": "Title: My Story\nContent: Once upon a time...\n\n",
    "characters": ["67756a67e021c3660f294629", "67756a67e021c3660f29462a"],
    "background_music_id": "67826549efec43a02d951b61",
    "bg_image_url": "http://example.com/image.jpg",
    "story_name": "My Adventure",
    "opening_messages": [
        {
            "content": "Hello everyone!",
            "character": "67756a67e021c3660f294629"
        }
    ],
    "settings": {
        "components": "..."
    },
    "language": "en"
}

Response 200:
{
    "id": "story_id"
}
```

### 获取故事列表
```http
GET /story/get_unstarted_stories?page=1&limit=10

Response 200:
[
    {
        "id": "story_id",
        "title": "故事标题",
        "intro": "故事简介(generated_background)",
        "messages": ["开场白1", "开场白2"],
        "likes": "0",
        "rewards": "0",
        "background": "背景图片URL",
        "date": "2024-01-01",
        "characters": 2,
        "avatar_url": "第一个非Narrator角色的形象图片URL",
        "characterIcons": ["角色1图标URL", "角色2图标URL"],
        "characterDetails": [
            {
                "id": "character_id",
                "name": "角色名称",
                "description": "角色描述",
                "image_url": "角色图片URL",
                "icon_url": "角色图标URL",
                "character_type": "角色类型"
            }
        ],
        "backgroundMusic": "背景音乐URL",
        "created_by": "创建者钱包地址",
        "creator_name": "创建者用户名",
        "comments_count": "0"
    }
]

Response 401:
{
    "detail": "Not authenticated"
}

Response 500:
{
    "detail": "Failed to get stories: error message"
}
```

## 对话接口

### 创建新对话
```http
POST /conversation
Content-Type: application/json

{
    "story_id": "65f2a6d7e021c3660f294629",
    "messages": [
        {
            "content": "你好，我是小明",
            "character_id": "65f2a6d7e021c3660f294630"
        }
    ]
}

Response 200:
{
    "id": "对话ID",
    "story_id": "故事ID",
    "status": "active",
    "created_at": "2024-01-21T17:34:40.312Z",
    "last_message_id": "最后消息ID"
}
```

### 检查故事对话
```http
GET /conversation/{story_id}

Response 200:
{
    "conversation_id": "对话ID" // 如果没有对话则为null
}
```

### 获取历史消息
```http
POST /story_chat/history-messages
Content-Type: application/json

{
    "conversation_id": "对话ID",
    "last_message_time": "2024-01-21T17:34:40.312Z"  // ISO格式的UTC时间
}

Response 200:
[
    {
        "id": "消息ID",
        "content": "消息内容",
        "character_id": "角色ID",
        "character_name": "角色名称",
        "is_opening": false,
        "sequence": 1,
        "created_at": "2024-01-21T17:34:40.312Z",
        "role": "user/assistant"
    }
]
```

### 选择说话角色
```http
POST /story_chat/select-speakers
Content-Type: application/json

{
    "history_length": 25,
    "user_message": "你好，大家今天过得怎么样？",
    "history_messages": [
        {
            "role": "user",
            "content": "我们开始聊天吧"
        },
        {
            "role": "narrator",
            "content": "阳光明媚的下午，三个朋友相聚在咖啡厅里"
        },
        {
            "role": "character",
            "character_name": "小惠",
            "content": "今天天气真好啊，我特别喜欢这样的下午~"
        }
    ],
    "character_names": ["旁白", "小惠", "小静"]
}

Response 200:
{
    "speakers": ["小静", "旁白"]
}
```

### 生成角色回复
```http
POST /story_chat/generate-response
Content-Type: application/json

{
    "history_length": 25,
    "character_id": "67756a67e021c3660f29462a",
    "user_message": "小惠，你最近在忙些什么呢？",
    "history_messages": [
        {
            "role": "user",
            "content": "大家好啊"
        },
        {
            "role": "narrator",
            "content": "咖啡厅里飘着香醇的咖啡香气，阳光透过落地窗洒在桌上"
        },
        {
            "role": "character",
            "character_name": "小静",
            "content": "这里的环境真的很适合聊天呢"
        }
    ],
    "conversation_id": "1234567890",
    "last_message_id": "0987654321",
    "is_first_response": true
}

Response 200:
Event-Stream 格式的响应，每个事件包含生成的文本片段
```

## 角色接口

### 创建角色
```http
POST /characters
Content-Type: application/json

{
    "name": "角色名称",
    "avatar": "头像URL",
    "personality": "性格特征",
    "background": "角色背景"
}

Response 201:
{
    "id": "character_id",
    "name": "角色名称",
    "avatar": "头像URL",
    "personality": "性格特征",
    "background": "角色背景",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 获取角色列表
```http
GET /characters?page=1&limit=10

Response 200:
{
    "total": 100,
    "items": [
        {
            "id": "character_id",
            "name": "角色名称",
            "avatar": "头像URL",
            "personality": "性格特征",
            "background": "角色背景"
        }
    ]
}
```

## LLM生成接口

## 注意事项
1. 所有请求都需要携带有效的PAW访问令牌
2. 请求频率限制：每个用户每分钟100次
3. 文件上传大小限制：10MB
4. WebSocket连接超时时间：60秒
5. 对话历史保存时间：30天
6. 令牌管理：
   - 访问令牌有效期为 3 天
   - 同一钱包地址登录时自动刷新令牌
   - 退出登录时令牌自动刷新
   - 令牌过期后需要重新登录
7. 图片生成任务：
   - 任务状态保留24小时
   - 生成的图片URL有效期24小时，需要及时转存
   - 支持的图片尺寸：1024*1024, 720*1280, 1280*720
   - 异步任务需要轮询获取状态

## 图片接口

### 上传图片
```http
POST /images/upload
Content-Type: multipart/form-data

Form Data:
- file: 图片文件（支持jpg/png/gif/webp格式）

Response 200:
{
    "url": "http://vd1261kq672.vicp.fun:45271/api/v1/images/xxxxx.jpg",  // 图片访问URL
    "filename": "xxxxx.jpg"  // 图片文件名
}
```

### 图片访问
```http
GET /images/{filename}

无需鉴权，可直接访问

Response:
图片二进制数据，Content-Type 根据图片类型设置
```

## AI模型接口

### LLM问答接口（Chat Completion）
```http
POST /llm/chat/completions
Content-Type: application/json

Request:
{
    "model_id": "deepseek-chat",  // 模型ID，对应数据库中的llm_id
    "messages": [  // 对话历史
        {
            "role": "system",  // system/user/assistant
            "content": "你是一个有帮助的AI助手"
        },
        {
            "role": "user",
            "content": "你好，请介绍一下自己"
        }
    ],
    "stream": false  // 是否使用流式响应，默认false
}

Response 200 (非流式):
{
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1677652288,
    "model": "deepseek-chat",
    "choices": [{
        "index": 0,
        "message": {
            "role": "assistant",
            "content": "你好！我是一个AI助手..."
        },
        "finish_reason": "stop"
    }],
    "usage": {
        "prompt_tokens": 9,
        "completion_tokens": 12,
        "total_tokens": 21
    }
}

Response 200 (流式):
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek-chat","choices":[{"index":0,"delta":{"role":"assistant","content":"你"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"好"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek-chat","choices":[{"index":0,"delta":{"content":"！"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"deepseek-chat","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

[DONE]

Response 400:
{
    "error": {
        "code": "invalid_model",
        "message": "The model 'xxx' does not exist or is not available."
    }
}

Response 401:
{
    "error": {
        "code": "unauthorized",
        "message": "Invalid API key or token."
    }
}
```

注意事项：
1. 该接口适用于 chat 和 other 类型的模型
2. 模型的具体参数（temperature等）在数据库中配置，接口中不需要传递
3. 流式响应使用 Server-Sent Events (SSE) 格式
4. 响应格式与OpenAI接口保持一致，便于客户端复用
5. 支持system/user/assistant三种角色的消息
6. 所有模型的响应都会被转换为统一的格式

### 图生文接口（Image to Text Chat Completion）
```http
POST /ai/i2t/chat/completions
Content-Type: application/json

Request:
{
    "model_id": "qwen-vl-plus-1",  // 模型ID，对应数据库中的llm_id
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "描述一下这个图片"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "http://vd1261kq672.vicp.fun:45271/images/bbb29707-fda1-434d-bc87-b9d4d6089783.png"
                    }
                }
            ]
        }
    ]
}

Response 200:
{
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1677652288,
    "model": "qwen-vl-plus",
    "choices": [{
        "index": 0,
        "message": {
            "role": "assistant",
            "content": "这是一张..."
        },
        "finish_reason": "stop"
    }],
    "usage": {
        "prompt_tokens": 9,
        "completion_tokens": 12,
        "total_tokens": 21
    }
}

Response 400:
{
    "error": {
        "code": "invalid_model",
        "message": "The model 'xxx' does not exist or is not available."
    }
}

Response 401:
{
    "error": {
        "code": "unauthorized",
        "message": "Invalid API key or token."
    }
}

### 删除音乐
```http
DELETE /music/{music_id}

Response 204

