export interface AppUsageData {
  name: string
  title: string
  duration: number
  launches: number
  lastActive: number
  category?: string
}

export interface DayStats {
  date: string
  totalTime: number
  apps: { [appName: string]: AppUsageData }
  timeline: Array<{
    timestamp: number
    app: string
    title: string
  }>
}

export interface TodayStats {
  totalTime: number
  totalApps: number
  topApps: AppUsageData[]
  currentApp: string | null
  currentAppDuration: number
  currentAppStartTime: number
  date: string
}

export interface WorkMode {
  id: string
  name: string
  description: string
  autoCreateDesktop: boolean
  createdAt: number
  updatedAt: number
}

declare global {
  interface Window {
    electronAPI: {
      getAppUsageData: (date?: string) => Promise<DayStats | null>
      getCurrentApp: () => Promise<string | null>
      getTodayStats: () => Promise<TodayStats>
      getCurrentAppStartTime: () => Promise<number>
      getDataDirectory: () => Promise<string>
      getTodayDataFilePath: () => Promise<string>
      onAppUsageUpdated: (callback: (data: any) => void) => void
      onAppUsageIncrementalUpdate: (callback: (data: any) => void) => void
      removeAppUsageListener: () => void
      
      // 工作模式相关API
      getAllWorkModes: () => Promise<WorkMode[]>
      getWorkMode: (id: string) => Promise<WorkMode | null>
      createWorkMode: (name: string, description?: string) => Promise<WorkMode>
      updateWorkMode: (id: string, updates: Partial<WorkMode>) => Promise<WorkMode | null>
      deleteWorkMode: (id: string) => Promise<boolean>
    }
  }
}