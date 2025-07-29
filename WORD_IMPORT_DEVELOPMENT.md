# Word导入功能开发文档

## 一、功能概述

实现Word文档导入并自动转换为可编辑模板的功能，支持智能识别文档结构，自动划分内容块，并允许用户手动调整和配置。

### 核心功能
1. Word文档解析和结构识别
2. 基于可配置规则的智能内容块划分
3. 实时预览和手动调整
4. 固定内容与AI生成内容的灵活转换
5. 模板保存和管理

## 二、技术架构

### 技术栈
- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **文档解析**: mammoth.js
- **预览组件**: 复用现有的 PreviewPanel

### 数据流
```
Word文档上传 → 后端解析(mammoth) → 结构化数据 → 应用识别规则 → 
生成内容块 → 前端展示/编辑 → 预览(PreviewPanel) → 保存为模板
```

## 三、详细设计

### 3.1 数据结构定义

```typescript
// 识别规则定义
interface RecognitionRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // 规则优先级，数字越小优先级越高
  type: 'heading' | 'paragraph' | 'custom';
  config: RuleConfig;
}

interface RuleConfig {
  // 标题识别配置
  headingPattern?: string; // 正则表达式，如 "^第.+[章节]"
  headingLevel?: number[]; // 支持的标题级别 [1,2,3]
  
  // 分组策略
  grouping: 'single' | 'with-content' | 'until-next';
  // single: 标题单独成块
  // with-content: 标题和后续内容合并
  // until-next: 标题和内容直到下个标题
  
  // 内容识别
  contentPatterns?: string[]; // 内容特征，如 ["待填写", "请输入"]
  maxParagraphs?: number; // 最大段落数限制
  minLength?: number; // 最小内容长度
  
  // 自动转换
  autoConvertToAI?: boolean; // 是否自动转为AI内容块
  aiPromptTemplate?: string; // AI提示词模板
}

// 解析后的文档结构
interface ParsedDocument {
  rawText: string;
  html: string;
  elements: ParsedElement[];
  metadata?: {
    author?: string;
    title?: string;
    createdAt?: Date;
  };
}

interface ParsedElement {
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
    alignment?: string;
  };
}

// 内容块分组结果
interface ContentBlockGroup {
  id: string;
  elements: ParsedElement[];
  suggestedType: 'text' | 'ai-generated';
  suggestedTitle: string;
  matchedRule?: string; // 匹配的规则ID
}
```

### 3.2 预设规则库

```typescript
const DEFAULT_RULES: RecognitionRule[] = [
  {
    id: 'rule-heading-single',
    name: '标题独立成块',
    description: '将每个标题作为独立的内容块',
    enabled: true,
    priority: 1,
    type: 'heading',
    config: {
      headingLevel: [1, 2, 3],
      grouping: 'single'
    }
  },
  {
    id: 'rule-heading-with-content',
    name: '标题与内容组合',
    description: '标题和其后的内容合并为一个内容块',
    enabled: false,
    priority: 2,
    type: 'heading',
    config: {
      headingLevel: [1, 2, 3],
      grouping: 'with-content',
      maxParagraphs: 10
    }
  },
  {
    id: 'rule-heading-section',
    name: '章节识别',
    description: '从一个标题到下一个同级标题之间的所有内容为一块',
    enabled: false,
    priority: 3,
    type: 'heading',
    config: {
      headingLevel: [1, 2],
      grouping: 'until-next'
    }
  },
  {
    id: 'rule-ai-placeholder',
    name: 'AI占位符识别',
    description: '识别待填写的占位符内容并自动转为AI生成块',
    enabled: true,
    priority: 4,
    type: 'custom',
    config: {
      contentPatterns: [
        '待填写', '请输入', 'TODO', 
        '[请在此处', '___', '...',
        '请编写', '待补充', '待完善'
      ],
      autoConvertToAI: true,
      aiPromptTemplate: '请根据上下文补充这部分内容'
    }
  },
  {
    id: 'rule-short-paragraph',
    name: '短段落合并',
    description: '将连续的短段落合并为一个内容块',
    enabled: true,
    priority: 5,
    type: 'paragraph',
    config: {
      maxParagraphs: 5,
      minLength: 50,
      grouping: 'with-content'
    }
  }
];
```

### 3.3 页面组件设计

#### 3.3.1 主页面布局

```typescript
// pages/ImportWordPage.tsx
const ImportWordPage: React.FC = () => {
  // 状态管理
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [activeRules, setActiveRules] = useState<RecognitionRule[]>(DEFAULT_RULES);
  const [contentGroups, setContentGroups] = useState<ContentBlockGroup[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 三栏布局
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* 左侧栏：规则配置 */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <RuleConfigPanel 
            rules={activeRules}
            onRulesChange={setActiveRules}
            onApplyRules={handleApplyRules}
          />
        </div>
        
        {/* 中间栏：文档结构编辑 */}
        <div className="flex-1 overflow-y-auto">
          {!parsedDocument ? (
            <UploadPanel onFileUpload={handleFileUpload} />
          ) : (
            <DocumentStructureEditor
              parsedDocument={parsedDocument}
              contentGroups={contentGroups}
              onGroupsChange={setContentGroups}
              onRegeneratePreview={generatePreview}
            />
          )}
        </div>
        
        {/* 右侧栏：预览面板 */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {previewTemplate ? (
            <div className="h-full">
              <div className="p-4 border-b">
                <h3 className="font-semibold">模板预览</h3>
              </div>
              <PreviewPanel template={previewTemplate} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>上传文档后显示预览</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button onClick={handleBack} className="btn-secondary">
            返回
          </button>
          <div className="space-x-4">
            <button 
              onClick={handleSaveAsTemplate}
              disabled={!previewTemplate}
              className="btn-primary"
            >
              保存为模板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 3.3.2 规则配置面板

```typescript
// components/ImportWord/RuleConfigPanel.tsx
const RuleConfigPanel: React.FC<Props> = ({ rules, onRulesChange, onApplyRules }) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">智能识别规则</h2>
      
      <div className="space-y-4">
        {rules.map(rule => (
          <RuleItem
            key={rule.id}
            rule={rule}
            onChange={(updatedRule) => handleRuleChange(rule.id, updatedRule)}
          />
        ))}
      </div>
      
      <div className="mt-6">
        <button 
          onClick={onApplyRules}
          className="w-full btn-primary"
        >
          应用规则
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>提示：</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>规则按优先级顺序执行</li>
          <li>可以同时启用多个规则</li>
          <li>识别结果可手动调整</li>
        </ul>
      </div>
    </div>
  );
};
```

#### 3.3.3 文档结构编辑器

```typescript
// components/ImportWord/DocumentStructureEditor.tsx
const DocumentStructureEditor: React.FC<Props> = ({ 
  parsedDocument, 
  contentGroups, 
  onGroupsChange,
  onRegeneratePreview 
}) => {
  return (
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">文档结构</h2>
        <div className="space-x-2">
          <button className="btn-secondary text-sm">
            全部合并
          </button>
          <button className="btn-secondary text-sm">
            重置
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {contentGroups.map((group, index) => (
          <ContentGroupCard
            key={group.id}
            group={group}
            index={index}
            onMergeUp={() => handleMergeGroups(index - 1, index)}
            onMergeDown={() => handleMergeGroups(index, index + 1)}
            onSplit={(elementIndex) => handleSplitGroup(index, elementIndex)}
            onTypeChange={(type) => handleTypeChange(group.id, type)}
            onTitleChange={(title) => handleTitleChange(group.id, title)}
          />
        ))}
      </div>
    </div>
  );
};
```

### 3.4 后端API设计

#### 3.4.1 Word文档解析API

```typescript
// POST /api/documents/parse-word
interface ParseWordRequest {
  file: File; // multipart/form-data
}

interface ParseWordResponse {
  success: boolean;
  data?: ParsedDocument;
  error?: string;
}

// 实现
router.post('/parse-word', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: '未提供文件' });
    }
    
    const parsed = await wordParserService.parseDocument(file.buffer);
    res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### 3.4.2 应用识别规则API

```typescript
// POST /api/documents/apply-rules
interface ApplyRulesRequest {
  parsedDocument: ParsedDocument;
  rules: RecognitionRule[];
}

interface ApplyRulesResponse {
  success: boolean;
  data?: ContentBlockGroup[];
  error?: string;
}
```

#### 3.4.3 生成模板预览API

```typescript
// POST /api/documents/generate-template
interface GenerateTemplateRequest {
  contentGroups: ContentBlockGroup[];
  templateName: string;
  templateDescription?: string;
}

interface GenerateTemplateResponse {
  success: boolean;
  data?: DocumentTemplate;
  error?: string;
}
```

### 3.5 核心算法实现

#### 3.5.1 规则匹配算法

```typescript
class RuleMatcher {
  match(element: ParsedElement, rule: RecognitionRule): boolean {
    switch (rule.type) {
      case 'heading':
        return this.matchHeading(element, rule);
      case 'paragraph':
        return this.matchParagraph(element, rule);
      case 'custom':
        return this.matchCustom(element, rule);
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
}
```

#### 3.5.2 内容分组算法

```typescript
class ContentGrouper {
  group(
    elements: ParsedElement[], 
    rules: RecognitionRule[]
  ): ContentBlockGroup[] {
    const groups: ContentBlockGroup[] = [];
    const sortedRules = rules
      .filter(r => r.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    let i = 0;
    while (i < elements.length) {
      let matched = false;
      
      // 尝试每个规则
      for (const rule of sortedRules) {
        if (this.matcher.match(elements[i], rule)) {
          const group = this.createGroup(elements, i, rule);
          groups.push(group);
          i += group.elements.length;
          matched = true;
          break;
        }
      }
      
      // 默认处理：单个段落为一组
      if (!matched) {
        groups.push({
          id: generateId(),
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
      id: generateId(),
      elements: groupElements,
      suggestedType: config.autoConvertToAI ? 'ai-generated' : 'text',
      suggestedTitle: this.generateGroupTitle(groupElements, rule),
      matchedRule: rule.id
    };
  }
}
```

## 四、开发计划

### 第一阶段：基础功能（3天）
1. 后端Word解析服务实现
2. 前端上传和解析结果展示
3. 基础的内容块划分功能

### 第二阶段：规则系统（2天）
1. 规则配置界面
2. 规则匹配算法实现
3. 预设规则库

### 第三阶段：交互优化（2天）
1. 内容块合并/拆分功能
2. 类型转换功能
3. 实时预览更新

### 第四阶段：完善和测试（2天）
1. 批量操作功能
2. 错误处理和提示
3. 性能优化
4. 测试和bug修复

## 五、注意事项

1. **文件大小限制**：建议限制上传文件不超过10MB
2. **格式支持**：优先支持.docx格式，.doc格式作为后续功能
3. **性能考虑**：大文档需要分页显示内容块
4. **用户体验**：提供清晰的操作引导和错误提示
5. **数据安全**：上传的文档在处理完成后应及时清理

## 六、扩展功能（未来版本）

1. **批量导入**：支持多个文档批量转换
2. **样式保留**：保留原文档的字体、颜色等样式
3. **表格支持**：识别和转换表格内容
4. **图片处理**：提取和管理文档中的图片
5. **模板库**：基于导入历史生成推荐规则
6. **AI优化**：使用AI自动优化识别结果

## 七、测试用例

### 测试文档类型
1. 纯文本文档
2. 带标题层级的文档
3. 包含列表的文档
4. 混合内容文档（文本+表格+图片）
5. 模板类文档（包含占位符）

### 测试场景
1. 规则优先级冲突
2. 内容块合并边界情况
3. 大文档性能测试
4. 特殊字符处理
5. 并发上传处理

---

*本文档将随开发进度持续更新*