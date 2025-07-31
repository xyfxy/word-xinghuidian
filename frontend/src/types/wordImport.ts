// Word导入相关的类型定义

// 识别规则定义
export interface RecognitionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  type: 'heading' | 'paragraph' | 'custom' | 'heading-pattern';
  config: RuleConfig;
}

export interface RuleConfig {
  headingPattern?: string;
  headingLevel?: number[];
  grouping: 'single' | 'with-content' | 'until-next' | 'heading-then-content' | 'merge-same-style';
  contentPatterns?: string[];
  maxParagraphs?: number;
  minLength?: number;
  autoConvertToAI?: boolean;
  aiPromptTemplate?: string;
  
  // heading-pattern规则专用
  pattern?: string; // 匹配模式的正则表达式
  level?: number; // 识别为的标题级别
}

// 解析后的文档结构
export interface ParsedDocument {
  rawText: string;
  html: string;
  elements: ParsedElement[];
  metadata?: {
    author?: string;
    title?: string;
    createdAt?: Date;
  };
}

export interface ParsedElement {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'image';
  content: string;
  html: string;
  level?: number;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    alignment?: string;
  };
  // 图片特有属性
  imageData?: {
    src: string; // base64或URL
    width?: number;
    height?: number;
    alt?: string;
    relationshipId?: string; // Word文档中的关系ID
    fileName?: string; // 原始文件名
  };
}

// 内容块分组结果
export interface ContentBlockGroup {
  id: string;
  elements: ParsedElement[];
  suggestedType: 'text' | 'ai-generated';
  suggestedTitle: string;
  matchedRule?: string;
}