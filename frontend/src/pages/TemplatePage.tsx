import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Search, Edit, Copy, Trash2, FileText, Clock, Wand2, Upload, Download, FileDown, RefreshCw } from 'lucide-react';
import { templateService, TemplateListItem } from '../services/api';
import { createDefaultTemplate } from '../utils/document';
import useEditorStore from '../stores/editorStore';
import { useNavigate } from 'react-router-dom';

const TemplatePage: React.FC = React.memo(() => {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [pageSize] = useState(20);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setCurrentTemplate } = useEditorStore();
  const navigate = useNavigate();

  // 加载模板列表（使用简化数据）
  const loadTemplates = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const result = await templateService.getTemplateList(page, pageSize);
      setTemplates(result.templates);
      setTotalTemplates(result.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('加载模板列表失败:', error);
      alert('加载模板列表失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // 刷新模板列表
  const handleRefresh = useCallback(async () => {
    await loadTemplates(currentPage);
    alert('模板列表已刷新');
  }, [currentPage, loadTemplates]);

  useEffect(() => {
    loadTemplates(1);
  }, []);

  // 过滤模板
  const filteredTemplates = useMemo(() => 
    templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    ), [templates, searchTerm]
  );

  // 创建新模板
  const handleCreateTemplate = useCallback(() => {
    const newTemplate = createDefaultTemplate();
    setCurrentTemplate(newTemplate);
    navigate('/editor');
  }, [navigate, setCurrentTemplate]);

  // 编辑模板
  const handleEditTemplate = useCallback(async (templateItem: TemplateListItem) => {
    try {
      setLoading(true);
      // 获取完整模板数据（会使用缓存）
      const fullTemplate = await templateService.getTemplate(templateItem.id);
      setCurrentTemplate(fullTemplate);
      navigate('/editor');
    } catch (error) {
      console.error('加载模板失败:', error);
      alert('加载模板失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [navigate, setCurrentTemplate]);

  // 复制模板
  const handleDuplicateTemplate = useCallback(async (templateItem: TemplateListItem) => {
    try {
      if (!templateItem.id) {
        alert('模板ID无效');
        return;
      }
      
      const newName = prompt('请输入新模板名称:', `${templateItem.name} - 副本`);
      if (!newName) return;

      await templateService.duplicateTemplate(templateItem.id, newName);
      
      loadTemplates(currentPage);
      alert('模板复制成功！');
    } catch (error) {
      console.error('复制模板失败:', error);
      alert('复制模板失败，请稍后重试');
    }
  }, [currentPage, loadTemplates]);

  // 删除模板
  const handleDeleteTemplate = useCallback(async (templateItem: TemplateListItem) => {
    if (!templateItem.id) {
      alert('模板ID无效');
      return;
    }
    
    if (!confirm(`确定要删除模板"${templateItem.name}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await templateService.deleteTemplate(templateItem.id);
      loadTemplates(currentPage);
      alert('模板删除成功！');
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除模板失败，请稍后重试');
    }
  }, [currentPage, loadTemplates]);

  // 导出单个模板
  const handleExportTemplate = useCallback(async (templateItem: TemplateListItem) => {
    if (!templateItem.id) {
      alert('模板ID无效');
      return;
    }

    try {
      await templateService.exportTemplate(templateItem.id);
    } catch (error) {
      console.error('导出模板失败:', error);
      alert('导出模板失败，请稍后重试');
    }
  }, []);

  // 导出所有模板
  const handleExportAllTemplates = useCallback(async () => {
    if (templates.length === 0) {
      alert('没有可导出的模板');
      return;
    }

    try {
      await templateService.exportAllTemplates();
    } catch (error) {
      console.error('导出所有模板失败:', error);
      alert('导出模板失败，请稍后重试');
    }
  }, [templates.length]);

  // 触发文件选择
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 处理文件导入
  const handleImportTemplate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.json')) {
      alert('请选择JSON格式的文件');
      return;
    }

    setImporting(true);
    try {
      const result = await templateService.importTemplates(file);
      
      // 显示导入结果
      const { summary, results } = result;
      let message = `导入完成：\n成功 ${summary.success} 个，失败 ${summary.failed} 个\n\n`;
      
      if (summary.failed > 0) {
        message += '失败的模板：\n';
        results.filter(r => !r.success).forEach(r => {
          message += `- ${r.name}: ${r.message}\n`;
        });
      }

      alert(message);
      
      if (summary.success > 0) {
        loadTemplates(currentPage);
      }
    } catch (error) {
      console.error('导入模板失败:', error);
      alert(`导入失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setImporting(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载模板列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">模板管理</h1>
              <p className="mt-2 text-gray-600">
                管理您的文档模板，创建可重用的格式和结构
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefresh}
                className="btn-secondary flex items-center"
                title="刷新模板列表"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                刷新
              </button>
              <button
                onClick={() => navigate('/import-word')}
                className="btn-secondary flex items-center"
              >
                <Upload className="h-5 w-5 mr-2" />
                导入Word
              </button>
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="btn-secondary flex items-center disabled:opacity-50"
              >
                <FileDown className="h-5 w-5 mr-2" />
                {importing ? '导入中...' : '导入模板'}
              </button>
              <button
                onClick={handleExportAllTemplates}
                disabled={templates.length === 0}
                className="btn-secondary flex items-center disabled:opacity-50"
              >
                <Download className="h-5 w-5 mr-2" />
                导出全部
              </button>
              <button
                onClick={handleCreateTemplate}
                className="btn-primary flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                新建模板
              </button>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索模板名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportTemplate}
            className="hidden"
          />
        </div>

        {/* 模板统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总模板数</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">本周更新</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.filter(t => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(t.updatedAt) > weekAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">模板总块数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.reduce((sum, t) => sum + (t.blockCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">平均大小</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.length > 0 
                    ? `${Math.round(templates.reduce((sum, t) => sum + (t.size || 0), 0) / templates.length / 1024)}KB`
                    : '0KB'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 模板列表 */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? '未找到匹配的模板' : '还没有模板'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? '尝试调整搜索条件或创建新模板' 
                : '创建您的第一个文档模板来开始使用'
              }
            </p>
            <button
              onClick={handleCreateTemplate}
              className="btn-primary"
            >
              创建新模板
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(template.updatedAt)}
                  </div>
                  <span>{template.blockCount || 0} 个内容块</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {Math.round((template.size || 0) / 1024)}KB
                  </span>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/use-template?templateId=${template.id}`);
                    }}
                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                    title="使用模板"
                  >
                    <Wand2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTemplate(template);
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    title="编辑模板"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportTemplate(template);
                    }}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="导出模板"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateTemplate(template);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="复制模板"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="删除模板"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页控件 */}
        {totalTemplates > pageSize && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadTemplates(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                第 {currentPage} 页 / 共 {Math.ceil(totalTemplates / pageSize)} 页
              </span>
              <button
                onClick={() => loadTemplates(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalTemplates / pageSize)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default TemplatePage; 