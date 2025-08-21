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
  AIModelTestResult,
  MultimodalGenerateRequest,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  MultimodalMessage,
  ModelCapabilities
} from '../types/model';

export class ModelService {
  private dataDir: string;
  private algorithm = 'aes-256-cbc';
  private secretKey: Buffer;
  private iv: Buffer;

  constructor() {
    this.dataDir = join(__dirname, '../../data', 'models');
    
    // 从环境变量获取密钥，如果没有则使用默认值666888
    const secret = process.env.MODEL_ENCRYPTION_KEY || '666888';
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
          
          const { apiKey, ...modelWithoutKey } = model;
          
          // 如果模型没有多模态字段，自动检测并添加
          if (modelWithoutKey.multimodalSupport === undefined) {
            const capabilities = await this.detectModelCapabilities(model.id);
            modelWithoutKey.multimodalSupport = capabilities?.imageAnalysis || false;
            modelWithoutKey.capabilities = capabilities || undefined;
          }
          
          models.push({
            ...modelWithoutKey,
            apiKeyPreview: this.getApiKeyPreview(decryptedApiKey)
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
      isActive: true,
      multimodalSupport: request.multimodalSupport || false,
      capabilities: request.capabilities
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
    if (request.multimodalSupport !== undefined) model.multimodalSupport = request.multimodalSupport;
    if (request.capabilities !== undefined) model.capabilities = request.capabilities;
    
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

  // 多模态内容生成
  async generateMultimodalContent(request: MultimodalGenerateRequest): Promise<any> {
    const model = await this.getModel(request.modelId);
    if (!model) {
      throw new Error('模型不存在');
    }

    if (!model.multimodalSupport) {
      throw new Error('该模型不支持多模态功能');
    }

    try {
      let url = model.baseUrl;
      if (!url.endsWith('/')) {
        url += '/';
      }
      
      // OpenAI兼容的chat/completions接口
      if (model.provider === 'openai' || model.provider === 'custom') {
        url += 'chat/completions';
      }

      const requestData = {
        model: model.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 3000,
        stream: request.stream || false
      };

      console.log('🚀 发送多模态请求到:', url);
      console.log('🔑 模型:', model.model);

      const response = await axios.post(
        url,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${model.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30秒超时，多模态处理需要更长时间
        }
      );

      console.log('📥 AI响应状态:', response.data.choices[0].finish_reason);

      const message = response.data.choices[0].message;
      let content = message.content;

      // 处理Gemini 2.5 Pro的reasoning字段
      if (!content && message.reasoning) {
        console.log('🧠 检测到reasoning字段，使用reasoning作为内容');
        content = message.reasoning;
      }

      // 如果还是没有内容，尝试从reasoning_details获取
      if (!content && message.reasoning_details && message.reasoning_details.length > 0) {
        console.log('🔍 从reasoning_details提取内容');
        content = message.reasoning_details[0].text;
      }

      console.log('✅ 最终提取的内容:', content?.substring(0, 100) + '...');

      return {
        success: true,
        content: content || '模型未返回内容',
        usage: response.data.usage
      };
    } catch (error: any) {
      console.error('多模态内容生成失败:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || '未知错误'
      };
    }
  }

  // 图片分析
  async analyzeImages(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    const model = await this.getModel(request.modelId);
    if (!model) {
      return {
        success: false,
        results: [],
        error: '模型不存在'
      };
    }

    if (!model.capabilities?.imageAnalysis) {
      return {
        success: false,
        results: [],
        error: '该模型不支持图片分析功能'
      };
    }

    try {
      console.log(`🖼️ 开始并行分析 ${request.images.length} 张图片`);
      
      // 并行处理所有图片
      const analysisPromises = request.images.map(async (imageBase64, i) => {
        try {
          // 构建多模态消息
          const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
          const prompt = request.prompt || this.getDefaultAnalysisPrompt(request.analysisType || 'description');
          
          console.log(`🖼️ 开始分析第 ${i + 1} 张图片`);
          
          const messages: MultimodalMessage[] = [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl,
                    detail: 'high'
                  }
                }
              ]
            }
          ];

          const generateRequest: MultimodalGenerateRequest = {
            modelId: request.modelId,
            messages,
            temperature: 0.3,
            maxTokens: 20000  // 大幅增加token限制
          };

          const response = await this.generateMultimodalContent(generateRequest);
          
          console.log(`✅ 第 ${i + 1} 张图片分析完成`);
          
          if (response.success) {
            return {
              imageIndex: i,
              description: response.content,
              confidence: 0.9 // 暂时固定值，实际应该从模型返回
            };
          } else {
            return {
              imageIndex: i,
              description: `分析失败: ${response.error}`,
              confidence: 0
            };
          }
        } catch (error) {
          console.error(`❌ 第 ${i + 1} 张图片分析出错:`, error);
          return {
            imageIndex: i,
            description: `分析出错: ${error instanceof Error ? error.message : '未知错误'}`,
            confidence: 0
          };
        }
      });

      // 等待所有图片分析完成
      const results = await Promise.all(analysisPromises);
      console.log(`🎉 所有 ${results.length} 张图片分析完成`);

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('图片分析失败:', error);
      return {
        success: false,
        results: [],
        error: error.message || '未知错误'
      };
    }
  }

  // 获取默认分析提示词
  private getDefaultAnalysisPrompt(analysisType: string): string {
    switch (analysisType) {
      case 'description':
        return '描述这张图片，包括主要内容、物体、场景和颜色。用中文回答，限制在200字以内。';
      case 'ocr':
        return '识别图片中的文字内容。';
      case 'classification':
        return '对这张图片进行分类。';
      case 'outline':
        return '多模态提取要点，保持原顺序，禁止扩写，输出讨论大纲。请严格按照图片中显示的顺序提取文字内容，不得添加任何解释或补充，直接输出结构化的讨论大纲。用中文回答。';
      case 'custom':
        return '请描述这张图片的内容。用中文回答，简洁明了。';
      default:
        return '请描述这张图片。';
    }
  }

  // 获取多模态模型列表
  async getMultimodalModels(): Promise<AIModelListItem[]> {
    const allModels = await this.getAllModels();
    console.log('所有模型:', allModels.map(m => ({ 
      id: m.id, 
      name: m.name, 
      model: m.model, 
      multimodalSupport: m.multimodalSupport,
      capabilities: m.capabilities 
    })));
    
    const multimodalModels = allModels.filter(model => model.multimodalSupport);
    console.log('多模态模型:', multimodalModels.map(m => ({ 
      id: m.id, 
      name: m.name, 
      model: m.model 
    })));
    
    return multimodalModels;
  }

  // 检测模型能力
  async detectModelCapabilities(modelId: string): Promise<ModelCapabilities | null> {
    const model = await this.getModel(modelId);
    if (!model) {
      return null;
    }

    // 根据模型名称推断能力（简化版本）
    const modelName = model.model.toLowerCase();
    const capabilities: ModelCapabilities = {
      textGeneration: true, // 默认都支持文本生成
      imageAnalysis: false,
      visionUnderstanding: false,
      documentAnalysis: false,
      maxImageSize: 5 * 1024 * 1024, // 5MB
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxImagesPerRequest: 4
    };

    // 根据常见的多模态模型名称判断
    if (modelName.includes('vision') || 
        modelName.includes('gpt-4v') || 
        modelName.includes('gpt-4-vision') ||
        modelName.includes('gpt-4o') ||
        modelName.includes('claude-3') ||
        modelName.includes('gemini') ||
        modelName.includes('qwen-vl') ||
        modelName.includes('moonshot-v1-vision') ||  // 只有vision版本支持
        modelName.includes('glm-4v') ||
        modelName.includes('yi-vision')) {
      capabilities.imageAnalysis = true;
      capabilities.visionUnderstanding = true;
      capabilities.documentAnalysis = true;
    }

    return capabilities;
  }
}

// 导出单例
export const modelService = new ModelService();