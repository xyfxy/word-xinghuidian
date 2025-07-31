import React, { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronUp, RotateCcw, Save, X } from 'lucide-react';
import { SimpleAISettings } from '../Settings/SimpleAISettings';
import { ContentBlock, AISettings } from '../../types';

interface AIBlockSettingsProps {
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  defaultModelId?: string | null;
  defaultSystemPrompt?: string;
}

export const AIBlockSettings: React.FC<AIBlockSettingsProps> = ({
  block,
  onUpdate,
  defaultModelId = null,
  defaultSystemPrompt = '你是一个专业的文档编写助手。'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelId, setModelId] = useState<string | null>(block.modelId || defaultModelId);
  const [systemPrompt, setSystemPrompt] = useState(block.systemPrompt || defaultSystemPrompt);
  const [temperature, setTemperature] = useState(block.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(block.maxTokens || 500);
  
  // MaxKB 配置状态
  const [maxkbBaseUrl, setMaxkbBaseUrl] = useState(block.aiSettings?.maxkbBaseUrl || '');
  const [maxkbApiKey, setMaxkbApiKey] = useState(block.aiSettings?.maxkbApiKey || '');
  
  const [hasChanges, setHasChanges] = useState(false);

  // 检测变化
  useEffect(() => {
    const changed = 
      modelId !== (block.modelId || defaultModelId) ||
      systemPrompt !== (block.systemPrompt || defaultSystemPrompt) ||
      temperature !== (block.temperature || 0.7) ||
      maxTokens !== (block.maxTokens || 500) ||
      maxkbBaseUrl !== (block.aiSettings?.maxkbBaseUrl || '') ||
      maxkbApiKey !== (block.aiSettings?.maxkbApiKey || '');
    setHasChanges(changed);
  }, [modelId, systemPrompt, temperature, maxTokens, maxkbBaseUrl, maxkbApiKey, block, defaultModelId, defaultSystemPrompt]);

  const handleSave = () => {
    const aiSettings: AISettings = {
      provider: 'maxkb',
      maxkbBaseUrl,
      maxkbApiKey,
      systemPrompt
    };
    
    onUpdate({
      modelId,
      systemPrompt,
      temperature,
      maxTokens,
      aiSettings
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setModelId(defaultModelId);
    setSystemPrompt(defaultSystemPrompt);
    setTemperature(0.7);
    setMaxTokens(500);
    setMaxkbBaseUrl('');
    setMaxkbApiKey('');
    onUpdate({
      modelId: undefined,
      systemPrompt: undefined,
      temperature: undefined,
      maxTokens: undefined,
      aiSettings: undefined
    });
    setHasChanges(false);
  };

  const handleCancel = () => {
    setModelId(block.modelId || defaultModelId);
    setSystemPrompt(block.systemPrompt || defaultSystemPrompt);
    setTemperature(block.temperature || 0.7);
    setMaxTokens(block.maxTokens || 500);
    setMaxkbBaseUrl(block.aiSettings?.maxkbBaseUrl || '');
    setMaxkbApiKey(block.aiSettings?.maxkbApiKey || '');
    setHasChanges(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50">
      {/* 头部 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">AI设置</span>
          {block.modelId && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
              自定义配置
            </span>
          )}
          {!block.modelId && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
              使用全局设置
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="p-3 border-t border-gray-200 space-y-4">
          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              {block.modelId 
                ? '此AI块使用独立设置，不会影响其他AI块。'
                : '此AI块使用全局默认设置。'}
            </p>
          </div>

          {/* 模型选择 */}
          <SimpleAISettings
            selectedModelId={modelId}
            onModelChange={setModelId}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            maxLength={maxTokens}
            onMaxLengthChange={setMaxTokens}
            showAdvanced={modelId !== 'maxkb'} // MaxKB时不显示高级参数
          />

          {/* MaxKB 配置 - 只在选择MaxKB时显示 */}
          {modelId === 'maxkb' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-3">MaxKB 知识库配置</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MaxKB Base URL
                  </label>
                  <input
                    type="url"
                    value={maxkbBaseUrl}
                    onChange={(e) => setMaxkbBaseUrl(e.target.value)}
                    placeholder="https://maxkb.fit2cloud.com/api/application/xxx"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MaxKB API Key
                  </label>
                  <input
                    type="password"
                    value={maxkbApiKey}
                    onChange={(e) => setMaxkbApiKey(e.target.value)}
                    placeholder="输入您的MaxKB API Key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                配置MaxKB知识库的连接信息，用于AI问答生成。
              </p>
            </div>
          )}

          {/* 系统提示词 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              系统提示词
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="定义AI的角色和行为"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* 操作按钮 */}
          {hasChanges && (
            <div className="flex items-center justify-between pt-2 border-t">
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                <RotateCcw className="h-3 w-3" />
                重置为默认
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  <X className="h-3 w-3" />
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Save className="h-3 w-3" />
                  保存设置
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};