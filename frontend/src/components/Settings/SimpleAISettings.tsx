import React from 'react';
import { ModelSelector } from './ModelSelector';

interface SimpleAISettingsProps {
  selectedModelId: string | null;
  onModelChange: (modelId: string | null) => void;
  temperature?: number;
  onTemperatureChange?: (temperature: number) => void;
  maxLength?: number;
  onMaxLengthChange?: (maxLength: number) => void;
  showAdvanced?: boolean;
}

export const SimpleAISettings: React.FC<SimpleAISettingsProps> = ({
  selectedModelId,
  onModelChange,
  temperature = 0.7,
  onTemperatureChange,
  maxLength = 500,
  onMaxLengthChange,
  showAdvanced = false
}) => {
  return (
    <div className="space-y-4">
      {/* 模型选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          AI模型
        </label>
        <ModelSelector
          value={selectedModelId}
          onChange={onModelChange}
          showMaxKB={true}
        />
        <p className="text-xs text-gray-500 mt-1">
          选择要使用的AI模型，或使用默认配置
        </p>
      </div>

      {/* 高级设置 */}
      {showAdvanced && (
        <>
          {/* 最大长度 */}
          {onMaxLengthChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大生成长度
              </label>
              <input
                type="number"
                value={maxLength}
                onChange={(e) => onMaxLengthChange(parseInt(e.target.value) || 500)}
                min="10"
                max="2000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* 温度 */}
          {onTemperatureChange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                创造性 (Temperature)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  value={temperature}
                  onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-10">{temperature}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                值越低越保守，值越高越有创造性
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};