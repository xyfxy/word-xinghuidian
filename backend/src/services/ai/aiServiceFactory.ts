// AI服务工厂
import { AIService, AIServiceFactoryConfig } from '../../types/ai';
import { OpenAIService } from './openaiService';
import { CustomGPTService } from './customGPTService';

export class AIServiceFactory {
  private static instances: Map<string, AIService> = new Map();

  static createService(config: AIServiceFactoryConfig): AIService {
    const key = `${config.provider}-${config.apiKey}-${config.baseUrl || 'default'}`;
    
    // 如果已经存在相同配置的实例，直接返回
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let service: AIService;

    switch (config.provider.toLowerCase()) {
      case 'openai':
        service = new OpenAIService(
          config.apiKey,
          config.baseUrl || 'https://api.openai.com/v1',
          config.model || 'gpt-3.5-turbo'
        );
        break;
      
      
      case 'custom':
        if (!config.baseUrl) {
          throw new Error('自定义GPT服务必须提供baseUrl');
        }
        service = new CustomGPTService(
          config.apiKey,
          config.baseUrl,
          config.model || 'gpt-3.5-turbo',
          config.customHeaders
        );
        break;
      
      default:
        throw new Error(`不支持的AI服务提供商: ${config.provider}`);
    }

    this.instances.set(key, service);
    return service;
  }

  // 清除缓存的实例
  static clearInstances(): void {
    this.instances.clear();
  }

  // 获取默认服务（从环境变量读取）
  static getDefaultService(): AIService {
    throw new Error('请使用模型管理系统配置AI服务，或使用MaxKB');
  }
}