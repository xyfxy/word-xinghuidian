import React, { useState, useEffect } from 'react'
import { AISettings } from '../../stores/aiSettings'

interface AIProvider {
  id: string
  name: string
  models: string[]
  defaultModel: string
  requiresApiKey: boolean
  defaultBaseUrl: string
  requiresBaseUrl?: boolean
  supportsCustomHeaders?: boolean
}

interface AIModelSettingsProps {
  settings: AISettings
  onUpdate: (settings: Partial<AISettings>) => void
}

const providers: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    defaultModel: 'gpt-3.5-turbo',
    requiresApiKey: true,
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
  {
    id: 'custom',
    name: '自定义GPT服务',
    models: [],
    defaultModel: '',
    requiresApiKey: false,
    defaultBaseUrl: '',
    requiresBaseUrl: true,
    supportsCustomHeaders: true,
  },
]

export const AIModelSettings: React.FC<AIModelSettingsProps> = ({ settings, onUpdate }) => {
  const [customModel, setCustomModel] = useState('')
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([])

  const selectedProvider = providers.find(p => p.id === settings.service) || providers[0]

  useEffect(() => {
    // 初始化自定义头部
    if (settings.customHeaders) {
      const headers = Object.entries(settings.customHeaders).map(([key, value]) => ({ key, value }))
      setCustomHeaders(headers)
    }
  }, [settings.customHeaders])

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId)
    if (provider) {
      onUpdate({
        service: providerId as AISettings['service'],
        baseUrl: provider.defaultBaseUrl,
        model: provider.defaultModel,
      })
    }
  }

  const handleModelChange = (model: string) => {
    onUpdate({ model })
  }

  const handleCustomHeadersChange = (headers: Array<{ key: string; value: string }>) => {
    const headersObject = headers.reduce((acc, { key, value }) => {
      if (key && value) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)
    
    onUpdate({ customHeaders: headersObject })
  }

  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }])
  }

  const removeCustomHeader = (index: number) => {
    const newHeaders = customHeaders.filter((_, i) => i !== index)
    setCustomHeaders(newHeaders)
    handleCustomHeadersChange(newHeaders)
  }

  const updateCustomHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...customHeaders]
    newHeaders[index][field] = value
    setCustomHeaders(newHeaders)
    handleCustomHeadersChange(newHeaders)
  }

  return (
    <div className="space-y-4">
      {/* AI 服务提供商 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          AI 服务提供商
        </label>
        <select
          value={settings.service}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      {selectedProvider.requiresApiKey && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => onUpdate({ apiKey: e.target.value })}
            placeholder="请输入 API Key"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Base URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          API 地址
        </label>
        <input
          type="text"
          value={settings.baseUrl}
          onChange={(e) => onUpdate({ baseUrl: e.target.value })}
          placeholder="请输入 API 地址"
          disabled={!selectedProvider.requiresBaseUrl && settings.service !== 'custom'}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* 模型选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          模型
        </label>
        {selectedProvider.models.length > 0 ? (
          <select
            value={settings.model || selectedProvider.defaultModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {selectedProvider.models.map(model => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={settings.model || customModel}
            onChange={(e) => {
              setCustomModel(e.target.value)
              handleModelChange(e.target.value)
            }}
            placeholder="请输入模型名称"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* 自定义请求头 */}
      {selectedProvider.supportsCustomHeaders && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            自定义请求头
          </label>
          <div className="space-y-2">
            {customHeaders.map((header, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                  placeholder="Header 名称"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                  placeholder="Header 值"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeCustomHeader(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  删除
                </button>
              </div>
            ))}
            <button
              onClick={addCustomHeader}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + 添加请求头
            </button>
          </div>
        </div>
      )}

      {/* 高级设置 */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">高级设置</h4>
        
        {/* 最大长度 */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大生成长度
          </label>
          <input
            type="number"
            value={settings.maxLength}
            onChange={(e) => onUpdate({ maxLength: parseInt(e.target.value) || 500 })}
            min="10"
            max="2000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 温度 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            创造性 (Temperature)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              value={settings.temperature}
              onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) })}
              min="0"
              max="1"
              step="0.1"
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-10">{settings.temperature}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            值越低越保守，值越高越有创造性
          </p>
        </div>
      </div>
    </div>
  )
}