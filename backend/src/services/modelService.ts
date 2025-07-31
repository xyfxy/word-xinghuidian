import { readFile, writeFile, readdir, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import axios from 'axios';
import { 
  AIModel, 
  AIModelCreateRequest, 
  AIModelUpdateRequest, 
  AIModelListItem,
  AIModelTestResult 
} from '../types/model';

export class ModelService {
  private dataDir: string;
  private algorithm = 'aes-256-cbc';
  private secretKey: Buffer;
  private iv: Buffer;

  constructor() {
    this.dataDir = join(process.cwd(), 'data', 'models');
    
    // 从环境变量获取密钥，如果没有则生成默认值
    const secret = process.env.MODEL_ENCRYPTION_KEY || 'default-secret-key-please-change-in-production';
    this.secretKey = crypto.createHash('sha256').update(String(secret)).digest();
    this.iv = Buffer.alloc(16, 0); // 初始化向量
    
    this.ensureDataDir();
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  }

  // 加密API Key
  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // 解密API Key
  private decrypt(text: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, this.iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // 生成API Key预览（只显示前4位）
  private getApiKeyPreview(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }
    return `${apiKey.substring(0, 4)}...`;
  }

  // 获取所有模型
  async getAllModels(): Promise<AIModelListItem[]> {
    try {
      const files = await readdir(this.dataDir);
      const models: AIModelListItem[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await readFile(join(this.dataDir, file), 'utf-8');
          const model: AIModel = JSON.parse(data);
          
          // 转换日期字符串为Date对象
          model.createdAt = new Date(model.createdAt);
          model.updatedAt = new Date(model.updatedAt);
          if (model.lastTested) {
            model.lastTested = new Date(model.lastTested);
          }
          
          // 解密API Key以生成预览
          const decryptedApiKey = this.decrypt(model.apiKey);
          
          models.push({
            ...model,
            apiKeyPreview: this.getApiKeyPreview(decryptedApiKey),
            apiKey: undefined as any // 不返回加密的API Key
          });
        }
      }
      
      // 按创建时间倒序排序
      return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  // 获取单个模型（包含解密的API Key）
  async getModel(id: string): Promise<AIModel | null> {
    try {
      const filePath = join(this.dataDir, `${id}.json`);
      const data = await readFile(filePath, 'utf-8');
      const model: AIModel = JSON.parse(data);
      
      // 解密API Key
      model.apiKey = this.decrypt(model.apiKey);
      
      return model;
    } catch (error) {
      return null;
    }
  }

  // 创建模型
  async createModel(request: AIModelCreateRequest): Promise<AIModel> {
    const id = uuidv4();
    const now = new Date();
    
    const model: AIModel = {
      id,
      name: request.name,
      provider: request.provider,
      baseUrl: request.baseUrl,
      apiKey: this.encrypt(request.apiKey), // 加密存储
      model: request.model,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    
    // 保存到文件
    const filePath = join(this.dataDir, `${id}.json`);
    await writeFile(filePath, JSON.stringify(model, null, 2));
    
    // 返回时解密API Key
    model.apiKey = request.apiKey;
    
    return model;
  }

  // 更新模型
  async updateModel(id: string, request: AIModelUpdateRequest): Promise<AIModel | null> {
    const model = await this.getModel(id);
    if (!model) {
      return null;
    }
    
    // 更新字段
    if (request.name !== undefined) model.name = request.name;
    if (request.baseUrl !== undefined) model.baseUrl = request.baseUrl;
    if (request.model !== undefined) model.model = request.model;
    if (request.isActive !== undefined) model.isActive = request.isActive;
    if (request.apiKey !== undefined) {
      model.apiKey = request.apiKey; // 此时是明文
    }
    
    model.updatedAt = new Date();
    
    // 重新加密API Key并保存
    const savedModel = { ...model };
    savedModel.apiKey = this.encrypt(model.apiKey);
    
    const filePath = join(this.dataDir, `${id}.json`);
    await writeFile(filePath, JSON.stringify(savedModel, null, 2));
    
    return model;
  }

  // 删除模型
  async deleteModel(id: string): Promise<boolean> {
    try {
      const filePath = join(this.dataDir, `${id}.json`);
      await unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 测试模型连接
  async testModel(id: string): Promise<AIModelTestResult> {
    const model = await this.getModel(id);
    if (!model) {
      return {
        success: false,
        message: '模型不存在'
      };
    }
    
    const startTime = Date.now();
    
    try {
      // 构建请求URL
      let url = model.baseUrl;
      if (!url.endsWith('/')) {
        url += '/';
      }
      
      // OpenAI兼容的chat/completions接口
      if (model.provider === 'openai' || model.provider === 'custom') {
        url += 'chat/completions';
      }
      
      // 测试请求
      const response = await axios.post(
        url,
        {
          model: model.model,
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ],
          max_tokens: 10,
          temperature: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${model.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        }
      );
      
      const responseTime = Date.now() - startTime;
      
      // 更新测试状态
      await this.updateModel(id, {
        ...model,
        apiKey: model.apiKey // 保持原API Key
      });
      
      // 更新测试信息
      const savedModel = await this.getModel(id);
      if (savedModel) {
        savedModel.lastTested = new Date();
        savedModel.testStatus = 'success';
        savedModel.responseTime = responseTime;
        
        const encryptedModel = { ...savedModel };
        encryptedModel.apiKey = this.encrypt(savedModel.apiKey);
        
        const filePath = join(this.dataDir, `${id}.json`);
        await writeFile(filePath, JSON.stringify(encryptedModel, null, 2));
      }
      
      return {
        success: true,
        message: '连接测试成功',
        responseTime
      };
    } catch (error: any) {
      // 更新测试失败状态
      const savedModel = await this.getModel(id);
      if (savedModel) {
        savedModel.lastTested = new Date();
        savedModel.testStatus = 'failed';
        
        const encryptedModel = { ...savedModel };
        encryptedModel.apiKey = this.encrypt(savedModel.apiKey);
        
        const filePath = join(this.dataDir, `${id}.json`);
        await writeFile(filePath, JSON.stringify(encryptedModel, null, 2));
      }
      
      return {
        success: false,
        message: '连接测试失败',
        error: error.response?.data?.error?.message || error.message || '未知错误'
      };
    }
  }

  // 测试模型连接（不保存）
  async testModelConnection(request: AIModelCreateRequest): Promise<AIModelTestResult> {
    const startTime = Date.now();
    
    try {
      // 构建请求URL
      let url = request.baseUrl;
      if (!url.endsWith('/')) {
        url += '/';
      }
      
      // OpenAI兼容的chat/completions接口
      if (request.provider === 'openai' || request.provider === 'custom') {
        url += 'chat/completions';
      }
      
      // 测试请求
      const response = await axios.post(
        url,
        {
          model: request.model,
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ],
          max_tokens: 10,
          temperature: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${request.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10秒超时
        }
      );
      
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        message: '连接测试成功',
        responseTime
      };
    } catch (error: any) {
      return {
        success: false,
        message: '连接测试失败',
        error: error.response?.data?.error?.message || error.message || '未知错误'
      };
    }
  }
}

// 导出单例
export const modelService = new ModelService();