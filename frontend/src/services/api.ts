import axios from 'axios';
import { AIGenerateRequest, AIGenerateResponse, DocumentTemplate } from '../types';
import { ParsedDocument, RecognitionRule, ContentBlockGroup } from '../types/wordImport';

interface MaxKbRequest {
  baseUrl: string;
  apiKey: string;
  messages: { role: string; content: string }[];
  model?: string;
  maxTokens?: number;
}

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 120000, // 120秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // We return the full response object now to avoid type inference issues.
    // Service methods will be responsible for accessing `response.data`.
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

// AI内容生成API
export const aiService = {

  // 使用模型管理的新生成接口
  async generateWithModel(params: {
    modelId: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<AIGenerateResponse> {
    try {
      const response = await api.post<{
        success: boolean;
        data: { content: string; model?: string; usage?: any };
      }>('/ai-gpt/generate', {
        modelId: params.modelId,
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 500,
      });
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          content: response.data.data.content,
        };
      }
      
      return {
        success: false,
        content: '',
        error: '生成失败',
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '生成失败',
      };
    }
  },

  async generateMaxKbContent(request: MaxKbRequest): Promise<AIGenerateResponse> {
    try {
      const response = await api.post<{ success: true; content: string }>('/ai-gpt/generate-maxkb', request);
      // The backend route returns { success: true, content: '...' } directly in the data
      return {
        success: true,
        content: response.data.content,
      };
    } catch (error) {
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'MaxKB内容生成失败',
      };
    }
  },

};

// 模板管理API
export const templateService = {
  // 获取模板列表
  async getTemplates(): Promise<DocumentTemplate[]> {
    try {
      const response = await api.get<{ data: DocumentTemplate[] }>('/templates');
      return response.data.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '获取模板列表失败');
    }
  },

  // 获取单个模板
  async getTemplate(id: string): Promise<DocumentTemplate> {
    try {
      const response = await api.get<{ data: DocumentTemplate }>(`/templates/${id}`);
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '获取模板详情失败');
    }
  },

  // 保存模板
  async saveTemplate(template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    try {
      const response = await api.post<{ data: DocumentTemplate }>('/templates', template);
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '保存模板失败');
    }
  },

  // 更新模板
  async updateTemplate(id: string, template: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    try {
      const response = await api.put<{ data: DocumentTemplate }>(`/templates/${id}`, template);
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '更新模板失败');
    }
  },

  // 删除模板
  async deleteTemplate(id: string): Promise<void> {
    try {
      await api.delete(`/templates/${id}`);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '删除模板失败');
    }
  },

  // 复制模板
  async duplicateTemplate(id: string, newName?: string): Promise<DocumentTemplate> {
    try {
      const response = await api.post<{ data: DocumentTemplate }>(`/templates/${id}/duplicate`, {
        name: newName
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '复制模板失败');
    }
  },
};

// 文档处理API
export const documentService = {
  // 导入Word文档
  async importDocument(file: File): Promise<DocumentTemplate> {
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await api.post<{ data: DocumentTemplate }>('/documents/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '导入文档失败');
    }
  },

  // 导出Word文档
  async exportDocument(template: DocumentTemplate): Promise<Blob> {
    try {
      const response = await api.post<Blob>('/documents/export', template, {
        responseType: 'blob',
      });
      return response.data; // For blob, the data is the blob itself
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '导出文档失败');
    }
  },

  // 预览文档
  async previewDocument(template: DocumentTemplate): Promise<string> {
    try {
      const response = await api.post<{ data: string }>('/documents/preview', template);
      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '预览文档失败');
    }
  },
};

// Word导入相关API
export const wordImportService = {
  // 解析Word文档
  async parseWordDocument(file: File, options?: { ignoreWordStyles?: boolean }): Promise<ParsedDocument> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加选项到FormData
    if (options?.ignoreWordStyles !== undefined) {
      formData.append('ignoreWordStyles', String(options.ignoreWordStyles));
    }
    
    const response = await api.post<{ success: boolean; data?: ParsedDocument; error?: string }>(
      '/word-import/parse-word',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || '解析文档失败');
  },

  // 获取识别规则
  async getRecognitionRules(): Promise<RecognitionRule[]> {
    const response = await api.get<{ success: boolean; data?: RecognitionRule[]; error?: string }>(
      '/word-import/recognition-rules'
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || '获取规则失败');
  },

  // 应用识别规则
  async applyRules(parsedDocument: ParsedDocument, rules: RecognitionRule[]): Promise<ContentBlockGroup[]> {
    const response = await api.post<{ success: boolean; data?: ContentBlockGroup[]; error?: string }>(
      '/word-import/apply-rules',
      { parsedDocument, rules }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || '应用规则失败');
  },

  // 生成模板
  async generateTemplate(
    contentGroups: ContentBlockGroup[],
    templateName: string,
    templateDescription?: string
  ): Promise<DocumentTemplate> {
    const response = await api.post<{ success: boolean; data?: DocumentTemplate; error?: string }>(
      '/word-import/generate-template',
      { contentGroups, templateName, templateDescription }
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || '生成模板失败');
  },
};

export default api; 