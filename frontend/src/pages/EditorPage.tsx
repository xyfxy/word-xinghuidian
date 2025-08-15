import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Save, Eye, Download, Settings, Sparkles, X, ChevronUp, ChevronDown, Edit, Type, Image, FileText, Table } from 'lucide-react';
import useEditorStore from '../stores/editorStore';
import { createDefaultTemplate, createDefaultContentBlock, exportToWord, validateAiSettingsIndependence } from '../utils/document';
import { formatMaxKbContent } from '../utils/markdown';
import { aiService, templateService } from '../services/api';
import ContentBlockEditor from '../components/Editor/ContentBlockEditor';
import FormatPanel from '../components/Editor/FormatPanel';
import PreviewPanel from '../components/Editor/PreviewPanel';

const AddBlockButtons: React.FC<{ 
  onAdd: (type: 'text' | 'ai-generated' | 'two-column' | 'image' | 'page-break' | 'table', insertPosition?: number) => void; 
  className?: string;
  insertPosition?: number;
  showText?: boolean;
}> = ({ onAdd, className = '', insertPosition, showText = true }) => (
  <div className={`flex justify-center items-center flex-wrap gap-4 ${className}`}>
    <button
      onClick={() => onAdd('text', insertPosition)}
      className="btn-secondary flex items-center"
    >
      <Plus className="h-4 w-4 mr-2" />
      {showText ? '添加固定内容' : '固定内容'}
    </button>
    <button
      onClick={() => onAdd('two-column', insertPosition)}
      className="btn-secondary flex items-center"
    >
      <Plus className="h-4 w-4 mr-2" />
      {showText ? '添加双栏文本' : '双栏文本'}
    </button>
    <button
      onClick={() => onAdd('image', insertPosition)}
      className="btn-secondary flex items-center"
    >
      <Image className="h-4 w-4 mr-2" />
      {showText ? '添加图片' : '图片'}
    </button>
    <button
      onClick={() => onAdd('page-break', insertPosition)}
      className="btn-secondary flex items-center"
    >
      <FileText className="h-4 w-4 mr-2" />
      {showText ? '添加换页' : '换页'}
    </button>
    <button
      onClick={() => onAdd('table', insertPosition)}
      className="btn-secondary flex items-center"
    >
      <Table className="h-4 w-4 mr-2" />
      {showText ? '添加表格' : '表格'}
    </button>
    <button
      onClick={() => onAdd('ai-generated', insertPosition)}
      className="btn-primary flex items-center"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {showText ? '添加AI生成内容' : 'AI生成'}
    </button>
  </div>
);

const InsertBlockButton: React.FC<{
  onAdd: (type: 'text' | 'ai-generated' | 'two-column' | 'image' | 'page-break' | 'table', insertPosition?: number) => void;
  insertPosition: number;
}> = ({ onAdd, insertPosition }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAddBlock = (type: 'text' | 'ai-generated' | 'two-column' | 'image' | 'page-break' | 'table') => {
    onAdd(type, insertPosition);
    setIsMenuOpen(false);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="relative group/insert flex justify-center my-2">
      <div className="insert-line"></div>
      <div className="insert-dropdown" ref={dropdownRef}>
        <button 
          className="insert-plus-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Plus className="h-4 w-4" />
        </button>
        {isMenuOpen && (
          <div className="insert-menu">
            <button
              onClick={() => handleAddBlock('text')}
              className="insert-menu-item"
            >
              <Type className="h-4 w-4" />
              固定内容
            </button>
            <button
              onClick={() => handleAddBlock('two-column')}
              className="insert-menu-item"
            >
              <Type className="h-4 w-4" />
              双栏文本
            </button>
            <button
              onClick={() => handleAddBlock('image')}
              className="insert-menu-item"
            >
              <Image className="h-4 w-4" />
              图片
            </button>
            <button
              onClick={() => handleAddBlock('page-break')}
              className="insert-menu-item"
            >
              <FileText className="h-4 w-4" />
              换页
            </button>
            <button
              onClick={() => handleAddBlock('table')}
              className="insert-menu-item"
            >
              <Table className="h-4 w-4" />
              表格
            </button>
            <button
              onClick={() => handleAddBlock('ai-generated')}
              className="insert-menu-item"
            >
              <Sparkles className="h-4 w-4" />
              AI生成内容
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const EditorPage: React.FC = () => {
  const {
    currentTemplate,
    isLoading,
    selectedBlock,
    previewMode,
    previewWidth,
    expandedBlocks,
    setCurrentTemplate,
    setLoading,
    setSelectedBlock,
    setPreviewMode,
    setPreviewWidth,
    toggleAllBlocks,
    addContentBlock,
    updateContentBlock,
    removeContentBlock,
    convertBlockType,
    aiSettings,
  } = useEditorStore();

  const [showFormatPanel, setShowFormatPanel] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // 初始化默认模板
  useEffect(() => {
    if (!currentTemplate) {
      const defaultTemplate = createDefaultTemplate();
      setCurrentTemplate(defaultTemplate);
    }
  }, [currentTemplate, setCurrentTemplate]);

  // 处理预览面板大小调整
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300;
    const maxWidth = Math.min(800, window.innerWidth * 0.6);
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setPreviewWidth(clampedWidth);
  }, [isResizing, setPreviewWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // 添加内容块
  const handleAddContentBlock = (type: 'text' | 'ai-generated' | 'two-column' | 'image' | 'page-break' | 'table', insertPosition?: number) => {
    if (!currentTemplate) return;

    const position = insertPosition !== undefined ? insertPosition : currentTemplate.content.length;
    const newBlock = createDefaultContentBlock(type, position);
    
    // 如果是AI块，则附加当前的AI设置为默认值（深拷贝）
    if (newBlock.type === 'ai-generated') {
      newBlock.aiSettings = {
        provider: aiSettings.provider,
        maxkbBaseUrl: aiSettings.maxkbBaseUrl,
        maxkbApiKey: aiSettings.maxkbApiKey,
        systemPrompt: aiSettings.systemPrompt,
      };
    }

    addContentBlock(newBlock, insertPosition);
    setSelectedBlock(newBlock.id);
    
    // 验证AI设置独立性（仅在开发模式下）
    if (process.env.NODE_ENV === 'development' && type === 'ai-generated') {
      setTimeout(() => {
        if (currentTemplate) {
          validateAiSettingsIndependence(currentTemplate);
        }
      }, 100);
    }
  };

  // 生成AI内容
  const handleGenerateAI = async (blockId: string) => {
    if (!currentTemplate) return;

    const block = currentTemplate.content.find(b => b.id === blockId);
    if (!block || block.type !== 'ai-generated' || !block.aiPrompt) {
      alert('请先设置AI提示词');
      return;
    }
    
    setIsGenerating(true);
    try {
      let result;
      
      // 处理提示词中的内容块引用
      let processedPrompt = block.aiPrompt
      
      // 查找并替换 {{blockId}} 格式的引用
      const blockRefs = processedPrompt.match(/\{\{([^}]+)\}\}/g)
      if (blockRefs) {
        blockRefs.forEach(ref => {
          const refBlockId = ref.replace(/\{\{|\}\}/g, '')
          const refBlock = currentTemplate.content.find(b => b.id === refBlockId)
          if (refBlock && typeof refBlock.content === 'string') {
            processedPrompt = processedPrompt.replace(ref, refBlock.content)
          }
        })
      }
      
      // 检查是否使用新的模型管理方式
      if (block.modelId) {
        // 使用新的模型管理API
        const systemPrompt = block.systemPrompt || '你是一个专业的文档编写助手。';
        
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'system' as const, content: processedPrompt }
        ];
        
        if (block.modelId === 'maxkb') {
          // 特殊处理MaxKB（保持兼容）
          const blockAiSettings = block.aiSettings || aiSettings;
          if (!blockAiSettings.maxkbBaseUrl || !blockAiSettings.maxkbApiKey) {
            alert('请先在AI设置中配置MaxKB的Base URL和API Key');
            setIsGenerating(false);
            return;
          }
          result = await aiService.generateMaxKbContent({
            baseUrl: blockAiSettings.maxkbBaseUrl,
            apiKey: blockAiSettings.maxkbApiKey,
            messages: messages,
            maxTokens: block.maxTokens || 3000,
          });
        } else {
          // 使用模型管理中的模型
          result = await aiService.generateWithModel({
            modelId: block.modelId,
            messages: messages,
            temperature: block.temperature || 0.7,
            maxTokens: block.maxTokens || 3000,
          });
        }
      } else {
        // 向后兼容：使用全局默认设置
        const effectiveModelId = aiSettings.defaultModelId || 'maxkb';
        const blockAiSettings = block.aiSettings || aiSettings;
        
        if (effectiveModelId === 'maxkb') {
          // 使用MaxKB
          if (!blockAiSettings.maxkbBaseUrl || !blockAiSettings.maxkbApiKey) {
            alert('请先在AI设置中配置MaxKB的Base URL和API Key');
            setIsGenerating(false);
            return;
          }
          result = await aiService.generateMaxKbContent({
            baseUrl: blockAiSettings.maxkbBaseUrl,
            apiKey: blockAiSettings.maxkbApiKey,
            messages: [
              { role: 'system' as const, content: blockAiSettings.systemPrompt || '你是一个专业的文档编写助手。' },
              { role: 'system' as const, content: processedPrompt },
            ],
            maxTokens: block.maxTokens || 3000,
          });
        } else {
          // 使用全局默认模型
          const systemPrompt = blockAiSettings.systemPrompt || '你是一个专业的文档编写助手。';
          
          const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'system' as const, content: processedPrompt }
          ];
          
          result = await aiService.generateWithModel({
            modelId: effectiveModelId,
            messages: messages,
            temperature: block.temperature || aiSettings.temperature || 0.7,
            maxTokens: block.maxTokens || aiSettings.maxTokens || 3000,
          });
        }
      }

      if (result.success && result.content) {
        // 对所有内容进行Markdown解析，以支持**加粗**、*斜体*等格式
        const formattedContent = await formatMaxKbContent(result.content);
        updateContentBlock(blockId, { content: formattedContent });
        alert('AI内容生成成功！');
      } else {
        alert(result.error || 'AI内容生成失败');
      }
    } catch (error) {
      console.error('AI生成错误:', error);
      alert('AI内容生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 保存模板
  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;

    // 验证AI设置独立性
    if (!validateAiSettingsIndependence(currentTemplate)) {
      alert('检测到AI块设置存在共享引用问题，请刷新页面重试');
      return;
    }

    setLoading(true);
    try {
      // 保存时包含expandedBlocks状态
      const templateToSave = {
        ...currentTemplate,
        expandedBlocks: expandedBlocks,
      };

      if (currentTemplate.id && currentTemplate.id.length > 10) {
        // 更新现有模板
        const updatedTemplate = await templateService.updateTemplate(currentTemplate.id, templateToSave);
        setCurrentTemplate(updatedTemplate);
        alert('模板保存成功！');
      } else {
        // 保存新模板
        const { id, createdAt, updatedAt, ...templateData } = templateToSave;
        const savedTemplate = await templateService.saveTemplate(templateData);
        setCurrentTemplate(savedTemplate);
        alert('模板保存成功！');
      }
    } catch (error) {
      console.error('保存模板错误:', error);
      // 显示具体的错误信息
      const errorMessage = error instanceof Error ? error.message : '保存模板失败';
      alert(`保存失败：${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 导出文档
  const handleExportDocument = async () => {
    if (!currentTemplate) return;

    try {
      await exportToWord(currentTemplate);
    } catch (error) {
      console.error('导出文档错误:', error);
      alert('导出文档失败，请稍后重试');
    }
  };

  // 切换预览模式
  const handleTogglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // 判断是否所有块都已展开
  const allBlocksExpanded = currentTemplate?.content.every(block => expandedBlocks[block.id] === true) || false;

  if (!currentTemplate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载编辑器...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 group">
            <input
              type="text"
              value={currentTemplate.name}
              onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
              className="text-xl font-semibold bg-transparent border-none outline-none hover:bg-gray-50 focus:bg-white focus:border focus:border-blue-300 focus:rounded px-2 py-1 min-w-0 flex-1"
              placeholder="请输入模板名称"
            />
            <Edit className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </div>
          <span className="text-sm text-gray-500">
            {currentTemplate.content.length} 个内容块
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFormatPanel(!showFormatPanel)}
            className="btn-secondary"
            title="格式设置"
          >
            <Settings className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleTogglePreview}
            className={`btn-secondary ${previewMode ? 'bg-primary-100 text-primary-700' : ''}`}
            title="预览模式"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={handleSaveTemplate}
            disabled={isLoading}
            className="btn-primary"
            title="保存模板"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? '保存中...' : '保存'}
          </button>

          <button
            onClick={handleExportDocument}
            className="btn-primary"
            title="导出文档"
          >
            <Download className="h-4 w-4 mr-2" />
            导出
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className={`flex-1 flex overflow-hidden ${isResizing ? 'resizing' : ''}`}>
        {/* 格式设置面板 */}
        {showFormatPanel && (
          <div className="w-80 bg-white border-r overflow-y-auto">
            <FormatPanel />
          </div>
        )}

        {/* 编辑区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* 工具栏 */}
              <div className="flex items-center justify-between mb-6">
                <AddBlockButtons onAdd={handleAddContentBlock} />
                
                {/* 一键收缩/展开按钮 */}
                {currentTemplate.content.length > 0 && (
                  <button
                    onClick={toggleAllBlocks}
                    className="btn-secondary flex items-center"
                    title={allBlocksExpanded ? '一键收缩所有内容块' : '一键展开所有内容块'}
                  >
                    {allBlocksExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        收缩全部
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        展开全部
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 内容块列表 */}
              {currentTemplate.content
                .slice() // 创建一个副本以避免直接修改store中的状态
                .sort((a, b) => a.position - b.position)
                .map((block) => (
                  <div key={block.id}>
                    {/* 悬浮式插入按钮（包括第一个） */}
                    <InsertBlockButton 
                      onAdd={handleAddContentBlock}
                      insertPosition={block.position}
                    />
                    
                    <div className="relative group">
                      <ContentBlockEditor
                        block={block}
                        isSelected={selectedBlock === block.id}
                        onSelect={() => setSelectedBlock(block.id)}
                        onUpdate={(updates) => updateContentBlock(block.id, updates)}
                        onGenerateAI={() => handleGenerateAI(block.id)}
                        isGenerating={isGenerating && selectedBlock === block.id}
                        onConvertType={(newType) => convertBlockType(block.id, newType)}
                      />
                      <button
                        onClick={() => removeContentBlock(block.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除内容块"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              
              {/* 在末尾添加内容块按钮 */}
              {currentTemplate.content.length > 0 && (
                <>
                  <hr className="my-6 border-gray-200" />
                  <AddBlockButtons onAdd={handleAddContentBlock} className="mt-4" />
                </>
              )}
              
              {/* 空状态 */}
              {currentTemplate.content.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    开始创建文档
                  </h3>
                  <p className="text-gray-600 mb-6">
                    添加固定内容或AI生成内容块来构建您的文档
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 预览面板 - 可调整大小的右侧边栏 */}
        {previewMode && (
          <div 
            className={`preview-panel bg-white border-l overflow-hidden flex flex-col relative ${isResizing ? 'resizing' : ''}`}
            style={{ width: previewWidth }}
          >
            {/* 调整大小的拖拽条 */}
            <div
              className="resize-handle"
              onMouseDown={handleMouseDown}
              title="拖拽调整预览面板大小"
            />
            
            <div className="p-4 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">文档预览</h3>
                  <span className="text-xs text-gray-500">宽度: {previewWidth}px</span>
                </div>
                <button
                  onClick={handleTogglePreview}
                  className="text-gray-400 hover:text-gray-600"
                  title="关闭预览"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="transform scale-90 origin-top"> {/* 从scale-75改为scale-90，提供更大的预览 */}
                <PreviewPanel template={currentTemplate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage; 