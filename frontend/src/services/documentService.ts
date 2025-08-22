import axios from 'axios';
import { getApiBaseUrl } from '../utils/config';

// 创建一个带认证的axios实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 300000, // 5分钟超时
});

// 请求拦截器 - 添加钉钉认证头
api.interceptors.request.use(
  (config) => {
    // 添加钉钉认证头信息
    try {
      const dingTalkUser = sessionStorage.getItem('dingTalkUser');
      if (dingTalkUser) {
        const userData = JSON.parse(dingTalkUser);
        if (userData.userInfo && userData.userInfo.userId) {
          config.headers['X-DingTalk-UserId'] = userData.userInfo.userId;
          config.headers['X-DingTalk-Auth'] = 'true';
        }
      }
    } catch (error) {
      console.warn('获取钉钉认证信息失败:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理错误信息
    let message = '网络请求失败';
    
    if (error.response?.data) {
      if (typeof error.response.data === 'object' && error.response.data.message) {
        message = error.response.data.message;
      } else if (typeof error.response.data === 'string') {
        message = error.response.data;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    return Promise.reject(new Error(message));
  }
);

interface ExtractedTextResponse {
  success: boolean;
  data?: {
    text: string;
    fileName: string;
    fileSize: number;
    wordCount: number;
  };
  message?: string;
}

interface ExtractedFile {
  text: string;
  fileName: string;
  fileSize: number;
  wordCount: number;
  success: boolean;
  error?: string;
}

interface ExtractedTextsResponse {
  success: boolean;
  data?: {
    files: ExtractedFile[];
    totalFiles: number;
    successCount: number;
    failedCount: number;
  };
  message?: string;
}

class DocumentService {
  // 提取文档文本内容
  async extractTextFromDocument(file: File): Promise<ExtractedTextResponse> {
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await api.post<ExtractedTextResponse>(
        '/documents/extract-text',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('提取文档文本失败:', error);
      throw error;
    }
  }

  // 验证文件类型
  validateFileType(file: File): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/plain', // .txt
      'application/pdf', // .pdf
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint', // .ppt
    ];
    
    const allowedExtensions = ['.docx', '.doc', '.txt', '.pdf', '.pptx', '.ppt'];
    const fileExtension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    return allowedTypes.includes(file.type) || 
           (fileExtension ? allowedExtensions.includes(fileExtension) : false);
  }

  // 验证文件大小（最大10MB）
  validateFileSize(file: File): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return file.size <= maxSize;
  }

  // 提取多个文档文本内容
  async extractTextFromDocuments(files: File[]): Promise<ExtractedTextsResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });

    try {
      const response = await api.post<ExtractedTextsResponse>(
        '/documents/extract-texts',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('提取多个文档文本失败:', error);
      throw error;
    }
  }

  // 验证多个文件
  validateFiles(files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } {
    const valid: File[] = [];
    const invalid: { file: File; reason: string }[] = [];

    files.forEach(file => {
      if (!this.validateFileType(file)) {
        invalid.push({ file, reason: '不支持的文件类型' });
      } else if (!this.validateFileSize(file)) {
        invalid.push({ file, reason: '文件大小超过10MB' });
      } else {
        valid.push(file);
      }
    });

    return { valid, invalid };
  }
}

export default new DocumentService();