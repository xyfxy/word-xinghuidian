import React, { useMemo, useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ContentBlock, TwoColumnContent, ImageContent, PageBreakContent } from '../../types';
import { Sparkles, Type, Loader, Settings, ChevronDown, ChevronRight, Image as ImageIcon, FileText, Upload, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Switch } from '@headlessui/react';
import BlockFormatPanel from './BlockFormatPanel';
import useEditorStore, { AiSettings } from '../../stores/editorStore';

interface ContentBlockEditorProps {
    block: ContentBlock;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<ContentBlock>) => void;
    onGenerateAI: () => void;
    isGenerating: boolean;
}

// 深拷贝AI设置的辅助函数
const deepCloneAiSettings = (settings: AiSettings): AiSettings => {
  return {
    provider: settings.provider,
    maxkbBaseUrl: settings.maxkbBaseUrl,
    maxkbApiKey: settings.maxkbApiKey,
    maxkbModel: settings.maxkbModel,
    systemPrompt: settings.systemPrompt,
  };
};

// AI设置面板组件
const AiSettingsPanel: React.FC<{
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
}> = ({ block, onUpdate }) => {
  const { aiSettings } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [formAiSettings, setFormAiSettings] = useState<AiSettings>(
    block.aiSettings ? deepCloneAiSettings(block.aiSettings) : deepCloneAiSettings(aiSettings)
  );
  const [isAiSettingsChanged, setIsAiSettingsChanged] = useState(false);

  // 同步AI块设置到本地表单状态
  useEffect(() => {
    const blockSettings = block.aiSettings 
      ? deepCloneAiSettings(block.aiSettings)
      : deepCloneAiSettings(aiSettings);
    setFormAiSettings(blockSettings);
    setIsAiSettingsChanged(false);
  }, [block.aiSettings, aiSettings]);

  // 处理AI设置变化
  const handleAiSettingsChange = <T extends keyof AiSettings>(key: T, value: AiSettings[T]) => {
    setFormAiSettings(prev => ({ ...prev, [key]: value }));
    setIsAiSettingsChanged(true);
  };

  // 应用AI设置变化
  const applyAiSettingsChange = () => {
    onUpdate({ 
      aiSettings: deepCloneAiSettings(formAiSettings) 
    });
    setIsAiSettingsChanged(false);
  };

  // 重置AI设置为全局设置
  const resetAiSettings = () => {
    setFormAiSettings(deepCloneAiSettings(aiSettings));
    onUpdate({ 
      aiSettings: deepCloneAiSettings(aiSettings) 
    });
    setIsAiSettingsChanged(false);
  };

  // 移除AI设置，使用全局设置
  const useGlobalSettings = () => {
    onUpdate({ aiSettings: undefined });
    setFormAiSettings(deepCloneAiSettings(aiSettings));
    setIsAiSettingsChanged(false);
  };

  return (
    <div className="mt-3 border border-gray-200 rounded-lg">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">AI设置</span>
          {block.aiSettings && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
              {block.aiSettings.provider === 'maxkb' ? 'MaxKB' : '通义千问'}
            </span>
          )}
          {!block.aiSettings && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
              使用全局设置
            </span>
          )}
        </div>
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
      
      {isExpanded && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          {/* 设置状态说明 */}
          <div className="mb-4">
            {block.aiSettings ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  此AI块使用独立设置，不会影响其他AI块或全局设置。
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  此AI块使用全局默认设置。设置独立配置后将不再跟随全局设置变化。
                </p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              {!block.aiSettings && (
                <button
                  onClick={applyAiSettingsChange}
                  className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  设置独立配置
                </button>
              )}
              {block.aiSettings && (
                <button
                  onClick={useGlobalSettings}
                  className="text-xs px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  使用全局设置
                </button>
              )}
            </div>
            
            {isAiSettingsChanged && (
              <div className="flex gap-2">
                <button
                  onClick={resetAiSettings}
                  className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                >
                  重置
                </button>
                <button
                  onClick={applyAiSettingsChange}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  应用
                </button>
              </div>
            )}
          </div>

          {/* AI设置表单 */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务商</label>
              <select
                value={formAiSettings.provider}
                onChange={(e) => handleAiSettingsChange('provider', e.target.value as 'qianwen' | 'maxkb')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="qianwen">通义千问</option>
                <option value="maxkb">MaxKB</option>
              </select>
            </div>

            {formAiSettings.provider === 'maxkb' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MaxKB Base URL</label>
                  <input
                    type="url"
                    placeholder="https://maxkb.fit2cloud.com/api/application/xxx"
                    value={formAiSettings.maxkbBaseUrl}
                    onChange={(e) => handleAiSettingsChange('maxkbBaseUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MaxKB API Key</label>
                  <input
                    type="password"
                    placeholder="输入您的MaxKB API Key"
                    value={formAiSettings.maxkbApiKey}
                    onChange={(e) => handleAiSettingsChange('maxkbApiKey', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MaxKB 模型</label>
                  <input
                    type="text"
                    placeholder="例如: gpt-3.5-turbo"
                    value={formAiSettings.maxkbModel}
                    onChange={(e) => handleAiSettingsChange('maxkbModel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">系统提示词</label>
              <textarea
                rows={3}
                placeholder="定义AI的角色和行为"
                value={formAiSettings.systemPrompt}
                onChange={(e) => handleAiSettingsChange('systemPrompt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* 配置验证提示 */}
          {formAiSettings.provider === 'maxkb' && 
           (!formAiSettings.maxkbBaseUrl || !formAiSettings.maxkbApiKey) && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                MaxKB配置不完整，请填写完整的Base URL和API Key。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 图片编辑组件
const ImageEditor: React.FC<{
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
}> = ({ block, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContent = block.content as ImageContent;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片文件大小不能超过5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onUpdate({
          content: {
            ...imageContent,
            src: result,
            alt: file.name
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageFromUrl = () => {
    const url = prompt('请输入图片URL:');
    if (url) {
      onUpdate({
        content: {
          ...imageContent,
          src: url,
        }
      });
    }
  };

  const handleImageChange = <K extends keyof ImageContent>(key: K, value: ImageContent[K]) => {
    onUpdate({
      content: {
        ...imageContent,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 图片源设置 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-800">图片源</h4>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            上传图片
          </button>
          <button
            onClick={handleImageFromUrl}
            className="btn-secondary"
          >
            从URL添加
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        {imageContent.src && (
          <div className="relative">
            <img
              src={imageContent.src}
              alt={imageContent.alt}
              className="max-w-full h-auto max-h-48 rounded border"
            />
            <button
              onClick={() => handleImageChange('src', '')}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 图片设置 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">宽度 (px)</label>
          <input
            type="number"
            value={imageContent.width || ''}
            onChange={(e) => handleImageChange('width', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min="10"
            max="1000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">高度 (px)</label>
          <input
            type="number"
            value={imageContent.height || ''}
            onChange={(e) => handleImageChange('height', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min="10"
            max="1000"
          />
        </div>
      </div>

      {/* 对齐方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">对齐方式</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleImageChange('alignment', 'left')}
            className={`p-2 rounded border ${imageContent.alignment === 'left' ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300'}`}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleImageChange('alignment', 'center')}
            className={`p-2 rounded border ${imageContent.alignment === 'center' ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300'}`}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleImageChange('alignment', 'right')}
            className={`p-2 rounded border ${imageContent.alignment === 'right' ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-300'}`}
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleImageChange('alignment', 'auto')}
            className={`p-2 rounded border ${imageContent.alignment === 'auto' ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'}`}
            title="自适应(宽度100%)"
          >
            <span className="font-bold text-xs">自适应</span>
          </button>
        </div>
      </div>

      {/* 图片标题 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图片标题</label>
        <input
          type="text"
          value={imageContent.caption || ''}
          onChange={(e) => handleImageChange('caption', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="可选的图片标题"
        />
      </div>

      {/* 图片描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图片描述</label>
        <input
          type="text"
          value={imageContent.alt}
          onChange={(e) => handleImageChange('alt', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="图片的描述信息"
        />
      </div>

      {/* 边框设置 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">启用边框</label>
          <Switch
            checked={imageContent.border?.enabled || false}
            onChange={(checked) => handleImageChange('border', { 
              enabled: checked,
              color: imageContent.border?.color || '#000000',
              width: imageContent.border?.width || 1,
              style: imageContent.border?.style || 'solid'
            })}
            className={`${imageContent.border?.enabled ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span className={`${imageContent.border?.enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
          </Switch>
        </div>

        {imageContent.border?.enabled && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">颜色</label>
              <input
                type="color"
                value={imageContent.border?.color || '#000000'}
                onChange={(e) => handleImageChange('border', { 
                  enabled: imageContent.border?.enabled || false,
                  color: e.target.value,
                  width: imageContent.border?.width || 1,
                  style: imageContent.border?.style || 'solid'
                })}
                className="w-full h-10 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">宽度</label>
              <input
                type="number"
                value={imageContent.border?.width || 1}
                onChange={(e) => handleImageChange('border', { 
                  enabled: imageContent.border?.enabled || false,
                  color: imageContent.border?.color || '#000000',
                  width: Number(e.target.value),
                  style: imageContent.border?.style || 'solid'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">样式</label>
              <select
                value={imageContent.border?.style || 'solid'}
                onChange={(e) => handleImageChange('border', { 
                  enabled: imageContent.border?.enabled || false,
                  color: imageContent.border?.color || '#000000',
                  width: imageContent.border?.width || 1,
                  style: e.target.value as 'solid' | 'dashed' | 'dotted'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
                <option value="dotted">点线</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 换页编辑组件
const PageBreakEditor: React.FC<{
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
}> = ({ block, onUpdate }) => {
  const pageBreakContent = block.content as PageBreakContent;

  const handlePageBreakChange = <K extends keyof PageBreakContent['settings']>(key: K, value: PageBreakContent['settings'][K]) => {
    onUpdate({
      content: {
        ...pageBreakContent,
        settings: {
          ...pageBreakContent.settings,
          [key]: value
        }
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">换页设置</h4>
            <p className="text-sm text-blue-700">此块将在文档中插入分页符</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">添加空白页</label>
          <Switch
            checked={pageBreakContent.settings.addBlankPage}
            onChange={(checked) => handlePageBreakChange('addBlankPage', checked)}
            className={`${pageBreakContent.settings.addBlankPage ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span className={`${pageBreakContent.settings.addBlankPage ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
          </Switch>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">页面方向</label>
          <select
            value={pageBreakContent.settings.pageOrientation || 'portrait'}
            onChange={(e) => handlePageBreakChange('pageOrientation', e.target.value as 'portrait' | 'landscape')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="portrait">纵向</option>
            <option value="landscape">横向</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
    block,
    isSelected,
    onSelect,
    onUpdate,
    onGenerateAI,
    isGenerating,
}) => {
    const isAiBlock = block.type === 'ai-generated';
    const { expandedBlocks, setBlockExpanded } = useEditorStore();
    
    // 从store获取展开状态，如果不存在则默认为false（新内容块收缩）
    const isExpanded = expandedBlocks[block.id] ?? false;
    const setIsExpanded = (expanded: boolean) => setBlockExpanded(block.id, expanded);

    const blockStyle = useMemo(() => {
        const border = block.format?.paragraph?.border?.bottom;
        if (!border || border.style === 'none') {
            return {};
        }

        const style: React.CSSProperties = {
            borderBottomStyle: border.style === 'thickThin' ? 'double' : (border.style as any),
            borderBottomColor: border.color,
            borderBottomWidth: `${border.size}pt`,
            paddingBottom: `${border.space}pt`,
        };
        return style;
    }, [block.format]);

    const handleFormatChange = (useGlobal: boolean) => {
        onUpdate({
            format: {
                ...block.format,
                useGlobalFormat: useGlobal,
            },
        });
    };
    
    const handleTwoColumnChange = (part: 'left' | 'right', value: string) => {
        if (block.type !== 'two-column') return;
        const currentContent = block.content as TwoColumnContent;
        onUpdate({ 
            content: {
                ...currentContent,
                [part]: value
            }
        });
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ],
    };

    // 获取内容块图标
    const getBlockIcon = () => {
        switch (block.type) {
            case 'ai-generated':
                return <Sparkles className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" />;
            case 'two-column':
                return <Type className="h-5 w-5 mr-2 text-purple-500 flex-shrink-0" />;
            case 'image':
                return <ImageIcon className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />;
            case 'page-break':
                return <FileText className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0" />;
            default:
                return <Type className="h-5 w-5 mr-2 text-green-500 flex-shrink-0" />;
        }
    };

    return (
        <div
            onClick={onSelect}
            className={`card p-4 transition-all duration-300 ${isSelected ? 'shadow-xl ring-2 ring-primary-500' : 'hover:shadow-lg'
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    {/* 展开/收缩按钮 */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="p-1 hover:bg-gray-100 rounded mr-2 flex-shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                    </button>
                    
                    {getBlockIcon()}
                    <input
                        type="text"
                        value={block.title || ''}
                        onChange={(e) => onUpdate({ title: e.target.value })}
                        className="font-semibold bg-transparent border-none outline-none focus:ring-0"
                    />
                </div>

                {/* 只有非换页块才显示自定义格式选项 */}
                {block.type !== 'page-break' && (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">自定义格式</span>
                        <Switch
                            checked={!block.format?.useGlobalFormat}
                            onChange={(checked) => handleFormatChange(!checked)}
                            className={`${!block.format?.useGlobalFormat ? 'bg-primary-600' : 'bg-gray-200'
                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                        >
                            <span
                                className={`${!block.format?.useGlobalFormat ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </Switch>
                    </div>
                )}
            </div>

            {/* 只在展开状态下显示内容 */}
            {isExpanded && (
                <div className="transition-all duration-300 ease-in-out">
                    {!block.format?.useGlobalFormat && block.type !== 'page-break' && (
                         <BlockFormatPanel block={block} onUpdate={onUpdate} />
                    )}

                    {/* AI生成块 */}
                    {isAiBlock && (
                        <div className="my-4 space-y-3">
                            <div className="flex justify-between items-center">
                               <h4 className="text-sm font-medium text-gray-800">AI 生成指令</h4>
                            </div>
                            
                            <textarea
                                value={block.aiPrompt || ''}
                                onChange={(e) => onUpdate({ aiPrompt: e.target.value })}
                                placeholder="输入AI生成提示词..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                rows={3}
                            />
                            
                            <button
                                onClick={onGenerateAI}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader className="animate-spin h-4 w-4 mr-2" />
                                        生成中...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        生成内容
                                    </>
                                )}
                            </button>

                            {/* AI设置面板 */}
                            <AiSettingsPanel block={block} onUpdate={onUpdate} />
                        </div>
                    )}

                    {/* 图片块 */}
                    {block.type === 'image' && (
                        <div className="my-4">
                            <ImageEditor block={block} onUpdate={onUpdate} />
                        </div>
                    )}

                    {/* 换页块 */}
                    {block.type === 'page-break' && (
                        <div className="my-4">
                            <PageBreakEditor block={block} onUpdate={onUpdate} />
                        </div>
                    )}
                    
                    {/* 双栏文本块 */}
                    {block.type === 'two-column' && (
                        <div className="my-4">
                            <div className="flex justify-between items-center">
                                <input
                                    type="text"
                                    value={(block.content as TwoColumnContent).left}
                                    onChange={(e) => handleTwoColumnChange('left', e.target.value)}
                                    className="p-1 bg-transparent border-none outline-none focus:ring-0"
                                    style={{ width: `${(block.format.columnRatio || 0.5) * 100}%` }}
                                    placeholder="左侧内容"
                                />
                                 <input
                                    type="text"
                                    value={(block.content as TwoColumnContent).right}
                                    onChange={(e) => handleTwoColumnChange('right', e.target.value)}
                                    className="p-1 bg-transparent border-none outline-none focus:ring-0 text-right"
                                    style={{ width: `${(1 - (block.format.columnRatio || 0.5)) * 100}%` }}
                                    placeholder="右侧内容"
                                />
                            </div>
                        </div>
                    )}

                    {/* 文本块 */}
                    {(block.type === 'text' || block.type === 'ai-generated') && (
                        <ReactQuill
                            theme="snow"
                            value={block.content as string}
                            onChange={(content) => onUpdate({ content })}
                            modules={quillModules}
                            style={blockStyle}
                        />
                    )}
                </div>
            )}
            
            {/* 收缩状态下显示内容预览 */}
            {!isExpanded && (
                <div className="py-2 text-sm text-gray-500 border-t border-gray-100">
                    {block.type === 'two-column' ? (
                        <div className="flex">
                            <span className="flex-1 truncate">
                                {(block.content as TwoColumnContent).left || '左侧内容...'}
                            </span>
                            <span className="mx-2">|</span>
                            <span className="flex-1 truncate">
                                {(block.content as TwoColumnContent).right || '右侧内容...'}
                            </span>
                        </div>
                    ) : block.type === 'image' ? (
                        <div className="flex items-center">
                            <ImageIcon className="h-4 w-4 mr-2" />
                            <span className="truncate">
                                {(block.content as ImageContent).src 
                                    ? `图片: ${(block.content as ImageContent).alt || '未命名图片'}`
                                    : '点击展开设置图片...'
                                }
                            </span>
                        </div>
                    ) : block.type === 'page-break' ? (
                        <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>
                                换页 {(block.content as PageBreakContent).settings.addBlankPage && '+ 空白页'}
                            </span>
                        </div>
                    ) : (
                        <div className="truncate">
                            {typeof block.content === 'string' && block.content.length > 0 
                                ? block.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                                : isAiBlock 
                                    ? (block.aiPrompt || '点击展开设置AI生成指令...')
                                    : '点击展开编辑内容...'
                            }
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ContentBlockEditor; 