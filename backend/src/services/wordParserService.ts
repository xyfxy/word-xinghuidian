// 基础Word文档解析服务 - 使用mammoth.js
import * as mammoth from 'mammoth';
import { JSDOM } from 'jsdom';
import { 
  ParsedDocument, 
  ParsedElement, 
  ContentBlockGroup,
  RecognitionRule
} from '../types/wordImport';
import { RuleMatcher, ContentGrouper } from './wordParserHelpers';

export class WordParserService {
  // 生成唯一ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  
  // 解析Word文档
  async parseDocument(buffer: Buffer): Promise<ParsedDocument> {
    try {
      // 使用mammoth转换Word文档
      const result = await mammoth.convertToHtml({ buffer });
      const html = result.value;
      const messages = result.messages;
      
      // 如果有警告信息，打印出来
      if (messages.length > 0) {
        console.warn('Mammoth转换警告:', messages);
      }
      
      // 解析HTML提取元素
      const elements = this.parseHtmlToElements(html);
      
      // 提取纯文本
      const textResult = await mammoth.extractRawText({ buffer });
      const rawText = textResult.value;
      
      return {
        rawText,
        html,
        elements,
        metadata: {
          createdAt: new Date()
        }
      };
    } catch (error: any) {
      throw new Error(`解析Word文档失败: ${error.message}`);
    }
  }
  
  // 解析HTML为结构化元素
  private parseHtmlToElements(html: string): ParsedElement[] {
    const elements: ParsedElement[] = [];
    
    // 在 Node 环境使用 JSDOM 解析 HTML
    const dom = new JSDOM(html);
    const { document, NodeFilter } = dom.window as any;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    
    let node = walker.nextNode() as any;
    while (node) {
      const element = node as any;
      const tagName = element.tagName.toLowerCase();
      
      // 跳过空元素
      const content = (element.textContent || '').trim();
      if (!content) continue;
      
      // 根据标签类型创建元素
      if (tagName.match(/^h[1-6]$/)) {
        // 标题
        const level = parseInt(tagName.charAt(1));
        elements.push({
          id: this.generateId(),
          type: 'heading',
          content,
          html: (element as any).outerHTML || '',
          level
        });
      } else if (tagName === 'p') {
        // 段落
        elements.push({
          id: this.generateId(),
          type: 'paragraph',
          content,
          html: (element as any).outerHTML || ''
        });
      } else if (tagName === 'ul' || tagName === 'ol') {
        // 列表
        elements.push({
          id: this.generateId(),
          type: 'list',
          content,
          html: (element as any).outerHTML || ''
        });
      } else if (tagName === 'table') {
        // 表格
        elements.push({
          id: this.generateId(),
          type: 'table',
          content,
          html: (element as any).outerHTML || ''
        });
      }
      node = walker.nextNode() as any;
    }
    
    return elements;
  }
  
  // 应用识别规则
  async applyRecognitionRules(
    parsedDoc: ParsedDocument,
    rules: RecognitionRule[]
  ): Promise<ContentBlockGroup[]> {
    const matcher = new RuleMatcher();
    const grouper = new ContentGrouper(matcher);
    
    const enabledRules = rules.filter(r => r.enabled);
    const groups = grouper.group(parsedDoc.elements, enabledRules);
    
    return groups;
  }
}

// 导出类以便其他模块使用
export { RuleMatcher, ContentGrouper } from './wordParserHelpers';