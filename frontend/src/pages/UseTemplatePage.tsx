import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileText, Download, Sparkles, ChevronRight, Copy, Eye, ChevronDown, ChevronUp, Upload, X, ArrowLeft, Image as ImageIcon, File, Loader, Settings2, Layers } from 'lucide-react'
import { templateService, aiService } from '../services/api'
import { DocumentTemplate, ContentBlock, ImageContent } from '../types'
// 已删除未使用的 useAISettings 导入
import { toast } from '../utils/toast'
import { exportToWord } from '../utils/document'
import { formatMaxKbContent } from '../utils/markdown'
import SimpleRichTextEditor from '../components/Editor/SimpleRichTextEditor'
import PreviewPanel from '../components/Editor/PreviewPanel'
import ImageProcessorModal from '../components/ImageProcessor/ImageProcessorModal'
import AIExecutionOrderModal from '../components/AIExecutionOrderModal'
import documentService from '../services/documentService'

export default function UseTemplatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('templateId')
  
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingBlockId, setGeneratingBlockId] = useState<string | null>(null)
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  // 移除未使用的 generationTime 状态
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({})
  const [previewWidth, setPreviewWidth] = useState(730)
  const [isResizing, setIsResizing] = useState(false)
  const [showImageProcessor, setShowImageProcessor] = useState(false)
  const [showGenerateOptions, setShowGenerateOptions] = useState(false)
  const [showExecutionOrderModal, setShowExecutionOrderModal] = useState(false)
  const generateOptionsRef = useRef<HTMLDivElement>(null)
  // 已删除未使用的 getSettingsForBlock

  useEffect(() => {
    loadTemplates()
  }, [])
  
  // 点击外部关闭生成选项菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (generateOptionsRef.current && !generateOptionsRef.current.contains(event.target as Node)) {
        setShowGenerateOptions(false)
      }
    }
    
    if (showGenerateOptions) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showGenerateOptions])

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
      // 使用简化的模板列表
      const result = await templateService.getTemplateList(1, 100)
      setTemplates(result.templates as any)
    } catch (error) {
      console.error('加载模板失败:', error)
      toast.error('加载模板失败')
    }
  }

  const handleTemplateSelect = async (template: any) => {
    try {
      // 获取完整模板数据
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
    setGeneratingBlockId(blockId)
    setGenerationStartTime(Date.now())
    // 重置计时器
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
        
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'system' as const, content: processedPrompt }
        ]
        
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
      setGeneratingBlockId(null)
      if (generationStartTime) {
        const totalTime = Math.round((Date.now() - generationStartTime) / 1000)
        toast.success(`生成完成，耗时 ${totalTime} 秒`)
      }
      setGenerationStartTime(null)
    }
  }

  // 生成策略类型
  type GenerateStrategy = 'serial' | 'parallel' | 'smart' | 'batch' | 'custom'
  
  // 处理自定义执行组
  const handleCustomExecution = async (groups: any[]) => {
    const totalBlocks = groups.reduce((sum, g) => sum + g.blockIds.length, 0)
    
    if (totalBlocks === 0) {
      toast.warning('没有找到需要生成的AI内容块')
      return
    }
    
    toast.info(`开始按自定义顺序生成 ${totalBlocks} 个AI内容块...`)
    
    let successCount = 0
    let failCount = 0
    
    try {
      // 按组顺序执行
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i]
        const groupBlocks = group.blockIds
        
        if (groupBlocks.length === 0) continue
        
        toast.info(`正在执行 ${group.name}（${group.type === 'serial' ? '串行' : '并行'}，${groupBlocks.length} 个内容块）`)
        
        if (group.type === 'serial') {
          // 串行执行组内的块
          for (const blockId of groupBlocks) {
            try {
              await handleAIGenerate(blockId)
              successCount++
              toast.success(`内容块生成完成：${contentBlocks.find(b => b.id === blockId)?.title}`)
            } catch (error) {
              failCount++
              console.error(`生成块 ${blockId} 失败:`, error)
              toast.error(`内容块生成失败：${contentBlocks.find(b => b.id === blockId)?.title}`)
            }
          }
        } else {
          // 并行执行组内的块
          const promises = groupBlocks.map((blockId: string) => 
            handleAIGenerate(blockId)
              .then(() => {
                successCount++
                toast.success(`内容块生成完成：${contentBlocks.find(b => b.id === blockId)?.title}`)
                return true
              })
              .catch(error => {
                failCount++
                console.error(`生成块 ${blockId} 失败:`, error)
                toast.error(`内容块生成失败：${contentBlocks.find(b => b.id === blockId)?.title}`)
                return false
              })
          )
          
          await Promise.all(promises)
        }
      }
      
      // 显示最终结果
      if (failCount > 0) {
        toast.warning(`生成完成：${successCount} 个成功，${failCount} 个失败`)
      } else if (successCount > 0) {
        toast.success(`所有AI内容生成完成！共成功生成 ${successCount} 个内容块`)
      }
    } catch (error) {
      console.error('执行自定义顺序时出错:', error)
      toast.error('部分AI内容生成失败，请检查配置后重试')
    }
    
    setShowExecutionOrderModal(false)
  }
  
  const handleGenerateAllAI = async (strategy: GenerateStrategy = 'smart') => {
    const aiBlocks = contentBlocks.filter(b => b.type === 'ai-generated' && b.aiPrompt)
    const totalBlocks = aiBlocks.length
    
    if (totalBlocks === 0) {
      toast.warning('没有找到需要生成的AI内容块')
      return
    }
    
    const strategyNames: Record<GenerateStrategy, string> = {
      serial: '串行执行',
      parallel: '并行执行',
      smart: '智能执行（第一个先执行，其余并行）',
      batch: '分批执行（每批3个并行）',
      custom: '自定义执行顺序'
    }
    
    toast.info(`开始使用【${strategyNames[strategy]}】策略生成 ${totalBlocks} 个AI内容块...`)
    setShowGenerateOptions(false)
    
    try {
      let successCount = 0
      let failCount = 0
      
      switch (strategy) {
        case 'serial':
          // 串行执行：一个接一个
          for (let i = 0; i < aiBlocks.length; i++) {
            try {
              toast.info(`正在生成第 ${i + 1}/${totalBlocks} 个AI内容块`)
              await handleAIGenerate(aiBlocks[i].id)
              successCount++
            } catch (error) {
              failCount++
              console.error(`生成块 ${aiBlocks[i].id} 失败:`, error)
            }
          }
          break
          
        case 'parallel':
          // 并行执行：全部同时
          const parallelPromises = aiBlocks.map((block, index) => 
            handleAIGenerate(block.id)
              .then(() => {
                toast.success(`第 ${index + 1}/${totalBlocks} 个AI内容块生成完成`)
                return true
              })
              .catch(error => {
                toast.error(`第 ${index + 1}/${totalBlocks} 个AI内容块生成失败`)
                console.error(`生成块 ${block.id} 失败:`, error)
                return false
              })
          )
          const parallelResults = await Promise.all(parallelPromises)
          successCount = parallelResults.filter(r => r).length
          failCount = parallelResults.filter(r => !r).length
          break
          
        case 'smart':
          // 智能执行：第一个先执行，其余并行
          if (aiBlocks.length === 1) {
            try {
              await handleAIGenerate(aiBlocks[0].id)
              successCount = 1
            } catch (error) {
              failCount = 1
              console.error(`生成块 ${aiBlocks[0].id} 失败:`, error)
            }
          } else {
            // 第一个块先执行
            try {
              toast.info(`正在生成第 1/${totalBlocks} 个AI内容块（优先执行）`)
              await handleAIGenerate(aiBlocks[0].id)
              successCount++
            } catch (error) {
              failCount++
              console.error(`生成第一个块 ${aiBlocks[0].id} 失败:`, error)
            }
            
            // 其余块并行执行
            if (aiBlocks.length > 1) {
              const remainingBlocks = aiBlocks.slice(1)
              toast.info(`正在并行生成剩余 ${remainingBlocks.length} 个AI内容块...`)
              
              const promises = remainingBlocks.map((block, index) => 
                handleAIGenerate(block.id)
                  .then(() => {
                    toast.success(`第 ${index + 2}/${totalBlocks} 个AI内容块生成完成`)
                    return true
                  })
                  .catch(error => {
                    toast.error(`第 ${index + 2}/${totalBlocks} 个AI内容块生成失败`)
                    console.error(`生成块 ${block.id} 失败:`, error)
                    return false
                  })
              )
              
              const results = await Promise.all(promises)
              successCount += results.filter(r => r).length
              failCount += results.filter(r => !r).length
            }
          }
          break
          
        case 'batch':
          // 分批执行：每批3个并行
          const batchSize = 3
          for (let i = 0; i < aiBlocks.length; i += batchSize) {
            const batch = aiBlocks.slice(i, Math.min(i + batchSize, aiBlocks.length))
            const batchNumber = Math.floor(i / batchSize) + 1
            const totalBatches = Math.ceil(aiBlocks.length / batchSize)
            
            toast.info(`正在处理第 ${batchNumber}/${totalBatches} 批（${batch.length} 个内容块）`)
            
            const batchPromises = batch.map((block, index) => 
              handleAIGenerate(block.id)
                .then(() => {
                  toast.success(`第 ${i + index + 1}/${totalBlocks} 个AI内容块生成完成`)
                  return true
                })
                .catch(error => {
                  toast.error(`第 ${i + index + 1}/${totalBlocks} 个AI内容块生成失败`)
                  console.error(`生成块 ${block.id} 失败:`, error)
                  return false
                })
            )
            
            const batchResults = await Promise.all(batchPromises)
            successCount += batchResults.filter(r => r).length
            failCount += batchResults.filter(r => !r).length
          }
          break
      }
      
      // 显示最终结果
      if (failCount > 0) {
        toast.warning(`生成完成：${successCount} 个成功，${failCount} 个失败`)
      } else if (successCount > 0) {
        toast.success(`所有AI内容生成完成！共成功生成 ${successCount} 个内容块`)
      }
    } catch (error) {
      console.error('生成AI内容时出错:', error)
      toast.error('部分AI内容生成失败，请检查配置后重试')
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
          <AIGeneratorBlockInput 
            block={block}
            updateBlockContent={updateBlockContent}
            updateBlockPrompt={updateBlockPrompt}
            handleAIGenerate={handleAIGenerate}
            isGenerating={isGenerating && generatingBlockId === block.id}
            generationStartTime={generatingBlockId === block.id ? generationStartTime : null}
          />
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
                          <span>{(template as any).blockCount || (template as any).content?.length || 0} 个内容块</span>
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
                          <div className="relative" ref={generateOptionsRef}>
                            <button
                              onClick={() => setShowGenerateOptions(!showGenerateOptions)}
                              disabled={isGenerating}
                              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            >
                              <Sparkles className="w-4 h-4" />
                              生成所有AI内容
                              <ChevronDown className={`w-4 h-4 transition-transform ${showGenerateOptions ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showGenerateOptions && !isGenerating && (
                              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="p-2">
                                  <button
                                    onClick={() => {
                                      setShowGenerateOptions(false)
                                      setShowExecutionOrderModal(true)
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-md transition-colors border border-purple-200 mb-2"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Layers className="w-4 h-4 text-purple-600" />
                                      <div>
                                        <div className="font-medium text-purple-700">自定义执行顺序</div>
                                        <div className="text-xs text-gray-500">配置详细的执行顺序和分组</div>
                                      </div>
                                    </div>
                                  </button>
                                  
                                  <div className="border-t pt-2 mt-2">
                                    <div className="text-xs text-gray-500 px-3 pb-2">快速选项</div>
                                    <button
                                      onClick={() => handleGenerateAllAI('smart')}
                                      className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-md transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Settings2 className="w-4 h-4 text-purple-600" />
                                        <div>
                                          <div className="font-medium text-gray-900">智能执行（推荐）</div>
                                          <div className="text-xs text-gray-500">第一个先执行，其余并行</div>
                                        </div>
                                      </div>
                                    </button>
                                  
                                  <button
                                    onClick={() => handleGenerateAllAI('serial')}
                                    className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-md transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Settings2 className="w-4 h-4 text-blue-600" />
                                      <div>
                                        <div className="font-medium text-gray-900">串行执行</div>
                                        <div className="text-xs text-gray-500">按顺序一个接一个执行</div>
                                      </div>
                                    </div>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleGenerateAllAI('parallel')}
                                    className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-md transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Settings2 className="w-4 h-4 text-green-600" />
                                      <div>
                                        <div className="font-medium text-gray-900">并行执行</div>
                                        <div className="text-xs text-gray-500">全部同时执行（最快）</div>
                                      </div>
                                    </div>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleGenerateAllAI('batch')}
                                    className="w-full text-left px-3 py-2 hover:bg-purple-50 rounded-md transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Settings2 className="w-4 h-4 text-orange-600" />
                                      <div>
                                        <div className="font-medium text-gray-900">分批执行</div>
                                        <div className="text-xs text-gray-500">每批3个并行执行</div>
                                      </div>
                                    </div>
                                  </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
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
      
      {/* AI执行顺序配置弹窗 */}
      <AIExecutionOrderModal
        isOpen={showExecutionOrderModal}
        onClose={() => setShowExecutionOrderModal(false)}
        contentBlocks={contentBlocks}
        onExecute={handleCustomExecution}
      />
    </div>
  )

}

// AI生成块输入组件 - 作为独立组件
interface AIGeneratorBlockInputProps {
  block: ContentBlock;
  updateBlockContent: (blockId: string, content: string | any) => void;
  updateBlockPrompt: (blockId: string, aiPrompt: string) => void;
  handleAIGenerate: (blockId: string) => void;
  isGenerating: boolean;
  generationStartTime: number | null;
}

const AIGeneratorBlockInput: React.FC<AIGeneratorBlockInputProps> = ({ 
  block, 
  updateBlockContent, 
  updateBlockPrompt, 
  handleAIGenerate, 
  isGenerating,
  generationStartTime 
}) => {
    const [elapsedTime, setElapsedTime] = useState(0)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [extractedContents, setExtractedContents] = useState<Map<string, string>>(new Map())
    const [isExtracting, setIsExtracting] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // 生成时间计时器
    useEffect(() => {
      if (isGenerating && generationStartTime) {
        timerRef.current = setInterval(() => {
          setElapsedTime(Math.floor((Date.now() - generationStartTime) / 1000))
        }, 1000)
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setElapsedTime(0)
      }

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }, [isGenerating, generationStartTime])

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) return

      const validation = documentService.validateFiles(files)
      
      if (validation.invalid.length > 0) {
        const invalidMessages = validation.invalid.map(
          ({ file, reason }) => `${file.name}: ${reason}`
        ).join('\n')
        toast.error(`以下文件无法上传：\n${invalidMessages}`)
      }

      if (validation.valid.length === 0) return

      const newFiles = [...uploadedFiles, ...validation.valid]
      setUploadedFiles(newFiles)
      setIsExtracting(true)

      try {
        const result = await documentService.extractTextFromDocuments(validation.valid)
        console.log('文档提取结果:', result) // 调试日志
        
        if (result.success && result.data) {
          const newContents = new Map(extractedContents)
          
          result.data.files.forEach(file => {
            console.log('处理文件:', file.fileName, file.success) // 调试日志
            if (file.success && file.text) {
              newContents.set(file.fileName, file.text)
            }
          })
          
          console.log('新内容Map:', newContents) // 调试日志
          setExtractedContents(newContents)
          updatePromptWithDocuments(newContents)
          
          if (result.data.failedCount > 0) {
            toast.error(`${result.data.failedCount} 个文件解析失败`)
          } else {
            toast.success(`成功提取 ${result.data.successCount} 个文件`)
          }
        }
      } catch (error) {
        console.error('提取文档文本错误:', error)
        toast.error('提取文档文本失败，请重试')
      } finally {
        setIsExtracting(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    const updatePromptWithDocuments = (contents: Map<string, string>) => {
      const basePrompt = block.aiPrompt?.split('\n===== 文档内容 ====')[0] || ''
      
      if (contents.size === 0) {
        updateBlockPrompt(block.id, basePrompt)
        return
      }
      
      let documentsText = '\n===== 文档内容 =====\n\n'
      
      contents.forEach((text, fileName) => {
        documentsText += `【${fileName}】\n${text}\n\n`
      })
      
      const newPrompt = basePrompt + documentsText
      updateBlockPrompt(block.id, newPrompt)
    }

    const handleRemoveFile = (fileName: string) => {
      const newFiles = uploadedFiles.filter(f => f.name !== fileName)
      setUploadedFiles(newFiles)
      
      const newContents = new Map(extractedContents)
      newContents.delete(fileName)
      setExtractedContents(newContents)
      
      updatePromptWithDocuments(newContents)
    }

    const handleRemoveAllFiles = () => {
      setUploadedFiles([])
      setExtractedContents(new Map())
      
      const basePrompt = block.aiPrompt?.split('\n===== 文档内容 ====')[0] || ''
      updateBlockPrompt(block.id, basePrompt)
    }

    return (
      <div className="space-y-3">
        {/* AI生成内容编辑器 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <SimpleRichTextEditor
              value={block.content as string}
              onChange={(content) => updateBlockContent(block.id, content)}
              placeholder="AI生成的内容将显示在这里..."
              minHeight={120}
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleAIGenerate(block.id)}
              disabled={isGenerating || (!block.aiPrompt?.trim() && uploadedFiles.length === 0)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  生成中
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成
                </>
              )}
            </button>
            {isGenerating && (
              <div className="text-xs text-center text-gray-500">
                已用时: {elapsedTime}s
              </div>
            )}
          </div>
        </div>

        {/* 提示词输入 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              提示词 <span className="text-gray-500">(可点击内容块旁的复制按钮获取引用)</span>
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
            value={block.aiPrompt?.split('\n===== 文档内容 ====')[0] || ''}
            onChange={(e) => {
              const basePrompt = e.target.value
              const documentsSection = block.aiPrompt?.split('\n===== 文档内容 ====')[1] || ''
              const newPrompt = documentsSection 
                ? basePrompt + '\n===== 文档内容 ====' + documentsSection
                : basePrompt
              updateBlockPrompt(block.id, newPrompt)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
            rows={3}
            placeholder="输入AI提示词..."
            disabled={isExtracting}
          />
        </div>

        {/* 文档上传区域 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
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
            <div className="mb-3 space-y-2 max-h-32 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div key={file.name} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                  <div className="flex items-center space-x-2 flex-1">
                    <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                        {extractedContents.has(file.name) && (
                          <span className="ml-2 text-green-600">✓ 已解析</span>
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="text-center">
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtracting || uploadedFiles.length >= 10}
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                点击上传文档（支持 .docx, .doc, .txt）
              </button>
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
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {Array.from(extractedContents.entries()).map(([fileName, content]) => (
                  <div key={fileName} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-1">【{fileName}】</h5>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-24 overflow-y-auto">
                      {content.substring(0, 300)}
                      {content.length > 300 && '...'}
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
    )
}