import fs from 'fs/promises';
import path from 'path';
import { DocumentTemplate, ContentBlock, DocumentFormat } from '../types';

class DocumentService {
  // 导入Word文档
  async importWordDocument(filePath: string): Promise<DocumentTemplate> {
    try {
      // 这里是一个简化的实现，实际项目中应该使用专门的Word解析库
      // 比如 mammoth.js 或 docx-parser
      
      // 创建基础模板结构
      const template: DocumentTemplate = {
        id: this.generateId(),
        name: '导入的文档',
        description: '从Word文档导入',
        format: this.getDefaultFormat(),
        content: [
          {
            id: this.generateId(),
            type: 'text',
            content: '这是从Word文档导入的内容，请编辑此处...',
            format: { style: 'normal' },
            position: 0,
            title: '导入内容',
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return template;
    } catch (error) {
      console.error('导入Word文档失败:', error);
      throw new Error('导入Word文档失败，请检查文件格式');
    }
  }

  // 导出为Word文档
  async exportToWord(template: DocumentTemplate): Promise<Buffer> {
    try {
      // 前端处理实际的docx生成，这里返回一个简单的占位符
      const content = `这是 '${template.name}' 的模拟Word导出.`;
      const buffer = Buffer.from(content, 'utf-8');
      return buffer;
    } catch (error) {
      console.error('导出Word文档失败:', error);
      throw new Error('导出Word文档失败');
    }
  }

  // 导出为PDF
  async exportToPDF(template: DocumentTemplate): Promise<Buffer> {
    try {
      // 实际应使用puppeteer等库从HTML生成PDF
      const htmlContent = await this.generatePreview(template);
      const buffer = Buffer.from(htmlContent, 'utf-8'); // 简化处理，实际应转为PDF
      return buffer;
    } catch (error) {
      console.error('导出PDF失败:', error);
      throw new Error('导出PDF失败');
    }
  }

  // 清理HTML格式标签，只保留文本内容和基本结构
  private stripHtmlFormatting(html: string): string {
    if (!html) return '';
    
    // 更彻底地清理HTML格式标签
    // 保留结构性标签（如p, br, h1-h6, ul, ol, li），清理所有格式标签
    let cleaned = html
      // 清理格式标签的闭合标签
      .replace(/<\/(strong|b|em|i|u|span|font|mark|del|ins|sub|sup|small|big)>/gi, '')
      // 清理格式标签的开放标签
      .replace(/<(strong|b|em|i|u|span|font|mark|del|ins|sub|sup|small|big)(\s[^>]*)?>/gi, '')
      // 清理所有内联样式属性
      .replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')
      // 清理其他常见的格式属性
      .replace(/\s*(color|font-weight|font-style|text-decoration|font-size|font-family)\s*=\s*["'][^"']*["']/gi, '')
      // 清理空的标签属性
      .replace(/<([^>]+)\s+>/gi, '<$1>')
      // 清理多余的空格
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned;
  }

  // 生成HTML预览
  async generatePreview(template: DocumentTemplate): Promise<string> {
    try {
      const sortedContent = [...template.content].sort((a, b) => a.position - b.position);
      
      const globalIndent = template.format.paragraph.indent;
      const globalFontSize = template.format.font.size;
      const firstLineIndentPx = this.convertUnitToPx(globalIndent.firstLine, globalIndent.firstLineUnit, globalFontSize);
      const leftIndentPx = this.convertUnitToPx(globalIndent.left, globalIndent.leftUnit, globalFontSize);
      const rightIndentPx = this.convertUnitToPx(globalIndent.right, globalIndent.rightUnit, globalFontSize);

      let html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.name}</title>
          <style>
            body {
              font-family: '${template.format.font.family}', serif;
              font-size: ${template.format.font.size}px;
              color: ${template.format.font.color};
              line-height: ${template.format.paragraph.lineHeight};
              margin: ${template.format.page.margins.top}px ${template.format.page.margins.right}px ${template.format.page.margins.bottom}px ${template.format.page.margins.left}px;
              max-width: ${template.format.page.width}px;
              background: white;
            }
            .content-block {
              margin-bottom: ${template.format.paragraph.paragraphSpacing}px;
              text-align: ${template.format.paragraph.alignment};
              text-indent: ${firstLineIndentPx}px;
              padding-left: ${leftIndentPx}px;
              padding-right: ${rightIndentPx}px;
            }
            .heading1 {
              font-size: ${template.format.font.size * 1.5}px;
              font-weight: bold;
              margin-bottom: ${template.format.paragraph.paragraphSpacing * 1.5}px;
            }
            .heading2 {
              font-size: ${template.format.font.size * 1.3}px;
              font-weight: bold;
              margin-bottom: ${template.format.paragraph.paragraphSpacing * 1.2}px;
            }
            .heading3 {
              font-size: ${template.format.font.size * 1.1}px;
              font-weight: bold;
              margin-bottom: ${template.format.paragraph.paragraphSpacing}px;
            }
            .quote {
              font-style: italic;
              border-left: 3px solid #ccc;
              padding-left: 15px;
              margin-left: 20px;
            }
            .ai-content {
              background-color: #f0f8ff;
              border: 1px dashed #4CAF50;
              border-radius: 4px;
              padding: 10px;
              position: relative;
            }
            .ai-content::before {
              content: 'AI生成内容';
              position: absolute;
              top: -10px;
              left: 10px;
              background: #4CAF50;
              color: white;
              padding: 2px 8px;
              font-size: 10px;
              border-radius: 3px;
            }
            .text-content {
              background-color: #f9f9f9;
              border: 1px dashed #2196F3;
              border-radius: 4px;
              padding: 10px;
              position: relative;
            }
            .text-content::before {
              content: '固定内容';
              position: absolute;
              top: -10px;
              left: 10px;
              background: #2196F3;
              color: white;
              padding: 2px 8px;
              font-size: 10px;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <h1>${template.name}</h1>
      `;

      sortedContent.forEach(block => {
        const blockClass = `content-block ${block.format.style || 'normal'}`;
        const containerClass = block.type === 'ai-generated' ? 'ai-content' : 'text-content';
        const inlineStyles = this.getBlockStyles(block, template.format);
        
        // 根据是否使用全局格式来决定是否清理HTML格式
        const shouldUseGlobal = block.format?.useGlobalFormat !== false;
        const displayContent = shouldUseGlobal 
          ? this.stripHtmlFormatting(block.content || '')
          : (block.content || '');
        
        html += `
          <div class="${containerClass}">
            <div class="${blockClass}" style="${inlineStyles}">
              ${displayContent}
            </div>
          </div>
        `;
      });

      html += `
        </body>
        </html>
      `;

      return html;
    } catch (error) {
      console.error('生成预览失败:', error);
      throw new Error('生成预览失败');
    }
  }

  // 单位转换辅助函数 (pt, cm to px)
  private convertUnitToPx(value: number, unit: 'pt' | 'cm' | 'px' | 'char' | undefined, fontSize = 16): number {
    if (value === 0) return 0;
    
    switch (unit) {
      case 'pt':
        return value * (96 / 72); // 1pt = 1/72 inch
      case 'cm':
        return value * (96 / 2.54); // 1cm = 96/2.54 px
      case 'char':
        // 中文字符宽度约等于字体大小，使用 1:1 换算为 pt，再转 px
        return value * fontSize * (96 / 72);
      case 'px':
      default:
        return value;
    }
  }

  // 获取块的行内样式
  private getBlockStyles(block: ContentBlock, defaultFormat: DocumentFormat): string {
    const shouldUseGlobal = block.format?.useGlobalFormat !== false;

    const fontSettings = shouldUseGlobal
      ? defaultFormat.font
      : { ...defaultFormat.font, ...block.format.font };

    const paragraphSettings = shouldUseGlobal
      ? defaultFormat.paragraph
      : {
        ...defaultFormat.paragraph,
        ...block.format.paragraph,
        indent: {
          ...defaultFormat.paragraph.indent,
          ...block.format.paragraph?.indent
        }
      };
      
    let styles = '';
    if (!shouldUseGlobal) {
      styles += `font-family: '${fontSettings.family}', serif;`;
      styles += `font-size: ${fontSettings.size}px;`;
      styles += `color: ${fontSettings.color};`;
      styles += `font-weight: ${fontSettings.bold ? 'bold' : 'normal'};`;
      styles += `font-style: ${fontSettings.italic ? 'italic' : 'normal'};`;
      styles += `text-decoration: ${fontSettings.underline ? 'underline' : 'none'};`;
      styles += `line-height: ${paragraphSettings.lineHeight};`;
      styles += `text-align: ${paragraphSettings.alignment};`;
      styles += `margin-bottom: ${paragraphSettings.paragraphSpacing}px;`;
      
      const indent = paragraphSettings.indent;
      styles += `text-indent: ${this.convertUnitToPx(indent.firstLine, indent.firstLineUnit, fontSettings.size)}px;`;
      styles += `padding-left: ${this.convertUnitToPx(indent.left, indent.leftUnit, fontSettings.size)}px;`;
      styles += `padding-right: ${this.convertUnitToPx(indent.right, indent.rightUnit, fontSettings.size)}px;`;
    }
    
    return styles;
  }

  // 验证文档
  async validateDocument(template: DocumentTemplate): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 验证基本信息
    if (!template.name || template.name.trim().length === 0) {
      errors.push('文档名称不能为空');
    }

    if (!template.content || template.content.length === 0) {
      errors.push('文档内容不能为空');
    }

    // 验证内容块
    if (template.content) {
      template.content.forEach((block, index) => {
        if (!block.id) {
          errors.push(`第${index + 1}个内容块缺少ID`);
        }

        if (!block.type || !['text', 'ai-generated'].includes(block.type)) {
          errors.push(`第${index + 1}个内容块类型无效`);
        }

        if (block.type === 'ai-generated' && (!block.aiPrompt || block.aiPrompt.trim().length === 0)) {
          errors.push(`第${index + 1}个AI内容块缺少提示词`);
        }

        if (typeof block.position !== 'number') {
          errors.push(`第${index + 1}个内容块位置信息无效`);
        }
      });
    }

    // 验证格式设置
    if (!template.format) {
      errors.push('文档格式设置不能为空');
    } else {
      if (!template.format.font) {
        errors.push('字体设置不能为空');
      }

      if (!template.format.paragraph) {
        errors.push('段落设置不能为空');
      }

      if (!template.format.page) {
        errors.push('页面设置不能为空');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 清理临时文件
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`清理文件 ${filePath} 失败:`, error);
    }
  }

  // 生成唯一ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // 获取默认格式设置
  private getDefaultFormat(): DocumentFormat {
    return {
      font: {
        family: 'Microsoft YaHei',
        size: 16,
        color: '#333333',
        bold: false,
        italic: false,
        underline: false,
      },
      paragraph: {
        lineHeight: 1.5,
        paragraphSpacing: 0,
        spaceBefore: 0,
        indent: {
          firstLine: 0,
          firstLineUnit: 'pt',
          left: 0,
          leftUnit: 'pt',
          right: 0,
          rightUnit: 'pt',
        },
        alignment: 'left',
      },
      page: {
        width: 595,
        height: 842,
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72,
        },
        orientation: 'portrait',
      },
    };
  }
}

export default new DocumentService(); 