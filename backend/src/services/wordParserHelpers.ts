// Word文档解析辅助类
import { 
  ParsedElement, 
  ContentBlockGroup,
  RecognitionRule
} from '../types/wordImport';

// 规则匹配器类
export class RuleMatcher {
  match(element: ParsedElement, rule: RecognitionRule): boolean {
    // 调试特定元素
    if (element.content.includes('二、') || element.content.includes('调研流程')) {
      console.log(`  尝试规则 "${rule.name}" (类型: ${rule.type})`);
    }
    
    switch (rule.type) {
      case 'heading':
        return this.matchHeading(element, rule);
      case 'paragraph':
        return this.matchParagraph(element, rule);
      case 'custom':
        return this.matchCustom(element, rule);
      case 'heading-pattern':
        return this.matchHeadingPattern(element, rule);
      // 移除未定义的规则类型，避免类型不匹配
      default:
        return false;
    }
  }
  
  private matchHeading(element: ParsedElement, rule: RecognitionRule): boolean {
    if (element.type !== 'heading') return false;
    
    const config = rule.config;
    
    // 检查标题级别
    if (config.headingLevel && !config.headingLevel.includes(element.level!)) {
      return false;
    }
    
    // 检查标题模式
    if (config.headingPattern) {
      const regex = new RegExp(config.headingPattern);
      return regex.test(element.content);
    }
    
    return true;
  }
  
  private matchParagraph(element: ParsedElement, rule: RecognitionRule): boolean {
    if (element.type !== 'paragraph') return false;
    
    const config = rule.config;
    
    // 检查最小长度
    if (config.minLength && element.content.length < config.minLength) {
      return false;
    }
    
    return true;
  }
  
  private matchCustom(element: ParsedElement, rule: RecognitionRule): boolean {
    const config = rule.config;
    
    // 检查内容模式
    if (config.contentPatterns) {
      return config.contentPatterns.some(pattern => 
        element.content.includes(pattern)
      );
    }
    
    return false;
  }
  
  private matchHeadingPattern(element: ParsedElement, rule: RecognitionRule): boolean {
    const config = rule.config;
    
    // 只匹配段落类型的元素（因为这些是通过内容模式识别的）
    if (element.type !== 'paragraph') return false;
    
    // 检查内容是否匹配指定的模式
    if (config.pattern) {
      const regex = new RegExp(config.pattern);
      const isMatch = regex.test(element.content);
      
      // 如果规则配置中要求加粗，则检查是否加粗
      if (config.requireBold !== undefined && isMatch) {
        const isBold = element.style?.bold === true;
        
        // 调试日志
        if (element.content.includes('一、') || element.content.includes('二、') || element.content.includes('三、')) {
          console.log(`匹配规则 ${rule.name}:`);
          console.log(`  - 元素内容: "${element.content}"`);
          console.log(`  - 正则匹配: ${isMatch}`);
          console.log(`  - 是否加粗: ${isBold}`);
          console.log(`  - 要求加粗: ${config.requireBold}`);
          console.log(`  - 最终匹配: ${config.requireBold ? (isMatch && isBold) : isMatch}`);
        }
        
        // 如果要求加粗但元素不是加粗的，则不匹配
        if (config.requireBold && !isBold) {
          return false;
        }
      }
      
      // 调试日志
      if (element.content.includes('二、') || element.content.includes('调研流程')) {
        console.log(`匹配标题模式规则 ${rule.name}:`);
        console.log(`  - 元素内容: "${element.content}"`);
        console.log(`  - 正则表达式: ${config.pattern}`);
        console.log(`  - 匹配结果: ${isMatch}`);
      }
      
      return isMatch;
    }
    
    return false;
  }
}

// 内容分组器类
export class ContentGrouper {
  private matcher: RuleMatcher;
  
  constructor(matcher: RuleMatcher) {
    this.matcher = matcher;
  }
  
  group(
    elements: ParsedElement[], 
    rules: RecognitionRule[]
  ): ContentBlockGroup[] {
    const groups: ContentBlockGroup[] = [];
    const sortedRules = rules
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    // 检查是否有合并相同样式规则
    const hasMergeSameStyleRule = sortedRules.some(r => 
      r.config.grouping === 'merge-same-style'
    );
    
    // 如果启用了合并相同样式规则，使用特殊的分组逻辑
    if (hasMergeSameStyleRule) {
      return this.groupBySameStyle(elements);
    }
    
    // 如果没有启用的规则，使用默认的单段落分组
    if (sortedRules.length === 0) {
      return elements.map(element => ({
        id: this.generateId(),
        elements: [element],
        suggestedType: 'text',
        suggestedTitle: this.generateTitle(element)
      }));
    }
    
    let i = 0;
    while (i < elements.length) {
      let matched = false;
      
      // 尝试每个规则
      for (const rule of sortedRules) {
        if (this.matcher.match(elements[i], rule)) {
          
          // 如果是heading-pattern规则，需要特殊处理
          if (rule.type === 'heading-pattern') {
            // 将段落转换为标题，保留所有原有属性（包括样式）
            const convertedElement: ParsedElement = {
              ...elements[i], // 保留所有原有属性
              type: 'heading' as const, // 只改变类型
              level: rule.config.level || 1 // 设置标题级别
            };
            // 确保样式被保留
            if (elements[i].style) {
              convertedElement.style = { ...elements[i].style };
            }
            elements[i] = convertedElement;
          }
          
          // 特殊处理 heading-then-content 策略
          if (rule.config.grouping === 'heading-then-content') {
            // 1. 创建标题组
            const headingGroup: ContentBlockGroup = {
              id: this.generateId(),
              elements: [elements[i]],
              suggestedType: 'text',
              suggestedTitle: this.generateTitle(elements[i]),
              matchedRule: rule.id
            };
            groups.push(headingGroup);
            
            // 2. 收集后续内容
            const contentElements: ParsedElement[] = [];
            let j = i + 1;
            
            // 先处理后续元素，看是否有heading-pattern规则可以应用
            while (j < elements.length) {
              let elementProcessed = false;
              
              // 检查是否有heading-pattern规则可以将这个段落转换为标题
              for (const checkRule of sortedRules) {
                if (checkRule.type === 'heading-pattern' && elements[j].type === 'paragraph') {
                  if (this.matcher.match(elements[j], checkRule)) {
                    // 转换为标题
                    elements[j] = {
                      ...elements[j],
                      type: 'heading' as const,
                      level: checkRule.config.level || 1
                    };
                    elementProcessed = true;
                    break;
                  }
                }
              }
              
              // 遇到新标题则停止
              if (elements[j].type === 'heading') break;
              
              contentElements.push(elements[j]);
              j++;
            }
            
            // 3. 如果有内容，创建内容组
            if (contentElements.length > 0) {
              const contentGroup: ContentBlockGroup = {
                id: this.generateId(),
                elements: contentElements,
                suggestedType: 'text',
                suggestedTitle: '内容',
                matchedRule: rule.id
              };
              groups.push(contentGroup);
            }
            
            i = j; // 更新索引
            matched = true;
          } else {
            // 其他策略使用原有逻辑
            // 对于grouping为'single'的规则，只取当前元素
            if (rule.config.grouping === 'single') {
              const group: ContentBlockGroup = {
                id: this.generateId(),
                elements: [elements[i]],
                suggestedType: rule.config.autoConvertToAI ? 'ai-generated' : 'text',
                suggestedTitle: this.generateTitle(elements[i]),
                matchedRule: rule.id
              };
              groups.push(group);
              i++;
            } else {
              const group = this.createGroup(elements, i, rule);
              groups.push(group);
              i += group.elements.length;
            }
            matched = true;
          }
          break;
        }
      }
      
      // 默认处理：单个段落为一组
      if (!matched) {
        groups.push({
          id: this.generateId(),
          elements: [elements[i]],
          suggestedType: 'text',
          suggestedTitle: this.generateTitle(elements[i])
        });
        i++;
      }
    }
    
    return groups;
  }
  
  private createGroup(
    elements: ParsedElement[], 
    startIndex: number, 
    rule: RecognitionRule
  ): ContentBlockGroup {
    const config = rule.config;
    const groupElements: ParsedElement[] = [elements[startIndex]];
    
    if (config.grouping === 'with-content') {
      // 收集后续内容
      let i = startIndex + 1;
      while (
        i < elements.length && 
        groupElements.length < (config.maxParagraphs || 10)
      ) {
        // 遇到新标题则停止
        if (elements[i].type === 'heading') break;
        groupElements.push(elements[i]);
        i++;
      }
    } else if (config.grouping === 'until-next') {
      // 收集直到下一个同级标题
      const currentLevel = elements[startIndex].level;
      let i = startIndex + 1;
      while (i < elements.length) {
        if (
          elements[i].type === 'heading' && 
          elements[i].level! <= currentLevel!
        ) {
          break;
        }
        groupElements.push(elements[i]);
        i++;
      }
    }
    
    return {
      id: this.generateId(),
      elements: groupElements,
      suggestedType: config.autoConvertToAI ? 'ai-generated' : 'text',
      suggestedTitle: this.generateGroupTitle(groupElements, rule),
      matchedRule: rule.id
    };
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
  
  private generateTitle(element: ParsedElement): string {
    // 如果是标题，直接使用标题内容
    if (element.type === 'heading') {
      return element.content;
    }
    
    // 如果是图片，不添加任何标题
    if (element.type === 'image') {
      return '';
    }
    
    // 对于段落，截取前20个字符作为标题
    const title = element.content.substring(0, 20);
    return title.length < element.content.length ? title + '...' : title;
  }
  
  private generateGroupTitle(elements: ParsedElement[], rule: RecognitionRule): string {
    // 如果第一个元素是标题，使用标题
    if (elements[0].type === 'heading') {
      return elements[0].content;
    }
    
    // 如果第一个元素是图片，不添加标题
    if (elements[0].type === 'image') {
      return '';
    }
    
    // 如果匹配了AI占位符规则，使用规则名称
    if (rule.type === 'custom' && rule.config.autoConvertToAI) {
      return rule.name;
    }
    
    // 否则使用第一个元素的前20个字符
    const firstElement = elements[0];
    const title = firstElement.content.substring(0, 20);
    return title.length < firstElement.content.length ? title + '...' : title;
  }
  
  // 根据相同样式分组的方法
  private groupBySameStyle(elements: ParsedElement[]): ContentBlockGroup[] {
    const groups: ContentBlockGroup[] = [];
    
    if (elements.length === 0) return groups;
    
    let currentGroup: ParsedElement[] = [elements[0]];
    let currentStyle = this.getElementStyle(elements[0]);
    
    for (let i = 1; i < elements.length; i++) {
      const element = elements[i];
      const elementStyle = this.getElementStyle(element);
      
      // 比较样式是否相同
      const isSame = this.isSameStyle(currentStyle, elementStyle);
      
      if (isSame) {
        // 样式相同，添加到当前组
        currentGroup.push(element);
      } else {
        // 样式不同，创建新组
        groups.push({
          id: this.generateId(),
          elements: currentGroup,
          suggestedType: this.getSuggestedType(currentGroup),
          suggestedTitle: this.generateTitle(currentGroup[0]),
          matchedRule: 'rule-merge-same-style'
        });
        
        // 开始新组
        currentGroup = [element];
        currentStyle = elementStyle;
      }
    }
    
    // 处理最后一组
    if (currentGroup.length > 0) {
      groups.push({
        id: this.generateId(),
        elements: currentGroup,
        suggestedType: this.getSuggestedType(currentGroup),
        suggestedTitle: this.generateTitle(currentGroup[0]),
        matchedRule: 'rule-merge-same-style'
      });
    }
    
    return groups;
  }
  
  // 获取元素的样式信息（用于比较）
  private getElementStyle(element: ParsedElement): any {
    if (!element.style) return {};
    
    // 提取段落级别的样式属性
    return {
      fontSize: element.style.fontSize,
      fontFamily: element.style.fontFamily,
      color: element.style.color,
      alignment: element.style.alignment,
      lineHeight: element.style.lineHeight,
      textIndent: element.style.textIndent,
      leftIndent: element.style.leftIndent,
      rightIndent: element.style.rightIndent,
      spaceBefore: element.style.spaceBefore,
      spaceAfter: element.style.spaceAfter,
      // 不比较 bold、italic、underline 等行内样式
    };
  }
  
  // 比较两个样式是否相同
  private isSameStyle(style1: any, style2: any): boolean {
    // 比较所有段落级别的样式属性
    const keys = ['fontSize', 'fontFamily', 'color', 'alignment', 'lineHeight', 
                  'textIndent', 'leftIndent', 'rightIndent', 'spaceBefore', 'spaceAfter'];
    
    for (const key of keys) {
      const val1 = style1[key];
      const val2 = style2[key];
      
      // 处理 undefined 和 null 的情况
      if (val1 === undefined && val2 === undefined) continue;
      if (val1 === null && val2 === null) continue;
      
      // 处理默认值的情况
      if (key === 'fontSize') {
        // 字号默认值为 12
        const size1 = val1 || 12;
        const size2 = val2 || 12;
        if (size1 !== size2) return false;
      } else if (key === 'fontFamily') {
        // 字体默认值为宋体
        const font1 = val1 || '宋体';
        const font2 = val2 || '宋体';
        if (font1 !== font2) return false;
      } else if (key === 'color') {
        // 颜色默认值为黑色
        const color1 = val1 || '#000000';
        const color2 = val2 || '#000000';
        if (color1 !== color2) return false;
      } else if (key === 'alignment') {
        // 对齐默认值为左对齐
        const align1 = val1 || 'left';
        const align2 = val2 || 'left';
        if (align1 !== align2) return false;
      } else if (key === 'lineHeight') {
        // 行高比较：如果都是undefined，认为相同；否则直接比较值
        if (val1 === undefined && val2 === undefined) {
          // 都未定义，认为相同
          continue;
        } else if (val1 === undefined || val2 === undefined) {
          // 一个定义一个未定义，认为不同
          return false;
        } else {
          // 都有值，直接比较（允许小的浮点数误差）
          const diff = Math.abs(val1 - val2);
          if (diff > 0.01) return false;
        }
      } else if (['textIndent', 'leftIndent', 'rightIndent', 'spaceBefore', 'spaceAfter'].includes(key)) {
        // 缩进和间距默认值为 0
        const indent1 = val1 || 0;
        const indent2 = val2 || 0;
        if (indent1 !== indent2) return false;
      } else {
        // 其他属性直接比较
        if (val1 !== val2) return false;
      }
    }
    
    return true;
  }
  
  // 根据元素类型获取建议的内容块类型
  private getSuggestedType(elements: ParsedElement[]): 'text' | 'ai-generated' {
    // 如果所有元素都是图片，返回text类型
    if (elements.every(e => e.type === 'image')) {
      return 'text';
    }
    
    // 如果包含表格，返回text类型
    if (elements.some(e => e.type === 'table')) {
      return 'text';
    }
    
    // 检查是否包含AI占位符内容
    const aiPatterns = ['待填写', '请输入', 'TODO', '[请在此处', '___', '...', '请编写', '待补充', '待完善'];
    const hasAIPlaceholder = elements.some(e => 
      aiPatterns.some(pattern => e.content.includes(pattern))
    );
    
    return hasAIPlaceholder ? 'ai-generated' : 'text';
  }
}