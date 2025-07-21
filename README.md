# Word星辉点 - 智能Word编辑器

一个结合人工编辑和AI内容生成的智能Word编辑器，让文档创作更高效、更智能。

## 🌟 项目特色

- **智能编辑器**: 可视化Word编辑器，支持字体、行间距、缩进等完整格式设置
- **AI内容生成**: 集成千问AI，智能生成高质量内容，AI只负责内容，格式完全按预设模板执行
- **模板系统**: 强大的模板管理系统，区分固定内容和AI生成区域，一键应用格式样式
- **实时预览**: 所见即所得的编辑体验，支持实时预览和格式调整
- **文档导出**: 支持标准Word文档和PDF格式导出

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- Tailwind CSS (样式框架)
- Quill.js (富文本编辑器)
- Zustand (状态管理)
- docx.js (Word文档处理)

### 后端
- Node.js + Express + TypeScript
- 千问API (AI内容生成)
- multer (文件上传)
- 文件系统存储

## 📦 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装所有子项目依赖
npm run install:all
```

### 环境配置

复制环境变量文件并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置千问API密钥：

```env
# 千问API配置
QIANWEN_API_KEY=your_qianwen_api_key_here
QIANWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

# 服务器配置
PORT=3001
NODE_ENV=development

# 前端配置
VITE_API_BASE_URL=http://localhost:3001/api
```

### 启动开发服务器

```bash
# 同时启动前端和后端开发服务器
npm run dev

# 或分别启动
npm run dev:frontend  # 前端服务 (http://localhost:3000)
npm run dev:backend   # 后端服务 (http://localhost:3001)
```

## 🎯 核心功能

### 1. 模板编辑器
- 字体设置（字体类型、大小、颜色、样式）
- 段落格式（行间距、段间距、缩进、对齐）
- 页面设置（页边距、纸张大小、方向）
- 样式管理（标题、正文、引用等）

### 2. 内容区域管理
- **固定内容区域**: 用户手动编辑的文本内容
- **AI生成区域**: 通过提示词让AI生成的内容
- 拖拽排序和位置调整
- 实时预览和格式应用

### 3. AI内容生成
- 基于千问API的智能内容生成
- 支持上下文感知的内容创作
- 可调节创作参数（长度、创意度等）
- 提示词优化建议

### 4. 文档处理
- Word文档导入和解析
- 标准Word格式导出
- PDF格式导出
- HTML预览生成

## 📚 使用指南

### 创建文档模板

1. 进入编辑器页面
2. 设置文档格式（字体、段落、页面）
3. 添加内容块：
   - 固定内容：手动编辑的文本
   - AI内容：设置提示词让AI生成
4. 调整内容块顺序和格式
5. 保存模板

### AI内容生成

1. 选择AI内容块
2. 编写清晰的提示词，例如：
   ```
   请写一段关于人工智能发展趋势的段落，字数在200字左右，语言要专业但易懂
   ```
3. 设置生成参数（长度、创意度）
4. 点击生成，AI将根据模板格式生成内容

### 文档导出

1. 完成文档编辑
2. 选择导出格式（Word/PDF）
3. 系统将生成包含所有格式的文档文件

## 🔧 API 接口

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

## 🎨 界面预览

### 主页
- 项目介绍和功能特性展示
- 快速开始引导
- 使用流程说明

### 编辑器
- 左侧：格式设置面板
- 中间：内容编辑区域
- 右侧：AI生成控制面板
- 底部：预览和导出功能

### 模板管理
- 模板列表展示
- 模板创建和编辑
- 模板复制和删除
- 导入导出功能

## 🚀 部署

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [千问AI](https://tongyi.aliyun.com/) - 提供强大的AI内容生成能力
- [React](https://react.dev/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架
- [Quill.js](https://quilljs.com/) - 富文本编辑器
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

---

**Word星辉点团队** - 让文档创作更智能 ✨ 