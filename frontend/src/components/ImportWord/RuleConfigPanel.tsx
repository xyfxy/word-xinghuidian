// 规则配置面板组件 - 优化版
import React, { useState } from 'react';
import { 
  Settings, 
  RefreshCw
} from 'lucide-react';
import { RecognitionRule } from '../../types/wordImport';
import { Switch } from '@headlessui/react';

interface RuleConfigPanelProps {
  rules: RecognitionRule[];
  onRulesChange: (rules: RecognitionRule[]) => void;
  onApplyRules: () => void;
  isProcessing?: boolean;
  ignoreWordStyles?: boolean;
  onIgnoreWordStylesChange?: (value: boolean) => void;
}

const RuleConfigPanel: React.FC<RuleConfigPanelProps> = ({ 
  rules, 
  onRulesChange, 
  onApplyRules,
  isProcessing = false,
  ignoreWordStyles = false,
  onIgnoreWordStylesChange
}) => {

  // 切换规则启用状态
  const toggleRule = (ruleId: string) => {
    const newRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    onRulesChange(newRules);
    
    // 自动应用规则
    setTimeout(() => {
      onApplyRules();
    }, 100);
  };

  // 获取合并规则
  const mergeRule = rules.find(r => r.config.grouping === 'merge-same-style');

  const enabledRulesCount = rules.filter(r => r.enabled).length;

  return (
    <div className="h-full flex flex-col">
      {/* 标题 */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          内容块合并设置
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          将段落格式相同的内容块合并成一个段
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 合并规则 */}
        {mergeRule && (
          <div className="border-b">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">内容块合并规则</h4>
                <span className="text-xs text-gray-500">
                  {mergeRule.enabled ? '已启用' : '已禁用'}
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  {mergeRule.description}
                </p>
              </div>
              <RuleItem rule={mergeRule} onToggle={toggleRule} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// 规则项组件
const RuleItem: React.FC<{
  rule: RecognitionRule;
  onToggle: (ruleId: string) => void;
}> = ({ rule, onToggle }) => {
  return (
    <div className="flex items-start py-3 border-b last:border-b-0">
      <Switch
        checked={rule.enabled}
        onChange={() => onToggle(rule.id)}
        className={`${rule.enabled ? 'bg-blue-600' : 'bg-gray-200'} 
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors mt-0.5`}
      >
        <span className={`${rule.enabled ? 'translate-x-5' : 'translate-x-1'} 
          inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
      </Switch>
      <div className="ml-3 flex-1">
        <div className="flex items-center">
          <span className={`text-sm font-medium ${rule.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
            {rule.name}
          </span>
          {rule.priority && (
            <span className="ml-2 text-xs text-gray-400">
              优先级: {rule.priority}
            </span>
          )}
        </div>
        <p className={`text-xs mt-1 ${rule.enabled ? 'text-gray-600' : 'text-gray-400'}`}>
          {rule.description}
        </p>
        {rule.config.pattern && (
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded mt-1 inline-block">
            {rule.config.pattern}
          </code>
        )}
      </div>
    </div>
  );
};

export default RuleConfigPanel;