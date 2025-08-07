import api from './api';
import { 
  AIModelListItem, 
  AIModelCreateRequest, 
  AIModelUpdateRequest,
  AIModelTestResult,
  ModelCapabilities,
  MultimodalGenerateRequest
} from '../types/model';

export const modelService = {
  // 获取所有模型
  async getModels(): Promise<AIModelListItem[]> {
    try {
      const response = await api.get<{ success: boolean; data: AIModelListItem[] }>('/models');
      if (response.data.success) {
        // 转换日期字符串为Date对象
        return response.data.data.map(model => ({
          ...model,
          createdAt: new Date(model.createdAt),
          updatedAt: new Date(model.updatedAt),
          lastTested: model.lastTested ? new Date(model.lastTested) : undefined
        }));
      }
      throw new Error('获取模型列表失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '获取模型列表失败');
    }
  },

  // 获取单个模型详情
  async getModel(id: string): Promise<AIModelListItem> {
    try {
      const response = await api.get<{ success: boolean; data: AIModelListItem }>(`/models/${id}`);
      if (response.data.success) {
        const model = response.data.data;
        return {
          ...model,
          createdAt: new Date(model.createdAt),
          updatedAt: new Date(model.updatedAt),
          lastTested: model.lastTested ? new Date(model.lastTested) : undefined
        };
      }
      throw new Error('获取模型详情失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '获取模型详情失败');
    }
  },

  // 创建新模型
  async createModel(request: AIModelCreateRequest): Promise<AIModelListItem> {
    try {
      const response = await api.post<{ 
        success: boolean; 
        data: AIModelListItem & { testResult?: AIModelTestResult } 
      }>('/models', request);
      
      if (response.data.success) {
        const model = response.data.data;
        return {
          ...model,
          createdAt: new Date(model.createdAt),
          updatedAt: new Date(model.updatedAt),
          lastTested: model.lastTested ? new Date(model.lastTested) : undefined
        };
      }
      throw new Error('创建模型失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '创建模型失败');
    }
  },

  // 更新模型
  async updateModel(id: string, request: AIModelUpdateRequest): Promise<AIModelListItem> {
    try {
      const response = await api.put<{ success: boolean; data: AIModelListItem }>(`/models/${id}`, request);
      if (response.data.success) {
        const model = response.data.data;
        return {
          ...model,
          createdAt: new Date(model.createdAt),
          updatedAt: new Date(model.updatedAt),
          lastTested: model.lastTested ? new Date(model.lastTested) : undefined
        };
      }
      throw new Error('更新模型失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '更新模型失败');
    }
  },

  // 删除模型
  async deleteModel(id: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean }>(`/models/${id}`);
      if (!response.data.success) {
        throw new Error('删除模型失败');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '删除模型失败');
    }
  },

  // 测试模型连接
  async testModel(id: string): Promise<AIModelTestResult> {
    try {
      const response = await api.post<{ success: boolean; data: AIModelTestResult }>(`/models/${id}/test`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('测试模型失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '测试模型失败');
    }
  },

  // 测试模型连接（不保存）
  async testConnection(request: AIModelCreateRequest): Promise<AIModelTestResult> {
    try {
      const response = await api.post<{ success: boolean; data: AIModelTestResult }>('/models/test-connection', request);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('测试连接失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '测试连接失败');
    }
  },

  // 获取多模态模型列表
  async getMultimodalModels(): Promise<AIModelListItem[]> {
    try {
      const response = await api.get<{ success: boolean; data: AIModelListItem[] }>('/models/multimodal');
      if (response.data.success) {
        return response.data.data.map(model => ({
          ...model,
          createdAt: new Date(model.createdAt),
          updatedAt: new Date(model.updatedAt),
          lastTested: model.lastTested ? new Date(model.lastTested) : undefined
        }));
      }
      throw new Error('获取多模态模型列表失败');
    } catch (error: any) {
      console.error('多模态API调用详细错误:', error);
      console.error('错误响应:', error.response?.data);
      console.error('错误状态:', error.response?.status);
      
      // 如果是404，说明API不存在，降级处理
      if (error.response?.status === 404) {
        console.log('多模态API不存在，尝试降级处理...');
        throw new Error('多模态API不存在');
      }
      
      throw new Error(error.response?.data?.message || error.message || '获取多模态模型列表失败');
    }
  },

  // 多模态内容生成
  async generateMultimodalContent(request: MultimodalGenerateRequest): Promise<any> {
    try {
      const response = await api.post<{ success: boolean; data: any }>('/models/multimodal/generate', request);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('多模态内容生成失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '多模态内容生成失败');
    }
  },

  // 检测模型能力
  async detectModelCapabilities(modelId: string): Promise<ModelCapabilities> {
    try {
      const response = await api.get<{ success: boolean; data: ModelCapabilities }>(`/models/${modelId}/capabilities`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('检测模型能力失败');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '检测模型能力失败');
    }
  }
};