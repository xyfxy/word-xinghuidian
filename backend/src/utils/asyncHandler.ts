import { Request, Response, NextFunction } from 'express';

// 异步路由错误处理包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('🚨 异步路由错误:', error);
      console.error('📍 错误堆栈:', error.stack);
      next(error);
    });
  };
};

// 确保所有错误都被捕获的中间件
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('\n🔥 ==========  错误详情  ==========');
  console.error('📅 时间:', new Date().toISOString());
  console.error('🌐 请求路径:', req.method, req.path);
  console.error('📝 错误消息:', err.message);
  console.error('📚 错误堆栈:', err.stack);
  console.error('🔍 错误对象:', err);
  console.error('=====================================\n');
  next(err);
};