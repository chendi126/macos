import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { FeishuService, FeishuConfig, ExportSummary, WorkModeSession, TableCreationResult } from './FeishuService'
import { AppTracker, DayStats } from './AppTracker'
import { WorkModeManager } from './WorkModeManager'
import * as os from 'os'
import * as crypto from 'crypto'

export interface ExportConfig {
  feishu: FeishuConfig
  autoExport: boolean
  exportInterval: number // 小时
  lastExportTime: number
  autoOpenTable: boolean // 导出成功后自动打开表格
  userId?: string // 用户ID
  isUserTable?: boolean // 是否为用户独立表格
}

export interface UserTableSetupResult {
  success: boolean
  config?: FeishuConfig
  error?: string
}

export interface ExportResult {
  success: boolean
  summary: ExportSummary[]
  error?: string
}

export class DataExportManager {
  private configPath: string
  private config: ExportConfig | null = null
  private feishuService: FeishuService | null = null
  private appTracker: AppTracker
  private workModeManager: WorkModeManager
  private exportInterval: NodeJS.Timeout | null = null

  constructor(appTracker: AppTracker, workModeManager: WorkModeManager) {
    this.appTracker = appTracker
    this.workModeManager = workModeManager
    this.configPath = path.join(app.getPath('userData'), 'export-config.json')
    this.loadConfig()
  }

  // 加载配置
  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8')
        this.config = JSON.parse(data)
        
        if (this.config?.feishu) {
          this.feishuService = new FeishuService(this.config.feishu)
          
          // 如果启用了自动导出，设置定时器
          if (this.config.autoExport) {
            this.startAutoExport()
          }
        }
      }
    } catch (error) {
      console.error('Error loading export config:', error)
    }
  }

  // 保存配置
  private saveConfig() {
    try {
      if (this.config) {
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      }
    } catch (error) {
      console.error('Error saving export config:', error)
    }
  }

  // 设置飞书配置
  public setFeishuConfig(config: FeishuConfig): boolean {
    try {
      this.config = {
        feishu: config,
        autoExport: this.config?.autoExport || false,
        exportInterval: this.config?.exportInterval || 24, // 默认24小时
        lastExportTime: this.config?.lastExportTime || 0,
        autoOpenTable: this.config?.autoOpenTable ?? true // 默认启用自动打开表格
      }
      
      this.feishuService = new FeishuService(config)
      this.saveConfig()
      return true
    } catch (error) {
      console.error('Error setting Feishu config:', error)
      return false
    }
  }

  // 获取配置
  public getConfig(): ExportConfig | null {
    return this.config
  }

  // 测试飞书连接
  public async testFeishuConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.feishuService) {
      return { success: false, message: '飞书服务未配置' }
    }

    return await this.feishuService.testConnection()
  }

  // 导出指定日期的数据
  public async exportDateData(date: string): Promise<ExportResult> {
    if (!this.feishuService) {
      return {
        success: false,
        summary: [],
        error: '飞书服务未配置'
      }
    }

    try {
      const summaries: ExportSummary[] = []
      const today = new Date().toISOString().split('T')[0]

      // 导出应用使用数据
      let dayStats: any = null

      if (date === today) {
        // 对于今天的数据，使用实时数据（包含当前应用的实时时间）
        dayStats = this.appTracker.getRealTimeUsageData()
      } else {
        // 对于历史数据，使用保存的数据
        dayStats = this.appTracker.getUsageData(date)
      }

      if (dayStats) {
        const appSummary = await this.feishuService.exportAppUsageData(dayStats)
        summaries.push(appSummary)
      }

      // 导出工作模式会话数据（如果是今天的数据）
      if (date === today) {
        const sessions = this.getWorkModeSessions(1) // 获取今天的会话
        if (sessions.length > 0) {
          const sessionSummary = await this.feishuService.exportWorkModeSessions(sessions)
          summaries.push(sessionSummary)
        }
      }

      const allSuccess = summaries.every(s => s.success)

      // 如果导出成功且配置了自动打开表格，自动打开飞书表格
      if (allSuccess && this.config?.autoOpenTable) {
        try {
          await this.feishuService.openDetailTable()
        } catch (error) {
          console.warn('自动打开飞书表格失败:', error)
          // 不影响导出结果，只是警告
        }
      }

      return {
        success: allSuccess,
        summary: summaries,
        error: allSuccess ? undefined : '部分数据导出失败'
      }

    } catch (error) {
      return {
        success: false,
        summary: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 导出今日数据
  public async exportTodayData(): Promise<ExportResult> {
    const today = new Date().toISOString().split('T')[0]
    return await this.exportDateData(today)
  }

  // 导出应用使用汇总数据
  public async exportAppUsageSummary(date?: string): Promise<ExportResult> {
    if (!this.feishuService) {
      return {
        success: false,
        summary: [],
        error: '飞书服务未配置'
      }
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]
      const summaries: ExportSummary[] = []

      // 导出应用使用汇总数据
      let dayStats: any = null

      if (targetDate === today) {
        // 对于今天的数据，使用实时数据（包含当前应用的实时时间）
        dayStats = this.appTracker.getRealTimeUsageData()

        // 重要：需要与前端AppTracking页面使用相同的工作模式时间计算逻辑
        // 前端会根据当前工作模式状态和当前应用增量时间重新计算workModeTime
        const isWorkModeActive = this.appTracker.getWorkModeActive()
        const currentApp = this.appTracker.getCurrentApp()
        const currentAppStartTime = this.appTracker.getCurrentAppStartTime()

        if (isWorkModeActive && currentApp && currentAppStartTime > 0) {
          // 计算当前应用的增量时间
          const currentAppTotalDuration = Date.now() - currentAppStartTime
          const savedAppDuration = dayStats.apps[currentApp]?.duration || 0

          // 注意：dayStats.apps[currentApp].duration 已经包含了实时时间
          // 所以我们需要计算的是相对于保存数据的增量
          const savedData = this.appTracker.getUsageData(targetDate)
          const savedAppDurationInSavedData = savedData?.apps[currentApp]?.duration || 0
          const currentAppIncrement = (savedAppDuration - savedAppDurationInSavedData)

          // 如果工作模式激活，这个增量时间应该加到工作模式时间中
          // 但是AppTracker.getRealTimeUsageData()已经处理了这个逻辑
          // 所以这里不需要额外处理
          console.log('Work mode calculation debug:', {
            isWorkModeActive,
            currentApp,
            currentAppTotalDuration,
            savedAppDuration,
            savedAppDurationInSavedData,
            currentAppIncrement,
            workModeTime: dayStats.workModeTime
          })
        }
      } else {
        // 对于历史数据，使用保存的数据
        dayStats = this.appTracker.getUsageData(targetDate)
      }

      if (dayStats) {
        const summary = await this.feishuService.exportAppUsageSummary(dayStats)
        summaries.push(summary)
      }

      const allSuccess = summaries.every(s => s.success)

      // 如果导出成功且配置了自动打开表格，自动打开飞书汇总表格
      if (allSuccess && this.config?.autoOpenTable) {
        try {
          await this.feishuService.openSummaryTable()
        } catch (error) {
          console.warn('自动打开飞书汇总表格失败:', error)
          // 不影响导出结果，只是警告
        }
      }

      return {
        success: allSuccess,
        summary: summaries,
        error: allSuccess ? undefined : '汇总数据导出失败'
      }

    } catch (error) {
      return {
        success: false,
        summary: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }



  // 获取工作模式会话数据（简化版本，因为当前WorkModeManager可能没有getSessionHistory方法）
  private getWorkModeSessions(days: number): WorkModeSession[] {
    // 这里需要根据实际的WorkModeManager实现来调整
    // 暂时返回空数组，后续可以扩展
    return []
  }

  // 启用自动导出
  public enableAutoExport(intervalHours: number): boolean {
    try {
      if (!this.config) {
        return false
      }

      this.config.autoExport = true
      this.config.exportInterval = intervalHours
      this.saveConfig()
      this.startAutoExport()
      return true
    } catch (error) {
      console.error('Error enabling auto export:', error)
      return false
    }
  }

  // 禁用自动导出
  public disableAutoExport(): boolean {
    try {
      if (!this.config) {
        return false
      }

      this.config.autoExport = false
      this.saveConfig()
      this.stopAutoExport()
      return true
    } catch (error) {
      console.error('Error disabling auto export:', error)
      return false
    }
  }

  // 设置自动打开表格
  public setAutoOpenTable(enabled: boolean): boolean {
    try {
      if (!this.config) {
        return false
      }

      this.config.autoOpenTable = enabled
      this.saveConfig()
      return true
    } catch (error) {
      console.error('Error setting auto open table:', error)
      return false
    }
  }

  // 启动自动导出
  private startAutoExport() {
    if (!this.config || !this.config.autoExport) {
      return
    }

    this.stopAutoExport() // 先停止现有的定时器

    const intervalMs = this.config.exportInterval * 60 * 60 * 1000 // 转换为毫秒
    this.exportInterval = setInterval(async () => {
      try {
        await this.exportTodayData()
        this.config!.lastExportTime = Date.now()
        this.saveConfig()
      } catch (error) {
        console.error('Auto export error:', error)
      }
    }, intervalMs)
  }

  // 停止自动导出
  private stopAutoExport() {
    if (this.exportInterval) {
      clearInterval(this.exportInterval)
      this.exportInterval = null
    }
  }

  // 获取导出状态
  public getExportStatus() {
    return {
      configured: !!this.feishuService,
      autoExport: this.config?.autoExport || false,
      exportInterval: this.config?.exportInterval || 24,
      lastExportTime: this.config?.lastExportTime || 0
    }
  }

  /**
   * 生成用户ID
   */
  private generateUserId(): string {
    const hostname = os.hostname()
    const username = os.userInfo().username
    const machineId = `${hostname}-${username}`
    return crypto.createHash('md5').update(machineId).digest('hex').substring(0, 8)
  }

  /**
   * 为当前用户创建独立的飞书表格
   */
  async createUserTable(templateConfig: FeishuConfig): Promise<UserTableSetupResult> {
    try {
      const userId = this.generateUserId()
      console.log('为用户创建独立表格, 用户ID:', userId)

      // 使用模板配置创建FeishuService实例
      const templateService = new FeishuService(templateConfig)

      // 创建用户表格
      const result = await templateService.createUserTable(userId, templateConfig)

      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      // 创建用户专属配置
      const userConfig: FeishuConfig = {
        appId: templateConfig.appId,
        appSecret: templateConfig.appSecret,
        appToken: result.appToken!,
        tableId: result.tableId!,
        summaryTableId: result.summaryTableId!,
        blockTypeId: templateConfig.blockTypeId,
        userId: userId,
        isTemplate: false
      }

      // 保存用户配置
      this.config = {
        feishu: userConfig,
        autoExport: false,
        exportInterval: 24,
        lastExportTime: 0,
        autoOpenTable: true,
        userId: userId,
        isUserTable: true
      }

      this.feishuService = new FeishuService(userConfig)
      this.saveConfig()

      return {
        success: true,
        config: userConfig,
        shareUrl: result.shareUrl,
        accessInstructions: result.accessInstructions
      }

    } catch (error) {
      console.error('创建用户表格失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 检查是否需要创建用户表格
   */
  isUsingSharedTable(): boolean {
    return !this.config?.isUserTable
  }

  /**
   * 获取用户ID
   */
  getUserId(): string {
    return this.config?.userId || this.generateUserId()
  }

  /**
   * 调试表格结构
   */
  async debugTableStructure(): Promise<void> {
    if (this.feishuService) {
      await this.feishuService.debugTableStructure()
    } else {
      console.log('飞书服务未配置，使用测试配置获取字段信息...')
      await FeishuService.testGetTableFields()
    }
  }
}
