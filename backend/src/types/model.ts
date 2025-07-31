// AI模型管理相关类型定义

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'custom';
  baseUrl: string;
  apiKey: string; // 加密存储
  model: string;
  createdAt: Date;
  updatedAt: Date;
  lastTested?: Date;
  isActive: boolean;
  testStatus?: 'success' | 'failed' | 'testing';
  responseTime?: number; // 测试响应时间（毫秒）
}

export interface AIModelCreateRequest {
  name: string;
  provider: 'openai' | 'custom';
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AIModelUpdateRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string; // 如果提供则更新，否则保持原值
  model?: string;
  isActive?: boolean;
}

export interface AIModelListItem {
  id: string;
  name: string;
  provider: 'openai' | 'custom';
  baseUrl: string;
  apiKeyPreview: string; // 如：sk-1234...
  model: string;
  createdAt: Date;
  updatedAt: Date;
  lastTested?: Date;
  isActive: boolean;
  testStatus?: 'success' | 'failed' | 'testing';
  responseTime?: number;
}

export interface AIModelTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}

// 加密配置
export interface EncryptionConfig {
  algorithm: string;
  secretKey: string;
  iv: string;
}