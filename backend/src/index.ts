import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量，确保在所有其他模块之前执行
dotenv.config();

// 导入路由
import aiRoutes from './routes/ai';
import templateRoutes from './routes/templates';
import documentRoutes from './routes/documents';

const app = express();
const PORT = process.env.PORT || 3002;

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
app.use('/api/ai/', aiLimiter);

// 日志中间件
app.use(morgan('combined'));

// 解析JSON和URL编码数据
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/ai', aiRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/documents', documentRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404处理
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  });
});

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Word星辉点后端服务启动成功`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ 千问API状态: ${process.env.QIANWEN_API_KEY ? '已配置' : '未配置'}`);
});

export default app; 