// Word导入相关的类型定义

// 识别规则定义
export interface RecognitionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // 规则优先级，数字越小优先级越高
  type: 'heading' | 'paragraph' | 'custom' | 'heading-pattern';
  config: RuleConfig;
}

export interface RuleConfig {
  // 标题识别配置
  headingPattern?: string; // 正则表达式，如 "^第.+[章节]"
  headingLevel?: number[]; // 支持的标题级别 [1,2,3]
  
  // 分组策略
  grouping: 'single' | 'with-content' | 'until-next' | 'heading-then-content' | 'merge-same-style';
  // single: 标题单独成块
  // with-content: 标题和后续内容合并
  // until-next: 标题和内容直到下个标题
  // heading-then-content: 标题独立成块，后续内容合并成另一块
  // merge-same-style: 合并相同样式的段落
  
  // 内容识别
  contentPatterns?: string[]; // 内容特征，如 ["待填写", "请输入"]
  maxParagraphs?: number; // 最大段落数限制
  minLength?: number; // 最小内容长度
  
  // heading-pattern规则专用
  pattern?: string; // 匹配模式的正则表达式
  level?: number; // 识别为的标题级别
  requireBold?: boolean; // 是否要求加粗
  
  // 自动转换
  autoConvertToAI?: boolean; // 是否自动转为AI内容块
  aiPromptTemplate?: string; // AI提示词模板
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
  level?: number; // 标题级别
  style?: {
    fontSize?: number;
    fontFamily?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
    alignment?: string;
    lineHeight?: string | number;
    textIndent?: number;
    leftIndent?: number;
    rightIndent?: number;
    spaceBefore?: number;
    spaceAfter?: number;
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
  // 表格特有属性
  tableData?: {
    rows: string[][];
    style?: {
      borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
      borderWidth?: number;
      borderColor?: string;
      cellPadding?: number;
      cellSpacing?: number;
      width?: 'auto' | 'full' | number;
    };
    cellStyles?: any[][]; // 每个单元格的字体样式
    cellMergeInfo?: { colspan: number; rowspan: number }[][]; // 单元格合并信息
  };
}

// 内容块分组结果
export interface ContentBlockGroup {
  id: string;
  elements: ParsedElement[];
  suggestedType: 'text' | 'ai-generated';
  suggestedTitle: string;
  matchedRule?: string; // 匹配的规则ID
}