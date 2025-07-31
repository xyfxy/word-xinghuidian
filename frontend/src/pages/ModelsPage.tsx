import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { ModelList } from '../components/Models/ModelList';
import { AddModelModal } from '../components/Models/AddModelModal';
import { useModelStore } from '../stores/modelStore';
import { modelService } from '../services/modelService';
import toast from 'react-hot-toast';

export const ModelsPage: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { models, isLoading, error, setModels, setLoading, setError } = useModelStore();

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await modelService.getModels();
      setModels(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载模型列表失败';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadModels();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI模型管理</h1>
        <p className="text-gray-600 mt-2">
          管理您的AI模型配置，支持OpenAI及兼容接口
        </p>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            添加模型
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          共 {models.length} 个模型，
          {models.filter(m => m.isActive).length} 个已启用
        </div>
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">加载中...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadModels}
            className="text-sm text-red-600 underline mt-2"
          >
            重试
          </button>
        </div>
      ) : (
        <ModelList 
          models={models} 
          onRefresh={loadModels}
        />
      )}

      {/* 添加模型弹窗 */}
      <AddModelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadModels}
      />
    </div>
  );
};