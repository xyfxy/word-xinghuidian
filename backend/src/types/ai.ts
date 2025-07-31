// AI服务通用类型定义

// GPT通用消息格式
export interface GPTMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// GPT通用请求格式
export interface GPTRequest {
  messages: GPTMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

// GPT通用响应格式
export interface GPTResponse {
  content: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// AI模型配置
export interface AIModelConfig {
  provider: 'openai' | 'qianwen' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
  customHeaders?: Record<string, string>;
}

// AI服务接口
export interface AIService {
  generateContent(request: GPTRequest): Promise<GPTResponse>;
  checkHealth(): Promise<{ status: string; message: string }>;
}

// AI服务工厂配置
export interface AIServiceFactoryConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  customHeaders?: Record<string, string>;
}