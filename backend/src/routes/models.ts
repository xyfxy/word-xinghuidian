import express from 'express';
import { modelService } from '../services/modelService';
import { AIModelCreateRequest, AIModelUpdateRequest } from '../types/model';

const router = express.Router();

// 获取所有模型列表
router.get('/', async (req, res) => {
  try {
    const models = await modelService.getAllModels();
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模型列表失败'
    });
  }
});

// 获取单个模型详情（不返回完整API Key）
router.get('/:id', async (req, res) => {
  try {
    const model = await modelService.getModel(req.params.id);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      });
    }
    
    // 不返回完整的API Key
    const { apiKey, ...modelWithoutKey } = model;
    
    res.json({
      success: true,
      data: {
        ...modelWithoutKey,
        apiKeyPreview: apiKey.substring(0, 4) + '...'
      }
    });
  } catch (error) {
    console.error('获取模型详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模型详情失败'
    });
  }
});

// 创建新模型
router.post('/', async (req, res) => {
  try {
    const request: AIModelCreateRequest = req.body;
    
    // 验证必填字段
    if (!request.name || !request.provider || !request.baseUrl || !request.apiKey || !request.model) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }
    
    // 先测试连接
    const testResult = await modelService.testModelConnection(request);
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: `模型连接测试失败: ${testResult.error || testResult.message}`
      });
    }
    
    // 创建模型
    const model = await modelService.createModel(request);
    
    // 不返回API Key
    const { apiKey, ...modelWithoutKey } = model;
    
    res.json({
      success: true,
      data: {
        ...modelWithoutKey,
        apiKeyPreview: apiKey.substring(0, 4) + '...',
        testResult: {
          success: true,
          responseTime: testResult.responseTime
        }
      }
    });
  } catch (error) {
    console.error('创建模型失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建模型失败'
    });
  }
});

// 更新模型
router.put('/:id', async (req, res) => {
  try {
    const request: AIModelUpdateRequest = req.body;
    
    // 如果提供了新的API Key，先测试连接
    if (request.apiKey) {
      const existingModel = await modelService.getModel(req.params.id);
      if (!existingModel) {
        return res.status(404).json({
          success: false,
          message: '模型不存在'
        });
      }
      
      const testRequest = {
        name: request.name || existingModel.name,
        provider: existingModel.provider,
        baseUrl: request.baseUrl || existingModel.baseUrl,
        apiKey: request.apiKey,
        model: request.model || existingModel.model
      };
      
      const testResult = await modelService.testModelConnection(testRequest);
      if (!testResult.success) {
        return res.status(400).json({
          success: false,
          message: `模型连接测试失败: ${testResult.error || testResult.message}`
        });
      }
    }
    
    const model = await modelService.updateModel(req.params.id, request);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      });
    }
    
    // 不返回API Key
    const { apiKey, ...modelWithoutKey } = model;
    
    res.json({
      success: true,
      data: {
        ...modelWithoutKey,
        apiKeyPreview: apiKey.substring(0, 4) + '...'
      }
    });
  } catch (error) {
    console.error('更新模型失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新模型失败'
    });
  }
});

// 删除模型
router.delete('/:id', async (req, res) => {
  try {
    const success = await modelService.deleteModel(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      });
    }
    
    res.json({
      success: true,
      message: '模型已删除'
    });
  } catch (error) {
    console.error('删除模型失败:', error);
    res.status(500).json({
      success: false,
      message: '删除模型失败'
    });
  }
});

// 测试模型连接
router.post('/:id/test', async (req, res) => {
  try {
    const result = await modelService.testModel(req.params.id);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    console.error('测试模型失败:', error);
    res.status(500).json({
      success: false,
      message: '测试模型失败'
    });
  }
});

// 测试模型连接（不保存）
router.post('/test-connection', async (req, res) => {
  try {
    const request: AIModelCreateRequest = req.body;
    
    // 验证必填字段
    if (!request.provider || !request.baseUrl || !request.apiKey || !request.model) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }
    
    const result = await modelService.testModelConnection(request);
    
    res.json({
      success: result.success,
      data: result
    });
  } catch (error) {
    console.error('测试连接失败:', error);
    res.status(500).json({
      success: false,
      message: '测试连接失败'
    });
  }
});

export default router;