// 千问API类型定义
export interface QianwenRequest {
  model: string;
  input: {
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;
  };
  parameters: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop?: string[];
  };
}

export interface QianwenResponse {
  output: {
    text: string;
    finish_reason: string;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 辅助类型
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// 文档模板类型（与前端保持一致）
export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  format: DocumentFormat;
  content: ContentBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFormat {
  font: FontSettings;
  paragraph: ParagraphSettings;
  page: PageSettings;
}

export interface FontSettings {
  family: string;
  size: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ParagraphSettings {
  lineHeight: number;
  paragraphSpacing: number;
  spaceBefore: number;
  indent: IndentSettings;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface IndentSettings {
  firstLine: number;
  firstLineUnit: 'pt' | 'cm' | 'px' | 'char';
  left: number;
  leftUnit: 'pt' | 'cm' | 'px' | 'char';
  right: number;
  rightUnit: 'pt' | 'cm' | 'px' | 'char';
}

export interface PageSettings {
  width: number;
  height: number;
  margins: MarginSettings;
  orientation: 'portrait' | 'landscape';
}

export interface MarginSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// 双栏文本内容
export interface TwoColumnContent {
  left: string;
  right: string;
}

// 图片内容
export interface ImageContent {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  alignment: 'left' | 'center' | 'right' | 'auto';
  caption?: string;
  border?: {
    enabled: boolean;
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
}

// 换页内容
export interface PageBreakContent {
  type: 'page-break';
  settings: {
    addBlankPage: boolean;
    pageOrientation?: 'portrait' | 'landscape';
  };
}

// 表格内容
export interface TableContent {
  rows: (string | { content: string; colspan?: number; rowspan?: number; style?: any })[][];
  style: {
    borderStyle: 'none' | 'solid' | 'dashed' | 'dotted';
    borderWidth: number;
    borderColor: string;
    cellPadding: number;
    cellSpacing: number;
    width: 'auto' | 'full' | number;
    headerRows: number;
    headerStyle: {
      backgroundColor: string;
      fontBold: boolean;
      textAlign: string;
    };
  };
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'ai-generated' | 'two-column' | 'image' | 'page-break' | 'table';
  content: string | TwoColumnContent | ImageContent | PageBreakContent | TableContent;
  format: BlockFormat;
  aiPrompt?: string;
  position: number;
  title?: string;
}

export interface BlockFormat {
  useGlobalFormat?: boolean;
  font?: Partial<FontSettings>;
  paragraph?: DeepPartial<ParagraphSettings>;
  style?: 'normal' | 'heading1' | 'heading2' | 'heading3' | 'quote';
}

// AI生成请求和响应
export interface AIGenerateRequest {
  prompt: string;
  maxLength: number;
  temperature: number;
  context?: string;
}

export interface AIGenerateResponse {
  content: string;
  success: boolean;
  error?: string;
}

// 错误类型
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
} 