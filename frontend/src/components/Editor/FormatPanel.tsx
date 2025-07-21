import React, { useState } from 'react';
import useEditorStore from '../../stores/editorStore';
import { FontSettings, ParagraphSettings, IndentSettings } from '../../types';

// 定义标准字体和字号
const FONT_FAMILIES = [
  '宋体', '仿宋_GB2312', '楷体', '黑体', '微软雅黑', 
  'Arial', 'Times New Roman', 'Courier New', 'Verdana'
];

const FONT_SIZES: { [key: string]: number } = {
  '初号': 42, '小初': 36, '一号': 26, '小一': 24, '二号': 22, '小二': 18,
  '三号': 16, '小三': 15, '四号': 14, '小四': 12, '五号': 10.5, '小五': 9
};

// 可收缩的区域组件
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

const FormatPanel: React.FC = () => {
  const { 
    currentTemplate, 
    updateTemplateFormat, 
    aiSettings, 
    setAiSettings 
  } = useEditorStore();

  // 获取字号名称的函数
  const getSizeName = (size?: number) => {
    if (size === undefined) return '';
    return Object.keys(FONT_SIZES).find(name => FONT_SIZES[name] === size) || '';
  };

  // 管理各个区域的展开状态
  const [expandedSections, setExpandedSections] = useState({
    font: true,
    paragraph: false,
    indent: false,
    page: false,
    ai: false
  });

  // 切换区域展开状态
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 如果没有模板，不显示面板
  if (!currentTemplate) {
    return null;
  }

  const { format } = currentTemplate;

  const handleFontChange = <T extends keyof FontSettings>(key: T, value: FontSettings[T]) => {
    updateTemplateFormat({ font: { ...format.font, [key]: value } });
  };

  const handleParagraphChange = <T extends keyof ParagraphSettings>(key: T, value: ParagraphSettings[T]) => {
    updateTemplateFormat({ paragraph: { ...format.paragraph, [key]: value } });
  };

  const handleIndentChange = <T extends keyof IndentSettings>(key: T, value: IndentSettings[T]) => {
    updateTemplateFormat({ 
      paragraph: { 
        ...format.paragraph, 
        indent: { ...format.paragraph.indent, [key]: value } 
      } 
    });
  };

  const handlePageChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updateTemplateFormat({ 
        page: { 
          ...format.page, 
          [parent]: { ...(format.page[parent as keyof typeof format.page] as any), [child]: value } 
        } 
      });
    } else {
      updateTemplateFormat({ page: { ...format.page, [field]: value } });
    }
  };

  // 处理AI设置变化（仅用于全局设置）
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
        {/* 字体设置 */}
        <CollapsibleSection 
          title="字体" 
          isOpen={expandedSections.font} 
          onToggle={() => toggleSection('font')}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">字体</label>
              <select 
                value={format.font.family} 
                onChange={(e) => handleFontChange('family', e.target.value)}
                className="input-field"
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
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
                {Object.entries(FONT_SIZES).map(([name, size]) => (
                  <option key={name} value={size}>{name} ({size}pt)</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label-text">字号 (pt)</label>
              <input
                type="number"
                value={format.font.size}
                onChange={(e) => handleFontChange('size', Number(e.target.value))}
                className="input-field"
                min="6"
                max="72"
                step="0.5"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="label-text">粗体</label>
            <input
              type="checkbox"
              checked={format.font.bold}
              onChange={(e) => handleFontChange('bold', e.target.checked)}
              className="checkbox"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="label-text">斜体</label>
            <input
              type="checkbox"
              checked={format.font.italic}
              onChange={(e) => handleFontChange('italic', e.target.checked)}
              className="checkbox"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="label-text">下划线</label>
            <input
              type="checkbox"
              checked={format.font.underline}
              onChange={(e) => handleFontChange('underline', e.target.checked)}
              className="checkbox"
            />
          </div>
          <div>
            <label className="label-text">颜色</label>
            <input
              type="color"
              value={format.font.color}
              onChange={(e) => handleFontChange('color', e.target.value)}
              className="color-input"
            />
          </div>
        </CollapsibleSection>

        {/* 段落设置 */}
        <CollapsibleSection 
          title="段落" 
          isOpen={expandedSections.paragraph} 
          onToggle={() => toggleSection('paragraph')}
        >
          <div>
            <label className="label-text">对齐方式</label>
            <select 
              value={format.paragraph.alignment} 
              onChange={(e) => handleParagraphChange('alignment', e.target.value as any)}
              className="input-field"
            >
              <option value="left">左对齐</option>
              <option value="center">居中</option>
              <option value="right">右对齐</option>
              <option value="justify">两端对齐</option>
            </select>
          </div>
          <div>
            <label className="label-text">行高</label>
            <input
              type="number"
              value={format.paragraph.lineHeight}
              onChange={(e) => handleParagraphChange('lineHeight', Number(e.target.value))}
              className="input-field"
              min="1"
              step="0.1"
            />
          </div>
          <div>
            <label className="label-text">段落间距 (pt)</label>
            <input
              type="number"
              value={format.paragraph.paragraphSpacing}
              onChange={(e) => handleParagraphChange('paragraphSpacing', Number(e.target.value))}
              className="input-field"
              min="0"
              step="1"
            />
          </div>
        </CollapsibleSection>

        {/* 缩进设置 */}
        <CollapsibleSection 
          title="缩进" 
          isOpen={expandedSections.indent} 
          onToggle={() => toggleSection('indent')}
        >
          <div>
            <label className="label-text">左缩进 (pt)</label>
            <input
              type="number"
              value={format.paragraph.indent.left}
              onChange={(e) => handleIndentChange('left', Number(e.target.value))}
              className="input-field"
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="label-text">右缩进 (pt)</label>
            <input
              type="number"
              value={format.paragraph.indent.right}
              onChange={(e) => handleIndentChange('right', Number(e.target.value))}
              className="input-field"
              min="0"
              step="1"
            />
          </div>
          <div>
            <label className="label-text">首行缩进 (pt)</label>
            <input
              type="number"
              value={format.paragraph.indent.firstLine}
              onChange={(e) => handleIndentChange('firstLine', Number(e.target.value))}
              className="input-field"
              step="1"
            />
          </div>
        </CollapsibleSection>

        {/* 页面设置 */}
        <CollapsibleSection 
          title="页面" 
          isOpen={expandedSections.page} 
          onToggle={() => toggleSection('page')}
        >
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
            <div>
              <label className="label-text">上边距 (cm)</label>
              <input
                type="number"
                value={format.page.margins.top}
                onChange={(e) => handlePageChange('margins.top', Number(e.target.value))}
                className="input-field"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="label-text">下边距 (cm)</label>
              <input
                type="number"
                value={format.page.margins.bottom}
                onChange={(e) => handlePageChange('margins.bottom', Number(e.target.value))}
                className="input-field"
                min="0"
                step="0.1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">左边距 (cm)</label>
              <input
                type="number"
                value={format.page.margins.left}
                onChange={(e) => handlePageChange('margins.left', Number(e.target.value))}
                className="input-field"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="label-text">右边距 (cm)</label>
              <input
                type="number"
                value={format.page.margins.right}
                onChange={(e) => handlePageChange('margins.right', Number(e.target.value))}
                className="input-field"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* 全局AI默认设置 */}
        <CollapsibleSection 
          title="AI 默认设置" 
          isOpen={expandedSections.ai} 
          onToggle={() => toggleSection('ai')}
        >
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              这是全局AI默认设置，仅用作新建AI内容块的初始配置。每个AI块可以在内部设置独立的AI配置。
            </p>
          </div>
          
          <div>
            <label className="label-text">默认服务商</label>
            <select
              value={aiSettings.provider}
              onChange={(e) => handleAiSettingsChange('provider', e.target.value as 'qianwen' | 'maxkb')}
              className="input-field"
            >
              <option value="qianwen">通义千问</option>
              <option value="maxkb">MaxKB</option>
            </select>
          </div>

          {aiSettings.provider === 'maxkb' && (
            <>
              <div>
                <label className="label-text">默认 MaxKB Base URL</label>
                <input
                  type="url"
                  placeholder="https://maxkb.fit2cloud.com/api/application/xxx"
                  value={aiSettings.maxkbBaseUrl}
                  onChange={(e) => handleAiSettingsChange('maxkbBaseUrl', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">默认 MaxKB API Key</label>
                <input
                  type="password"
                  placeholder="输入您的默认MaxKB API Key"
                  value={aiSettings.maxkbApiKey}
                  onChange={(e) => handleAiSettingsChange('maxkbApiKey', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-text">默认 MaxKB 模型</label>
                <input
                  type="text"
                  placeholder="例如: gpt-3.5-turbo"
                  value={aiSettings.maxkbModel}
                  onChange={(e) => handleAiSettingsChange('maxkbModel', e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="label-text">默认系统提示词</label>
            <textarea
              rows={3}
              placeholder="定义AI的默认角色和行为"
              value={aiSettings.systemPrompt}
              onChange={(e) => handleAiSettingsChange('systemPrompt', e.target.value)}
              className="input-field"
            />
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
};

export default FormatPanel; 