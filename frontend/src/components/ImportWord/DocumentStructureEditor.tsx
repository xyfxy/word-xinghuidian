// 文档结构编辑器组件
import React, { useState } from 'react';
import { 
  Type, Sparkles, MergeIcon, ScissorsIcon, RefreshCw, 
  ChevronRight, ChevronDown, Copy, Hash, Image 
} from 'lucide-react';
import { ParsedDocument, ContentBlockGroup, ParsedElement } from '../../types/wordImport';
import { toast } from '../../utils/toast';
import { copyToClipboard } from '../../utils/clipboard';

interface DocumentStructureEditorProps {
  parsedDocument: ParsedDocument;
  contentGroups: ContentBlockGroup[];
  onGroupsChange: (groups: ContentBlockGroup[]) => void;
  onRegeneratePreview: () => void;
}

const DocumentStructureEditor: React.FC<DocumentStructureEditorProps> = ({ 
  parsedDocument, 
  contentGroups, 
  onGroupsChange,
  onRegeneratePreview 
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  // 生成唯一ID
  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  // 切换组的展开状态
  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // 切换组的选中状态
  const toggleGroupSelected = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  // 合并相邻的组
  const handleMergeGroups = (index1: number, index2: number) => {
    if (index1 < 0 || index2 >= contentGroups.length) return;
    
    const newGroups = [...contentGroups];
    const group1 = newGroups[index1];
    const group2 = newGroups[index2];
    
    // 创建合并后的组
    const mergedGroup: ContentBlockGroup = {
      id: generateId(),
      elements: [...group1.elements, ...group2.elements],
      suggestedType: group1.suggestedType, // 保留第一个组的类型
      suggestedTitle: `${group1.suggestedTitle} + ${group2.suggestedTitle}`,
      matchedRule: undefined
    };
    
    // 替换原来的两个组
    newGroups.splice(index1, 2, mergedGroup);
    onGroupsChange(newGroups);
    
    toast.success('内容块已合并');
  };

  // 拆分组
  const handleSplitGroup = (groupIndex: number, splitIndex: number) => {
    const group = contentGroups[groupIndex];
    if (splitIndex <= 0 || splitIndex >= group.elements.length) return;
    
    const newGroups = [...contentGroups];
    
    // 创建两个新组
    const group1: ContentBlockGroup = {
      id: generateId(),
      elements: group.elements.slice(0, splitIndex),
      suggestedType: group.suggestedType,
      suggestedTitle: generateTitle(group.elements[0]),
      matchedRule: group.matchedRule
    };
    
    const group2: ContentBlockGroup = {
      id: generateId(),
      elements: group.elements.slice(splitIndex),
      suggestedType: group.suggestedType,
      suggestedTitle: generateTitle(group.elements[splitIndex]),
      matchedRule: group.matchedRule
    };
    
    // 替换原来的组
    newGroups.splice(groupIndex, 1, group1, group2);
    onGroupsChange(newGroups);
    
    toast.success('内容块已拆分');
  };

  // 更改组的类型
  const handleTypeChange = (groupId: string, newType: 'text' | 'ai-generated') => {
    const newGroups = contentGroups.map(group => 
      group.id === groupId 
        ? { ...group, suggestedType: newType }
        : group
    );
    onGroupsChange(newGroups);
  };

  // 更改组的标题
  const handleTitleChange = (groupId: string, newTitle: string) => {
    const newGroups = contentGroups.map(group => 
      group.id === groupId 
        ? { ...group, suggestedTitle: newTitle }
        : group
    );
    onGroupsChange(newGroups);
  };

  // 批量操作
  const handleBatchTypeChange = (type: 'text' | 'ai-generated') => {
    if (selectedGroups.size === 0) {
      toast.error('请先选择要操作的内容块');
      return;
    }
    
    const newGroups = contentGroups.map(group => 
      selectedGroups.has(group.id)
        ? { ...group, suggestedType: type }
        : group
    );
    onGroupsChange(newGroups);
    setSelectedGroups(new Set());
    
    toast.success(`已将 ${selectedGroups.size} 个内容块转换为${type === 'ai-generated' ? 'AI生成' : '固定'}内容`);
  };

  // 生成标题
  const generateTitle = (element: ParsedElement): string => {
    if (element.type === 'heading') {
      return element.content;
    }
    const content = element.content.substring(0, 30);
    return content + (element.content.length > 30 ? '...' : '');
  };

  // 复制组ID引用
  const copyGroupReference = async (groupId: string) => {
    const reference = `{{${groupId}}}`;
    const success = await copyToClipboard(reference);
    if (success) {
      toast.success(`已复制引用: ${reference}`);
    } else {
      toast.error('复制失败，请手动复制');
    }
  };

  // 截取内容预览
  const truncateContent = (content: string, maxLength: number = 100): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* 头部工具栏 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">文档结构</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              共 {contentGroups.length} 个内容块 | 
              原始元素 {parsedDocument.elements.length} 个
            </span>
            <button
              onClick={onRegeneratePreview}
              className="btn-secondary text-sm flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              刷新预览
            </button>
          </div>
        </div>
        
        {/* 批量操作 */}
        {selectedGroups.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-blue-700">
              已选择 {selectedGroups.size} 个内容块
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleBatchTypeChange('text')}
                className="btn-secondary text-sm"
              >
                转为固定内容
              </button>
              <button
                onClick={() => handleBatchTypeChange('ai-generated')}
                className="btn-secondary text-sm"
              >
                转为AI内容
              </button>
              <button
                onClick={() => setSelectedGroups(new Set())}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                取消选择
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 内容块列表 */}
      <div className="space-y-3">
        {contentGroups.map((group, index) => (
          <div 
            key={group.id} 
            className={`border rounded-lg overflow-hidden transition-all ${
              selectedGroups.has(group.id) 
                ? 'border-blue-500 shadow-md' 
                : 'border-gray-200 hover:shadow-sm'
            }`}
          >
            {/* 组头部 */}
            <div className="bg-gray-50 px-4 py-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={selectedGroups.has(group.id)}
                    onChange={() => toggleGroupSelected(group.id)}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  
                  {/* 展开/收缩按钮 */}
                  <button
                    onClick={() => toggleGroupExpanded(group.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {expandedGroups[group.id] ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                  
                  {/* 组信息 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        value={group.suggestedTitle}
                        onChange={(e) => handleTitleChange(group.id, e.target.value)}
                        className="flex-1 text-sm font-medium bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                      />
                      <span className="text-xs text-gray-400 flex items-center">
                        <Hash className="h-3 w-3" />
                        {group.id.substring(0, 6)}
                      </span>
                      <button
                        onClick={() => copyGroupReference(group.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title={`复制引用 {{${group.id}}}`}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        group.suggestedType === 'ai-generated' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {group.suggestedType === 'ai-generated' ? (
                          <><Sparkles className="h-3 w-3 inline mr-1" />AI生成</>
                        ) : (
                          <><Type className="h-3 w-3 inline mr-1" />固定内容</>
                        )}
                      </span>
                      <span className="text-gray-500">
                        {group.elements.length} 个元素
                      </span>
                      {group.matchedRule && (
                        <span className="text-gray-500">
                          匹配规则: {group.matchedRule}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center space-x-1 ml-4">
                  {index > 0 && (
                    <button
                      onClick={() => handleMergeGroups(index - 1, index)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="与上方合并"
                    >
                      <MergeIcon className="h-4 w-4 rotate-180" />
                    </button>
                  )}
                  {index < contentGroups.length - 1 && (
                    <button
                      onClick={() => handleMergeGroups(index, index + 1)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="与下方合并"
                    >
                      <MergeIcon className="h-4 w-4" />
                    </button>
                  )}
                  {group.elements.length > 1 && (
                    <button
                      onClick={() => handleSplitGroup(index, 1)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="拆分"
                    >
                      <ScissorsIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* 类型切换 */}
              <div className="mt-2 flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="radio"
                    checked={group.suggestedType === 'text'}
                    onChange={() => handleTypeChange(group.id, 'text')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>固定内容</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="radio"
                    checked={group.suggestedType === 'ai-generated'}
                    onChange={() => handleTypeChange(group.id, 'ai-generated')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>AI生成</span>
                </label>
              </div>
            </div>
            
            {/* 展开的内容 */}
            {expandedGroups[group.id] && (
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="space-y-2">
                  {group.elements.map((element, elemIndex) => (
                    <div key={element.id} className="relative">
                      <div className="flex items-start space-x-2">
                        <span className="text-xs text-gray-400 mt-1">
                          {elemIndex + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              element.type === 'heading' 
                                ? 'bg-blue-100 text-blue-700' 
                                : element.type === 'list'
                                ? 'bg-green-100 text-green-700'
                                : element.type === 'image'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {element.type === 'image' ? (
                                <><Image className="h-3 w-3 inline mr-1" />图片</>
                              ) : (
                                <>
                                  {element.type}
                                  {element.level && ` ${element.level}`}
                                </>
                              )}
                            </span>
                            {element.style && (
                              <>
                                {element.style.bold && (
                                  <span className="text-xs text-gray-500">粗体</span>
                                )}
                                {element.style.italic && (
                                  <span className="text-xs text-gray-500">斜体</span>
                                )}
                              </>
                            )}
                          </div>
                          {element.type === 'image' && element.imageData ? (
                            <div className="mt-2">
                              <img 
                                src={element.imageData.src} 
                                alt={element.imageData.alt || '图片'} 
                                className="max-w-full h-auto rounded border border-gray-200"
                                style={{
                                  maxHeight: '200px',
                                  objectFit: 'contain'
                                }}
                              />
                              {element.imageData.alt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {element.imageData.alt}
                                </p>
                              )}
                            </div>
                          ) : element.html ? (
                            <div 
                              className="text-sm text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: element.html }}
                            />
                          ) : (
                            <p className="text-sm text-gray-700">
                              {truncateContent(element.content, 150)}
                            </p>
                          )}
                        </div>
                        {group.elements.length > 1 && elemIndex > 0 && (
                          <button
                            onClick={() => handleSplitGroup(index, elemIndex)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="从此处拆分"
                          >
                            <ScissorsIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentStructureEditor;