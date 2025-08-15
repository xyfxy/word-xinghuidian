// 千问AI服务实现（使用GPT接口标准）
import axios from 'axios';
import { BaseAIService } from './baseAIService';
import { GPTRequest, GPTResponse } from '../../types/ai';

export class QianwenAIService extends BaseAIService {
  constructor(
    apiKey: string, 
    baseUrl: string = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: string = 'qwen-turbo'
  ) {
    super(apiKey, baseUrl, model);
  }

  async generateContent(request: GPTRequest): Promise<GPTResponse> {
    this.validateRequest(request);

    try {
      // 转换为千问API格式
      const qianwenRequest = {
        model: request.model || this.model,
        input: {
          messages: request.messages,
        },
        parameters: {
          max_tokens: request.max_tokens || 500,
          temperature: request.temperature || 0.7,
          top_p: request.top_p || 0.8,
        },
      };

      const response = await axios.post(this.baseUrl, qianwenRequest, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 300000,
      });

      // 转换响应为GPT格式
      return {
        content: response.data.output.text.trim(),
        model: this.model,
        usage: {
          prompt_tokens: response.data.usage.input_tokens,
          completion_tokens: response.data.usage.output_tokens,
          total_tokens: response.data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      console.error('千问API调用失败:', error.response?.data || error.message);
      throw new Error(`AI服务调用失败: ${error.response?.data?.message || error.message}`);
    }
  }

  async checkHealth(): Promise<{ status: string; message: string }> {
    if (!this.apiKey) {
      return {
        status: 'error',
        message: '千问API密钥未配置',
      };
    }

    try {
      const testRequest: GPTRequest = {
        messages: [{ role: 'user', content: '你好' }],
        max_tokens: 10,
        temperature: 0.1,
      };

      await this.generateContent(testRequest);
      
      return {
        status: 'ok',
        message: '千问AI服务正常',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '千问AI服务异常',
      };
    }
  }
}