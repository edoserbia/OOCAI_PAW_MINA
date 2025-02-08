# Multi-Agent Chat 前端项目

基于 Next.js 开发的多智能体对话系统前端项目。

## 环境要求

- Node.js 20.18.1+
- npm 10.8.2+
- Next.js 15.1.3
- React 19.0.0

## 环境配置

### 1. 安装 NVM（Node Version Manager）
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### 2. 配置 NVM
```bash
source ~/.bashrc
```

### 3. 安装 Node.js
```bash
nvm install 20
```

### 4. 切换 Node.js 版本
```bash
nvm use 20
```

### 5. 验证安装
```bash
node --version  # 应显示 v20.18.1
npm --version   # 应显示 10.8.2
```

注意：每次使用 node、npm 或 npx 命令前，请确保先运行 `nvm use 20` 以使用正确的 Node.js 版本。

## 项目初始化

### 1. 创建项目
```bash
npx create-next-app@latest
```

在创建过程中，选择以下配置：
- 使用 TypeScript
- 使用 Tailwind CSS
- 使用 App Router
- 其他选项根据需要选择

### 2. 初始化 shadcn/ui
```bash
npx shadcn@latest init
```

在初始化过程中，确保：
- 选择默认样式配置
- 使用 CSS 变量
- 选择 tailwind.config.ts
- 选择 slate 颜色主题

## 项目设置

### 1. 安装依赖
```bash
npm install
```

### 2. 安装必要的 shadcn 组件
```bash
npx shadcn@latest add button
npx shadcn@latest add avatar
npx shadcn@latest add select
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add dialog
```

## 开发运行

```bash
npm run dev
```

项目使用 Turbopack 进行开发构建加速，启动后访问 [http://localhost:3000](http://localhost:3000) 查看项目。

## 项目结构

```
frontend/
├── app/                # Next.js 13+ App Router 目录
├── components/         # React 组件
├── docs/              # 项目文档
│   └── design.md      # 详细设计文档
├── public/            # 静态资源
└── styles/            # 样式文件
```

## 详细文档

- [设计文档](./docs/design.md) - 包含详细的UI设计和功能说明
- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 特性
- [shadcn/ui 文档](https://ui.shadcn.com) - 了解组件库使用

## 开发指南

1. 页面开发在 `app` 目录下进行
2. 组件开发在 `components` 目录下进行
3. 使用 Tailwind CSS 进行样式开发
4. 遵循 TypeScript 类型规范

## 部署

项目使用 Next.js 框架，推荐使用 Vercel 进行部署：

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 选择主分支进行自动部署

也可以使用传统方式部署：

1. 构建项目
```bash
npm run build
```

2. 启动生产服务
```bash
npm start
```

## 注意事项

1. 确保使用正确的 Node.js 版本（20.18.1+）
2. 开发前请先安装所有必要的 shadcn 组件
3. 遵循项目的代码规范和文档规范
4. 保持依赖包的版本一致性
5. 开发模式使用 Turbopack 加速构建
