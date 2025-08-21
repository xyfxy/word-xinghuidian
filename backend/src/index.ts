import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量，确保在所有其他模块之前执行
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 导入路由
import aiGptRoutes from './routes/ai-gpt';
import modelRoutes from './routes/models';
import templateRoutes from './routes/templates';
import documentRoutes from './routes/documents';
import wordImportRoutes from './routes/wordImport';
import imageRoutes from './routes/images';
import dingTalkRoutes from './routes/dingtalk';

// 导入中间件
import { dingTalkAuthMiddleware, optionalDingTalkAuth } from './middleware/dingTalkAuth';

// 导入错误处理工具
import { errorLogger } from './utils/asyncHandler';

const app = express();
const PORT = process.env.PORT || 3003;

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // 生产环境域名
    : ['http://localhost:3000'], // 开发环境
  credentials: true,
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: '请求过于频繁，请稍后再试',
});
app.use('/api/', limiter);

// AI请求特殊限制
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟最多10个AI请求
  message: 'AI请求过于频繁，请稍后再试',
});
app.use('/api/ai-gpt/', aiLimiter);

// 日志中间件
app.use(morgan('combined'));

// 解析JSON和URL编码数据
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 钉钉认证路由（不需要认证）
app.use('/api/dingtalk', dingTalkRoutes);

// 应用钉钉认证中间件到其他API路由（可选）
if (process.env.ENABLE_DINGTALK_AUTH === 'true') {
  app.use('/api/ai-gpt', dingTalkAuthMiddleware);
  app.use('/api/templates', dingTalkAuthMiddleware);
  app.use('/api/documents', dingTalkAuthMiddleware);
  app.use('/api/word-import', dingTalkAuthMiddleware);
  app.use('/api/images', dingTalkAuthMiddleware);
}

// API路由
app.use('/api/ai-gpt', aiGptRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/word-import', wordImportRoutes);
app.use('/api/images', imageRoutes);

// 增强版健康检查 - 包含数据完整性检查
app.get('/api/health', async (req, res) => {
  const fs = require('fs').promises;
  const path = require('path');
  
  let dataStatus = {
    models: false,
    templates: false
  };
  
  try {
    // 检查模型数据
    const modelsDir = path.join(__dirname, '../data/models');
    const modelFiles = await fs.readdir(modelsDir).catch(() => []);
    dataStatus.models = modelFiles.filter((f: string) => f.endsWith('.json')).length > 0;
    
    // 检查模板数据
    const templatesDir = path.join(__dirname, '../data/templates');
    const templateFiles = await fs.readdir(templatesDir).catch(() => []);
    dataStatus.templates = templateFiles.filter((f: string) => f.endsWith('.json')).length > 0;
  } catch (e) {
    // 忽略错误，使用默认值
  }
  
  const isHealthy = dataStatus.models && dataStatus.templates;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    dataIntegrity: dataStatus
  });
});

// 404处理
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

// 错误日志中间件
app.use(errorLogger);

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 确保错误被记录到控制台
  if (!res.headersSent) {
    console.error('\n🚨 最终错误处理器被调用:');
    console.error('错误:', err);
    console.error('堆栈:', err.stack);
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`🚀 Word新汇点后端服务启动成功`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ 使用模型管理和MaxKB进行AI内容生成`);
});

// 处理端口占用错误
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
    console.error(`💡 请尝试以下方法：`);
    console.error(`   1. 运行 "netstat -ano | findstr :${PORT}" 查找占用端口的进程`);
    console.error(`   2. 运行 "taskkill //F //PID <进程ID>" 结束进程`);
    console.error(`   3. 或修改 .env 文件中的 PORT 配置`);
    process.exit(1);
  } else {
    console.error('服务器错误:', error);
    process.exit(1);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

export default app; 