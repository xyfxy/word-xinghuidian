import express, { Request, Response } from 'express';
import { AIGenerateRequest } from '../types';
import { generateMaxKbContent } from '../services/maxkbService';
import qianwenService from '../services/qianwenService';

const router = express.Router();

// 生成内容
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, maxLength = 3000, temperature = 0.7, context } = req.body as AIGenerateRequest;

    // 验证请求参数
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供有效的提示词',
      });
      return;
    }

    if (maxLength < 10 || maxLength > 10000) {
      res.status(400).json({
        success: false,
        message: '内容长度应在10-10000字符之间',
      });
      return;
    }

    if (temperature < 0 || temperature > 1) {
      res.status(400).json({
        success: false,
        message: '温度参数应在0-1之间',
      });
      return;
    }

    // 调用AI服务生成内容
    const result = await qianwenService.generateContent({
      prompt: prompt.trim(),
      maxLength,
      temperature,
      context,
    });

    res.json(result);
  } catch (error) {
    console.error('AI内容生成错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'AI服务异常',
    });
  }
});

// 新增：通过MaxKB生成内容
router.post('/generate-maxkb', async (req: Request, res: Response): Promise<void> => {
  const { baseUrl, apiKey, messages, model } = req.body;

  if (!baseUrl || !apiKey || !messages || !Array.isArray(messages)) {
    res.status(400).json({
      success: false,
      message: '请提供有效的MaxKB配置 (baseUrl, apiKey) 和 messages 数组',
    });
    return;
  }

  try {
    const content = await generateMaxKbContent(baseUrl, apiKey, messages, model);
    res.json({
      success: true,
      content: content,
    });
  } catch (error) {
    console.error('MaxKB 内容生成失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'MaxKB 服务调用失败',
    });
  }
});

// 批量生成内容
router.post('/batch-generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requests } = req.body;

    // 验证请求参数
    if (!Array.isArray(requests) || requests.length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供有效的批量生成请求',
      });
      return;
    }

    if (requests.length > 10) {
      res.status(400).json({
        success: false,
        message: '批量生成最多支持10个请求',
      });
      return;
    }

    // 验证每个请求
    for (const request of requests) {
      if (!request.prompt || typeof request.prompt !== 'string') {
        res.status(400).json({
          success: false,
          message: '所有请求必须包含有效的提示词',
        });
        return;
      }
    }

    // 调用AI服务批量生成
    const results = await qianwenService.batchGenerate(requests);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('批量AI内容生成错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'AI服务异常',
    });
  }
});

// 优化提示词
router.post('/optimize-prompt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: '请提供有效的提示词',
      });
      return;
    }

    const optimizedPrompt = await qianwenService.optimizePrompt(prompt.trim());

    res.json({
      success: true,
      data: {
        original: prompt.trim(),
        optimized: optimizedPrompt,
      },
    });
  } catch (error) {
    console.error('提示词优化错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '提示词优化失败',
    });
  }
});

// AI服务健康检查
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    const health = await qianwenService.checkHealth();
    
    if (health.status === 'ok') {
      res.json({
        success: true,
        data: health,
      });
    } else {
      res.status(503).json({
        success: false,
        message: health.message,
      });
      return;
    }
  } catch (error) {
    console.error('AI服务健康检查错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI服务健康检查失败',
    });
  }
});

export default router; 