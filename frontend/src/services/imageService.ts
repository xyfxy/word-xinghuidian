import api from './api';
import { ImageAnalysisRequest, ImageAnalysisResponse } from '../types/model';

export interface UploadImageResult {
  filename: string;
  url: string;
}

export interface AnalysisTask {
  taskId: string;
  message: string;
}

export interface AnalysisStatus {
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
}

export const imageService = {
  // 上传并分析图片
  async uploadAndAnalyze(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    try {
      const response = await api.post<{ 
        success: boolean; 
        data: any[];
        error?: string;
      }>('/images/upload-analyze', request);
      
      return {
        success: response.data.success,
        results: response.data.data || [],
        error: response.data.error
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : '图片分析失败'
      };
    }
  },

  // 异步分析图片
  async analyzeAsync(request: ImageAnalysisRequest): Promise<AnalysisTask> {
    try {
      const response = await api.post<{ 
        success: boolean; 
        taskId: string;
        message: string;
      }>('/images/analyze-async', request);
      
      if (response.data.success) {
        return {
          taskId: response.data.taskId,
          message: response.data.message
        };
      }
      
      throw new Error('提交分析任务失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '提交分析任务失败');
    }
  },

  // 查询分析状态
  async getAnalysisStatus(taskId: string): Promise<AnalysisStatus> {
    try {
      const response = await api.get<{ 
        success: boolean; 
        data: AnalysisStatus;
      }>(`/images/analysis-status/${taskId}`);
      
      if (response.data.success) {
        return {
          ...response.data.data,
          createdAt: new Date(response.data.data.createdAt)
        };
      }
      
      throw new Error('查询分析状态失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '查询分析状态失败');
    }
  },

  // 保存图片文件
  async saveImage(base64Data: string, filename?: string): Promise<UploadImageResult> {
    try {
      const response = await api.post<{ 
        success: boolean; 
        data: UploadImageResult;
      }>('/images/save', {
        base64Data,
        filename
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error('保存图片失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '保存图片失败');
    }
  },

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
  },

  // 将文件转换为base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('请选择图片文件'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsDataURL(file);
    });
  },

  // 批量转换文件为base64
  async filesToBase64(files: File[]): Promise<string[]> {
    const promises = files.map(file => this.fileToBase64(file));
    return Promise.all(promises);
  }
};