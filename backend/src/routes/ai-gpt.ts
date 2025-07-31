import express from 'express';
import { AIServiceFactory } from '../services/ai/aiServiceFactory';
import { GPTRequest, AIServiceFactoryConfig } from '../types/ai';
import { modelService } from '../services/modelService';

const router = express.Router();

// 通用GPT接口 - 生成内容
router.post('/generate', async (req, res) => {
  try {
    const { 
      messages, 
      model, 
      temperature = 0.7, 
      max_tokens = 500,
      top_p = 1,
      // AI服务配置
      provider = 'custom',
      apiKey,
      baseUrl,
      customHeaders,
      // 模型ID - 新增支持
      modelId
    } = req.body;

    // 验证请求参数
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的消息列表',
      });
    }

    // 验证消息格式
    for (const message of messages) {
      if (!message.role || !message.content) {
        return res.status(400).json({
          success: false,
          message: '消息格式错误：每条消息必须包含role和content',
        });
      }
    }

    // 创建AI服务实例
    let aiService;
    let selectedModel = model; // 默认使用请求中的model
    
    if (modelId) {
      // 使用模型管理中的配置
      const savedModel = await modelService.getModel(modelId);
      if (!savedModel) {
        return res.status(400).json({
          success: false,
          message: '指定的模型不存在',
        });
      }
      
      if (!savedModel.isActive) {
        return res.status(400).json({
          success: false,
          message: '指定的模型已禁用',
        });
      }
      
      const config: AIServiceFactoryConfig = {
        provider: savedModel.provider === 'openai' ? 'custom' : savedModel.provider,
        apiKey: savedModel.apiKey,
        baseUrl: savedModel.baseUrl,
        model: savedModel.model,
      };
      aiService = AIServiceFactory.createService(config);
      selectedModel = savedModel.model; // 使用保存的模型名称
    } else if (apiKey) {
      // 使用请求中提供的配置
      const config: AIServiceFactoryConfig = {
        provider,
        apiKey,
        baseUrl,
        model,
        customHeaders,
      };
      aiService = AIServiceFactory.createService(config);
    } else {
      // 使用默认配置（从环境变量读取）
      try {
        aiService = AIServiceFactory.getDefaultService();
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'AI服务未配置，请提供API密钥、modelId或在环境变量中配置',
        });
      }
    }

    // 构建GPT请求
    const gptRequest: GPTRequest = {
      messages,
      model: selectedModel,
      temperature,
      max_tokens,
      top_p,
    };

    // 调用AI服务
    const response = await aiService.generateContent(gptRequest);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('AI内容生成错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'AI服务异常',
    });
  }
});

// 兼容旧接口 - 将旧的generate请求转换为GPT格式
router.post('/generate-legacy', async (req, res) => {
  try {
    const { prompt, maxLength = 500, temperature = 0.7, context } = req.body;

    // 验证请求参数
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的提示词',
      });
    }

    // 构建GPT格式的消息
    const messages: GPTRequest['messages'] = [
      {
        role: 'system',
        content: '你是一个专业的内容创作助手，能够根据用户需求生成高质量的中文内容。请确保内容准确、连贯、符合语境。'
      }
    ];

    if (context) {
      messages.push({
        role: 'user',
        content: `参考上下文：${context}\n\n请根据以下要求生成内容：${prompt}`
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    // 使用默认AI服务
    const aiService = AIServiceFactory.getDefaultService();
    const response = await aiService.generateContent({
      messages,
      temperature,
      max_tokens: maxLength,
    });

    res.json({
      content: response.content,
      success: true,
    });
  } catch (error) {
    console.error('AI内容生成错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'AI服务异常',
    });
  }
});

// AI服务健康检查
router.get('/health', async (req, res) => {
  try {
    const { provider, apiKey, baseUrl } = req.query;

    let aiService;
    if (provider && apiKey) {
      // 检查特定配置的服务
      aiService = AIServiceFactory.createService({
        provider: provider as string,
        apiKey: apiKey as string,
        baseUrl: baseUrl as string,
      });
    } else {
      // 检查默认服务
      try {
        aiService = AIServiceFactory.getDefaultService();
      } catch (error) {
        return res.status(503).json({
          success: false,
          message: 'AI服务未配置',
        });
      }
    }

    const health = await aiService.checkHealth();
    
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
    }
  } catch (error) {
    console.error('AI服务健康检查错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI服务健康检查失败',
    });
  }
});

// 获取支持的AI服务提供商列表
router.get('/providers', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        defaultModel: 'gpt-3.5-turbo',
        requiresApiKey: true,
        defaultBaseUrl: 'https://api.openai.com/v1',
      },
      {
        id: 'custom',
        name: '自定义GPT服务',
        models: [],
        defaultModel: '',
        requiresApiKey: false,
        requiresBaseUrl: true,
        supportsCustomHeaders: true,
      },
    ],
  });
});

// MaxKB 生成内容接口（兼容旧接口）
router.post('/generate-maxkb', async (req, res) => {
  const { baseUrl, apiKey, messages, model, maxTokens } = req.body;

  if (!baseUrl || !apiKey || !messages || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      message: '请提供有效的MaxKB配置 (baseUrl, apiKey) 和 messages 数组',
    });
  }

  try {
    // 导入 MaxKB 服务
    const { generateMaxKbContent } = await import('../services/maxkbService');
    const content = await generateMaxKbContent(baseUrl, apiKey, messages, model, maxTokens);
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

export default router;