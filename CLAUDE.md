# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在处理本仓库代码时提供指导。

## 项目概述

Word星辉点是一个智能Word编辑器，结合了手动编辑和AI内容生成功能。这是一个全栈Web应用，采用React前端和Node.js/Express后端，集成千问AI进行内容生成。

## 开发命令

### 初始设置

```bash
# 安装所有依赖（根目录 + 前端 + 后端）
npm run install:all

# 配置环境变量
cp .env.example .env
# 编辑 .env 添加你的 QIANWEN_API_KEY
```

### 开发

```bash
# 同时运行前端和后端
npm run dev

# 单独运行
npm run dev:frontend  # 前端运行在 http://localhost:3000
npm run dev:backend   # 后端运行在 http://localhost:3001
```

### 构建与生产

```bash
# 构建前端和后端
npm run build

# 启动生产服务器
npm start
```

### 测试与代码检查

```bash
# 前端
cd frontend && npm run lint

# 后端
cd backend && npm run lint
cd backend && npm test
```

## 架构

### 前端结构

- **React 18 + TypeScript** 使用Vite构建的应用
- **状态管理**：Zustand存储在 `frontend/src/stores/`
- **路由**：React Router，页面在 `frontend/src/pages/`
- **组件**：模块化组件在 `frontend/src/components/`
  - `Editor/`：使用Quill.js的富文本编辑器组件
  - `Layout/`：布局和导航组件
- **API集成**：服务层在 `frontend/src/services/`
- **样式**：Tailwind CSS配合自定义组件

### 后端结构

- **Express + TypeScript** API服务器
- **路由**：API端点在 `backend/src/routes/`
  - `/api/ai/generate`：通过千问API生成AI内容
  - `/api/templates`：模板CRUD操作
  - `/api/documents/*`：文档导入/导出/预览
- **服务**：业务逻辑在 `backend/src/services/`
- **存储**：基于文件的存储在 `backend/data/`
  - 模板以JSON文件形式存储在 `backend/data/templates/`
- **安全**：配置了Helmet、CORS、速率限制

### 关键集成点

- **AI生成**：后端使用axios集成千问API，需要 `QIANWEN_API_KEY` 环境变量
- **文档处理**：使用docx.js进行Word文档生成和操作
- **富文本编辑**：Quill.js编辑器，配置自定义工具栏和格式
- **模板系统**：区分固定内容块和AI生成内容区域

### 环境配置

必需的环境变量：

```env
# 后端 (.env)
QIANWEN_API_KEY=your_key_here
QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
PORT=3001
NODE_ENV=development

# 前端（通过Vite代理配置）
VITE_API_BASE_URL=http://localhost:3001/api
```

### 开发说明

- 前端使用Vite代理在开发时将 `/api` 请求转发到后端
- 后端使用文件系统进行数据持久化（无需数据库）
- 使用npm scripts和concurrently管理monorepo结构
- TypeScript配置：前端使用ESM，后端使用CommonJS
