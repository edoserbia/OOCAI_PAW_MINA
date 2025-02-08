# 多角色对话故事系统 (Multi-Agent Chat Story System)

## 项目简介
这是一个基于FastAPI和Next.js开发的多角色对话故事系统。用户可以通过Web3钱包授权登录，选择不同的故事模板，与多个AI角色进行互动来推进故事情节的发展。系统支持多种互动模式，包括群聊、海龟汤、开放世界等多种场景。

## 系统特点
- 🎭 多角色互动：支持多个AI角色同时参与对话
- 📝 多样化模板：提供群聊、海龟汤、开放世界等多种故事模板
- 🎨 角色定制：支持自定义角色形象、性格和背景
- 🔄 对话管理：支持对话回退、恢复和历史记录
- 🎵 多媒体支持：集成背景音乐、图片生成等功能
- 🔒 Web3登录：使用Web3钱包进行安全认证

## 技术架构

### 后端技术栈
- 框架：FastAPI
- 数据库：MongoDB
- AI模型：DeepSeek Chat
- 开发语言：Python 3.10+
- 认证：Web3钱包

### 前端技术栈
- 框架：Next.js 13+
- UI库：TailwindCSS
- 状态管理：React Context
- Web3集成：ethers.js
- 开发语言：TypeScript

## 核心功能

### 1. 故事模板系统
- 预定义多种故事模板（群聊、海龟汤、开放世界等）
- 模板组件管理（角色选择、文本输入、音乐选择等）
- 模板状态管理（激活/禁用）
- 模板配置自动加载

### 2. 角色系统
- 默认旁白角色：所有故事必须包含的叙述者角色
- 自定义角色：创建具有不同性格特征的角色
- 角色关系管理：通过故事设置关联角色
- 角色设定生成：通过LLM自动生成角色特征

### 3. 对话系统
- 实时对话响应
- 对话历史管理
- 支持对话回退和恢复
- 多角色协同对话

### 4. AI服务集成
- LLM对话生成
- 文生图服务
- 图生文服务
- 多API密钥负载均衡

## 项目结构
```
project/
├── ui/                # 前端项目
│   ├── app/                # Next.js页面
│   ├── components/         # React组件
│   ├── lib/                # 工具函数
│   ├── services/           # API服务
│   └── config/             # 配置文件
│
├── backend/                # 后端项目
│   ├── api/               # API接口
│   ├── models/            # 数据模型
│   ├── services/          # 业务逻辑
│   ├── config/            # 配置文件
│   └── scripts/           # 初始化脚本
├── contracts/             # 合约
│
└── docs/                  # 项目文档
    ├── api/               # API文档
    ├── database/          # 数据库设计
    └── deployment/        # 部署指南
```

## 快速开始

### 环境要求
- Node.js 16+
- Python 3.10+
- MongoDB 5.0+
- DeepSeek API密钥

### 后端设置
1. 安装依赖
```bash
cd backend
pip install -r requirements.txt
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入必要的配置信息
```

3. 初始化数据
```bash
# 初始化数据库
python scripts/init_db.py

# 初始化故事模板
python scripts/init_story_templates.py
```

4. 启动服务
```bash
uvicorn api.main:app --reload
```

### 前端设置
1. 安装依赖
```bash
cd ui
npm install
```

2. 配置环境变量
```bash
cp .env.example .env.local
# 编辑.env.local文件，填入必要的配置信息
```

3. 启动开发服务器
```bash
npm run dev
```

## API文档
- [API接口文档](backend/docs/api_design.md)
- [数据库设计文档](backend/docs/database_design.md)

## 部署指南
详细的部署说明请参考[部署指南](docs/deployment.md)。

## 开发指南

### 后端开发
- API端点定义在 `backend/routes/` 目录下
- 数据模型定义在 `backend/models/` 目录下
- 业务逻辑实现在 `backend/services/` 目录下
- 配置管理在 `backend/config/` 目录下

### 前端开发
- 页面组件位于 `ui/app/` 目录下
- 可复用组件位于 `ui/components/` 目录下
- API服务封装在 `ui/services/` 目录下
- 工具函数位于 `ui/lib/` 目录下

## 贡献指南
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证
MIT License 
