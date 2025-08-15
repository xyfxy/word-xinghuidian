import React, { useState, useEffect } from 'react'
import { X, Sparkles, Play, Layers, Zap, Clock, Info } from 'lucide-react'
import { ContentBlock } from '../types'

interface ExecutionGroup {
  id: string
  name: string
  type: 'serial' | 'parallel'
  blockIds: string[]
}

interface AIExecutionOrderModalProps {
  isOpen: boolean
  onClose: () => void
  contentBlocks: ContentBlock[]
  onExecute: (groups: ExecutionGroup[]) => void
}

export default function AIExecutionOrderModal({
  isOpen,
  onClose,
  contentBlocks,
  onExecute
}: AIExecutionOrderModalProps) {
  const [executionGroups, setExecutionGroups] = useState<ExecutionGroup[]>([])
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [draggedFromGroup, setDraggedFromGroup] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)

  // 获取AI内容块
  const aiBlocks = contentBlocks.filter(b => b.type === 'ai-generated' && b.aiPrompt)

  // 初始化执行组
  useEffect(() => {
    if (isOpen && aiBlocks.length > 0) {
      // 默认创建一个并行组，包含所有AI块
      setExecutionGroups([
        {
          id: 'group-1',
          name: '组 1',
          type: 'parallel',
          blockIds: aiBlocks.map(b => b.id)
        }
      ])
    }
  }, [isOpen])

  const handleDragStart = (blockId: string, fromGroupId: string) => {
    setDraggedBlockId(blockId)
    setDraggedFromGroup(fromGroupId)
  }

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    setDragOverGroup(groupId)
  }

  const handleDragLeave = () => {
    setDragOverGroup(null)
  }

  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault()
    if (!draggedBlockId || !draggedFromGroup) return

    setExecutionGroups(prev => {
      const newGroups = [...prev]
      
      // 从源组移除
      const sourceGroup = newGroups.find(g => g.id === draggedFromGroup)
      if (sourceGroup) {
        sourceGroup.blockIds = sourceGroup.blockIds.filter(id => id !== draggedBlockId)
      }
      
      // 添加到目标组
      const targetGroup = newGroups.find(g => g.id === targetGroupId)
      if (targetGroup && !targetGroup.blockIds.includes(draggedBlockId)) {
        targetGroup.blockIds.push(draggedBlockId)
      }
      
      return newGroups
    })

    setDraggedBlockId(null)
    setDraggedFromGroup(null)
    setDragOverGroup(null)
  }

  const addNewGroup = () => {
    const newGroup: ExecutionGroup = {
      id: `group-${Date.now()}`,
      name: `组 ${executionGroups.length + 1}`,
      type: 'parallel',
      blockIds: []
    }
    setExecutionGroups([...executionGroups, newGroup])
  }

  const removeGroup = (groupId: string) => {
    setExecutionGroups(prev => prev.filter(g => g.id !== groupId))
  }

  const toggleGroupType = (groupId: string) => {
    setExecutionGroups(prev => 
      prev.map(g => 
        g.id === groupId 
          ? { ...g, type: g.type === 'serial' ? 'parallel' : 'serial' }
          : g
      )
    )
  }

  const moveGroupUp = (index: number) => {
    if (index === 0) return
    setExecutionGroups(prev => {
      const newGroups = [...prev]
      ;[newGroups[index - 1], newGroups[index]] = [newGroups[index], newGroups[index - 1]]
      return newGroups
    })
  }

  const moveGroupDown = (index: number) => {
    if (index === executionGroups.length - 1) return
    setExecutionGroups(prev => {
      const newGroups = [...prev]
      ;[newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]]
      return newGroups
    })
  }

  const handleExecute = () => {
    // 过滤掉空组
    const validGroups = executionGroups.filter(g => g.blockIds.length > 0)
    if (validGroups.length === 0) {
      alert('请至少配置一个包含内容块的执行组')
      return
    }
    onExecute(validGroups)
    onClose()
  }

  const getBlockTitle = (blockId: string) => {
    const block = contentBlocks.find(b => b.id === blockId)
    return block?.title || '未知内容块'
  }

  const getUnassignedBlocks = () => {
    const assignedIds = executionGroups.flatMap(g => g.blockIds)
    return aiBlocks.filter(b => !assignedIds.includes(b.id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">配置AI内容生成顺序</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 说明信息 */}
        <div className="px-6 py-3 bg-blue-50 border-b">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p>将内容块拖拽到不同的执行组中，每个组可以选择串行或并行执行。</p>
              <p>执行时会按组的顺序依次执行，组内按照配置的方式执行。</p>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* 未分配的内容块 */}
            {getUnassignedBlocks().length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-3">未分配的内容块</h3>
                <div className="flex flex-wrap gap-2">
                  {getUnassignedBlocks().map(block => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleDragStart(block.id, 'unassigned')}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-md cursor-move hover:shadow-md transition-shadow flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">{block.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 执行组列表 */}
            {executionGroups.map((group, index) => (
              <div
                key={group.id}
                className={`border rounded-lg p-4 transition-colors ${
                  dragOverGroup === group.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                }`}
                onDragOver={(e) => handleDragOver(e, group.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, group.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => {
                        setExecutionGroups(prev =>
                          prev.map(g => 
                            g.id === group.id ? { ...g, name: e.target.value } : g
                          )
                        )
                      }}
                      className="font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-purple-400 rounded px-2"
                    />
                    <button
                      onClick={() => toggleGroupType(group.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        group.type === 'serial'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {group.type === 'serial' ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          串行执行
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          并行执行
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveGroupUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveGroupDown(index)}
                      disabled={index === executionGroups.length - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      ↓
                    </button>
                    {executionGroups.length > 1 && (
                      <button
                        onClick={() => removeGroup(group.id)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                        title="删除组"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 组内的内容块 */}
                <div className="min-h-[60px] bg-gray-50 rounded-md p-3">
                  {group.blockIds.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-3">
                      拖拽内容块到这里
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {group.blockIds.map(blockId => (
                        <div
                          key={blockId}
                          draggable
                          onDragStart={() => handleDragStart(blockId, group.id)}
                          className="px-3 py-2 bg-white border border-gray-300 rounded-md cursor-move hover:shadow-md transition-shadow flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="text-sm">{getBlockTitle(blockId)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 添加新组按钮 */}
            <button
              onClick={addNewGroup}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              <Layers className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">添加执行组</span>
            </button>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExecute}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            开始执行
          </button>
        </div>
      </div>
    </div>
  )
}