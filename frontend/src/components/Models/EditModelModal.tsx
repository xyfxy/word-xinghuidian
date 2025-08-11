import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import { AIModelListItem, AIModelUpdateRequest } from '../../types/model';
import { modelService } from '../../services/modelService';
import toast from 'react-hot-toast';

interface EditModelModalProps {
  isOpen: boolean;
  model: AIModelListItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditModelModal: React.FC<EditModelModalProps> = ({
  isOpen,
  model,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    model: '',
    multimodalSupport: false,
    isActive: true
  });
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        baseUrl: model.baseUrl,
        apiKey: '',
        model: model.model,
        multimodalSupport: model.multimodalSupport || false,
        isActive: model.isActive
      });
    }
  }, [model]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTestConnection = async () => {
    if (!model || !formData.apiKey || !formData.apiKey.trim()) {
      toast.error('请填写API Key后再测试连接');
      return;
    }

    setIsTesting(true);
    try {
      const testData = {
        name: formData.name || model.name,
        provider: model.provider,
        baseUrl: formData.baseUrl || model.baseUrl,
        apiKey: formData.apiKey,
        model: formData.model || model.model
      };

      const result = await modelService.testConnection(testData);
      
      if (result.success) {
        toast.success(`连接测试成功！响应时间: ${result.responseTime}ms`);
      } else {
        toast.error(result.error || result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '测试连接失败');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!model) return;

    if (!formData.name || !formData.name.trim() || 
        !formData.baseUrl || !formData.baseUrl.trim() || 
        !formData.model || !formData.model.trim()) {
      toast.error('请填写所有必填字段');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: AIModelUpdateRequest = {
        name: formData.name,
        baseUrl: formData.baseUrl,
        model: formData.model,
        multimodalSupport: formData.multimodalSupport,
        isActive: formData.isActive
      };

      if (formData.apiKey && formData.apiKey.trim()) {
        updateData.apiKey = formData.apiKey;
      }

      await modelService.updateModel(model.id, updateData);
      toast.success('模型更新成功');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !model) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">编辑模型</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入模型名称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API 地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="baseUrl"
              value={formData.baseUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.openai.com/v1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <p className="text-xs text-gray-500 mb-2">
              留空表示不更改现有的API Key
            </p>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                name="apiKey"
                value={formData.apiKey}
                onChange={handleInputChange}
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入新的API Key（可选）"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {formData.apiKey && formData.apiKey.trim() && (
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                    title="测试连接"
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模型标识符 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="gpt-4, claude-3-sonnet, etc."
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="multimodalSupport"
              name="multimodalSupport"
              checked={formData.multimodalSupport}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="multimodalSupport" className="text-sm text-gray-700">
              支持多模态（图像分析）
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              启用此模型
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新模型'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};