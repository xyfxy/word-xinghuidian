import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Download, Sparkles, ChevronRight, Copy, Eye, ChevronDown, ChevronUp, Upload, X, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { templateService, aiService } from '../services/api'
import { DocumentTemplate, ContentBlock, ImageContent } from '../types'
// 已删除未使用的 useAISettings 导入
import { toast } from '../utils/toast'
import { exportToWord } from '../utils/document'
import { formatMaxKbContent } from '../utils/markdown'
import SimpleRichTextEditor from '../components/Editor/SimpleRichTextEditor'
import PreviewPanel from '../components/Editor/PreviewPanel'
import ImageProcessorModal from '../components/ImageProcessor/ImageProcessorModal'

export default function UseTemplatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('templateId')
  
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({})
  const [previewWidth, setPreviewWidth] = useState(730)
  const [isResizing, setIsResizing] = useState(false)
  const [showImageProcessor, setShowImageProcessor] = useState(false)
  // 已删除未使用的 getSettingsForBlock

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        handleTemplateSelect(template)
      }
    }
  }, [templateId, templates])

  const loadTemplates = async () => {
    try {
      const data = await templateService.getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('加载模板失败:', error)
      toast.error('加载模板失败')
    }
  }

  const handleTemplateSelect = async (template: DocumentTemplate) => {
    try {
      const fullTemplate = await templateService.getTemplate(template.id)
      setSelectedTemplate(fullTemplate)
      
      // 初始化内容块，保留模板的默认内容
      const initialBlocks = fullTemplate.content.map(block => ({
        ...block,
        // 保留原有内容，用户可以修改
        content: block.content
      }))
      setContentBlocks(initialBlocks)
      
      // 初始化展开状态（默认全部展开）
      const initialExpanded: Record<string, boolean> = {}
      initialBlocks.forEach(block => {
        initialExpanded[block.id] = true
      })
      setExpandedBlocks(initialExpanded)
    } catch (error) {
      console.error('加载模板详情失败:', error)
      toast.error('加载模板详情失败')
    }
  }

  const updateBlockContent = (blockId: string, content: string | any) => {
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, content } : block
      )
    )
  }

  const updateBlockPrompt = (blockId: string, aiPrompt: string) => {
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, aiPrompt } : block
      )
    )
  }

  const handleAIGenerate = async (blockId: string) => {
    const block = contentBlocks.find(b => b.id === blockId)
    if (!block || block.type !== 'ai-generated' || !block.aiPrompt) return

    setIsGenerating(true)
    try {
      // 处理提示词中的内容块引用
      let processedPrompt = block.aiPrompt
      
      // 查找并替换 {{blockId}} 格式的引用
      const blockRefs = processedPrompt.match(/\{\{([^}]+)\}\}/g)
      if (blockRefs) {
        blockRefs.forEach(ref => {
          const refBlockId = ref.replace(/\{\{|\}\}/g, '')
          const refBlock = contentBlocks.find(b => b.id === refBlockId)
          if (refBlock && typeof refBlock.content === 'string') {
            processedPrompt = processedPrompt.replace(ref, refBlock.content)
          }
        })
      }

      let response
      
      // 检查是否使用新的模型管理方式
      if (block.modelId) {
        // 使用新的模型管理API
        const systemPrompt = block.systemPrompt || '你是一个专业的文档编写助手。'
        const context = contentBlocks
          .filter(b => b.position < block.position && typeof b.content === 'string')
          .map(b => b.content as string)
          .join('\n')
        
        const messages = [
          { role: 'system' as const, content: systemPrompt },
        ]
        
        if (context) {
          messages.push({ role: 'system' as const, content: `参考上下文：${context}` })
        }
        
        messages.push({ role: 'system' as const, content: processedPrompt })
        
        if (block.modelId === 'maxkb') {
          // 特殊处理MaxKB（保持兼容）
          const blockSettings = block.aiSettings
          if (!blockSettings?.maxkbBaseUrl || !blockSettings?.maxkbApiKey) {
            toast.error('请先在模板编辑器中配置MaxKB的Base URL和API Key')
            return
          }
          response = await aiService.generateMaxKbContent({
            baseUrl: blockSettings.maxkbBaseUrl,
            apiKey: blockSettings.maxkbApiKey,
            messages: messages,
            maxTokens: block.maxTokens || 3000,
          })
        } else {
          // 使用模型管理中的模型
          response = await aiService.generateWithModel({
            modelId: block.modelId,
            messages: messages,
            temperature: block.temperature || 0.7,
            maxTokens: block.maxTokens || 3000,
          })
        }
      } else {
        // 向后兼容：使用旧的AI设置方式
        const blockSettings = block.aiSettings
        
        if (blockSettings?.provider === 'maxkb') {
          // 使用MaxKB
          if (!blockSettings.maxkbBaseUrl || !blockSettings.maxkbApiKey) {
            toast.error('请先在模板编辑器中配置MaxKB的Base URL和API Key')
            return
          }
          response = await aiService.generateMaxKbContent({
            baseUrl: blockSettings.maxkbBaseUrl,
            apiKey: blockSettings.maxkbApiKey,
            messages: [
              { role: 'system' as const, content: blockSettings.systemPrompt || '你是一个专业的文档编写助手。' },
              { role: 'system' as const, content: processedPrompt },
            ],
            maxTokens: block.maxTokens || 3000,
          })
        } else {
          // 没有配置，提示用户
          toast.error('请在模板编辑器中为此AI块选择一个模型或配置MaxKB')
          return
        }
      }

      if (response.success && response.content) {
        // 对AI返回的内容进行Markdown解析，转换为HTML
        const formattedContent = await formatMaxKbContent(response.content)
        
        updateBlockContent(blockId, formattedContent)
        toast.success('AI内容生成成功')
      } else {
        toast.error(response.error || 'AI内容生成失败')
      }
    } catch (error) {
      console.error('AI生成失败:', error)
      toast.error('AI内容生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAllAI = async () => {
    const aiBlocks = contentBlocks.filter(b => b.type === 'ai-generated' && b.aiPrompt)
    for (const block of aiBlocks) {
      await handleAIGenerate(block.id)
    }
  }

  const handleExportDocument = async () => {
    if (!selectedTemplate) return

    setIsExporting(true)
    try {
      // 将当前内容块更新到模板中
      const documentData = {
        ...selectedTemplate,
        content: contentBlocks
      }

      await exportToWord(documentData)
      toast.success('文档导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('文档导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const copyBlockReference = (blockId: string) => {
    const reference = `{{${blockId}}}`
    navigator.clipboard.writeText(reference).then(() => {
      toast.success(`已复制引用: ${reference}`)
    }).catch(() => {
      toast.error('复制失败，请手动复制')
    })
  }

  // 切换所有内容块的展开/收缩状态
  const toggleAllBlocks = () => {
    const allExpanded = Object.values(expandedBlocks).every(v => v)
    const newExpandedState: Record<string, boolean> = {}
    contentBlocks.forEach(block => {
      newExpandedState[block.id] = !allExpanded
    })
    setExpandedBlocks(newExpandedState)
  }

  // 切换单个内容块的展开/收缩状态
  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }))
  }

  // 处理预览面板大小调整
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = window.innerWidth - e.clientX
    const minWidth = 300
    const maxWidth = Math.min(800, window.innerWidth * 0.6)
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setPreviewWidth(clampedWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // 图片编辑组件
  const ImageEditor: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageContent = block.content as ImageContent

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片文件大小不能超过5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          updateBlockContent(block.id, {
            ...imageContent,
            src: result,
            alt: file.name
          })
        }
      }
      reader.readAsDataURL(file)
    }

    const handleImageFromUrl = () => {
      const url = prompt('请输入图片URL:')
      if (url) {
        updateBlockContent(block.id, {
          ...imageContent,
          src: url,
        })
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            上传图片
          </button>
          <button
            onClick={handleImageFromUrl}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
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
          <div className="relative inline-block">
            <img
              src={imageContent.src}
              alt={imageContent.alt}
              className="max-w-full h-auto max-h-64 rounded border shadow-sm"
            />
            <button
              onClick={() => updateBlockContent(block.id, { ...imageContent, src: '' })}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderContentInput = (block: ContentBlock) => {
    switch (block.type) {
      case 'text':
        return (
          <SimpleRichTextEditor
            value={block.content as string}
            onChange={(content) => updateBlockContent(block.id, content)}
            placeholder="输入文本内容..."
            minHeight={120}
          />
        )
      
      case 'ai-generated':
        return (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <SimpleRichTextEditor
                  value={block.content as string}
                  onChange={(content) => updateBlockContent(block.id, content)}
                  placeholder="AI生成的内容将显示在这里..."
                  minHeight={120}
                />
              </div>
              <button
                onClick={() => handleAIGenerate(block.id)}
                disabled={isGenerating || !block.aiPrompt}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                生成
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  提示词 <span className="text-gray-500">(点击内容块旁的复制按钮获取引用)</span>
                </label>
                {(block.modelId || block.aiSettings) && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded">
                    {block.modelId === 'maxkb' ? 'MaxKB' : 
                     block.modelId ? '自定义模型' :
                     block.aiSettings?.provider === 'maxkb' ? 'MaxKB' : '千问'}
                  </span>
                )}
              </div>
              <textarea
                value={block.aiPrompt || ''}
                onChange={(e) => updateBlockPrompt(block.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
                placeholder="输入AI提示词..."
              />
            </div>
          </div>
        )
      
      case 'two-column':
        const twoColContent = typeof block.content === 'object' 
          ? block.content as any
          : typeof block.content === 'string' && block.content 
          ? JSON.parse(block.content) 
          : { left: '', right: '' }
        return (
          <div className="my-4">
            <div className="flex justify-between items-center gap-4">
              <input
                type="text"
                value={twoColContent.left || ''}
                onChange={(e) => {
                  const newContent = {
                    ...twoColContent,
                    left: e.target.value
                  }
                  updateBlockContent(block.id, newContent)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="左栏内容..."
              />
              <input
                type="text"
                value={twoColContent.right || ''}
                onChange={(e) => {
                  const newContent = {
                    ...twoColContent,
                    right: e.target.value
                  }
                  updateBlockContent(block.id, newContent)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                placeholder="右栏内容..."
              />
            </div>
          </div>
        )
      
      case 'image':
        return <ImageEditor block={block} />
      
      case 'page-break':
        return (
          <div className="text-center py-4 text-gray-500">
            <div className="border-t-2 border-dashed border-gray-300 mb-2"></div>
            <span className="text-sm">换页符</span>
            <div className="border-t-2 border-dashed border-gray-300 mt-2"></div>
          </div>
        )
      
      default:
        return null
    }
  }

  // 处理图片插入
  const handleInsertImages = (images: { base64: string; filename: string }[]) => {
    if (!selectedTemplate) return;

    // 查找所有现有的图片内容块，按位置排序
    const imageBlocks = contentBlocks
      .filter(block => block.type === 'image')
      .sort((a, b) => a.position - b.position);

    if (imageBlocks.length === 0) {
      toast.error('模板中没有图片内容块可以替换');
      return;
    }

    // 按顺序替换现有图片块的内容
    const updatedBlocks = contentBlocks.map(block => {
      if (block.type === 'image') {
        const imageIndex = imageBlocks.findIndex(ib => ib.id === block.id);
        if (imageIndex >= 0 && imageIndex < images.length) {
          const imageData = images[imageIndex];
          return {
            ...block,
            content: {
              ...(block.content as ImageContent),
              src: imageData.base64,
              alt: imageData.filename,
              title: imageData.filename
            } as ImageContent
          };
        }
      }
      return block;
    });

    setContentBlocks(updatedBlocks);
    
    const replacedCount = Math.min(images.length, imageBlocks.length);
    toast.success(`成功替换 ${replacedCount} 个图片内容块`);
    
    if (images.length > imageBlocks.length) {
      toast.warning(`还有 ${images.length - imageBlocks.length} 张图片未能插入，模板中图片块不足`);
    }
  };

  // 判断是否所有块都已展开
  const allBlocksExpanded = Object.values(expandedBlocks).every(v => v)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 transition-all duration-300 ${showPreview ? '' : 'w-full'}`}>
          <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">使用模板</h1>
                <p className="text-gray-600">选择模板，填写内容，快速生成文档</p>
              </div>

              {!selectedTemplate ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">选择模板</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-600">{template.description}</p>
                        )}
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>{template.content.length} 个内容块</span>
                          <ChevronRight className="w-4 h-4 ml-auto" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-lg">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedTemplate(null)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                            title="返回模板列表"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <div>
                            <h2 className="text-xl font-semibold text-gray-900">{selectedTemplate.name}</h2>
                            {selectedTemplate.description && (
                              <p className="text-gray-600 mt-1 text-sm">{selectedTemplate.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {contentBlocks.length > 0 && (
                            <button
                              onClick={toggleAllBlocks}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center gap-2 transition-colors"
                              title={allBlocksExpanded ? '收缩全部' : '展开全部'}
                            >
                              {allBlocksExpanded ? (
                                <><ChevronUp className="w-4 h-4" /> 收缩全部</>
                              ) : (
                                <><ChevronDown className="w-4 h-4" /> 展开全部</>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                              showPreview ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            title="预览文档"
                          >
                            <Eye className="w-4 h-4" />
                            预览
                          </button>
                          <button
                            onClick={() => setShowImageProcessor(true)}
                            className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm flex items-center gap-2 transition-colors"
                            title="图片处理模块"
                          >
                            <ImageIcon className="w-4 h-4" />
                            图片处理
                          </button>
                          <button
                            onClick={handleGenerateAllAI}
                            disabled={isGenerating}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                          >
                            <Sparkles className="w-4 h-4" />
                            生成所有AI内容
                          </button>
                          <button
                            onClick={handleExportDocument}
                            disabled={isExporting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            导出文档
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {contentBlocks.map((block, index) => (
                        <div key={block.id} className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
                          <div 
                            className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => toggleBlockExpanded(block.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleBlockExpanded(block.id)
                                  }}
                                >
                                  {expandedBlocks[block.id] ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                                <h3 className="font-medium text-gray-900">
                                  {index + 1}. {block.title}
                                </h3>
                                <span className="text-sm px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                                  {block.type === 'text' ? '文本' : 
                                   block.type === 'ai-generated' ? 'AI生成' :
                                   block.type === 'two-column' ? '双栏' : 
                                   block.type === 'image' ? '图片' :
                                   block.type === 'page-break' ? '换页' : block.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  ID: {block.id}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyBlockReference(block.id)
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title={`复制引用 {{${block.id}}}`}
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {expandedBlocks[block.id] && (
                            <div className="p-4">
                              {renderContentInput(block)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => navigate('/templates')}
                      className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      管理模板 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 预览面板 */}
        {showPreview && selectedTemplate && (
          <div 
            className={`bg-white border-l shadow-lg overflow-hidden flex flex-col relative ${isResizing ? 'select-none' : ''}`}
            style={{ width: previewWidth }}
          >
            {/* 调整大小的拖拽条 */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-blue-400 cursor-col-resize transition-all z-10"
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
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded transition-colors"
                  title="关闭预览"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PreviewPanel template={{ ...selectedTemplate, content: contentBlocks }} />
            </div>
          </div>
        )}
      </div>

      {/* 图片处理弹窗 */}
      <ImageProcessorModal
        isOpen={showImageProcessor}
        onClose={() => setShowImageProcessor(false)}
        onInsertImages={handleInsertImages}
      />
    </div>
  )
}