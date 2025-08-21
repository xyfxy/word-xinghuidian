import { Request, Response, NextFunction } from 'express';
import { DingTalkService } from '../services/dingTalkService';

const dingTalkService = new DingTalkService();

/**
 * 钉钉认证中间件
 * 验证请求是否来自已认证的钉钉用户
 */
export const dingTalkAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 如果未启用钉钉认证，直接通过
  if (process.env.ENABLE_DINGTALK_AUTH !== 'true') {
    return next();
  }

  // 开发环境且带有调试标记，直接通过
  if (process.env.NODE_ENV === 'development' && req.query.debug === 'dingtalk') {
    return next();
  }

  // 检查请求头中的钉钉用户ID
  const userId = req.headers['x-dingtalk-userid'] as string;
  const authFlag = req.headers['x-dingtalk-auth'] as string;

  if (!userId || authFlag !== 'true') {
    return res.status(401).json({
      success: false,
      message: '未授权的访问：请通过钉钉客户端访问'
    });
  }

  // 可选：验证用户ID是否有效（会增加API调用）
  if (process.env.DINGTALK_VERIFY_USER === 'true') {
    try {
      const isValid = await dingTalkService.verifyUser(userId);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: '用户验证失败'
        });
      }
    } catch (error) {
      console.error('验证用户失败:', error);
      return res.status(500).json({
        success: false,
        message: '用户验证服务暂时不可用'
      });
    }
  }

  // 将用户ID添加到请求对象中，供后续使用
  (req as any).dingTalkUserId = userId;

  next();
};

/**
 * 可选的钉钉认证中间件
 * 只记录用户信息，不强制要求认证
 */
export const optionalDingTalkAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.headers['x-dingtalk-userid'] as string;
  
  if (userId) {
    (req as any).dingTalkUserId = userId;
  }
  
  next();
};