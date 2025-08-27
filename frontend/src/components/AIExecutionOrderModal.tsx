import React, { useState, useEffect, useCallback } from 'react'
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
  onExecute: (groups: ExecutionGroup[], excludedIds: string[]) => void
}

export default function AIExecutionOrderModal({
  isOpen,
  onClose,
  contentBlocks,
  onExecute
}: AIExecutionOrderModalProps) {
  const [executionGroups, setExecutionGroups] = useState<ExecutionGroup[]>([])
  const [excludedBlocks, setExcludedBlocks] = useState<string[]>([]) // 被排除的内容块
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [draggedFromGroup, setDraggedFromGroup] = useState<string | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [dragOverExcluded, setDragOverExcluded] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null) // 拖拽到的位置索引

  // 获取AI内容块
  const aiBlocks = contentBlocks.filter(b => b.type === 'ai-generated' && b.aiPrompt)


  // 初始化执行组
  useEffect(() => {
    if (isOpen && aiBlocks.length > 0) {
      // 默认创建一个并行组，包含所有AI块（和之前一样）
      setExecutionGroups([
        {
          id: 'group-1',
          name: '组 1',
          type: 'parallel',
          blockIds: aiBlocks.map(b => b.id)
        }
      ])
      // 默认没有排除的内容块
      setExcludedBlocks([])
    }
  }, [isOpen])

  const handleDragStart = useCallback((blockId: string, fromGroupId: string) => {
    setDraggedBlockId(blockId)
    setDraggedFromGroup(fromGroupId)
    // 重置拖拽位置状态
    setDragOverIndex(null)
  }, [])

  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault()
    setDragOverGroup(groupId)
  }

  const handleDragLeave = () => {
    setDragOverGroup(null)
  }

  const handleDrop = (e: React.DragEvent, targetGroupId: string, dropIndex?: number) => {
    e.preventDefault()
    if (!draggedBlockId || !draggedFromGroup) return

    // 如果从排除区域拖出
    if (draggedFromGroup === 'excluded') {
      setExcludedBlocks(prev => prev.filter(id => id !== draggedBlockId))
    } else if (draggedFromGroup !== 'unassigned') {
      // 从源组移除（如果不是从未分配区域拖出）
      setExecutionGroups(prev => {
        const newGroups = [...prev]
        const sourceGroup = newGroups.find(g => g.id === draggedFromGroup)
        if (sourceGroup) {
          sourceGroup.blockIds = sourceGroup.blockIds.filter(id => id !== draggedBlockId)
        }
        return newGroups
      })
    }

    // 添加到目标组
    setExecutionGroups(prev => {
      const newGroups = [...prev]
      const targetGroup = newGroups.find(g => g.id === targetGroupId)
      if (targetGroup) {
        // 先移除（如果已存在）
        targetGroup.blockIds = targetGroup.blockIds.filter(id => id !== draggedBlockId)
        // 然后在指定位置插入
        if (dropIndex !== undefined) {
          targetGroup.blockIds.splice(dropIndex, 0, draggedBlockId)
        } else {
          targetGroup.blockIds.push(draggedBlockId)
        }
      }
      return newGroups
    })

    setDraggedBlockId(null)
    setDraggedFromGroup(null)
    setDragOverGroup(null)
    setDragOverIndex(null)
  }

  const handleDropToExcluded = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedBlockId || !draggedFromGroup) return

    // 从源组移除
    if (draggedFromGroup !== 'excluded' && draggedFromGroup !== 'unassigned') {
      setExecutionGroups(prev => {
        const newGroups = [...prev]
        const sourceGroup = newGroups.find(g => g.id === draggedFromGroup)
        if (sourceGroup) {
          sourceGroup.blockIds = sourceGroup.blockIds.filter(id => id !== draggedBlockId)
        }
        return newGroups
      })
    }

    // 添加到排除列表
    if (!excludedBlocks.includes(draggedBlockId)) {
      setExcludedBlocks(prev => [...prev, draggedBlockId])
    }

    setDraggedBlockId(null)
    setDraggedFromGroup(null)
    setDragOverExcluded(false)
    setDragOverIndex(null)
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
    if (validGroups.length === 0 && excludedBlocks.length === 0) {
      alert('请至少配置一个包含内容块的执行组，或选择要排除的内容块')
      return
    }
    onExecute(validGroups, excludedBlocks)
    onClose()
  }

  const getBlockTitle = (blockId: string) => {
    const block = contentBlocks.find(b => b.id === blockId)
    return block?.title || '未知内容块'
  }

  // 移除未分配内容块的概念，所有未在执行组的都在排除区域

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
              <p>拖拽调整执行顺序，串行组内顺序决定执行先后。</p>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* 待执行/排除的内容块 */}
            <div 
              className={`border rounded-lg p-4 transition-colors ${
                dragOverExcluded ? 'border-gray-400 bg-gray-100' : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverExcluded(true)
              }}
              onDragLeave={() => setDragOverExcluded(false)}
              onDrop={handleDropToExcluded}
            >
              <div className="flex items-center gap-3 mb-3">
                <Layers className="w-5 h-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">不执行的内容块（拖到这里排除）</h3>
                {excludedBlocks.length > 0 && (
                  <span className="text-sm text-gray-600 ml-auto">
                    {excludedBlocks.length} 个内容块已排除
                  </span>
                )}
              </div>
              <div className="min-h-[60px] bg-white rounded-md p-3 border border-gray-200">
                {excludedBlocks.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-3">
                    拖拽内容块到这里可以排除执行
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {excludedBlocks.map(blockId => (
                      <div
                        key={blockId}
                        draggable
                        onDragStart={() => handleDragStart(blockId, 'excluded')}
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

            {/* 执行组列表 */}
            {executionGroups.map((group, index) => (
              <div
                key={group.id}
                className={`border rounded-lg p-4 transition-colors ${
                  dragOverGroup === group.id ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                }`}
                onDragOver={(e) => {
                  if (group.type === 'parallel' || group.blockIds.length === 0) {
                    handleDragOver(e, group.id)
                  } else {
                    // 串行模式下也要阻止默认行为，避免显示禁止图标
                    e.preventDefault()
                  }
                }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  // 只处理并行模式或空组的拖放
                  if (group.type === 'parallel' || group.blockIds.length === 0) {
                    handleDrop(e, group.id)
                  }
                }}
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
                <div 
                  className="min-h-[60px] bg-gray-50 rounded-md p-3"
                  onDragOver={(e) => {
                    // 始终阻止默认行为，避免显示禁止图标
                    e.preventDefault()
                  }}
                  onDrop={(e) => {
                    // 空组的情况
                    if (group.blockIds.length === 0) {
                      handleDrop(e, group.id)
                    }
                  }}
                >
                  {group.blockIds.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-3">
                      拖拽内容块到这里
                    </p>
                  ) : (
                    <div className={`flex ${group.type === 'serial' ? 'flex-col' : 'flex-wrap'} gap-2`}>
                      
                      {group.blockIds.map((blockId, blockIndex) => (
                          <div
                            key={blockId}
                            draggable
                            onDragStart={() => handleDragStart(blockId, group.id)}
                            onDragOver={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (group.type === 'serial') {
                                // 记录当前悬停的位置
                                setDragOverIndex(blockIndex)
                                setDragOverGroup(group.id)
                              }
                            }}
                            onDragLeave={() => {
                              // 清除悬停状态
                              setDragOverIndex(null)
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (group.type === 'serial' && draggedBlockId) {
                                // 找到拖拽块的原始索引
                                const draggedIndex = group.blockIds.indexOf(draggedBlockId)
                                
                                // 如果是同一个位置，不做任何操作
                                if (draggedIndex === blockIndex) {
                                  setDragOverIndex(null)
                                  return
                                }
                                
                                // 创建新的数组
                                const newBlockIds = [...group.blockIds]
                                
                                // 如果拖拽的块在这个组中
                                if (draggedIndex !== -1) {
                                  // 移除原位置的块
                                  const [removed] = newBlockIds.splice(draggedIndex, 1)
                                  // 在目标位置插入
                                  const targetIndex = draggedIndex < blockIndex ? blockIndex - 1 : blockIndex
                                  newBlockIds.splice(targetIndex, 0, removed)
                                } else {
                                  // 从其他地方拖来的，直接插入到目标位置
                                  handleDrop(e, group.id, blockIndex)
                                  setDragOverIndex(null)
                                  return
                                }
                                
                                // 更新组的内容块顺序
                                setExecutionGroups(prev => 
                                  prev.map(g => 
                                    g.id === group.id 
                                      ? { ...g, blockIds: newBlockIds }
                                      : g
                                  )
                                )
                                
                                setDragOverIndex(null)
                              } else if (group.type === 'parallel') {
                                // 并行模式直接添加到组
                                handleDrop(e, group.id)
                              }
                            }}
                            className={`px-3 py-2 bg-white border rounded-md cursor-move hover:shadow-sm transition-all duration-200 flex items-center gap-2 ${
                              group.type === 'serial' ? 'w-full justify-between' : ''
                            } ${
                              group.type === 'serial' && dragOverIndex === blockIndex && dragOverGroup === group.id
                                ? 'ring-2 ring-purple-400 border-purple-400 bg-purple-50'
                                : 'border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {group.type === 'serial' && (
                                <span className="text-xs text-gray-500 font-medium">{blockIndex + 1}.</span>
                              )}
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              <span className="text-sm">{getBlockTitle(blockId)}</span>
                            </div>
                            {group.type === 'serial' && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (blockIndex > 0) {
                                      setExecutionGroups(prev => {
                                        const newGroups = [...prev]
                                        const currentGroup = newGroups.find(g => g.id === group.id)
                                        if (currentGroup) {
                                          const temp = currentGroup.blockIds[blockIndex]
                                          currentGroup.blockIds[blockIndex] = currentGroup.blockIds[blockIndex - 1]
                                          currentGroup.blockIds[blockIndex - 1] = temp
                                        }
                                        return newGroups
                                      })
                                    }
                                  }}
                                  disabled={blockIndex === 0}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  title="上移"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (blockIndex < group.blockIds.length - 1) {
                                      setExecutionGroups(prev => {
                                        const newGroups = [...prev]
                                        const currentGroup = newGroups.find(g => g.id === group.id)
                                        if (currentGroup) {
                                          const temp = currentGroup.blockIds[blockIndex]
                                          currentGroup.blockIds[blockIndex] = currentGroup.blockIds[blockIndex + 1]
                                          currentGroup.blockIds[blockIndex + 1] = temp
                                        }
                                        return newGroups
                                      })
                                    }
                                  }}
                                  disabled={blockIndex === group.blockIds.length - 1}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  title="下移"
                                >
                                  ↓
                                </button>
                              </div>
                            )}
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