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
  // 多模态支持
  capabilities?: ModelCapabilities;
  multimodalSupport?: boolean;
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
  // 多模态支持
  capabilities?: ModelCapabilities;
  multimodalSupport?: boolean;
}

export interface AIModelCreateRequest {
  name: string;
  provider: 'openai' | 'custom';
  baseUrl: string;
  apiKey: string;
  model: string;
  // 多模态支持
  capabilities?: ModelCapabilities;
  multimodalSupport?: boolean;
}

export interface AIModelUpdateRequest {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  isActive?: boolean;
  // 多模态支持
  capabilities?: ModelCapabilities;
  multimodalSupport?: boolean;
}

// 模型能力
export interface ModelCapabilities {
  textGeneration: boolean; // 文本生成
  imageAnalysis: boolean; // 图片分析
  visionUnderstanding: boolean; // 视觉理解
  documentAnalysis: boolean; // 文档分析
  maxImageSize?: number; // 最大图片尺寸（字节）
  supportedImageFormats?: string[]; // 支持的图片格式
  maxImagesPerRequest?: number; // 单次请求最大图片数量
}

// 多模态消息类型
export interface MultimodalMessage {
  role: 'user' | 'assistant' | 'system';
  content: MultimodalContent[];
}

// 多模态内容类型
export type MultimodalContent = TextContent | ImageContentData;

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageContentData {
  type: 'image_url';
  image_url: {
    url: string; // 可以是data:image/格式的base64或URL
    detail?: 'low' | 'high' | 'auto'; // 图片分析详细度
  };
}

// 多模态生成请求
export interface MultimodalGenerateRequest {
  modelId: string;
  messages: MultimodalMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// 图片分析请求
export interface ImageAnalysisRequest {
  modelId: string;
  images: string[]; // base64编码的图片数组
  prompt?: string; // 分析指令
  analysisType?: 'description' | 'ocr' | 'classification' | 'custom';
}

// 图片分析响应
export interface ImageAnalysisResponse {
  success: boolean;
  results: ImageAnalysisResult[];
  error?: string;
}

export interface ImageAnalysisResult {
  imageIndex: number;
  description?: string;
  ocrText?: string;
  classification?: string;
  confidence?: number;
  details?: any; // 其他详细信息
}

export interface AIModelTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}