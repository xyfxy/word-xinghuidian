// 基础AI服务抽象类
import { AIService, GPTRequest, GPTResponse } from '../../types/ai';

export abstract class BaseAIService implements AIService {
  protected apiKey: string;
  protected baseUrl: string;
  protected model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  abstract generateContent(request: GPTRequest): Promise<GPTResponse>;
  
  abstract checkHealth(): Promise<{ status: string; message: string }>;

  // 通用工具方法
  protected validateRequest(request: GPTRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error('消息列表不能为空');
    }

    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new Error('消息格式错误：必须包含role和content');
      }
    }
  }
}