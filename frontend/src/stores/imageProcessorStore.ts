import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ImageAnalysisResult } from '../types/model'

// 缓存的图片数据类型 - 缓存压缩后的图片和分析结果
export interface CachedImageData {
  id: string
  filename: string
  compressedBase64: string // 压缩后的图片数据
  analysis?: ImageAnalysisResult
  formattedAnalysis?: string
  processedAt: number // 处理时间戳
}

// 图片处理缓存配置
export interface ImageProcessorCache {
  modelId: string
  prompt: string
  images: CachedImageData[]
  createdAt: number
  lastUsedAt: number
}

interface ImageProcessorState {
  // 当前缓存的图片处理结果
  currentCache: ImageProcessorCache | null
  
  // 设置缓存
  setCache: (cache: ImageProcessorCache) => void
  
  // 获取缓存
  getCache: () => ImageProcessorCache | null
  
  // 更新最后使用时间
  updateLastUsedTime: () => void
  
  // 清除缓存
  clearCache: () => void
  
  // 检查缓存是否有效（24小时内）
  isCacheValid: () => boolean
  
  // 获取缓存的分析结果文本（用于大纲生成）
  getCachedAnalysisText: () => string
  
  // 检查当前缓存是否匹配指定的模型和提示词
  isCacheMatch: (modelId: string, prompt: string) => boolean
}

// 缓存有效期（2小时，适合单次工作会话）
const CACHE_EXPIRY_TIME = 2 * 60 * 60 * 1000

export const useImageProcessorStore = create<ImageProcessorState>()(
  persist(
    (set, get) => ({
      currentCache: null,
      
      setCache: (cache: ImageProcessorCache) => {
        set({
          currentCache: {
            ...cache,
            lastUsedAt: Date.now()
          }
        })
      },
      
      getCache: () => {
        const state = get()
        if (state.currentCache && state.isCacheValid()) {
          return state.currentCache
        }
        return null
      },
      
      updateLastUsedTime: () => {
        const state = get()
        if (state.currentCache) {
          set({
            currentCache: {
              ...state.currentCache,
              lastUsedAt: Date.now()
            }
          })
        }
      },
      
      clearCache: () => {
        set({ currentCache: null })
      },
      
      isCacheValid: () => {
        const state = get()
        if (!state.currentCache) return false
        
        const now = Date.now()
        const cacheAge = now - state.currentCache.createdAt
        
        return cacheAge < CACHE_EXPIRY_TIME
      },
      
      getCachedAnalysisText: () => {
        const state = get()
        const cache = state.getCache()
        
        if (!cache || cache.images.length === 0) {
          return ''
        }
        
        return cache.images
          .filter(img => img.analysis?.description)
          .map((img) => {
            const actualIndex = cache.images.indexOf(img)
            return `图片${actualIndex + 1}：${img.analysis!.description}`
          })
          .join('\n\n')
      },
      
      isCacheMatch: (modelId: string, prompt: string) => {
        const state = get()
        const cache = state.getCache()
        
        if (!cache) return false
        
        return cache.modelId === modelId && cache.prompt === prompt
      }
    }),
    {
      name: 'image-processor-cache',
      // 只持久化必要的数据，避免存储过大
      partialize: (state) => ({
        currentCache: state.currentCache
      })
    }
  )
)