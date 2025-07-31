// AI模型管理相关类型定义

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'custom';
  baseUrl: string;
  apiKey: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  lastTested?: Date;
  isActive: boolean;
  testStatus?: 'success' | 'failed' | 'testing';
  responseTime?: number;
}

export interface AIModelListItem {
  id: string;
  name: string;
  provider: 'openai' | 'custom';
  baseUrl: string;
  apiKeyPreview: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  lastTested?: Date;
  isActive: boolean;
  testStatus?: 'success' | 'failed' | 'testing';
  responseTime?: number;
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
  apiKey?: string;
  model?: string;
  isActive?: boolean;
}

export interface AIModelTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}