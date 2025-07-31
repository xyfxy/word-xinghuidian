// Word导入页面
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, ChevronLeft, Save, Eye, EyeOff } from 'lucide-react';
import { wordImportService, templateService } from '../services/api';
import { ParsedDocument, RecognitionRule, ContentBlockGroup } from '../types/wordImport';
import { DocumentTemplate } from '../types';
import PreviewPanel from '../components/Editor/PreviewPanel';
import RuleConfigPanel from '../components/ImportWord/RuleConfigPanel';
import DocumentStructureEditor from '../components/ImportWord/DocumentStructureEditor';
import { toast } from '../utils/toast';

const ImportWordPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null);
  const [activeRules, setActiveRules] = useState<RecognitionRule[]>([]);
  const [contentGroups, setContentGroups] = useState<ContentBlockGroup[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [previewWidth, setPreviewWidth] = useState(730);
  const [isResizing, setIsResizing] = useState(false);
  const [ignoreWordStyles] = useState(false); // 已删除未使用的 setter

  // 加载默认规则
  useEffect(() => {
    loadRecognitionRules();
  }, []);

  // 用于追踪是否是初始加载
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 当 ignoreWordStyles 改变时重新解析文档
  useEffect(() => {
    // 跳过初始加载
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    // 只有在已经上传了文档且已经解析过时才重新解析
    if (uploadedFile && parsedDocument) {
      const reparse = async () => {
        setIsProcessing(true);
        try {
          const parsed = await wordImportService.parseWordDocument(uploadedFile, { ignoreWordStyles });
          setParsedDocument(parsed);
          
          // 重新应用规则
          const groups = await wordImportService.applyRules(parsed, activeRules);
          setContentGroups(groups);
          
          // 重新生成预览
          if (groups.length > 0) {
            const template = await wordImportService.generateTemplate(
              groups,
              templateName || '未命名模板',
              templateDescription
            );
            setPreviewTemplate(template);
          }
          
          toast.success('文档重新解析成功');
        } catch (error: any) {
          console.error('重新解析文档失败:', error);
          toast.error(error.message || '重新解析文档失败');
        } finally {
          setIsProcessing(false);
        }
      };
      
      reparse();
    }
  }, [ignoreWordStyles]);

  // 处理预览面板大小调整
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300;
    const maxWidth = Math.min(800, window.innerWidth * 0.6);
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setPreviewWidth(clampedWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const loadRecognitionRules = async () => {
    try {
      const rules = await wordImportService.getRecognitionRules();
      setActiveRules(rules);
    } catch (error) {
      console.error('加载规则失败:', error);
      toast.error('加载识别规则失败');
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('请上传Word文档（.doc或.docx格式）');
      return;
    }

    // 验证文件大小
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      // 解析文档 - 这里不使用 ignoreWordStyles，因为文件选择时还没有机会设置这个选项
      // 用户应该先设置选项，然后再上传文件
      const parsed = await wordImportService.parseWordDocument(file);
      setParsedDocument(parsed);
      
      // 自动应用规则
      await handleApplyRules(parsed);
      
      // 设置默认模板名称
      const fileName = file.name.replace(/\.(doc|docx)$/i, '');
      setTemplateName(fileName);
      
      toast.success('文档解析成功');
    } catch (error: any) {
      console.error('解析文档失败:', error);
      toast.error(error.message || '解析文档失败');
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };


  // 应用识别规则
  const handleApplyRules = async (doc?: ParsedDocument) => {
    const documentToUse = doc || parsedDocument;
    if (!documentToUse) return;

    setIsProcessing(true);
    try {
      const groups = await wordImportService.applyRules(documentToUse, activeRules);
      setContentGroups(groups);
      
      // 自动生成预览
      await generatePreview(groups);
    } catch (error: any) {
      console.error('应用规则失败:', error);
      toast.error(error.message || '应用规则失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成预览模板
  const generatePreview = async (groups?: ContentBlockGroup[]) => {
    const groupsToUse = groups || contentGroups;
    if (groupsToUse.length === 0) return;

    try {
      const template = await wordImportService.generateTemplate(
        groupsToUse,
        templateName || '未命名模板',
        templateDescription
      );
      
      setPreviewTemplate(template);
    } catch (error: any) {
      console.error('生成预览失败:', error);
      toast.error(error.message || '生成预览失败');
    }
  };

  // 保存为模板
  const handleSaveAsTemplate = async () => {
    if (!previewTemplate) return;

    if (!templateName.trim()) {
      toast.error('请输入模板名称');
      return;
    }

    setIsProcessing(true);
    try {
      // 更新模板名称和描述
      const templateToSave = {
        ...previewTemplate,
        name: templateName,
        description: templateDescription
      };

      // 保存模板
      await templateService.saveTemplate(templateToSave);
      toast.success('模板保存成功');
      
      // 跳转到模板管理页面
      navigate('/templates');
    } catch (error: any) {
      console.error('保存模板失败:', error);
      toast.error(error.message || '保存模板失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 重置上传
  const handleReset = () => {
    setUploadedFile(null);
    setParsedDocument(null);
    setContentGroups([]);
    setPreviewTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* 主内容区域 - 计算剩余高度（减去Layout导航栏高度64px和底部栏高度80px） */}
      <div className="flex flex-1 overflow-hidden min-h-0" style={{ height: 'calc(100vh - 9rem)' }}>
        {/* 左侧栏：规则配置 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b flex-shrink-0">
            <h2 className="text-lg font-semibold">Word导入设置</h2>
          </div>
          
          {!parsedDocument ? (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-600 mb-4">
                上传Word文档后，您可以配置识别规则来自动划分内容块。
              </p>
              <div className="space-y-3">
                <div>
                  <label className="label-text">模板名称</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="input-field"
                    placeholder="输入模板名称..."
                    disabled={!parsedDocument}
                  />
                </div>
                <div>
                  <label className="label-text">模板描述</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="input-field"
                    rows={3}
                    placeholder="输入模板描述..."
                    disabled={!parsedDocument}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b space-y-3 flex-shrink-0">
                <div>
                  <label className="label-text">模板名称</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="input-field"
                    placeholder="输入模板名称..."
                  />
                </div>
                <div>
                  <label className="label-text">模板描述</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="输入模板描述..."
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <RuleConfigPanel 
                  rules={activeRules}
                  onRulesChange={setActiveRules}
                  onApplyRules={() => handleApplyRules()}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* 中间栏：文档结构编辑 */}
        <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
          {!parsedDocument ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto w-64 h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center transition-colors"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">上传Word文档</p>
                  <p className="text-sm text-gray-500">支持 .doc 和 .docx 格式</p>
                  <p className="text-xs text-gray-400 mt-2">最大 10MB</p>
                </div>
                
                {uploadedFile && (
                  <div className="mt-4 inline-flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{uploadedFile.name}</span>
                    <button
                      onClick={handleReset}
                      className="ml-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <DocumentStructureEditor
              parsedDocument={parsedDocument}
              contentGroups={contentGroups}
              onGroupsChange={(groups) => {
                setContentGroups(groups);
                generatePreview(groups);
              }}
              onRegeneratePreview={() => generatePreview()}
            />
          )}
        </div>
        
        {/* 右侧栏：预览面板 */}
        {showPreview && (
          <div 
            className={`bg-white border-l border-gray-200 overflow-hidden flex flex-col relative ${isResizing ? 'select-none' : ''}`}
            style={{ width: previewWidth }}
          >
            {/* 调整大小的拖拽条 */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-blue-400 cursor-col-resize transition-all z-10"
              onMouseDown={handleMouseDown}
              title="拖拽调整预览面板大小"
            />
            
            {previewTemplate ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">模板预览</h3>
                    <span className="text-xs text-gray-500">宽度: {previewWidth}px</span>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors"
                    title="关闭预览"
                  >
                    <EyeOff className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <PreviewPanel template={previewTemplate} />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>上传文档后显示预览</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 预览按钮（当预览隐藏时） */}
        {!showPreview && (
          <button
            onClick={() => setShowPreview(true)}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-white shadow-lg rounded-l-lg px-3 py-6 hover:shadow-xl transition-shadow"
          >
            <Eye className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>
      
      {/* 底部操作栏 - 固定高度 */}
      <div className="bg-white border-t shadow-lg flex-shrink-0 h-20 flex items-center px-4">
        <div className="flex justify-between items-center w-full">
          <button 
            onClick={() => navigate('/templates')} 
            className="btn-secondary flex items-center h-10"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            返回模板管理
          </button>
          
          <div className="flex items-center space-x-4">
            {parsedDocument && (
              <span className="text-sm text-gray-600">
                已识别 {contentGroups.length} 个内容块
              </span>
            )}
            <button 
              onClick={handleSaveAsTemplate}
              disabled={!previewTemplate || isProcessing || !templateName.trim()}
              className="btn-primary flex items-center h-10"
            >
              <Save className="h-4 w-4 mr-2" />
              保存为模板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportWordPage;