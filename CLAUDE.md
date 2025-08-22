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
npm run dev:backend   # 后端运行在 http://localhost:3003
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

必需的环境变量（统一在根目录 `.env` 文件中配置）：

```env
# AI服务配置
QIANWEN_API_KEY=your_key_here
QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
MODEL_ENCRYPTION_KEY=your_encryption_key

# 后端配置
PORT=3003
NODE_ENV=development

# 前端配置（VITE_ 前缀）
VITE_API_BASE_URL=http://localhost:3003/api
VITE_ENABLE_DINGTALK_AUTH=false  # 是否启用钉钉认证

# 钉钉配置（如果启用）
ENABLE_DINGTALK_AUTH=false
DINGTALK_CORP_ID=your_corp_id
DINGTALK_AGENT_ID=your_agent_id
DINGTALK_APP_KEY=your_app_key
DINGTALK_APP_SECRET=your_app_secret
DINGTALK_VERIFY_USER=false  # 是否验证用户身份（会增加API调用）
```

### 开发说明

- 前端使用Vite代理在开发时将 `/api` 请求转发到后端
- 后端使用文件系统进行数据持久化（无需数据库）
- 使用npm scripts和concurrently管理monorepo结构
- TypeScript配置：前端使用ESM，后端使用CommonJS
- 环境变量统一在根目录 `.env` 文件配置，前端通过 `vite.config.ts` 的 `envDir: '../'` 读取

### 环境变量配置说明

项目使用两种配置方式：

1. **开发环境**：
   - 直接从根目录 `.env` 文件读取环境变量
   - 前端通过 `vite.config.ts` 中的 `envDir: '../'` 配置读取父目录的 `.env` 文件
   - 不需要 `frontend/public/config.js` 文件（已在 `.gitignore` 中忽略）

2. **生产环境（Docker部署）**：
   - 使用 `frontend/docker-entrypoint.sh` 脚本在容器启动时动态生成 `config.js`
   - 从Docker环境变量读取配置并注入到运行时
   - 支持动态配置而无需重新构建镜像

3. **配置优先级**：
   - 运行时配置（`window.APP_CONFIG`）> 构建时配置（`.env`）> 默认值
   - 这样确保生产环境可以覆盖构建时的配置

### 钉钉集成

项目支持钉钉H5微应用集成，可以限制应用只能在钉钉客户端内访问：

1. **启用钉钉认证**：设置 `VITE_ENABLE_DINGTALK_AUTH=true` 和 `ENABLE_DINGTALK_AUTH=true`
2. **配置钉钉参数**：填写正确的企业ID、应用ID、AppKey和AppSecret
3. **组件说明**：
   - `DingTalkGuard`：检测是否在钉钉环境，非钉钉环境显示拒绝访问页面
   - `DingTalkAuthOptimized`：处理钉钉免登授权流程
   - `dingTalkService`：封装钉钉API调用逻辑

### Docker部署信息

**Docker Hub仓库**：xieyifanxyf

**镜像名称**：
- 前端：`xieyifanxyf/word-xinghuidian-frontend`
- 后端：`xieyifanxyf/word-xinghuidian-backend`

**最新版本**：v1.6.2 (2025-08-22)

**版本更新记录**：
- v1.6.2：支持钉钉认证动态切换，修复TypeScript编译错误，优化环境变量配置
- v1.6.1：钉钉认证功能优化
- v1.6.0：添加钉钉H5微应用支持

**部署方式**：
1. 生产服务器：221.229.216.122
2. 部署目录：`/opt/word-xinghuidian` (实际运行) 和 `/data/system-backup/客户部署包` (部署包)
3. 访问地址：http://221.229.216.122:3000

**切换认证模式**：
只需修改`.env`文件中的`VITE_ENABLE_DINGTALK_AUTH`和`ENABLE_DINGTALK_AUTH`，然后执行`docker-compose restart`即可，无需重新构建镜像。
