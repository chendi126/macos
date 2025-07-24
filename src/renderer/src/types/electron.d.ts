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

declare global {
  interface Window {
    electronAPI: {
      getAppUsageData: (date?: string) => Promise<DayStats | null>
      getCurrentApp: () => Promise<string | null>
      getTodayStats: () => Promise<TodayStats>
      getCurrentAppStartTime: () => Promise<number>
      onAppUsageUpdated: (callback: (data: any) => void) => void
      onAppUsageIncrementalUpdate: (callback: (data: any) => void) => void
      removeAppUsageListener: () => void
    }
  }
}