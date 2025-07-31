import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AISettings {
  service: 'maxkb'
  apiKey: string
  baseUrl: string
  maxLength: number
  temperature: number
}

interface AISettingsStore {
  globalSettings: AISettings
  blockSettings: Record<string, AISettings>
  updateGlobalSettings: (settings: Partial<AISettings>) => void
  updateBlockSettings: (blockId: string, settings: Partial<AISettings>) => void
  getSettingsForBlock: (blockId: string) => AISettings
  clearBlockSettings: (blockId: string) => void
}

const defaultSettings: AISettings = {
  service: 'maxkb',
  apiKey: '',
  baseUrl: '',
  maxLength: 500,
  temperature: 0.7
}

export const useAISettings = create<AISettingsStore>()(
  persist(
    (set, get) => ({
      globalSettings: defaultSettings,
      blockSettings: {},
      
      updateGlobalSettings: (settings) => {
        set((state) => ({
          globalSettings: {
            ...state.globalSettings,
            ...settings
          }
        }))
      },
      
      updateBlockSettings: (blockId, settings) => {
        set((state) => ({
          blockSettings: {
            ...state.blockSettings,
            [blockId]: {
              ...state.globalSettings,
              ...state.blockSettings[blockId],
              ...settings
            }
          }
        }))
      },
      
      getSettingsForBlock: (blockId) => {
        const state = get()
        return state.blockSettings[blockId] || state.globalSettings
      },
      
      clearBlockSettings: (blockId) => {
        set((state) => {
          const { [blockId]: _, ...rest } = state.blockSettings
          return { blockSettings: rest }
        })
      }
    }),
    {
      name: 'ai-settings-storage'
    }
  )
)