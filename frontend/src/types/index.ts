// 辅助类型
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// 文档模板类型
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  content: ContentBlock[];
  format: DocumentFormat;
  createdAt: Date;
  updatedAt: Date;
  expandedBlocks?: Record<string, boolean>; // 保存内容块的展开状态
}

// 文档格式设置
export interface DocumentFormat {
  font: FontSettings;
  paragraph: ParagraphSettings;
  page: PageSettings;
}

// 字体设置
export interface FontSettings {
  family: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

// 段落设置
export interface ParagraphSettings {
  lineHeight: number;
  paragraphSpacing: number;
  spaceBefore: number; // 段前距
  indent: IndentSettings;
  alignment: 'left' | 'center' | 'right' | 'justify';
  border?: {
    bottom?: {
      style: 'none' | 'single' | 'double' | 'thickThin';
      color: string;
      size: number;
      space: number;
    }
  };
}

// 缩进设置
export interface IndentSettings {
  firstLine: number;
  firstLineUnit: 'pt' | 'cm' | 'px' | 'char';
  left: number;
  leftUnit: 'pt' | 'cm' | 'px' | 'char';
  right: number;
  rightUnit: 'pt' | 'cm' | 'px' | 'char';
}

export interface AISettings {
  provider: 'qianwen' | 'maxkb';
  maxkbBaseUrl: string;
  maxkbApiKey: string;
  maxkbModel: string;
  systemPrompt: string;
}

// 页面设置
export interface PageSettings {
  width: number;
  height: number;
  margins: MarginSettings;
  orientation: 'portrait' | 'landscape';
}

// 页边距设置
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
  alignment: 'left' | 'center' | 'right' | 'auto'; // 新增'auto'自适应
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

// 表格单元格内容
export interface TableCell {
  content: string;
  colspan?: number;
  rowspan?: number;
  hidden?: boolean; // 用于标记被合并的单元格
  style?: {
    backgroundColor?: string;
    verticalAlign?: 'top' | 'middle' | 'bottom';
    textAlign?: 'left' | 'center' | 'right';
  };
}

// 表格内容
export interface TableContent {
  rows: TableCell[][];
  style?: {
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderWidth?: number;
    borderColor?: string;
    cellPadding?: number;
    cellSpacing?: number;
    width?: 'auto' | 'full' | number; // auto=自适应, full=100%, number=固定宽度
    headerRows?: number; // 标题行数
    headerStyle?: {
      backgroundColor?: string;
      fontBold?: boolean;
      textAlign?: 'left' | 'center' | 'right';
    };
  };
}

// 内容块
export interface ContentBlock {
  id: string;
  type: 'text' | 'ai-generated' | 'two-column' | 'image' | 'page-break' | 'table';
  content: string | TwoColumnContent | ImageContent | PageBreakContent | TableContent;
  format: BlockFormat;
  position: number;
  title: string;
  aiPrompt?: string;
  aiSettings?: AISettings;
}

// 块级格式
export interface BlockFormat {
  useGlobalFormat?: boolean;
  font?: Partial<FontSettings>;
  paragraph?: DeepPartial<ParagraphSettings>;
  style?: 'normal' | 'heading1' | 'heading2' | 'heading3' | 'quote';
  columnRatio?: number;
}

// AI生成请求
export interface AIGenerateRequest {
  prompt: string;
  maxLength: number;
  temperature: number;
  context?: string;
}

// AI生成响应
export interface AIGenerateResponse {
  content: string;
  success: boolean;
  error?: string;
}

// 编辑器状态
export interface EditorState {
  currentTemplate: DocumentTemplate | null;
  isLoading: boolean;
  selectedBlock: string | null;
  previewMode: boolean;
}

// API响应基础类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 