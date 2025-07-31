import React from 'react'
import { X } from 'lucide-react'
import { AISettings, useAISettings } from '../../stores/aiSettings'
import { AIModelSettings } from '../Settings/AIModelSettings'

interface AISettingsModalProps {
  isOpen: boolean
  onClose: () => void
  blockId?: string
  title?: string
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  blockId,
  title = '配置AI模型'
}) => {
  const { 
    globalSettings, 
    blockSettings, 
    updateGlobalSettings, 
    updateBlockSettings,
    clearBlockSettings 
  } = useAISettings()

  const currentSettings = blockId ? (blockSettings[blockId] || globalSettings) : globalSettings
  const isBlockSettings = blockId && !!blockSettings[blockId]

  const handleUpdate = (updates: Partial<AISettings>) => {
    if (blockId) {
      updateBlockSettings(blockId, updates)
    } else {
      updateGlobalSettings(updates)
    }
  }

  const handleUseGlobalSettings = () => {
    if (blockId) {
      clearBlockSettings(blockId)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {blockId && (
            <div className="mb-4">
              {isBlockSettings ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700 mb-2">
                    此AI块使用独立设置，不会影响其他AI块或全局设置。
                  </p>
                  <button
                    onClick={handleUseGlobalSettings}
                    className="text-sm px-3 py-1 bg-white text-blue-600 rounded border border-blue-300 hover:bg-blue-50"
                  >
                    切换到全局设置
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700">
                    此AI块使用全局默认设置。
                  </p>
                </div>
              )}
            </div>
          )}

          <AIModelSettings
            settings={currentSettings}
            onUpdate={handleUpdate}
          />
        </div>

        {/* 底部 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}