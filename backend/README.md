# 多角色对话故事系统

## 项目简介
这是一个基于FastAPI和MongoDB开发的多角色对话故事系统。用户可以通过Web3钱包授权登录，与多个AI角色进行互动来推进故事情节的发展。系统支持命令行交互和API接口调用两种方式。

## 系统架构

### 核心组件
1. **用户认证系统**
   - Web3钱包授权登录
   - API访问令牌(paw_access_token)管理
   - 用户权限控制

2. **角色系统**
   - 默认旁白角色（ID=1）：所有故事必须包含的叙述者角色
   - 自定义角色：可以创建多个具有不同性格特征的角色
   - 角色关系管理：通过故事设置关联角色
   - 角色设定生成：通过LLM自动生成角色特征

3. **故事模板系统**
   - 预定义多种故事模板（群聊、海龟汤、开放世界等）
   - 模板组件管理（角色选择、文本输入、音乐选择等）
   - 模板状态管理（激活/禁用）
   - 模板配置自动加载

4. **故事管理系统**
   - 管理故事基本信息和设定
   - 故事背景自动生成
   - 处理故事进程和状态
   - 确保每个故事都包含旁白角色

5. **对话管理系统**
   - 处理用户输入
   - 管理对话历史
   - 支持对话回退
   - 支持对话恢复
   - 支持旁白角色的剧情推进

6. **LLM服务系统**
   - 多API密钥负载均衡
   - 自动重试机制
   - 故事背景生成
   - 角色设定生成
   - 对话响应生成

### 技术栈
- 后端框架：FastAPI
- 数据库：MongoDB
- AI模型：DeepSeek Chat
- 开发语言：Python 3.10+
- 认证：Web3钱包

## 核心功能

### 用户管理
- Web3钱包登录
- API令牌管理
- 用户权限控制

### 故事管理
- 创建/修改/删除/查询故事
- 故事设定管理
- 自动生成故事背景
- 基于模板创建故事
- 模板配置管理

### 对话管理
- 新建对话（基于故事开场白）
- 恢复对话（从指定上下文）
- 查询对话历史
- 回退对话消息
- 实时对话响应

### LLM服务
- 多API密钥管理
- 负载均衡
- 自动重试
- 内容生成

## 目录结构
```
backend/
├── api/                # API接口
│   └── v1/
│       ├── endpoints/  # API端点
│       └── deps/       # 依赖项
├── models/             # 数据模型
├── services/           # 业务逻辑
│   ├── llm/           # LLM服务
│   ├── auth/          # 认证服务
│   └── story/         # 故事服务
├── utils/             # 工具函数
├── config/            # 配置文件
├── cli/              # 命令行工具
├── docs/             # 详细文档
└── tests/            # 测试用例
```

## 快速开始

### 环境要求
- Python 3.10+
- MongoDB 5.0+

### 安装步骤
1. 克隆项目
```bash
git clone [项目地址]
cd backend
```

2. 安装依赖
```bash
pip install -r requirements.txt
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入必要的配置信息
```

4. 初始化数据库
```bash
python scripts/init_db.py
```

### 运行方式

#### 初始化数据库和模板
```bash
# 初始化数据库
python scripts/init_db.py

# 初始化故事模板
python scripts/init_story_templates.py
```

#### 命令行模式
```bash
python -m cli.main
```

#### API服务模式
```bash
uvicorn api.main:app --reload
```

## 详细文档
- [API文档](docs/api.md)
- [数据库设计](docs/database.md)
- [部署指南](docs/deployment.md)

## 许可证
MIT License 