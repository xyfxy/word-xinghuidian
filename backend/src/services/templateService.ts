import fs from 'fs/promises';
import path from 'path';
import { DocumentTemplate } from '../types';

class TemplateService {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'data', 'templates');
    this.ensureTemplatesDir();
  }

  // 确保模板目录存在
  private async ensureTemplatesDir(): Promise<void> {
    try {
      await fs.access(this.templatesDir);
    } catch {
      await fs.mkdir(this.templatesDir, { recursive: true });
    }
  }

  // 生成唯一ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // 获取模板文件路径
  private getTemplatePath(id: string): string {
    return path.join(this.templatesDir, `${id}.json`);
  }

  // 获取所有模板
  async getAllTemplates(): Promise<DocumentTemplate[]> {
    try {
      await this.ensureTemplatesDir();
      const files = await fs.readdir(this.templatesDir);
      const templateFiles = files.filter(file => file.endsWith('.json'));
      
      const templates: DocumentTemplate[] = [];
      
      for (const file of templateFiles) {
        try {
          const filePath = path.join(this.templatesDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const template = JSON.parse(content);
          
          // 确保日期格式正确
          template.createdAt = new Date(template.createdAt);
          template.updatedAt = new Date(template.updatedAt);
          
          templates.push(template);
        } catch (error) {
          console.error(`读取模板文件 ${file} 失败:`, error);
        }
      }
      
      // 按更新时间倒序排列
      return templates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('获取模板列表失败:', error);
      return [];
    }
  }

  // 获取简化的模板列表（不包含完整content）
  async getTemplateList(page: number = 1, pageSize: number = 20): Promise<{
    templates: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      await this.ensureTemplatesDir();
      const files = await fs.readdir(this.templatesDir);
      const templateFiles = files.filter(file => file.endsWith('.json'));
      
      const templates: any[] = [];
      
      for (const file of templateFiles) {
        try {
          const filePath = path.join(this.templatesDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const template = JSON.parse(content);
          
          // 创建简化版本
          const simplifiedTemplate = {
            id: template.id,
            name: template.name,
            description: template.description,
            createdAt: new Date(template.createdAt),
            updatedAt: new Date(template.updatedAt),
            blockCount: Array.isArray(template.content) ? template.content.length : 0,
            size: stats.size,
            // 添加内容预览（前100个字符）
            contentPreview: this.generateContentPreview(template.content)
          };
          
          templates.push(simplifiedTemplate);
        } catch (error) {
          console.error(`读取模板文件 ${file} 失败:`, error);
        }
      }
      
      // 按更新时间倒序排列
      templates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      
      // 分页处理
      const total = templates.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTemplates = templates.slice(startIndex, endIndex);
      
      return {
        templates: paginatedTemplates,
        total,
        page,
        pageSize
      };
    } catch (error) {
      console.error('获取模板列表失败:', error);
      return {
        templates: [],
        total: 0,
        page,
        pageSize
      };
    }
  }

  // 生成内容预览
  private generateContentPreview(content: any[]): string {
    if (!Array.isArray(content) || content.length === 0) {
      return '';
    }
    
    let preview = '';
    for (const block of content) {
      if (block.type === 'text' && typeof block.content === 'string') {
        preview += block.content;
        if (preview.length > 100) {
          break;
        }
      }
    }
    
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  }

  // 根据ID获取模板
  async getTemplateById(id: string): Promise<DocumentTemplate | null> {
    try {
      const filePath = this.getTemplatePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const template = JSON.parse(content);
      
      // 确保日期格式正确
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);
      
      return template;
    } catch (error) {
      console.error(`获取模板 ${id} 失败:`, error);
      return null;
    }
  }

  // 保存新模板
  async saveTemplate(templateData: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    try {
      await this.ensureTemplatesDir();
      
      const now = new Date();
      const template: DocumentTemplate = {
        ...templateData,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const filePath = this.getTemplatePath(template.id);
      await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf-8');
      
      return template;
    } catch (error) {
      console.error('保存模板失败:', error);
      throw new Error('保存模板失败');
    }
  }

  // 更新模板
  async updateTemplate(id: string, updateData: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    try {
      const existingTemplate = await this.getTemplateById(id);
      if (!existingTemplate) {
        throw new Error('模板不存在');
      }

      const updatedTemplate: DocumentTemplate = {
        ...existingTemplate,
        ...updateData,
        id, // 确保ID不被修改
        createdAt: existingTemplate.createdAt, // 保持原创建时间
        updatedAt: new Date(),
      };

      const filePath = this.getTemplatePath(id);
      await fs.writeFile(filePath, JSON.stringify(updatedTemplate, null, 2), 'utf-8');
      
      return updatedTemplate;
    } catch (error) {
      console.error(`更新模板 ${id} 失败:`, error);
      throw new Error('更新模板失败');
    }
  }

  // 删除模板
  async deleteTemplate(id: string): Promise<void> {
    try {
      const filePath = this.getTemplatePath(id);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`删除模板 ${id} 失败:`, error);
      throw new Error('删除模板失败');
    }
  }

  // 复制模板
  async duplicateTemplate(id: string, newName?: string): Promise<DocumentTemplate> {
    try {
      const originalTemplate = await this.getTemplateById(id);
      if (!originalTemplate) {
        throw new Error('原模板不存在');
      }

      const duplicatedTemplate = {
        ...originalTemplate,
        name: newName || `${originalTemplate.name} - 副本`,
        description: `复制自：${originalTemplate.name}`,
      };

      // 移除ID、创建时间和更新时间，让saveTemplate重新生成
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...templateData } = duplicatedTemplate;
      
      return await this.saveTemplate(templateData);
    } catch (error) {
      console.error(`复制模板 ${id} 失败:`, error);
      throw new Error('复制模板失败');
    }
  }

  // 导入模板
  async importTemplate(templateData: any): Promise<DocumentTemplate> {
    try {
      // 验证模板数据结构
      if (!templateData.name || !templateData.format || !templateData.content) {
        throw new Error('模板数据格式不正确');
      }

      // 确保内容块有正确的结构
      if (!Array.isArray(templateData.content)) {
        throw new Error('模板内容必须是数组格式');
      }

      // 重新生成ID和时间戳
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...cleanTemplateData } = templateData;
      
      return await this.saveTemplate(cleanTemplateData);
    } catch (error) {
      console.error('导入模板失败:', error);
      throw new Error('导入模板失败');
    }
  }

  // 验证模板格式
  validateTemplate(template: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证基本字段
    if (!template.name || typeof template.name !== 'string') {
      errors.push('模板名称不能为空');
    }

    if (!template.format || typeof template.format !== 'object') {
      errors.push('模板格式不能为空');
    }

    if (!Array.isArray(template.content)) {
      errors.push('模板内容必须是数组格式');
    }

    // 验证格式字段
    if (template.format) {
      if (!template.format.font || typeof template.format.font !== 'object') {
        errors.push('字体设置不能为空');
      }

      if (!template.format.paragraph || typeof template.format.paragraph !== 'object') {
        errors.push('段落设置不能为空');
      }

      if (!template.format.page || typeof template.format.page !== 'object') {
        errors.push('页面设置不能为空');
      }
    }

    // 验证内容块
    if (Array.isArray(template.content)) {
      template.content.forEach((block: any, index: number) => {
        if (!block.id || typeof block.id !== 'string') {
          errors.push(`第${index + 1}个内容块缺少ID`);
        }

        if (!block.type || !['text', 'ai-generated'].includes(block.type)) {
          errors.push(`第${index + 1}个内容块类型无效`);
        }

        if (block.type === 'ai-generated' && (!block.aiPrompt || typeof block.aiPrompt !== 'string')) {
          errors.push(`第${index + 1}个AI内容块缺少提示词`);
        }

        if (typeof block.position !== 'number') {
          errors.push(`第${index + 1}个内容块缺少位置信息`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 获取模板统计信息
  async getTemplateStats(): Promise<{
    total: number;
    aiBlocks: number;
    textBlocks: number;
    recentlyUpdated: number;
  }> {
    try {
      const templates = await this.getAllTemplates();
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let aiBlocks = 0;
      let textBlocks = 0;
      let recentlyUpdated = 0;

      templates.forEach(template => {
        template.content.forEach(block => {
          if (block.type === 'ai-generated') {
            aiBlocks++;
          } else {
            textBlocks++;
          }
        });

        if (template.updatedAt > weekAgo) {
          recentlyUpdated++;
        }
      });

      return {
        total: templates.length,
        aiBlocks,
        textBlocks,
        recentlyUpdated,
      };
    } catch (error) {
      console.error('获取模板统计信息失败:', error);
      return {
        total: 0,
        aiBlocks: 0,
        textBlocks: 0,
        recentlyUpdated: 0,
      };
    }
  }
}

export default new TemplateService(); 