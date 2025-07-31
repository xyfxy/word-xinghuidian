import React, { useEffect, useState } from 'react';
import { useModelStore } from '../../stores/modelStore';
import { modelService } from '../../services/modelService';
import { RefreshCw } from 'lucide-react';

interface ModelSelectorProps {
  value?: string | null;
  onChange: (modelId: string | null) => void;
  showMaxKB?: boolean;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  value, 
  onChange, 
  showMaxKB = true,
  className = ''
}) => {
  const { models, isLoading, setModels, setLoading } = useModelStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadModels = async () => {
    if (models.length === 0) {
      setLoading(true);
    }
    try {
      const data = await modelService.getModels();
      setModels(data);
    } catch (error) {
      console.error('加载模型列表失败:', error);
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
    if (models.length === 0 && !isLoading) {
      loadModels();
    }
  }, []);

  // 获取激活的模型
  const activeModels = models.filter(m => m.isActive);

  return (
    <div className="flex items-center gap-2">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        disabled={isLoading}
      >
        <option value="">请选择模型</option>
        
        {showMaxKB && (
          <option value="maxkb">MaxKB（知识库）</option>
        )}
        
        {activeModels.length > 0 && (
          <optgroup label="已配置模型">
            {activeModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.model})
              </option>
            ))}
          </optgroup>
        )}
        
        {models.filter(m => !m.isActive).length > 0 && (
          <optgroup label="已禁用模型">
            {models.filter(m => !m.isActive).map(model => (
              <option key={model.id} value={model.id} disabled>
                {model.name} ({model.model})
              </option>
            ))}
          </optgroup>
        )}
      </select>
      
      <button
        onClick={handleRefresh}
        disabled={isRefreshing || isLoading}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        title="刷新模型列表"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};