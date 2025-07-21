import express from 'express';
import multer from 'multer';
import path from 'path';
import { DocumentTemplate } from '../types';
import documentService from '../services/documentService';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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

// 导入Word文档
router.post('/import', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要导入的Word文档',
      });
    }

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
router.post('/export', async (req, res) => {
  try {
    const template: DocumentTemplate = req.body;

    // 验证模板数据
    if (!template || !template.name || !template.content) {
      return res.status(400).json({
        success: false,
        message: '模板数据不完整',
      });
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
router.post('/preview', async (req, res) => {
  try {
    const template: DocumentTemplate = req.body;

    if (!template || !template.content) {
      return res.status(400).json({
        success: false,
        message: '模板数据不完整',
      });
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
router.post('/export-pdf', async (req, res) => {
  try {
    const template: DocumentTemplate = req.body;

    if (!template || !template.name || !template.content) {
      return res.status(400).json({
        success: false,
        message: '模板数据不完整',
      });
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
router.post('/validate', async (req, res) => {
  try {
    const template: DocumentTemplate = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        message: '请提供模板数据',
      });
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

// 获取支持的文档格式
router.get('/formats', (req, res) => {
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
    },
  });
});

export default router; 