// 自定义GPT服务实现（支持任何兼容OpenAI API的服务）
import axios from 'axios';
import { BaseAIService } from './baseAIService';
import { GPTRequest, GPTResponse } from '../../types/ai';

export class CustomGPTService extends BaseAIService {
  private customHeaders: Record<string, string>;

  constructor(
    apiKey: string,
    baseUrl: string,
    model: string,
    customHeaders: Record<string, string> = {}
  ) {
    super(apiKey, baseUrl, model);
    this.customHeaders = customHeaders;
  }

  async generateContent(request: GPTRequest): Promise<GPTResponse> {
    this.validateRequest(request);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.customHeaders,
      };

      // 如果有API Key，添加Authorization头
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // 构建完整的URL
      let url = this.baseUrl;
      if (!url.endsWith('/')) {
        url += '/';
      }
      // 如果baseUrl已经包含了/chat/completions，就不要重复添加
      if (!url.includes('/chat/completions')) {
        url += 'chat/completions';
      }

      console.log('CustomGPT请求URL:', url);
      console.log('CustomGPT请求模型:', request.model || this.model);

      const response = await axios.post(
        url,
        {
          model: request.model || this.model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 500,
          top_p: request.top_p || 1,
          stream: false,
        },
        {
          headers,
          timeout: 300000,
        }
      );

      // 尝试兼容不同的响应格式
      const content = response.data.choices?.[0]?.message?.content || 
                     response.data.output?.text ||
                     response.data.content ||
                     '';

      return {
        content: content.trim(),
        model: response.data.model || this.model,
        usage: response.data.usage,
      };
    } catch (error: any) {
      console.error('自定义GPT API调用失败:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
      
      // 根据不同的错误状态码提供更友好的错误信息
      let errorMessage = 'AI服务调用失败';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'API Key无效或未授权';
            break;
          case 403:
            errorMessage = '没有权限访问该API';
            break;
          case 404:
            errorMessage = 'API地址不存在，请检查URL是否正确';
            break;
          case 429:
            errorMessage = '请求频率超限，请稍后重试';
            break;
          case 500:
            errorMessage = 'AI服务内部错误';
            break;
          case 502:
            errorMessage = 'API网关错误，请检查API地址是否正确';
            break;
          case 503:
            errorMessage = 'AI服务暂时不可用';
            break;
          default:
            errorMessage = `AI服务错误 (${error.response.status})`;
        }
        
        // 如果有详细错误信息，附加上去
        if (error.response.data?.error?.message) {
          errorMessage += `: ${error.response.data.error.message}`;
        } else if (error.response.data?.message) {
          errorMessage += `: ${error.response.data.message}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'AI服务请求超时';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = '无法访问API地址，请检查网络连接';
      }
      
      throw new Error(errorMessage);
    }
  }

  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const testRequest: GPTRequest = {
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
        temperature: 0,
      };

      await this.generateContent(testRequest);
      
      return {
        status: 'ok',
        message: '自定义GPT服务正常',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '自定义GPT服务异常',
      };
    }
  }
}