import React, { useState } from 'react';
import { X, Loader2, Check, AlertCircle } from 'lucide-react';
import { AIModelCreateRequest } from '../../types/model';
import { modelService } from '../../services/modelService';
import { useModelStore } from '../../stores/modelStore';
import toast from 'react-hot-toast';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddModelModal: React.FC<AddModelModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<AIModelCreateRequest>({
    name: '',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    multimodalSupport: false,
    capabilities: {
      textGeneration: true,
      imageAnalysis: false,
      visionUnderstanding: false,
      documentAnalysis: false,
      maxImageSize: 5 * 1024 * 1024,
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxImagesPerRequest: 4
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; responseTime?: number } | null>(null);
  
  const { upsertModel } = useModelStore();

  const handleProviderChange = (provider: 'openai' | 'custom') => {
    setFormData({
      ...formData,
      provider,
      baseUrl: provider === 'openai' ? 'https://api.openai.com/v1' : '',
      model: provider === 'openai' ? 'gpt-3.5-turbo' : ''
    });
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!formData.baseUrl || !formData.apiKey || !formData.model) {
      toast.error('请填写完整的配置信息');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await modelService.testConnection(formData);
      setTestResult(result);
      if (result.success) {
        toast.success(`连接测试成功！响应时间: ${result.responseTime}ms`);
      } else {
        toast.error(result.error || result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '连接测试失败';
      setTestResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.baseUrl || !formData.apiKey || !formData.model) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newModel = await modelService.createModel(formData);
      upsertModel(newModel);
      toast.success('模型添加成功');
      onSuccess();
      onClose();
      
      // 重置表单
      setFormData({
        name: '',
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        multimodalSupport: false,
        capabilities: {
          textGeneration: true,
          imageAnalysis: false,
          visionUnderstanding: false,
          documentAnalysis: false,
          maxImageSize: 5 * 1024 * 1024,
          supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          maxImagesPerRequest: 4
        }
      });
      setTestResult(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '添加模型失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">添加AI模型</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-4">
            {/* 模型名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模型名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：GPT-3.5 生产环境"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 提供商 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                提供商 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.provider}
                onChange={(e) => handleProviderChange(e.target.value as 'openai' | 'custom')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="custom">自定义（OpenAI兼容）</option>
              </select>
            </div>

            {/* API地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                OpenAI兼容的API地址，无需包含 /chat/completions
              </p>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                API Key将被加密存储，添加后只显示前4位
              </p>
            </div>

            {/* 模型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模型 <span className="text-red-500">*</span>
              </label>
              {formData.provider === 'openai' ? (
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  <option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k</option>
                  <option value="gpt-4">gpt-4</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="例如：qwen-turbo, claude-3-sonnet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
            </div>

            {/* 多模态支持 */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">多模态支持</h3>
                  <p className="text-xs text-gray-500">是否支持图片分析等多模态功能</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.multimodalSupport}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    multimodalSupport: e.target.checked,
                    capabilities: {
                      ...formData.capabilities!,
                      imageAnalysis: e.target.checked,
                      visionUnderstanding: e.target.checked,
                      documentAnalysis: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              {formData.multimodalSupport && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.capabilities?.imageAnalysis || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          capabilities: {
                            ...formData.capabilities!,
                            imageAnalysis: e.target.checked
                          }
                        })}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>图片分析</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.capabilities?.visionUnderstanding || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          capabilities: {
                            ...formData.capabilities!,
                            visionUnderstanding: e.target.checked
                          }
                        })}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>视觉理解</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.capabilities?.documentAnalysis || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          capabilities: {
                            ...formData.capabilities!,
                            documentAnalysis: e.target.checked
                          }
                        })}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span>文档分析</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">最大图片大小(MB)</label>
                      <input
                        type="number"
                        value={Math.round((formData.capabilities?.maxImageSize || 0) / (1024 * 1024))}
                        onChange={(e) => setFormData({
                          ...formData,
                          capabilities: {
                            ...formData.capabilities!,
                            maxImageSize: parseInt(e.target.value) * 1024 * 1024
                          }
                        })}
                        min="1"
                        max="20"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">最大图片数量</label>
                      <input
                        type="number"
                        value={formData.capabilities?.maxImagesPerRequest || 1}
                        onChange={(e) => setFormData({
                          ...formData,
                          capabilities: {
                            ...formData.capabilities!,
                            maxImagesPerRequest: parseInt(e.target.value)
                          }
                        })}
                        min="1"
                        max="10"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 测试连接按钮 */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !formData.baseUrl || !formData.apiKey || !formData.model}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  '测试连接'
                )}
              </button>
              
              {testResult && (
                <div className={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.success ? (
                    <>
                      <Check className="h-4 w-4" />
                      连接成功 ({testResult.responseTime}ms)
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      {testResult.message}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isTesting}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                添加中...
              </>
            ) : (
              '添加模型'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};