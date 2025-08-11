import React, { useState } from 'react';
import { 
  Trash2, 
  Edit2, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  Check, 
  X, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { AIModelListItem } from '../../types/model';
import { modelService } from '../../services/modelService';
import { useModelStore } from '../../stores/modelStore';
import { EditModelModal } from './EditModelModal';
import toast from 'react-hot-toast';

interface ModelListProps {
  models: AIModelListItem[];
  onRefresh: () => void;
}

export const ModelList: React.FC<ModelListProps> = ({ models, onRefresh }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingModel, setEditingModel] = useState<AIModelListItem | null>(null);
  
  const { removeModel, upsertModel } = useModelStore();

  const handleDelete = async (model: AIModelListItem) => {
    if (!confirm(`确定要删除模型 "${model.name}" 吗？`)) {
      return;
    }

    setDeletingId(model.id);
    try {
      await modelService.deleteModel(model.id);
      removeModel(model.id);
      toast.success('模型已删除');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (model: AIModelListItem) => {
    setTogglingId(model.id);
    try {
      const updated = await modelService.updateModel(model.id, {
        isActive: !model.isActive
      });
      upsertModel(updated);
      toast.success(updated.isActive ? '模型已启用' : '模型已禁用');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setTogglingId(null);
    }
  };

  const handleTest = async (model: AIModelListItem) => {
    setTestingId(model.id);
    try {
      const result = await modelService.testModel(model.id);
      if (result.success) {
        toast.success(`连接测试成功！响应时间: ${result.responseTime}ms`);
        // 刷新列表以更新测试状态
        onRefresh();
      } else {
        toast.error(result.error || result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '测试失败');
    } finally {
      setTestingId(null);
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'openai':
        return 'OpenAI';
      case 'custom':
        return '自定义';
      default:
        return provider;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (models.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">还没有添加任何模型</p>
        <p className="text-sm text-gray-400 mt-2">点击"添加模型"按钮来添加您的第一个AI模型</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {models.map((model) => (
        <div
          key={model.id}
          className={`bg-white border rounded-lg p-4 ${
            !model.isActive ? 'opacity-60' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{model.name}</h3>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {getProviderName(model.provider)}
                </span>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                  {model.model}
                </span>
                {model.multimodalSupport && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                    多模态
                  </span>
                )}
                {!model.isActive && (
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                    已禁用
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>API地址：{model.baseUrl}</p>
                <p>API Key：{model.apiKeyPreview}</p>
                {model.multimodalSupport && model.capabilities && (
                  <div className="text-xs text-gray-500">
                    <span>支持能力：</span>
                    {model.capabilities.imageAnalysis && <span className="text-purple-600 mr-2">图片分析</span>}
                    {model.capabilities.visionUnderstanding && <span className="text-purple-600 mr-2">视觉理解</span>}
                    {model.capabilities.documentAnalysis && <span className="text-purple-600 mr-2">文档分析</span>}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>创建于 {formatDate(model.createdAt)}</span>
                  {model.lastTested && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      最后测试：{formatDate(model.lastTested)}
                      {model.testStatus === 'success' && (
                        <Check className="h-3 w-3 text-green-500 ml-1" />
                      )}
                      {model.testStatus === 'failed' && (
                        <X className="h-3 w-3 text-red-500 ml-1" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {/* 测试按钮 */}
              <button
                onClick={() => handleTest(model)}
                disabled={testingId === model.id}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="测试连接"
              >
                {testingId === model.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
              
              {/* 启用/禁用开关 */}
              <button
                onClick={() => handleToggleActive(model)}
                disabled={togglingId === model.id}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title={model.isActive ? '禁用' : '启用'}
              >
                {togglingId === model.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : model.isActive ? (
                  <ToggleRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                )}
              </button>
              
              {/* 编辑按钮 */}
              <button
                onClick={() => setEditingModel(model)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="编辑"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              
              {/* 删除按钮 */}
              <button
                onClick={() => handleDelete(model)}
                disabled={deletingId === model.id}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                title="删除"
              >
                {deletingId === model.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {/* 编辑模态框 */}
      <EditModelModal
        isOpen={!!editingModel}
        model={editingModel}
        onClose={() => setEditingModel(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
};