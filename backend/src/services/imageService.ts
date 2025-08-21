import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { modelService } from './modelService';
import { ImageAnalysisRequest } from '../types/model';

export class ImageService {
  private imagesDir: string;

  constructor() {
    this.imagesDir = join(__dirname, '../../data', 'images');
    this.ensureImagesDir();
  }

  private async ensureImagesDir(): Promise<void> {
    try {
      await mkdir(this.imagesDir, { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  }

  // 保存base64图片到文件
  async saveBase64Image(base64Data: string, filename?: string): Promise<string> {
    try {
      await this.ensureImagesDir();
      
      // 解析base64数据
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('无效的base64图片数据');
      }
      
      const extension = matches[1];
      const imageData = matches[2];
      
      // 生成文件名
      const imageId = uuidv4();
      const savedFilename = filename || `${imageId}.${extension}`;
      const filePath = join(this.imagesDir, savedFilename);
      
      // 保存文件
      const buffer = Buffer.from(imageData, 'base64');
      await writeFile(filePath, buffer);
      
      return savedFilename;
    } catch (error) {
      console.error('保存图片失败:', error);
      throw new Error('保存图片失败');
    }
  }

  // 读取图片为base64
  async readImageAsBase64(filename: string): Promise<string> {
    try {
      const filePath = join(this.imagesDir, filename);
      const buffer = await readFile(filePath);
      const extension = filename.split('.').pop()?.toLowerCase() || 'png';
      
      return `data:image/${extension};base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('读取图片失败:', error);
      throw new Error('读取图片失败');
    }
  }

  // 验证图片格式和大小
  validateImage(base64Data: string, maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } {
    try {
      // 检查base64格式
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        return { valid: false, error: '无效的图片格式' };
      }
      
      const extension = matches[1].toLowerCase();
      const imageData = matches[2];
      
      // 检查支持的格式
      const supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!supportedFormats.includes(extension)) {
        return { valid: false, error: `不支持的图片格式: ${extension}` };
      }
      
      // 检查文件大小
      const sizeInBytes = (imageData.length * 3) / 4; // base64解码后的大小
      if (sizeInBytes > maxSize) {
        return { valid: false, error: `图片文件过大，最大支持 ${Math.round(maxSize / 1024 / 1024)}MB` };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: '图片验证失败' };
    }
  }

  // 多模态分析图片
  async analyzeImages(modelId: string, images: string[], prompt?: string, analysisType?: 'description' | 'ocr' | 'classification' | 'custom') {
    try {
      // 验证所有图片
      for (let i = 0; i < images.length; i++) {
        const validation = this.validateImage(images[i]);
        if (!validation.valid) {
          throw new Error(`第${i + 1}张图片：${validation.error}`);
        }
      }

      // 调用模型分析
      const analysisRequest: ImageAnalysisRequest = {
        modelId,
        images,
        prompt,
        analysisType
      };

      const result = await modelService.analyzeImages(analysisRequest);
      return result;
    } catch (error) {
      console.error('图片分析失败:', error);
      throw error;
    }
  }

  // 获取图片处理队列
  private processingQueue: Map<string, {
    status: 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
    createdAt: Date;
  }> = new Map();

  // 异步处理图片分析
  async processImagesAsync(taskId: string, modelId: string, images: string[], prompt?: string, analysisType?: 'description' | 'ocr' | 'classification' | 'custom') {
    this.processingQueue.set(taskId, {
      status: 'processing',
      createdAt: new Date()
    });

    try {
      const result = await this.analyzeImages(modelId, images, prompt, analysisType);
      this.processingQueue.set(taskId, {
        status: 'completed',
        result,
        createdAt: new Date()
      });
    } catch (error) {
      this.processingQueue.set(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : '未知错误',
        createdAt: new Date()
      });
    }
  }

  // 获取处理状态
  getProcessingStatus(taskId: string) {
    return this.processingQueue.get(taskId) || null;
  }

  // 清理过期的处理任务（1小时后清理）
  cleanupExpiredTasks() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const [taskId, task] of this.processingQueue.entries()) {
      if (task.createdAt < oneHourAgo) {
        this.processingQueue.delete(taskId);
      }
    }
  }
}

// 导出单例
export const imageService = new ImageService();

// 定期清理过期任务
setInterval(() => {
  imageService.cleanupExpiredTasks();
}, 30 * 60 * 1000); // 每30分钟清理一次