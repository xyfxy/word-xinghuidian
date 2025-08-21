import express from 'express';
import { DingTalkService } from '../services/dingTalkService';

const router = express.Router();
const dingTalkService = new DingTalkService();

/**
 * 获取钉钉JSAPI配置
 * GET /api/dingtalk/config
 */
router.get('/config', async (req: express.Request, res: express.Response): Promise<any> => {
  const { url } = req.query;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数：url'
    });
  }

  try {
    const config = await dingTalkService.getJsApiConfig(url);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('获取钉钉配置失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取钉钉配置失败'
    });
  }
});

/**
 * 获取用户信息
 * POST /api/dingtalk/userinfo
 */
router.post('/userinfo', async (req: express.Request, res: express.Response): Promise<any> => {
  const { authCode } = req.body;
  
  if (!authCode) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数：authCode'
    });
  }

  try {
    const userInfo = await dingTalkService.getUserInfo(authCode);
    
    res.json({
      success: true,
      data: userInfo
    });
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取用户信息失败'
    });
  }
});

/**
 * 验证请求是否来自钉钉
 * POST /api/dingtalk/verify
 */
router.post('/verify', async (req: express.Request, res: express.Response): Promise<any> => {
  const { userId } = req.body;
  const dingTalkUserId = req.headers['x-dingtalk-userid'];
  
  if (!userId || !dingTalkUserId) {
    return res.status(401).json({
      success: false,
      message: '未授权的请求'
    });
  }

  // 验证用户ID是否匹配
  if (userId !== dingTalkUserId) {
    return res.status(401).json({
      success: false,
      message: '用户验证失败'
    });
  }

  res.json({
    success: true,
    message: '验证成功'
  });
});

export default router;