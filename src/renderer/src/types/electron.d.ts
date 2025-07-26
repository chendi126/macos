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

export interface WorkModeSession {
  id: string
  modeId: string
  startTime: number
  endTime?: number
  productiveTime: number // 在工作桌面上的时间
  distractingTime: number // 离开工作桌面的时间
  workDesktopId?: string // 工作桌面ID（如果可获取）
}

export interface FeishuConfig {
  appId: string
  appSecret: string
  appToken: string
  tableId: string // 应用详细数据表ID
  summaryTableId: string // 汇总数据表ID
  blockTypeId: string
  isTemplate?: boolean // 是否为模板配置
  userId?: string // 用户ID，用于区分不同用户
}

export interface UserTableSetupResult {
  success: boolean
  config?: FeishuConfig
  shareUrl?: string // 表格分享链接
  accessInstructions?: string // 访问说明
  error?: string
}

export interface UserLoginInfo {
  isLoggedIn: boolean
  userInfo?: any
  userAccessToken?: string
}

export interface UserAuthResult {
  success: boolean
  userAccessToken?: string
  userInfo?: any
  error?: string
}

export interface ExportConfig {
  feishu: FeishuConfig
  autoExport: boolean
  exportInterval: number // 小时
  lastExportTime: number
  autoOpenTable: boolean // 导出成功后自动打开表格
  userId?: string // 用户ID
  isUserTable?: boolean // 是否为用户独立表格
}

export interface ExportSummary {
  date: string
  totalRecords: number
  appRecords: number
  sessionRecords: number
  success: boolean
  error?: string
}

export interface ExportResult {
  success: boolean
  summary: ExportSummary[]
  error?: string
}

export interface ExportStatus {
  configured: boolean
  autoExport: boolean
  exportInterval: number
  lastExportTime: number
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

      // 数据导出相关API
      setFeishuConfig: (config: FeishuConfig) => Promise<boolean>
      getExportConfig: () => Promise<ExportConfig | null>
      testFeishuConnection: () => Promise<{ success: boolean; message: string }>
      exportTodayData: () => Promise<ExportResult>
      exportDateData: (date: string) => Promise<ExportResult>

      enableAutoExport: (intervalHours: number) => Promise<boolean>
      disableAutoExport: () => Promise<boolean>
      getExportStatus: () => Promise<ExportStatus>
      exportAppUsageSummary: (date?: string) => Promise<ExportResult>
      setAutoOpenTable: (enabled: boolean) => Promise<boolean>

      // 用户表格管理
      createUserTable: (templateConfig: FeishuConfig) => Promise<UserTableSetupResult>
      isUsingSharedTable: () => Promise<boolean>
      getUserId: () => Promise<string>

      // 调试功能
      debugTableStructure: () => Promise<void>

      // 嵌入式表格
      getEmbedUrls: () => Promise<{ detailUrl: string; summaryUrl: string } | null>

      // 用户授权
      generateUserAuthUrl: () => Promise<string | null>
      waitForOAuthCallback: () => Promise<UserAuthResult>
      handleUserAuthCallback: (code: string, state: string) => Promise<UserAuthResult>
      getUserLoginInfo: () => Promise<UserLoginInfo>
      userLogout: () => Promise<void>
      createUserOwnedTable: () => Promise<UserTableSetupResult>
    }
  }
}