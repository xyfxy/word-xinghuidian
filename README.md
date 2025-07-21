# Word星辉点 - 智能Word编辑器

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)

Word星辉点是一款结合手动编辑与AI智能生成的Word文档编辑器。它提供了直观的富文本编辑界面，支持模板管理，并集成了千问AI进行内容智能生成。

## ✨ 主要功能

- 📝 **富文本编辑** - 基于Quill.js的强大编辑器，支持多种文本格式
- 🤖 **AI内容生成** - 集成千问AI，智能生成高质量内容
- 📋 **模板系统** - 创建、管理和使用文档模板
- 📄 **Word文档处理** - 支持导入和导出标准Word文档
- 🎨 **实时预览** - 编辑时实时查看文档效果
- 💾 **自动保存** - 防止数据丢失

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 千问API密钥（用于AI功能）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/xyfxy/word-xinghuidian.git
   cd word-xinghuidian
   ```

2. **安装依赖**
   ```bash
   npm run install:all
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，添加你的千问API密钥：
   ```
   QIANWEN_API_KEY=your_api_key_here
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

   前端访问：http://localhost:3000
   
   后端API：http://localhost:3001

## 📦 项目结构

```
word-xinghuidian/
├── frontend/                # 前端React应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── stores/        # Zustand状态管理
│   │   ├── services/      # API服务
│   │   └── utils/         # 工具函数
│   └── ...
├── backend/                # 后端Express服务
│   ├── src/
│   │   ├── routes/        # API路由
│   │   ├── services/      # 业务逻辑
│   │   └── types/         # TypeScript类型
│   └── data/              # 数据存储
└── package.json           # 项目配置
```

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Zustand** - 状态管理
- **Quill.js** - 富文本编辑器
- **Tailwind CSS** - 样式框架
- **React Router** - 路由管理

### 后端
- **Node.js** - 运行时环境
- **Express** - Web框架
- **TypeScript** - 类型安全
- **Axios** - HTTP客户端
- **docx** - Word文档处理

## 📜 可用脚本

```bash
# 开发
npm run dev              # 同时启动前端和后端
npm run dev:frontend     # 仅启动前端
npm run dev:backend      # 仅启动后端

# 构建
npm run build           # 构建前端和后端
npm run build:frontend  # 仅构建前端
npm run build:backend   # 仅构建后端

# 生产环境
npm start              # 启动生产服务器

# 代码质量
npm run lint:frontend  # 前端代码检查
npm run lint:backend   # 后端代码检查
npm run test:backend   # 运行后端测试
```

## 🔧 配置说明

### 环境变量

后端环境变量 (`.env`):
```env
# 千问API配置
QIANWEN_API_KEY=your_api_key_here
QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

# 服务器配置
PORT=3001
NODE_ENV=development
```

### AI模型配置

在前端应用中，可以通过设置页面调整AI参数：
- 模型选择
- 温度参数
- 最大令牌数
- TopP参数

## 📱 使用指南

1. **创建文档**
   - 点击"新建文档"开始编辑
   - 使用工具栏格式化文本
   - 插入内容块用于AI生成

2. **使用模板**
   - 访问模板库
   - 选择或创建模板
   - 基于模板快速生成文档

3. **AI生成**
   - 在内容块中输入提示词
   - 点击"生成"获取AI内容
   - 编辑和调整生成的内容

4. **导出文档**
   - 点击"导出"按钮
   - 选择Word格式下载

## 🎯 核心功能详解

### 智能编辑器
- 可视化Word编辑器，支持字体、行间距、缩进等完整格式设置
- 所见即所得的编辑体验
- 支持复杂的文档格式和样式

### AI内容生成
- 集成千问AI，智能生成高质量内容
- AI只负责内容生成，格式完全按预设模板执行
- 支持上下文感知的内容创作
- 可调节创作参数（长度、创意度等）

### 模板系统
- 强大的模板管理系统
- 区分固定内容和AI生成区域
- 一键应用格式样式
- 支持模板导入导出

## 🔌 API 接口

### AI生成接口
```typescript
POST /api/ai/generate
{
  "prompt": "生成内容的提示词",
  "maxLength": 500,
  "temperature": 0.7,
  "context": "上下文信息"
}
```

### 模板管理接口
```typescript
GET /api/templates        // 获取模板列表
POST /api/templates       // 创建新模板
PUT /api/templates/:id    // 更新模板
DELETE /api/templates/:id // 删除模板
```

### 文档处理接口
```typescript
POST /api/documents/import   // 导入Word文档
POST /api/documents/export   // 导出Word文档
POST /api/documents/preview  // 生成预览
```

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Quill.js](https://quilljs.com/) - 强大的富文本编辑器
- [千问AI](https://tongyi.aliyun.com/) - AI内容生成支持
- [React](https://reactjs.org/) - UI框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

## 📞 联系方式

- 作者：xyfxy
- 邮箱：2959674812@qq.com
- GitHub：[@xyfxy](https://github.com/xyfxy)

---

如果这个项目对你有帮助，请给个⭐️ Star！