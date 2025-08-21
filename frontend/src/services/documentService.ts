import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
      const response = await axios.post<ExtractedTextResponse>(
        `${API_BASE_URL}/documents/extract-text`,
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
      const response = await axios.post<ExtractedTextsResponse>(
        `${API_BASE_URL}/documents/extract-texts`,
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