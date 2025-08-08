import express, { Request, Response } from 'express';
import { DocumentTemplate } from '../types';
import templateService from '../services/templateService';

const router = express.Router();

// 获取模板列表
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await templateService.getAllTemplates();
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('获取模板列表错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取模板列表失败',
    });
  }
});

// 获取单个模板
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: '模板ID不能为空',
      });
      return;
    }

    const template = await templateService.getTemplateById(id);
    
    if (!template) {
      res.status(404).json({
        success: false,
        message: '模板不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('获取模板详情错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取模板详情失败',
    });
  }
});

// 保存新模板
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateData = req.body;

    // 验证必需字段
    if (!templateData.name || typeof templateData.name !== 'string') {
      res.status(400).json({
        success: false,
        message: '模板名称不能为空',
      });
      return;
    }

    if (!templateData.format || !templateData.content) {
      res.status(400).json({
        success: false,
        message: '模板格式和内容不能为空',
      });
      return;
    }

    // 验证内容块
    if (!Array.isArray(templateData.content)) {
      res.status(400).json({
        success: false,
        message: '模板内容必须是数组格式',
      });
      return;
    }

    // 检查AI内容块是否有提示词
    const aiBlocks = templateData.content.filter((block: any) => block.type === 'ai-generated');
    for (const block of aiBlocks) {
      if (!block.aiPrompt || typeof block.aiPrompt !== 'string' || block.aiPrompt.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'AI生成内容块必须包含提示词',
        });
        return;
      }
    }

    const savedTemplate = await templateService.saveTemplate(templateData);

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: '模板保存成功',
    });
  } catch (error) {
    console.error('保存模板错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '保存模板失败',
    });
  }
});

// 更新模板
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: '模板ID不能为空',
      });
      return;
    }

    // 检查模板是否存在
    const existingTemplate = await templateService.getTemplateById(id);
    if (!existingTemplate) {
      res.status(404).json({
        success: false,
        message: '模板不存在',
      });
      return;
    }

    // 如果更新内容，验证AI内容块
    if (updateData.content && Array.isArray(updateData.content)) {
      const aiBlocks = updateData.content.filter((block: any) => block.type === 'ai-generated');
      for (const block of aiBlocks) {
        if (!block.aiPrompt || typeof block.aiPrompt !== 'string' || block.aiPrompt.trim().length === 0) {
          res.status(400).json({
            success: false,
            message: 'AI生成内容块必须包含提示词',
          });
          return;
        }
      }
    }

    const updatedTemplate = await templateService.updateTemplate(id, updateData);

    res.json({
      success: true,
      data: updatedTemplate,
      message: '模板更新成功',
    });
  } catch (error) {
    console.error('更新模板错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新模板失败',
    });
  }
});

// 删除模板
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: '模板ID不能为空',
      });
      return;
    }

    // 检查模板是否存在
    const existingTemplate = await templateService.getTemplateById(id);
    if (!existingTemplate) {
      res.status(404).json({
        success: false,
        message: '模板不存在',
      });
      return;
    }

    await templateService.deleteTemplate(id);

    res.json({
      success: true,
      message: '模板删除成功',
    });
  } catch (error) {
    console.error('删除模板错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除模板失败',
    });
  }
});

// 复制模板
router.post('/:id/duplicate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: '模板ID不能为空',
      });
      return;
    }

    // 检查模板是否存在
    const existingTemplate = await templateService.getTemplateById(id);
    if (!existingTemplate) {
      res.status(404).json({
        success: false,
        message: '模板不存在',
      });
      return;
    }

    const duplicatedTemplate = await templateService.duplicateTemplate(id, name);

    res.status(201).json({
      success: true,
      data: duplicatedTemplate,
      message: '模板复制成功',
    });
  } catch (error) {
    console.error('复制模板错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '复制模板失败',
    });
  }
});

export default router; 