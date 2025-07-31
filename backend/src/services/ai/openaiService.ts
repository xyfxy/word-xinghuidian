// OpenAI服务实现
import axios from 'axios';
import { BaseAIService } from './baseAIService';
import { GPTRequest, GPTResponse } from '../../types/ai';

export class OpenAIService extends BaseAIService {
  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1', model: string = 'gpt-3.5-turbo') {
    super(apiKey, baseUrl, model);
  }

  async generateContent(request: GPTRequest): Promise<GPTResponse> {
    this.validateRequest(request);

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: request.model || this.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 500,
          top_p: request.top_p || 1,
          stream: false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        }
      );

      const choice = response.data.choices[0];
      return {
        content: choice.message.content.trim(),
        model: response.data.model,
        usage: response.data.usage,
      };
    } catch (error: any) {
      console.error('OpenAI API调用失败:', error.response?.data || error.message);
      throw new Error(`AI服务调用失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const testRequest: GPTRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
        temperature: 0,
      };

      await this.generateContent(testRequest);
      
      return {
        status: 'ok',
        message: 'OpenAI服务正常',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'OpenAI服务异常',
      };
    }
  }
}