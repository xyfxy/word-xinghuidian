import React, { useState } from 'react'
import { X, Copy, Link, Hash, FileText } from 'lucide-react'
import { ContentBlock } from '../../types'
import { copyToClipboard } from '../../utils/clipboard'

interface BlockReferenceSelectorProps {
  isOpen: boolean
  onClose: () => void
  blocks: ContentBlock[]
  currentBlockId?: string
  onInsertReference: (reference: string) => void
}

const BlockReferenceSelector: React.FC<BlockReferenceSelectorProps> = ({
  isOpen,
  onClose,
  blocks,
  currentBlockId,
  onInsertReference
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 只显示文本块和AI内容块，过滤掉当前块
  const availableBlocks = blocks.filter(block => 
    block.id !== currentBlockId && 
    (block.type === 'text' || block.type === 'ai-generated')
  )

  // 根据搜索词过滤
  const filteredBlocks = availableBlocks.filter(block =>
    block.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    block.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBlockIcon = (type: ContentBlock['type']) => {
    switch (type) {
      case 'text':
        return <FileText className="w-4 h-4 text-green-500" />
      case 'ai-generated':
        return <FileText className="w-4 h-4 text-orange-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getBlockTypeLabel = (type: ContentBlock['type']) => {
    switch (type) {
      case 'text':
        return '文本'
      case 'ai-generated':
        return 'AI内容'
      default:
        return type
    }
  }

  const handleInsertReference = (blockId: string) => {
    const reference = `{{${blockId}}}`
    onInsertReference(reference)
    
    // 显示复制成功提示
    setCopiedId(blockId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyReference = async (blockId: string) => {
    const reference = `{{${blockId}}}`
    const success = await copyToClipboard(reference)
    if (success) {
      setCopiedId(blockId)
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      alert('复制失败，请手动选择并复制ID：' + reference)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[70vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">插入内容块引用</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="px-6 py-3 border-b">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索内容块..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* 说明信息 */}
        <div className="px-6 py-2 bg-blue-50 text-sm text-blue-700">
          选择要引用的内容块，在AI生成时会自动将内容块内容作为提示词输入
        </div>

        {/* 内容块列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredBlocks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm ? '没有找到匹配的内容块' : '没有可引用的内容块'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        {getBlockIcon(block.type)}
                        <span className="font-medium text-gray-900 truncate">
                          {index + 1}. {block.title || '未命名内容块'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                          {getBlockTypeLabel(block.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Hash className="w-3 h-3 flex-shrink-0" />
                        <code className="font-mono bg-gray-100 px-1 py-0.5 rounded truncate">
                          {block.id}
                        </code>
                        {copiedId === block.id && (
                          <span className="text-green-600 ml-2 flex-shrink-0">已复制!</span>
                        )}
                      </div>
                      {/* 内容预览 */}
                      {block.type === 'text' && typeof block.content === 'string' && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {block.content.replace(/<[^>]*>/g, '').substring(0, 200)}
                        </div>
                      )}
                      {block.type === 'ai-generated' && block.aiPrompt && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          提示词: {block.aiPrompt.substring(0, 200)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleInsertReference(block.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                        title="插入引用"
                      >
                        插入
                      </button>
                      <button
                        onClick={() => handleCopyReference(block.id)}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                        title="复制引用代码"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>引用格式：</span>
            <code className="font-mono bg-white px-2 py-1 rounded border">{'{{blockId}}'}</code>
            <span className="ml-2">在提示词中使用此格式引用其他内容块</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockReferenceSelector