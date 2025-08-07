import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { AIModel, ModelCapabilities } from '../types/model';

// 检测模型能力的函数
function detectModelCapabilities(modelName: string): ModelCapabilities {
  const lowerName = modelName.toLowerCase();
  const capabilities: ModelCapabilities = {
    textGeneration: true,
    imageAnalysis: false,
    visionUnderstanding: false,
    documentAnalysis: false,
    maxImageSize: 5 * 1024 * 1024,
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxImagesPerRequest: 4
  };

  // 根据常见的多模态模型名称判断
  if (lowerName.includes('vision') || 
      lowerName.includes('gpt-4v') || 
      lowerName.includes('gpt-4-vision') ||
      lowerName.includes('gpt-4o') ||
      lowerName.includes('claude-3') ||
      lowerName.includes('gemini') ||
      lowerName.includes('qwen-vl') ||
      lowerName.includes('moonshot') ||
      lowerName.includes('kimi')) {
    capabilities.imageAnalysis = true;
    capabilities.visionUnderstanding = true;
    capabilities.documentAnalysis = true;
  }

  return capabilities;
}

async function updateModels() {
  const dataDir = join(process.cwd(), 'data', 'models');
  
  try {
    const files = await readdir(dataDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(dataDir, file);
        const data = await readFile(filePath, 'utf-8');
        const model: AIModel = JSON.parse(data);
        
        // 如果模型没有多模态字段，添加它们
        if (model.multimodalSupport === undefined) {
          const capabilities = detectModelCapabilities(model.model);
          model.multimodalSupport = capabilities.imageAnalysis;
          model.capabilities = capabilities;
          
          // 更新时间
          model.updatedAt = new Date();
          
          // 保存更新后的模型
          await writeFile(filePath, JSON.stringify(model, null, 2));
          
          console.log(`已更新模型: ${model.name} (${model.model}) - 多模态支持: ${model.multimodalSupport}`);
        }
      }
    }
    
    console.log('所有模型更新完成！');
  } catch (error) {
    console.error('更新模型失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateModels();
}

export { updateModels };