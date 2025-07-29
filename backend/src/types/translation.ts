// 翻译记忆单元
export interface TranslationUnit {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  metadata?: {
    project?: string;
    domain?: string;
    client?: string;
    tags?: string[];
  };
}

// 术语条目
export interface TermEntry {
  id: string;
  sourceTerm: string;
  targetTerm: string;
  sourceLang: string;
  targetLang: string;
  definition?: string;
  context?: string;
  domain?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// 翻译匹配结果
export interface TranslationMatch {
  unit: TranslationUnit;
  score: number; // 匹配度 0-100
  matchType: 'exact' | 'fuzzy' | 'context';
}

// TMX文件导入导出格式
export interface TMXData {
  header: {
    creationtool: string;
    creationtoolversion: string;
    datatype: string;
    segtype: string;
    adminlang: string;
    srclang: string;
    creationdate: string;
  };
  body: Array<{
    tuid: string;
    srclang: string;
    segments: Array<{
      lang: string;
      text: string;
    }>;
  }>;
}

// 搜索参数
export interface SearchParams {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  minScore?: number;
  maxResults?: number;
  domain?: string;
  project?: string;
}