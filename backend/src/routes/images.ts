import express from 'express';
import { imageService } from '../services/imageService';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 上传并分析图片
router.post('/upload-analyze', async (req, res) => {
  try {
    const { modelId, images, prompt, analysisType } = req.body;
    
    if (!modelId || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段或图片数据'
      });
    }

    // 验证图片数量限制
    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        message: '一次最多只能处理10张图片'
      });
    }

    const result = await imageService.analyzeImages(modelId, images, prompt, analysisType);
    
    res.json({
      success: result.success,
      data: result.results,
      error: result.error
    });
  } catch (error) {
    console.error('图片分析失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '图片分析失败'
    });
  }
});

// 异步分析图片
router.post('/analyze-async', async (req, res) => {
  try {
    const { modelId, images, prompt, analysisType } = req.body;
    
    if (!modelId || !images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段或图片数据'
      });
    }

    // 验证图片数量限制
    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        message: '一次最多只能处理10张图片'
      });
    }

    const taskId = uuidv4();
    
    // 异步处理
    imageService.processImagesAsync(taskId, modelId, images, prompt, analysisType);
    
    res.json({
      success: true,
      taskId,
      message: '图片分析任务已提交，请使用taskId查询进度'
    });
  } catch (error) {
    console.error('提交图片分析任务失败:', error);
    res.status(500).json({
      success: false,
      message: '提交图片分析任务失败'
    });
  }
});

// 查询分析进度
router.get('/analysis-status/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const status = imageService.getProcessingStatus(taskId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: '任务不存在或已过期'
      });
    }
    
    res.json({
      success: true,
      data: {
        status: status.status,
        result: status.result,
        error: status.error,
        createdAt: status.createdAt
      }
    });
  } catch (error) {
    console.error('查询分析状态失败:', error);
    res.status(500).json({
      success: false,
      message: '查询分析状态失败'
    });
  }
});

// 保存图片文件
router.post('/save', async (req, res) => {
  try {
    const { base64Data, filename } = req.body;
    
    if (!base64Data) {
      return res.status(400).json({
        success: false,
        message: '缺少图片数据'
      });
    }

    // 验证图片
    const validation = imageService.validateImage(base64Data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const savedFilename = await imageService.saveBase64Image(base64Data, filename);
    
    res.json({
      success: true,
      data: {
        filename: savedFilename,
        url: `/api/images/${savedFilename}`
      }
    });
  } catch (error) {
    console.error('保存图片失败:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '保存图片失败'
    });
  }
});

// 获取图片文件
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const base64Data = await imageService.readImageAsBase64(filename);
    
    // 解析图片格式
    const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (matches) {
      const extension = matches[1];
      const imageData = matches[2];
      
      res.set({
        'Content-Type': `image/${extension}`,
        'Cache-Control': 'public, max-age=86400' // 缓存1天
      });
      
      const buffer = Buffer.from(imageData, 'base64');
      res.send(buffer);
    } else {
      res.status(400).json({
        success: false,
        message: '无效的图片数据'
      });
    }
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(404).json({
      success: false,
      message: '图片不存在'
    });
  }
});

export default router;