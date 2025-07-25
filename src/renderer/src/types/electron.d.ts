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
    isWorkMode?: boolean
  }>
  workModeTime: number
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

export interface AutoStartApp {
  id: string
  name: string
  path: string
  arguments?: string
  workingDirectory?: string
  enabled: boolean
}

export interface BlacklistApp {
  id: string
  name: string
  processName: string
  enabled: boolean
}

export interface WorkMode {
  id: string
  name: string
  description: string
  autoCreateDesktop: boolean
  autoStartApps: AutoStartApp[]
  blacklistApps: BlacklistApp[]
  enableBlacklist: boolean
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
      startWorkMode: (id: string) => Promise<boolean>
      stopWorkMode: (id: string) => Promise<boolean>
      getRunningModeId: () => Promise<string | null>
      
      // 自启动应用相关API
      selectExecutableFile: () => Promise<string | null>
      addAutoStartApp: (modeId: string, app: Omit<AutoStartApp, 'id'>) => Promise<AutoStartApp | null>
      updateAutoStartApp: (modeId: string, appId: string, updates: Partial<AutoStartApp>) => Promise<boolean>
      removeAutoStartApp: (modeId: string, appId: string) => Promise<boolean>
      
      // 黑名单应用相关API
      addBlacklistApp: (modeId: string, app: Omit<BlacklistApp, 'id'>) => Promise<BlacklistApp | null>
      updateBlacklistApp: (modeId: string, appId: string, updates: Partial<BlacklistApp>) => Promise<boolean>
      removeBlacklistApp: (modeId: string, appId: string) => Promise<boolean>
      getRunningProcesses: () => Promise<string[]>
      
      // 工作模式状态管理API
      setWorkModeActive: (isActive: boolean) => Promise<boolean>
      getWorkModeActive: () => Promise<boolean>
      
      // Windows 资源管理器
      openWindowsExplorer: (path?: string) => Promise<boolean>
    }
  }
}