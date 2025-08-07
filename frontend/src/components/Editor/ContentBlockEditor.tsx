import React, { useMemo, useRef, lazy, Suspense, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

// 懒加载 ReactQuill 以提升性能
const ReactQuill = lazy(() => import('react-quill'));
import { ContentBlock, TwoColumnContent, ImageContent, PageBreakContent, TableContent } from '../../types';
import { Sparkles, Type, Loader, ChevronDown, ChevronRight, Image as ImageIcon, FileText, Upload, AlignLeft, AlignCenter, AlignRight, Table, File, X } from 'lucide-react';
import { Switch } from '@headlessui/react';
import BlockFormatPanel from './BlockFormatPanel';
import TableEditor from './TableEditor';
import useEditorStore from '../../stores/editorStore';
import { AIBlockSettings } from './AIBlockSettings';
import documentService from '../../services/documentService';

interface ContentBlockEditorProps {
    block: ContentBlock;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<ContentBlock>) => void;
    onGenerateAI: () => void;
    isGenerating: boolean;
}

// 已删除未使用的 deepCloneAiSettings 函数

// 已删除未使用的 AiSettingsPanel 组件

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

    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ],
    }), []);

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
            case 'table':
                return <Table className="h-5 w-5 mr-2 text-indigo-500 flex-shrink-0" />;
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
                        <AIGeneratorBlock
                            block={block}
                            onUpdate={onUpdate}
                            onGenerateAI={onGenerateAI}
                            isGenerating={isGenerating}
                        />
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

                    {/* 表格块 */}
                    {block.type === 'table' && (
                        <div className="my-4">
                            <TableEditor 
                                content={block.content as TableContent}
                                onChange={(content) => onUpdate({ content })}
                                disabled={false}
                            />
                        </div>
                    )}

                    {/* 文本块 */}
                    {(block.type === 'text' || block.type === 'ai-generated') && (
                        <Suspense fallback={<div className="h-32 flex items-center justify-center text-gray-400">加载编辑器...</div>}>
                            <ReactQuill
                                theme="snow"
                                value={block.content as string}
                                onChange={(content) => onUpdate({ content })}
                                modules={quillModules}
                                style={blockStyle}
                            />
                        </Suspense>
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
                    ) : block.type === 'table' ? (
                        <div className="flex items-center">
                            <Table className="h-4 w-4 mr-2" />
                            <span>
                                表格 {(block.content as TableContent)?.rows?.length || 0}×{(block.content as TableContent)?.rows?.[0]?.length || 0}
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

// AI生成块组件
const AIGeneratorBlock: React.FC<{
    block: ContentBlock;
    onUpdate: (updates: Partial<ContentBlock>) => void;
    onGenerateAI: () => void;
    isGenerating: boolean;
}> = ({ block, onUpdate, onGenerateAI, isGenerating }) => {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [extractedContents, setExtractedContents] = useState<Map<string, string>>(new Map());
    const [isExtracting, setIsExtracting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        // 验证文件
        const validation = documentService.validateFiles(files);
        
        if (validation.invalid.length > 0) {
            const invalidMessages = validation.invalid.map(
                ({ file, reason }) => `${file.name}: ${reason}`
            ).join('\n');
            alert(`以下文件无法上传：\n${invalidMessages}`);
        }

        if (validation.valid.length === 0) return;

        // 添加到已上传文件列表
        const newFiles = [...uploadedFiles, ...validation.valid];
        setUploadedFiles(newFiles);
        setIsExtracting(true);

        try {
            const result = await documentService.extractTextFromDocuments(validation.valid);
            if (result.success && result.data) {
                const newContents = new Map(extractedContents);
                
                result.data.files.forEach(file => {
                    if (file.success && file.text) {
                        newContents.set(file.fileName, file.text);
                    }
                });
                
                setExtractedContents(newContents);
                
                // 更新提示词
                updatePromptWithDocuments(newContents);
                
                if (result.data.failedCount > 0) {
                    alert(`${result.data.failedCount} 个文件解析失败`);
                }
            }
        } catch (error) {
            console.error('提取文档文本错误:', error);
            alert('提取文档文本失败，请重试');
        } finally {
            setIsExtracting(false);
            // 清空文件输入
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const updatePromptWithDocuments = (contents: Map<string, string>) => {
        const basePrompt = block.aiPrompt?.split('\n===== 文档内容 ====')[0] || '';
        
        if (contents.size === 0) {
            onUpdate({ aiPrompt: basePrompt });
            return;
        }
        
        let documentsText = '\n===== 文档内容 =====\n\n';
        
        contents.forEach((text, fileName) => {
            documentsText += `\u3010${fileName}\u3011\n${text}\n\n`;
        });
        
        const newPrompt = basePrompt + documentsText;
        onUpdate({ aiPrompt: newPrompt });
    };

    const handleRemoveFile = (fileName: string) => {
        const newFiles = uploadedFiles.filter(f => f.name !== fileName);
        setUploadedFiles(newFiles);
        
        const newContents = new Map(extractedContents);
        newContents.delete(fileName);
        setExtractedContents(newContents);
        
        updatePromptWithDocuments(newContents);
    };

    const handleRemoveAllFiles = () => {
        setUploadedFiles([]);
        setExtractedContents(new Map());
        
        const basePrompt = block.aiPrompt?.split('\n===== 文档内容 ====')[0] || '';
        onUpdate({ aiPrompt: basePrompt });
    };

    return (
        <div className="my-4 space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-800">AI 生成指令</h4>
            </div>
            
            {/* 输入方式选择 */}
            <div className="space-y-3">
                {/* 文本输入区域 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">提示词</label>
                    <textarea
                        value={block.aiPrompt?.split('\n===== 文档内容 ====')[0] || ''}
                        onChange={(e) => {
                            const basePrompt = e.target.value;
                            const documentsSection = block.aiPrompt?.split('\n===== 文档内容 ====')[1] || '';
                            const newPrompt = documentsSection 
                                ? basePrompt + '\n===== 文档内容 ====' + documentsSection
                                : basePrompt;
                            onUpdate({ aiPrompt: newPrompt });
                        }}
                        placeholder="输入AI生成提示词..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                        rows={4}
                        disabled={isExtracting}
                    />
                </div>

                {/* 文档上传区域 */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            参考文档 ({uploadedFiles.length}/10)
                        </label>
                        {uploadedFiles.length > 0 && (
                            <button
                                onClick={handleRemoveAllFiles}
                                className="text-xs text-red-600 hover:text-red-800"
                            >
                                清除所有
                            </button>
                        )}
                    </div>
                    
                    {/* 已上传文件列表 */}
                    {uploadedFiles.length > 0 && (
                        <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
                            {uploadedFiles.map((file) => (
                                <div key={file.name} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                    <div className="flex items-center space-x-2 flex-1">
                                        <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                                {extractedContents.has(file.name) && (
                                                    <span className="ml-2 text-green-600">
                                                        ✓ 已解析
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFile(file.name)}
                                        className="p-1 hover:bg-gray-100 rounded ml-2"
                                        disabled={isExtracting}
                                    >
                                        <X className="h-4 w-4 text-gray-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* 上传按钮 */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                                拖拽文档到此处或点击选择
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isExtracting || uploadedFiles.length >= 10}
                                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                            >
                                选择文档
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                支持 .docx, .doc, .txt 格式，单个文件最大10MB
                            </p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".doc,.docx,.txt"
                        onChange={handleFileUpload}
                        multiple
                        className="hidden"
                    />
                </div>

                {/* 文档内容预览 */}
                {extractedContents.size > 0 && (
                    <div>
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                            {showPreview ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                            预览文档内容 ({extractedContents.size} 个文件)
                        </button>
                        
                        {showPreview && (
                            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                                {Array.from(extractedContents.entries()).map(([fileName, content]) => (
                                    <div key={fileName} className="bg-gray-50 p-3 rounded border border-gray-200">
                                        <h5 className="text-sm font-medium text-gray-700 mb-1">【{fileName}】</h5>
                                        <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                                            {content.substring(0, 500)}
                                            {content.length > 500 && '...'}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {isExtracting && (
                    <div className="flex items-center justify-center py-2">
                        <Loader className="animate-spin h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm text-gray-600">正在解析文档内容...</span>
                    </div>
                )}
            </div>

            <button
                onClick={onGenerateAI}
                disabled={isGenerating || isExtracting || (!block.aiPrompt?.trim() && uploadedFiles.length === 0)}
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
            <AIBlockSettings 
                block={block} 
                onUpdate={onUpdate}
                defaultModelId={null}
                defaultSystemPrompt="你是一个专业的文档编写助手。"
            />
        </div>
    );
};

export default ContentBlockEditor; 