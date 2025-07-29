// 预设的Word导入识别规则
import { RecognitionRule } from '../types/wordImport';

export const DEFAULT_RULES: RecognitionRule[] = [
  {
    id: 'rule-merge-same-style',
    name: '合并相同格式段落',
    description: '将上下内容块级样式一样的段落合并成一个段',
    enabled: true,  // 默认启用
    priority: 0,  // 最高优先级
    type: 'paragraph',
    config: {
      grouping: 'merge-same-style'
    }
  }
];