import express, { Request, Response } from 'express';
import { DocumentTemplate } from '../types';
import templateService from '../services/templateService';
import archiver from 'archiver';

const router = express.Router();

// 获取简化的模板列表（分页，不包含完整content）
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    
    const result = await templateService.getTemplateList(page, pageSize);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('获取模板列表错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取模板列表失败',
    });
  }
});

// 获取完整模板列表（保留原有接口以保持兼容）
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // 如果有simple参数，返回简化版本
    if (req.query.simple === 'true') {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const result = await templateService.getTemplateList(page, pageSize);
      
      res.json({
        success: true,
        data: result.templates,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize
        }
      });
      return;
    }
    
    // 否则返回完整数据（保持兼容）
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

    // AI生成块的提示词可以为空，在使用时再填写
    // 这样用户可以先保存模板结构，后续再添加提示词
    // const aiBlocks = templateData.content.filter((block: any) => block.type === 'ai-generated');
    // for (const block of aiBlocks) {
    //   if (!block.aiPrompt || typeof block.aiPrompt !== 'string' || block.aiPrompt.trim().length === 0) {
    //     res.status(400).json({
    //       success: false,
    //       message: 'AI生成内容块必须包含提示词',
    //     });
    //     return;
    //   }
    // }

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

    // AI生成块的提示词可以为空，在使用时再填写
    // if (updateData.content && Array.isArray(updateData.content)) {
    //   const aiBlocks = updateData.content.filter((block: any) => block.type === 'ai-generated');
    //   for (const block of aiBlocks) {
    //     if (!block.aiPrompt || typeof block.aiPrompt !== 'string' || block.aiPrompt.trim().length === 0) {
    //       res.status(400).json({
    //         success: false,
    //         message: 'AI生成内容块必须包含提示词',
    //       });
    //       return;
    //     }
    //   }
    // }

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

// 导出所有模板 - 必须在 /:id 路由之前定义
router.get('/export/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await templateService.getAllTemplates();
    
    if (templates.length === 0) {
      res.status(404).json({
        success: false,
        message: '没有可导出的模板',
      });
      return;
    }
    
    // 设置响应头为zip文件
    const fileName = `templates-backup-${new Date().toISOString().split('T')[0]}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    
    // 创建压缩包
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    });
    
    // 错误处理
    archive.on('error', (err) => {
      throw err;
    });
    
    // 将压缩流输出到响应
    archive.pipe(res);
    
    // 为每个模板创建单独的JSON文件
    for (const template of templates) {
      const templateData = {
        name: template.name,
        description: template.description,
        format: template.format,
        content: template.content,
        exportTime: new Date().toISOString(),
        version: '1.3.0'
      };
      
      // 清理文件名中的非法字符
      const safeFileName = template.name
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_')
        .substring(0, 100); // 限制文件名长度
      
      // 添加JSON文件到压缩包
      archive.append(JSON.stringify(templateData, null, 2), { 
        name: `${safeFileName}.json` 
      });
    }
    
    // 添加一个索引文件，包含所有模板的基本信息
    const indexData = {
      exportTime: new Date().toISOString(),
      version: '1.3.0',
      count: templates.length,
      templates: templates.map(t => ({
        name: t.name,
        description: t.description,
        fileName: `${t.name.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_').substring(0, 100)}.json`
      }))
    };
    
    archive.append(JSON.stringify(indexData, null, 2), { 
      name: '_index.json' 
    });
    
    // 完成压缩
    await archive.finalize();
  } catch (error) {
    console.error('导出所有模板错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导出模板失败',
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

// 导出单个模板
router.get('/:id/export', async (req: Request, res: Response): Promise<void> => {
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

    // 设置文件下载headers
    const fileName = `${template.name.replace(/[^\w\s-]/g, '')}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    
    // 返回模板数据（去除内部字段）
    const exportData = {
      name: template.name,
      description: template.description,
      format: template.format,
      content: template.content,
      exportTime: new Date().toISOString(),
      version: '1.3.0'
    };

    res.json(exportData);
  } catch (error) {
    console.error('导出模板错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导出模板失败',
    });
  }
});

// 导入模板
router.post('/import', async (req: Request, res: Response): Promise<void> => {
  try {
    const importData = req.body;

    if (!importData) {
      res.status(400).json({
        success: false,
        message: '导入数据不能为空',
      });
      return;
    }

    let templatesToImport: any[] = [];

    // 检查是否是单个模板导入
    if (importData.name && importData.content) {
      templatesToImport = [importData];
    }
    // 检查是否是批量导入
    else if (importData.templates && Array.isArray(importData.templates)) {
      templatesToImport = importData.templates;
    }
    else {
      res.status(400).json({
        success: false,
        message: '导入数据格式不正确',
      });
      return;
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const templateData of templatesToImport) {
      try {
        // 验证必需字段
        if (!templateData.name || !templateData.content || !templateData.format) {
          results.push({
            name: templateData.name || '未命名',
            success: false,
            message: '模板数据不完整'
          });
          failCount++;
          continue;
        }

        // 验证内容格式
        if (!Array.isArray(templateData.content)) {
          results.push({
            name: templateData.name,
            success: false,
            message: '模板内容格式不正确'
          });
          failCount++;
          continue;
        }

        // AI生成块的提示词可以为空，在使用时再填写
        // const aiBlocks = templateData.content.filter((block: any) => block.type === 'ai-generated');
        let hasValidationError = false;
        // for (const block of aiBlocks) {
        //   if (!block.aiPrompt || typeof block.aiPrompt !== 'string' || block.aiPrompt.trim().length === 0) {
        //     results.push({
        //       name: templateData.name,
        //       success: false,
        //       message: 'AI生成内容块必须包含提示词'
        //     });
        //     failCount++;
        //     hasValidationError = true;
        //     break;
        //   }
        // }

        if (hasValidationError) continue;

        // 检查是否存在同名模板
        const existingTemplates = await templateService.getAllTemplates();
        const existingTemplate = existingTemplates.find(t => t.name === templateData.name);
        
        if (existingTemplate) {
          // 生成新名称
          let newName = `${templateData.name} (导入)`;
          let counter = 1;
          while (existingTemplates.find(t => t.name === newName)) {
            newName = `${templateData.name} (导入${counter})`;
            counter++;
          }
          templateData.name = newName;
        }

        // 保存模板
        const savedTemplate = await templateService.saveTemplate(templateData);
        results.push({
          name: savedTemplate.name,
          success: true,
          message: '导入成功'
        });
        successCount++;
      } catch (error) {
        results.push({
          name: templateData.name || '未命名',
          success: false,
          message: error instanceof Error ? error.message : '导入失败'
        });
        failCount++;
      }
    }

    res.status(201).json({
      success: successCount > 0,
      data: {
        results,
        summary: {
          total: templatesToImport.length,
          success: successCount,
          failed: failCount
        }
      },
      message: `导入完成：成功 ${successCount} 个，失败 ${failCount} 个`,
    });
  } catch (error) {
    console.error('导入模板错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导入模板失败',
    });
  }
});

export default router; 