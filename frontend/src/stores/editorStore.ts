import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DocumentTemplate, ContentBlock, DocumentFormat } from '../types';

export interface AiSettings {
  provider: AiProvider;
  maxkbBaseUrl: string;
  maxkbApiKey: string;
  maxkbModel: string;
  systemPrompt: string;
}

export type AiProvider = 'qianwen' | 'maxkb';

interface EditorStore {
  // 状态
  currentTemplate: DocumentTemplate | null;
  isLoading: boolean;
  selectedBlock: string | null;
  previewMode: boolean;
  aiSettings: AiSettings;
  expandedBlocks: Record<string, boolean>; // 记录每个内容块的展开状态
  previewWidth: number; // 预览面板宽度

  // 状态更新方法
  setCurrentTemplate: (template: DocumentTemplate | null) => void;
  setLoading: (loading: boolean) => void;
  setSelectedBlock: (blockId: string | null) => void;
  setPreviewMode: (preview: boolean) => void;
  setAiSettings: (settings: Partial<AiSettings>) => void;
  setBlockExpanded: (blockId: string, expanded: boolean) => void;
  setPreviewWidth: (width: number) => void;
  toggleAllBlocks: () => void; // 一键展开/收缩所有内容块

  // 内容块操作
  addContentBlock: (block: ContentBlock, insertPosition?: number) => void;
  updateContentBlock: (blockId: string, updates: Partial<ContentBlock>) => void;
  removeContentBlock: (blockId: string) => void;
  reorderContentBlocks: (fromIndex: number, toIndex: number) => void;
  updateTemplateFormat: (format: Partial<DocumentFormat>) => void;

  // 重置编辑器
  resetEditor: () => void;
}

// 创建深拷贝函数，确保AI设置完全独立
const deepCloneAiSettings = (settings: AiSettings): AiSettings => {
  return {
    provider: settings.provider,
    maxkbBaseUrl: settings.maxkbBaseUrl,
    maxkbApiKey: settings.maxkbApiKey,
    maxkbModel: settings.maxkbModel,
    systemPrompt: settings.systemPrompt,
  };
};

const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentTemplate: null,
      isLoading: false,
      selectedBlock: null,
      previewMode: false,
      expandedBlocks: {},
      previewWidth: 500, // 默认预览面板宽度
      aiSettings: {
        provider: 'qianwen',
        maxkbBaseUrl: '',
        maxkbApiKey: '',
        maxkbModel: 'gpt-3.5-turbo',
        systemPrompt: '你是一个专业的文档编写助手。',
      },

      // 状态更新方法
      setCurrentTemplate: (template) => {
        set({ currentTemplate: template });
        // 如果模板有保存的expandedBlocks状态，则恢复它
        if (template && template.expandedBlocks) {
          set({ expandedBlocks: template.expandedBlocks });
        } else if (template && template.content.length > 0) {
          // 如果没有保存的状态，则根据是否为新模板来设置
          const isNewTemplate = !template.id || template.id.length <= 10;
          const expandedState: Record<string, boolean> = {};
          template.content.forEach(block => {
            expandedState[block.id] = isNewTemplate; // 新模板默认展开，保存的模板保持原状态
          });
          set({ expandedBlocks: expandedState });
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setSelectedBlock: (blockId) => set({ selectedBlock: blockId }),
      setPreviewMode: (preview) => set({ previewMode: preview }),
      setPreviewWidth: (width) => set({ previewWidth: width }),
      setBlockExpanded: (blockId, expanded) =>
        set((state) => ({
          expandedBlocks: {
            ...state.expandedBlocks,
            [blockId]: expanded,
          },
        })),
      setAiSettings: (settings) =>
        set((state) => ({ 
          aiSettings: { 
            ...state.aiSettings, 
            ...settings 
          } 
        })),
      
      toggleAllBlocks: () => {
        const { currentTemplate, expandedBlocks } = get();
        if (!currentTemplate) return;
        
        // 检查是否所有块都已展开
        const allExpanded = currentTemplate.content.every(block => expandedBlocks[block.id] === true);
        
        // 如果全部展开，则全部收缩；否则全部展开
        const newExpandedState: Record<string, boolean> = {};
        currentTemplate.content.forEach(block => {
          newExpandedState[block.id] = !allExpanded;
        });
        
        set({ expandedBlocks: newExpandedState });
      },

      // 内容块操作
      addContentBlock: (block, insertPosition?: number) => {
        const { currentTemplate, aiSettings, expandedBlocks } = get();
        if (!currentTemplate) return;

        // 如果是AI块，确保它有独立的设置副本
        const blockToAdd = block.type === 'ai-generated' 
          ? { 
              ...block, 
              aiSettings: block.aiSettings ? deepCloneAiSettings(block.aiSettings) : deepCloneAiSettings(aiSettings)
            }
          : block;

        let updatedContent;
        if (insertPosition !== undefined) {
          // 在指定位置插入
          const sortedContent = [...currentTemplate.content].sort((a, b) => a.position - b.position);
          
          // 调整插入位置后的所有内容块的position
          const adjustedContent = sortedContent.map(existingBlock => {
            if (existingBlock.position >= insertPosition) {
              return { ...existingBlock, position: existingBlock.position + 1 };
            }
            return existingBlock;
          });
          
          // 设置新块的position
          blockToAdd.position = insertPosition;
          
          updatedContent = [...adjustedContent, blockToAdd].sort((a, b) => a.position - b.position);
        } else {
          // 在末尾添加
          updatedContent = [...currentTemplate.content, blockToAdd].sort((a, b) => a.position - b.position);
        }

        const updatedTemplate = {
          ...currentTemplate,
          content: updatedContent,
        };
        
        // 新添加的内容块默认是展开状态
        const updatedExpandedBlocks = {
          ...expandedBlocks,
          [block.id]: true, // 新内容块默认展开
        };
        
        set({ 
          currentTemplate: updatedTemplate,
          expandedBlocks: updatedExpandedBlocks,
        });
      },

      updateContentBlock: (blockId, updates) => {
        const { currentTemplate } = get();
        if (!currentTemplate) return;

        const updatedTemplate = {
          ...currentTemplate,
          content: currentTemplate.content.map(block => {
            if (block.id === blockId) {
              const updatedBlock = { ...block, ...updates };
              
              // 如果更新的是AI设置，确保深拷贝
              if (updates.aiSettings) {
                updatedBlock.aiSettings = deepCloneAiSettings(updates.aiSettings);
              }
              
              return updatedBlock;
            }
            return block;
          }),
        };
        set({ currentTemplate: updatedTemplate });
      },

      removeContentBlock: (blockId) => {
        const { currentTemplate, expandedBlocks } = get();
        if (!currentTemplate) return;

        const updatedTemplate = {
          ...currentTemplate,
          content: currentTemplate.content.filter(block => block.id !== blockId),
        };
        
        // 清理对应的展开状态
        const updatedExpandedBlocks = { ...expandedBlocks };
        delete updatedExpandedBlocks[blockId];
        
        set({ 
          currentTemplate: updatedTemplate,
          expandedBlocks: updatedExpandedBlocks,
        });
      },

      reorderContentBlocks: (fromIndex, toIndex) => {
        const { currentTemplate } = get();
        if (!currentTemplate) return;

        const content = [...currentTemplate.content];
        const [movedBlock] = content.splice(fromIndex, 1);
        content.splice(toIndex, 0, movedBlock);

        // 重新分配位置
        const reorderedContent = content.map((block, index) => ({
          ...block,
          position: index,
        }));

        const updatedTemplate = {
          ...currentTemplate,
          content: reorderedContent,
        };
        set({ currentTemplate: updatedTemplate });
      },

      updateTemplateFormat: (format) => {
        const { currentTemplate } = get();
        if (!currentTemplate) return;

        const updatedTemplate = {
          ...currentTemplate,
          format: {
            ...currentTemplate.format,
            ...format,
            font: {
              ...currentTemplate.format.font,
              ...(format.font || {}),
            },
            paragraph: {
              ...currentTemplate.format.paragraph,
              ...(format.paragraph || {}),
              indent: {
                ...currentTemplate.format.paragraph.indent,
                ...(format.paragraph?.indent || {}),
              },
            },
            page: {
              ...currentTemplate.format.page,
              ...(format.page || {}),
              margins: {
                ...currentTemplate.format.page.margins,
                ...(format.page?.margins || {}),
              },
            },
          },
        };
        set({ currentTemplate: updatedTemplate });
      },

      resetEditor: () => {
        set({
          currentTemplate: null,
          isLoading: false,
          selectedBlock: null,
          previewMode: false,
          expandedBlocks: {},
        });
      },
    }),
    {
      name: 'editor-ai-settings-storage', // unique name
      partialize: (state) => ({ 
        aiSettings: state.aiSettings,
        previewWidth: state.previewWidth,
      }), // persist aiSettings and previewWidth
    }
  )
);

export default useEditorStore; 