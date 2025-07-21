import axios from 'axios';
import { QianwenRequest, QianwenResponse, AIGenerateRequest, AIGenerateResponse } from '../types';

class QianwenService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.QIANWEN_API_KEY || '';
    this.baseUrl = process.env.QIANWEN_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    
    if (!this.apiKey) {
      console.warn('⚠️  千问API密钥未配置，AI功能将不可用');
    }
  }

  // 检查API密钥是否配置
  private checkApiKey(): boolean {
    return !!this.apiKey;
  }

  // 调用千问API
  private async callQianwenAPI(request: QianwenRequest): Promise<QianwenResponse> {
    if (!this.checkApiKey()) {
      throw new Error('千问API密钥未配置');
    }

    try {
      const response = await axios.post(this.baseUrl, request, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 120秒超时
      });

      return response.data;
    } catch (error: any) {
      console.error('千问API调用失败:', error.response?.data || error.message);
      throw new Error(`AI服务调用失败: ${error.response?.data?.message || error.message}`);
    }
  }

  // 生成内容
  async generateContent(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    try {
      const qianwenRequest: QianwenRequest = {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的内容创作助手，能够根据用户需求生成高质量的中文内容。请确保内容准确、连贯、符合语境。'
            },
            {
              role: 'user',
              content: request.context 
                ? `参考上下文：${request.context}\n\n请根据以下要求生成内容：${request.prompt}`
                : request.prompt
            }
          ]
        },
        parameters: {
          max_tokens: request.maxLength,
          temperature: request.temperature,
          top_p: 0.8,
        }
      };

      const response = await this.callQianwenAPI(qianwenRequest);
      
      return {
        content: response.output.text.trim(),
        success: true,
      };
    } catch (error) {
      console.error('内容生成失败:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : '内容生成失败',
      };
    }
  }

  // 批量生成内容
  async batchGenerate(requests: AIGenerateRequest[]): Promise<AIGenerateResponse[]> {
    const results: AIGenerateResponse[] = [];
    
    // 串行处理，避免API并发限制
    for (const request of requests) {
      try {
        const result = await this.generateContent(request);
        results.push(result);
        
        // 添加延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          content: '',
          success: false,
          error: error instanceof Error ? error.message : '批量生成失败',
        });
      }
    }
    
    return results;
  }

  // 优化提示词
  async optimizePrompt(originalPrompt: string): Promise<string> {
    try {
      const qianwenRequest: QianwenRequest = {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的提示词优化专家。请帮助用户优化他们的提示词，使其更加清晰、具体、易于AI理解。'
            },
            {
              role: 'user',
              content: `请优化以下提示词，使其更加具体和有效：\n\n"${originalPrompt}"\n\n请直接返回优化后的提示词，不需要额外说明。`
            }
          ]
        },
        parameters: {
          max_tokens: 200,
          temperature: 0.3,
        }
      };

      const response = await this.callQianwenAPI(qianwenRequest);
      return response.output.text.trim();
    } catch (error) {
      console.error('提示词优化失败:', error);
      return originalPrompt; // 失败时返回原始提示词
    }
  }

  // 检查服务状态
  async checkHealth(): Promise<{ status: string; message: string }> {
    if (!this.checkApiKey()) {
      return {
        status: 'error',
        message: '千问API密钥未配置'
      };
    }

    try {
      // 发送一个简单的测试请求
      const testRequest: QianwenRequest = {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'user',
              content: '你好'
            }
          ]
        },
        parameters: {
          max_tokens: 10,
          temperature: 0.1,
        }
      };

      await this.callQianwenAPI(testRequest);
      
      return {
        status: 'ok',
        message: '千问AI服务正常'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '千问AI服务异常'
      };
    }
  }
}

export default new QianwenService(); 