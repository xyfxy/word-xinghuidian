import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { DocumentTemplate } from '../types';
import documentService from '../services/documentService';
import fs from 'fs/promises';

const router = express.Router();

// 处理文件名编码问题
function decodeFileName(filename: string): string {
  try {
    // 尝试从Latin-1解码到UTF-8
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch (error) {
    // 如果解码失败，返回原始文件名
    return filename;
  }
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // 处理文件名编码
    const originalName = decodeFileName(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(originalName));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许Word文档
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Word文档格式 (.doc, .docx)'));
    }
  },
});

// 配置multer用于文本提取（支持Word和txt）
const extractUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    // 允许Word文档、txt文件、PDF和PPT文件
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'application/pdf', // .pdf
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];
    
    const allowedExtensions = ['.docx', '.doc', '.txt', '.pdf', '.pptx', '.ppt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Word文档(.doc, .docx)、文本文件(.txt)、PDF文件(.pdf)和PowerPoint文件(.ppt, .pptx)格式') as any);
    }
  },
});

// 导入Word文档
router.post('/import', upload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: '请选择要导入的Word文档',
      });
      return;
    }

    // 处理文件名编码
    const fileName = decodeFileName(req.file.originalname);
    
    const template = await documentService.importWordDocument(req.file.path);

    // 清理上传的临时文件
    await documentService.cleanupFile(req.file.path);

    res.json({
      success: true,
      data: template,
      message: 'Word文档导入成功',
    });
  } catch (error) {
    console.error('导入Word文档错误:', error);
    
    // 清理上传的临时文件
    if (req.file) {
      await documentService.cleanupFile(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导入文档失败',
    });
  }
});

// 导出Word文档
router.post('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const template: DocumentTemplate = req.body;

    // 验证模板数据
    if (!template || !template.name || !template.content) {
      res.status(400).json({
        success: false,
        message: '模板数据不完整',
      });
      return;
    }

    const buffer = await documentService.exportToWord(template);

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(template.name)}.docx"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('导出Word文档错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导出文档失败',
    });
  }
});

// 预览文档内容
router.post('/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const template: DocumentTemplate = req.body;

    if (!template || !template.content) {
      res.status(400).json({
        success: false,
        message: '模板数据不完整',
      });
      return;
    }

    const htmlContent = await documentService.generatePreview(template);

    res.json({
      success: true,
      data: htmlContent,
    });
  } catch (error) {
    console.error('预览文档错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '生成预览失败',
    });
  }
});

// 转换为PDF
router.post('/export-pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const template: DocumentTemplate = req.body;

    if (!template || !template.name || !template.content) {
      res.status(400).json({
        success: false,
        message: '模板数据不完整',
      });
      return;
    }

    const buffer = await documentService.exportToPDF(template);

    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(template.name)}.pdf"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('导出PDF错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '导出PDF失败',
    });
  }
});

// 验证文档格式
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const template: DocumentTemplate = req.body;

    if (!template) {
      res.status(400).json({
        success: false,
        message: '请提供模板数据',
      });
      return;
    }

    const validation = await documentService.validateDocument(template);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error('验证文档错误:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '验证文档失败',
    });
  }
});

// 提取单个文档文本内容
router.post('/extract-text', extractUpload.single('document'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: '请选择要提取文本的文档',
      });
      return;
    }

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    if (fileExt === '.txt') {
      // 处理txt文件
      extractedText = await fs.readFile(req.file.path, 'utf-8');
    } else if (fileExt === '.docx' || fileExt === '.doc') {
      // 处理Word文档
      extractedText = await documentService.extractTextFromWord(req.file.path);
    } else if (fileExt === '.pdf') {
      // 处理PDF文档
      extractedText = await documentService.extractTextFromPDF(req.file.path);
    } else if (fileExt === '.pptx' || fileExt === '.ppt') {
      // 处理PowerPoint文档
      extractedText = await documentService.extractTextFromPPT(req.file.path);
    } else {
      throw new Error('不支持的文件格式');
    }

    // 清理上传的临时文件
    await documentService.cleanupFile(req.file.path);

    // 计算字数（中文字符 + 英文单词）
    const chineseChars = (extractedText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (extractedText.match(/\b[a-zA-Z]+\b/g) || []).length;
    const wordCount = chineseChars + englishWords;

    // 处理文件名编码
    const fileName = decodeFileName(req.file.originalname);

    res.json({
      success: true,
      data: {
        text: extractedText,
        fileName: fileName,
        fileSize: req.file.size,
        wordCount: wordCount,
        charCount: extractedText.length
      },
      message: '文本提取成功',
    });
  } catch (error) {
    console.error('提取文档文本错误:', error);
    
    // 清理上传的临时文件
    if (req.file) {
      await documentService.cleanupFile(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '提取文本失败',
    });
  }
});

// 提取多个文档文本内容
router.post('/extract-texts', extractUpload.array('documents', 10), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: '请选择要提取文本的文档',
      });
      return;
    }

    const results = [];
    const cleanupPromises = [];

    for (const file of req.files) {
      try {
        const fileExt = path.extname(file.originalname).toLowerCase();
        let extractedText = '';

        if (fileExt === '.txt') {
          // 处理txt文件
          extractedText = await fs.readFile(file.path, 'utf-8');
        } else if (fileExt === '.docx' || fileExt === '.doc') {
          // 处理Word文档
          extractedText = await documentService.extractTextFromWord(file.path);
        } else if (fileExt === '.pdf') {
          // 处理PDF文档
          extractedText = await documentService.extractTextFromPDF(file.path);
        } else if (fileExt === '.pptx' || fileExt === '.ppt') {
          // 处理PowerPoint文档
          extractedText = await documentService.extractTextFromPPT(file.path);
        } else {
          extractedText = `[不支持的文件格式: ${fileExt}]`;
        }

        // 计算字数（中文字符 + 英文单词）
        const chineseChars = (extractedText.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (extractedText.match(/\b[a-zA-Z]+\b/g) || []).length;
        const wordCount = chineseChars + englishWords;

        // 处理文件名编码
        const fileName = decodeFileName(file.originalname);

        results.push({
          text: extractedText,
          fileName: fileName,
          fileSize: file.size,
          wordCount: wordCount,
          charCount: extractedText.length,
          success: true
        });

        // 添加清理任务
        cleanupPromises.push(documentService.cleanupFile(file.path));
      } catch (error) {
        console.error(`处理文件 ${file.originalname} 失败:`, error);
        // 处理文件名编码
        const fileName = decodeFileName(file.originalname);
        
        results.push({
          text: '',
          fileName: fileName,
          fileSize: file.size,
          wordCount: 0,
          success: false,
          error: error instanceof Error ? error.message : '解析失败'
        });
        cleanupPromises.push(documentService.cleanupFile(file.path));
      }
    }

    // 清理所有临时文件
    await Promise.all(cleanupPromises).catch(console.error);

    res.json({
      success: true,
      data: {
        files: results,
        totalFiles: results.length,
        successCount: results.filter(r => r.success).length,
        failedCount: results.filter(r => !r.success).length
      },
      message: '文本提取完成',
    });
  } catch (error) {
    console.error('提取多个文档文本错误:', error);
    
    // 清理所有上传的临时文件
    if (req.files && Array.isArray(req.files)) {
      await Promise.all(
        req.files.map(file => documentService.cleanupFile(file.path).catch(() => {}))
      );
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '提取文本失败',
    });
  }
});

// 获取支持的文档格式
router.get('/formats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      import: [
        { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Word 2007+ 文档' },
        { extension: '.doc', mimeType: 'application/msword', name: 'Word 97-2003 文档' },
      ],
      export: [
        { extension: '.docx', name: 'Word 文档' },
        { extension: '.pdf', name: 'PDF 文档' },
        { extension: '.html', name: 'HTML 网页' },
      ],
      extract: [
        { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Word 2007+ 文档' },
        { extension: '.doc', mimeType: 'application/msword', name: 'Word 97-2003 文档' },
        { extension: '.txt', mimeType: 'text/plain', name: '文本文件' },
        { extension: '.pdf', mimeType: 'application/pdf', name: 'PDF 文档' },
        { extension: '.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'PowerPoint 2007+ 演示文档' },
        { extension: '.ppt', mimeType: 'application/vnd.ms-powerpoint', name: 'PowerPoint 97-2003 演示文档' },
      ],
    },
  });
});

export default router; 