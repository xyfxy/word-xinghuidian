import React, { useState, useEffect } from 'react';
import useEditorStore from '../../stores/editorStore';
import { FontSettings, ParagraphSettings, IndentSettings } from '../../types';
import { SimpleAISettings } from '../Settings/SimpleAISettings';

// --- Helper Component for Margin Inputs ---
const MarginInput: React.FC<{
  label: string;
  valueInPt: number;
  onValueChange: (valueInPt: number) => void;
}> = ({ label, valueInPt, onValueChange }) => {
  
  const ptToCm = (pt: number): string => (pt / 72 * 2.54).toFixed(2);
  const cmToPt = (cm: number): number => (cm / 2.54 * 72);

  const [displayValue, setDisplayValue] = useState(ptToCm(valueInPt));

  useEffect(() => {
    setDisplayValue(ptToCm(valueInPt));
  }, [valueInPt]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleInputBlur = () => {
    const cmValue = parseFloat(displayValue);
    if (!isNaN(cmValue)) {
      onValueChange(cmToPt(cmValue));
    } else {
      setDisplayValue(ptToCm(valueInPt));
    }
  };

  return (
    <div>
      <label className="label-text">{label}</label>
      <input
        type="number"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="input-field"
        min="0"
        step="0.1"
      />
    </div>
  );
};

// --- Constants ---
const FONT_FAMILIES = [
  '宋体', '新宋体', '仿宋', '仿宋_GB2312', '楷体', '楷体_GB2312', '黑体',
  '微软雅黑', '微软雅黑 Light',
  '华文宋体', '华文仿宋', '华文楷体', '华文细黑', '华文黑体', '华文中宋',
  '方正姚体', '方正舒体',
  '隶书', '幼圆', '等线', '等线 Light',
  'Arial', 'Times New Roman', 'Calibri', 'Cambria', 'Georgia', 
  'Verdana', 'Trebuchet MS', 'Tahoma', 'Helvetica', 'Courier New', 
  'Consolas', 'Garamond'
];

const FONT_SIZES: { [key: string]: number } = {
  '初号': 42, '小初': 36, '一号': 26, '小一': 24, '二号': 22, '小二': 18,
  '三号': 16, '小三': 15, '四号': 14, '小四': 12, '五号': 10.5, '小五': 9
};

// --- CollapsibleSection Component ---
interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 space-y-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Main FormatPanel Component ---
const FormatPanel: React.FC = () => {
  const { 
    currentTemplate, 
    updateTemplateFormat, 
    aiSettings, 
    setAiSettings 
  } = useEditorStore();

  const [expandedSections, setExpandedSections] = useState({
    font: true,
    paragraph: false,
    indent: false,
    page: true, // Default page section to open
    ai: false
  });

  if (!currentTemplate) {
    return null;
  }

  const { format } = currentTemplate;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getSizeName = (size?: number) => {
    if (size === undefined) return '';
    return Object.keys(FONT_SIZES).find(name => FONT_SIZES[name] === size) || '';
  };

  const handleFontChange = <T extends keyof FontSettings>(key: T, value: FontSettings[T]) => {
    updateTemplateFormat({ font: { ...format.font, [key]: value } });
  };
  
  const handleNumberChange = (value: string, callback: (num: number | undefined) => void) => {
    if (value === '') {
      callback(undefined as any);
    } else {
      const num = Number(value);
      if (!isNaN(num)) {
        callback(num);
      }
    }
  };

  const handleParagraphChange = <T extends keyof ParagraphSettings>(key: T, value: ParagraphSettings[T]) => {
    updateTemplateFormat({ paragraph: { ...format.paragraph, [key]: value } });
  };

  const handleIndentChange = <T extends keyof IndentSettings>(key: T, value: IndentSettings[T]) => {
    updateTemplateFormat({ 
      paragraph: { ...format.paragraph, indent: { ...format.paragraph.indent, [key]: value } } 
    });
  };

  const handlePageChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updateTemplateFormat({ 
        page: { ...format.page, [parent]: { ...(format.page[parent as keyof typeof format.page] as any), [child]: value } } 
      });
    } else {
      updateTemplateFormat({ page: { ...format.page, [field]: value } });
    }
  };

  const handleAiSettingsChange = <T extends keyof typeof aiSettings>(key: T, value: typeof aiSettings[T]) => {
    setAiSettings({ [key]: value });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">全局格式设置</h2>
        <p className="text-sm text-gray-600 mt-1">
          设置整个文档的默认格式，内容块可以选择使用或覆盖这些设置。
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <CollapsibleSection title="字体" isOpen={expandedSections.font} onToggle={() => toggleSection('font')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">字体</label>
              <select 
                value={format.font.family} 
                onChange={(e) => handleFontChange('family', e.target.value)}
                className="input-field"
              >
                {FONT_FAMILIES.map(font => (<option key={font} value={font}>{font}</option>))}
              </select>
            </div>
            <div>
              <label className="label-text">字号</label>
              <select 
                value={getSizeName(format.font.size) ? format.font.size : ''}
                onChange={(e) => handleFontChange('size', Number(e.target.value))}
                className="input-field"
              >
                <option value="" disabled={getSizeName(format.font.size) !== ''}>选择字号</option>
                {Object.entries(FONT_SIZES).map(([name, size]) => (<option key={name} value={size}>{name} ({size}pt)</option>))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label-text">字号 (pt)</label>
              <input
                type="number"
                value={format.font.size ?? ''}
                onChange={(e) => handleNumberChange(e.target.value, (num) => handleFontChange('size', num || 10.5))}
                className="input-field"
                min="6" max="72" step="0.5"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="label-text">粗体</label>
            <input type="checkbox" checked={format.font.bold} onChange={(e) => handleFontChange('bold', e.target.checked)} className="checkbox"/>
          </div>
          <div className="flex items-center justify-between">
            <label className="label-text">斜体</label>
            <input type="checkbox" checked={format.font.italic} onChange={(e) => handleFontChange('italic', e.target.checked)} className="checkbox"/>
          </div>
          <div className="flex items-center justify-between">
            <label className="label-text">下划线</label>
            <input type="checkbox" checked={format.font.underline} onChange={(e) => handleFontChange('underline', e.target.checked)} className="checkbox"/>
          </div>
          <div>
            <label className="label-text">颜色</label>
            <input type="color" value={format.font.color} onChange={(e) => handleFontChange('color', e.target.value)} className="color-input"/>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="段落" isOpen={expandedSections.paragraph} onToggle={() => toggleSection('paragraph')}>
          <div>
            <label className="label-text">对齐方式</label>
            <select value={format.paragraph.alignment} onChange={(e) => handleParagraphChange('alignment', e.target.value as any)} className="input-field">
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
              <option value="justify">两端对齐</option>
            </select>
          </div>
          <div>
            <label className="label-text">行高</label>
            <input type="number" value={format.paragraph.lineHeight ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleParagraphChange('lineHeight', num || 1.5))} className="input-field" min="1" step="0.1"/>
          </div>
          <div>
            <label className="label-text">段后距 (pt)</label>
            <input type="number" value={format.paragraph.paragraphSpacing ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleParagraphChange('paragraphSpacing', num || 0))} className="input-field" min="0" step="1"/>
          </div>
          <div>
            <label className="label-text">段前距 (pt)</label>
            <input type="number" value={format.paragraph.spaceBefore ?? ''} onChange={(e) => handleNumberChange(e.target.value, (num) => handleParagraphChange('spaceBefore', num || 0))} className="input-field" min="0" step="1"/>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="缩进" isOpen={expandedSections.indent} onToggle={() => toggleSection('indent')}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="label-text">首行缩进</label>
                <input 
                  type="number" 
                  value={format.paragraph.indent.firstLine ?? ''} 
                  onChange={(e) => handleNumberChange(e.target.value, (num) => handleIndentChange('firstLine', num || 0))} 
                  className="input-field" 
                  step="1"
                />
              </div>
              <div className="w-24">
                <label className="label-text">单位</label>
                <select 
                  value={format.paragraph.indent.firstLineUnit || 'pt'} 
                  onChange={(e) => handleIndentChange('firstLineUnit', e.target.value as any)}
                  className="input-field"
                >
                  <option value="pt">pt</option>
                  <option value="cm">cm</option>
                  <option value="px">px</option>
                  <option value="char">字符</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="label-text">左缩进</label>
                <input 
                  type="number" 
                  value={format.paragraph.indent.left ?? ''} 
                  onChange={(e) => handleNumberChange(e.target.value, (num) => handleIndentChange('left', num || 0))} 
                  className="input-field" 
                  min="0" 
                  step="1"
                />
              </div>
              <div className="w-24">
                <label className="label-text">单位</label>
                <select 
                  value={format.paragraph.indent.leftUnit || 'pt'} 
                  onChange={(e) => handleIndentChange('leftUnit', e.target.value as any)}
                  className="input-field"
                >
                  <option value="pt">pt</option>
                  <option value="cm">cm</option>
                  <option value="px">px</option>
                  <option value="char">字符</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <label className="label-text">右缩进</label>
                <input 
                  type="number" 
                  value={format.paragraph.indent.right ?? ''} 
                  onChange={(e) => handleNumberChange(e.target.value, (num) => handleIndentChange('right', num || 0))} 
                  className="input-field" 
                  min="0" 
                  step="1"
                />
              </div>
              <div className="w-24">
                <label className="label-text">单位</label>
                <select 
                  value={format.paragraph.indent.rightUnit || 'pt'} 
                  onChange={(e) => handleIndentChange('rightUnit', e.target.value as any)}
                  className="input-field"
                >
                  <option value="pt">pt</option>
                  <option value="cm">cm</option>
                  <option value="px">px</option>
                  <option value="char">字符</option>
                </select>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="页面" isOpen={expandedSections.page} onToggle={() => toggleSection('page')}>
          <div>
            <label className="label-text">页面方向</label>
            <select 
              value={format.page.orientation} 
              onChange={(e) => handlePageChange('orientation', e.target.value)}
              className="input-field"
            >
              <option value="portrait">纵向</option>
              <option value="landscape">横向</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MarginInput 
              label="上边距 (cm)" 
              valueInPt={format.page.margins.top} 
              onValueChange={(pt) => handlePageChange('margins.top', pt)} 
            />
            <MarginInput 
              label="下边距 (cm)" 
              valueInPt={format.page.margins.bottom} 
              onValueChange={(pt) => handlePageChange('margins.bottom', pt)} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MarginInput 
              label="左边距 (cm)" 
              valueInPt={format.page.margins.left} 
              onValueChange={(pt) => handlePageChange('margins.left', pt)} 
            />
            <MarginInput 
              label="右边距 (cm)" 
              valueInPt={format.page.margins.right} 
              onValueChange={(pt) => handlePageChange('margins.right', pt)} 
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="AI 默认设置" isOpen={expandedSections.ai} onToggle={() => toggleSection('ai')}>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              这是全局AI默认设置，仅用作新建AI内容块的初始配置。每个AI块可以在内部设置独立的AI配置。
            </p>
          </div>
          
          {/* 使用 SimpleAISettings 组件 */}
          <SimpleAISettings
            selectedModelId={aiSettings.defaultModelId || null}
            onModelChange={(modelId) => handleAiSettingsChange('defaultModelId', modelId)}
            temperature={aiSettings.temperature || 0.7}
            onTemperatureChange={(temp) => handleAiSettingsChange('temperature', temp)}
            maxLength={aiSettings.maxTokens || 3000}
            onMaxLengthChange={(length) => handleAiSettingsChange('maxTokens', length)}
            showAdvanced={aiSettings.defaultModelId !== 'maxkb'} // MaxKB时不显示高级参数
          />
          
          {/* MaxKB 配置 - 只在选择MaxKB时显示 */}
          {aiSettings.defaultModelId === 'maxkb' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">MaxKB 知识库配置</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MaxKB Base URL
                  </label>
                  <input
                    type="url"
                    value={aiSettings.maxkbBaseUrl || ''}
                    onChange={(e) => handleAiSettingsChange('maxkbBaseUrl', e.target.value)}
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
                    value={aiSettings.maxkbApiKey || ''}
                    onChange={(e) => handleAiSettingsChange('maxkbApiKey', e.target.value)}
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
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">默认系统提示词</label>
            <textarea 
              rows={3} 
              placeholder="定义AI的默认角色和行为" 
              value={aiSettings.systemPrompt || ''} 
              onChange={(e) => handleAiSettingsChange('systemPrompt', e.target.value)} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default FormatPanel;
