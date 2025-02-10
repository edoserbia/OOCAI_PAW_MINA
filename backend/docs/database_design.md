# 数据库设计文档

## MongoDB 集合设计

### users 集合
```javascript
{
  "_id": ObjectId,
  "wallet_address": String,     // Web3钱包地址
  "paw_access_token": String,   // API访问令牌
  "token_expires_at": DateTime, // 令牌过期时间
  "last_login": DateTime,       // 最后登录时间
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "wallet_address": 1,  // unique
  "paw_access_token": 1  // unique
}
```

#### 用户模型功能说明
1. 用户认证：
   - `get_by_wallet(wallet_address)`: 通过钱包地址获取用户
   - `get_by_token(access_token)`: 通过访问令牌获取用户
   - 实现位置：`backend/models/user.py`

2. 令牌管理：
   - `update_token(access_token, expires_at)`: 更新用户访问令牌
   - `logout()`: 使当前令牌失效
   - 实现位置：`backend/models/user.py`

3. 自动更新：
   - 登录时自动更新 last_login 和 updated_at
   - 令牌更新时自动更新 updated_at
   - 实现位置：`backend/models/user.py` 中的相关方法

### characters 集合
```javascript
{
  "_id": ObjectId,
  "character_id": Number,  // 角色ID，1为系统默认旁白角色
  "name": String,  // 角色名称
  "description": String,  // 角色描述
  "background": String,  // 角色背景
  "image_prompt": String,  // 角色图片生成提示词
  "system_prompt": String,  // 角色系统提示词
  "character_type": String,  // 角色类型：narrator或character
  "created_by": String,  // 创建者钱包地址，旁白角色为null
  "image_url": String,  // 角色大图URL
  "icon_url": String,  // 角色头像URL
  "settings": Object,  // 用户填写的角色设置，JSON格式
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "character_id": 1,  // unique
  "created_by": 1
}
```

### music 集合
```javascript
{
  "_id": ObjectId,
  "name": String,  // 音乐名称
  "url": String,   // 音乐URL
  "type": String,  // 音乐类型：upbeat/relaxing/dramatic/jazz/electronic/playful/ambient/adventure/mysterious/epic
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "name": 1,  // unique
  "type": 1   // 按类型查询
}
```

#### 音乐模型功能说明
1. 音乐管理：
   - `create_music(name, url, type)`: 创建新的音乐记录
   - `get_all_music()`: 获取所有音乐
   - `get_music_by_type(type)`: 获取指定类型的音乐
   - 实现位置：`backend/models/music.py`

2. 音乐类型说明：
   - upbeat: 欢快、充满活力的音乐
   - relaxing: 轻松、放松的音乐
   - dramatic: 戏剧性、情感丰富的音乐
   - jazz: 爵士风格音乐
   - electronic: 电子音乐
   - playful: 俏皮、有趣的音乐
   - ambient: 环境、氛围音乐
   - adventure: 冒险、探索主题音乐
   - mysterious: 神秘、悬疑的音乐
   - epic: 史诗、宏大的音乐

3. 自动更新：
   - 创建时自动设置 created_at 和 updated_at
   - 更新时自动更新 updated_at
   - 实现位置：`backend/models/music.py` 中的相关方法

### stories 集合
```javascript
{
  "_id": ObjectId,
  "story_name": String,  // 故事名称（用户填写）
  "generated_background": String,  // 生成的故事背景
  "generated_target": String,  // 故事目标
  "bg_image_prompt": String,  // 背景图片生成提示词
  "bg_image_url": String,  // 背景图片URL
  "icon_url": String,  // 故事图标URL
  "history_length": Number,  // 历史对话长度，默认25
  "created_by": String,  // 创建者钱包地址
  "characters": [Link[Character]],  // 角色列表
  "background_music": Link[Music],  // 关联的背景音乐，可为null
  "opening_messages": [{  // 开场白列表
    "content": String,   // 开场白内容
    "character": Link[Character]  // 关联的角色
  }],
  "settings": Object,  // 用户填写的故事设置，JSON格式
  "likes": Number,  // 被喜欢次数
  "retweet": Number,  // 被转发次数
  "played": Number,  // 被多少用户玩过
  "language": String,  // 创建者所使用语言
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "created_by": 1,
  ("created_by", "story_name"): 1
}
```

### conversations 集合
```javascript
{
  "_id": ObjectId,
  "story": Link[Story],  // 关联的故事（使用 Beanie ODM Link）
  "user_id": String,  // 用户钱包地址
  "status": String,  // 对话状态：active/archived
  "current_context": String,  // 当前上下文摘要，可选
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "story": 1,
  "user_id": 1
}
```

### messages 集合
```javascript
{
  "_id": ObjectId,
  "conversation": Link[Conversation],  // 关联的对话（使用 Beanie ODM Link）
  "character_id": Number,  // 角色ID，1为系统默认旁白角色，可选
  "content": String,  // 消息内容
  "sequence": Number,  // 消息序号，用于回退
  "role": String,  // 消息角色：character/narrator/user
  "created_at": DateTime
}

// 索引
{
  "conversation": 1,
  "sequence": 1
}
```

### other_agents 集合
```javascript
{
  "_id": ObjectId,
  "agent_id": String,  // 代理ID，如'summarizer'
  "name": String,  // 代理名称
  "description": String,  // 代理描述
  "system_prompt": String,  // 代理系统提示词
  "settings": {  // 代理设置，JSON格式
    "model": String,  // 使用的模型
    "temperature": Number,  // 温度参数
    "max_tokens": Number,  // 最大token数
    // 其他特定设置...
  },
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "agent_id": 1  // unique
}
```

### llms 集合
```javascript
{
  "_id": ObjectId,
  "llm_id": String,  // LLM ID，如'deepseek-chat'
  "type": String,  // LLM类型：chat/other/t2i(文生图)/i2t(图生文)
  "api_key": String,  // API密钥
  "usage_count": Number,  // 使用次数
  "last_used": DateTime,  // 最后使用时间
  "settings": {  // LLM设置，JSON格式
    "base_url": String,  // API基础URL
    "model": String,  // 模型名称
    "temperature": Number,  // 温度参数
    "max_tokens": Number,  // 最大token数
    "top_p": Number,  // 采样参数
    "presence_penalty": Number,  // 存在惩罚
    "frequency_penalty": Number,  // 频率惩罚
    "size": String,  // 图片生成尺寸，仅用于t2i类型
    "seed": Number,  // 随机种子，仅用于t2i类型
    "steps": Number,  // 生成步数，仅用于t2i类型
    "guidance": Number,  // 指导度量值，仅用于t2i类型
    // 其他特定设置...
  },
  "status": String,  // 状态：active/inactive
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "llm_id": 1,  // unique
  "type": 1,
  "status": 1,
  "usage_count": 1
}
```

### prompt_templates 集合
```javascript
{
  "_id": ObjectId,
  "prompt_id": String,  // 提示词模板ID，如't2i_character'
  "type": String,  // 模板类型：t2i/i2t/chat/other
  "content": String,  // 提示词模板内容
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "prompt_id": 1,  // unique
  "type": 1
}
```

### art_styles 集合
```javascript
{
    "_id": ObjectId,
    "name": String,  // 风格名称，唯一索引
    "image": String,  // 风格示例图片URL
    "keyword": String,  // 生成图片时使用的关键词
    "status": String,  // 状态：active/inactive
    "created_at": DateTime,
    "updated_at": DateTime
}

// 索引
{
    "name": 1  // unique
}
```

#### 艺术风格模型功能说明
1. 风格查询：
   - `get_art_styles(status)`: 获取艺术风格列表，可选按状态筛选
   - 实现位置：`backend/routes/art_styles.py`

### character_system_prompt_posts 集合
```javascript
{
  "_id": ObjectId,
  "content": String,  // 补充的提示词内容，用于角色扮演的行为规范
  "type": String,     // 提示词类型：description/requirements
  "language": String, // 语言：中文/English
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "created_at": 1,
  ("type", "language"): 1  // 复合索引，支持按类型和语言查询
}
```

### languages 集合
```javascript
{
  "_id": ObjectId,
  "language": String,  // 语言名称，如"中文"、"English"
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "language": 1  // unique
}
```

### story_templates 集合
```javascript
{
  "_id": ObjectId,
  "id": String,  // 模板ID，如'group-chat'
  "name": String,  // 模板名称
  "thumbnail": String,  // 缩略图URL
  "introduction": String,  // 模板介绍
  "components": [{  // 组件列表
    "type": String,  // 组件类型：CharacterSelection/TextInput/OpeningLineInput/MusicSelection等
    "id": String,  // 组件ID
    "title": String,  // 组件标题
    "width": Number,  // 组件宽度
    "height": Number,  // 组件高度
    "placeholder": String,  // 占位文本
    "options": [String]  // 可选项列表，仅用于特定组件类型
  }],
  "maxCharacters": Number,  // 最大角色数
  "history_length": Number, // 历史对话长度，默认25
  "hidden_background_prompt": String,  // 用于生成故事背景的提示词
  "hidden_target_prompt": String,  // 用于生成故事目标的提示词
  "status": String,  // 状态：active/inactive
  "created_at": DateTime,
  "updated_at": DateTime
}

// 索引
{
  "id": 1,  // unique
  "status": 1
}
```

#### 故事模板模型功能说明
1. 模板管理：
   - `get_by_id(template_id)`: 通过模板ID获取模板
   - `get_active_templates()`: 获取所有激活状态的模板
   - `create_template(template_data)`: 创建新模板
   - `update_template(template_id, template_data)`: 更新模板
   - `delete_template(template_id)`: 删除模板
   - 实现位置：`backend/models/story_template.py`

2. 自动更新：
   - 创建时自动设置 created_at 和 updated_at
   - 更新时自动更新 updated_at
   - 实现位置：`backend/models/story_template.py` 中的相关方法

## 初始化数据
### llms 集合初始化数据
```javascript
// 文生图模型
{
  "llm_id": "flux-schnell-1",
  "type": "t2i",
  "api_key": "sk-5ef04f9bc6554a409a73d2874213e0f9",
  "usage_count": 0,
  "settings": {
    "model": "flux-schnell",
    "size": "512*1024",
    "seed": 42,  // 默认种子值，实际使用时会随机生成
    "steps": 4,
    "guidance": 3.5
  },
  "status": "active",
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z")
}

// 图生文模型
{
  "llm_id": "qwen-vl-plus-1",
  "type": "i2t",
  "api_key": "sk-5ef04f9bc6554a409a73d2874213e0f9",
  "usage_count": 0,
  "settings": {
    "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "model": "qwen-vl-plus"
  },
  "status": "active",
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z")
}
```

### prompt_templates 集合初始化数据
```javascript
// 文生图角色形象生成模板
{
  "prompt_id": "t2i_character",
  "type": "t2i",
  "content": "Generate a portrait of {name}, {description}. The image should be {style} style.",
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z")
}

// 图生文场景描述模板
{
  "prompt_id": "i2t_scene",
  "type": "i2t",
  "content": "请详细描述这张图片中的场景，包括环境、氛围和主要元素。",
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z")
}

// 图生文人物描述模板
{
  "prompt_id": "i2t_character",
  "type": "i2t",
  "content": "请描述这个人物的外貌特征、表情和姿态。",
  "created_at": ISODate("2024-01-01T00:00:00Z"),
  "updated_at": ISODate("2024-01-01T00:00:00Z")
}
```

## 数据关系
1. Story -> Conversation (1:N)：一个故事可以有多个对话
2. Conversation -> Message (1:N)：一个对话包含多条消息
3. users -> stories (1:N)：一个用户可以创建多个故事
4. users -> characters (1:N)：一个用户可以创建多个角色
5. stories -> characters (N:M)：故事和角色是多对多关系
6. templates -> stories (1:N)：一个模板可以创建多个故事

## 注意事项
1. 使用 Beanie ODM 进行文档映射和关系管理
2. 所有时间字段使用UTC时间存储
3. 消息角色使用枚举类型：CHARACTER/NARRATOR/USER
4. 消息序号用于支持对话回退功能
5. 对话状态默认为 "active"
6. 重要字段都建立了适当的索引
7. 使用 Link 类型维护文档间的关系
8. 角色ID=1保留给系统旁白角色
9. 令牌管理说明：
   - 令牌过期时间设置为创建时间后的3天
   - 每次登录时检查并可能更新令牌
   - 退出登录时生成新令牌使旧令牌失效

## 代码示例

### 消息角色枚举
```python
class MessageRole(str, Enum):
    CHARACTER = "character"  # 角色消息
    NARRATOR = "narrator"    # 旁白消息
    USER = "user"           # 用户消息
```

### 常用查询方法
1. 获取对话消息列表：
```python
messages = await Message.find({"conversation._id": conversation_id}).sort("sequence").to_list()
```

2. 回退对话：
```python
await Message.find({
    "conversation._id": conversation_id,
    "sequence": {"$gt": target_sequence}
}).delete()
```

3. 创建消息：
```python
# 创建角色消息
message = await Message.create_character_message(
    conversation=conversation,
    character_id=character_id,
    content=content,
    sequence=sequence,
    is_narrator=False
)

# 创建用户消息
message = await Message.create_user_message(
    conversation=conversation,
    content=content,
    sequence=sequence
)
```