import { create } from 'zustand';
import { AIModelListItem } from '../types/model';

interface ModelStore {
  models: AIModelListItem[];
  isLoading: boolean;
  error: string | null;
  selectedModelId: string | null;
  
  // Actions
  setModels: (models: AIModelListItem[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedModelId: (modelId: string | null) => void;
  
  // 获取选中的模型
  getSelectedModel: () => AIModelListItem | null;
  
  // 获取所有激活的模型
  getActiveModels: () => AIModelListItem[];
  
  // 添加或更新模型
  upsertModel: (model: AIModelListItem) => void;
  
  // 删除模型
  removeModel: (modelId: string) => void;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: [],
  isLoading: false,
  error: null,
  selectedModelId: null,
  
  setModels: (models) => set({ models }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedModelId: (modelId) => set({ selectedModelId: modelId }),
  
  getSelectedModel: () => {
    const state = get();
    if (!state.selectedModelId) return null;
    return state.models.find(m => m.id === state.selectedModelId) || null;
  },
  
  getActiveModels: () => {
    const state = get();
    return state.models.filter(m => m.isActive);
  },
  
  upsertModel: (model) => {
    set((state) => {
      const index = state.models.findIndex(m => m.id === model.id);
      if (index >= 0) {
        // 更新现有模型
        const newModels = [...state.models];
        newModels[index] = model;
        return { models: newModels };
      } else {
        // 添加新模型
        return { models: [...state.models, model] };
      }
    });
  },
  
  removeModel: (modelId) => {
    set((state) => ({
      models: state.models.filter(m => m.id !== modelId),
      selectedModelId: state.selectedModelId === modelId ? null : state.selectedModelId
    }));
  }
}));