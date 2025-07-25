import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { FeishuService, FeishuConfig, ExportSummary } from './FeishuService'
import { AppTracker } from './AppTracker'
import { WorkModeManager } from './WorkModeManager'
import { DayStats, WorkModeSession } from '../types/electron'

export interface ExportConfig {
  feishu: FeishuConfig
  autoExport: boolean
  exportInterval: number // 小时
  lastExportTime: number
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
        lastExportTime: this.config?.lastExportTime || 0
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

      // 导出应用使用数据
      const dayStats = this.appTracker.getUsageData(date)
      if (dayStats) {
        const appSummary = await this.feishuService.exportAppUsageData(dayStats)
        summaries.push(appSummary)
      }

      // 导出工作模式会话数据（如果是今天的数据）
      const today = new Date().toISOString().split('T')[0]
      if (date === today) {
        const sessions = this.workModeManager.getSessionHistory(1) // 获取今天的会话
        if (sessions.length > 0) {
          const sessionSummary = await this.feishuService.exportWorkModeSessions(sessions)
          summaries.push(sessionSummary)
        }
      }

      const allSuccess = summaries.every(s => s.success)
      
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
      const summaries: ExportSummary[] = []

      // 导出应用使用汇总数据
      const dayStats = this.appTracker.getUsageData(targetDate)
      if (dayStats) {
        const summary = await this.feishuService.exportAppUsageSummary(dayStats)
        summaries.push(summary)
      }

      const allSuccess = summaries.every(s => s.success)

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

  // 导出历史数据
  public async exportHistoryData(days: number = 7): Promise<ExportResult> {
    if (!this.feishuService) {
      return {
        success: false,
        summary: [],
        error: '飞书服务未配置'
      }
    }

    try {
      const summaries: ExportSummary[] = []
      const today = new Date()

      // 导出指定天数的历史数据
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]

        const dayStats = this.appTracker.getUsageData(dateString)
        if (dayStats) {
          const summary = await this.feishuService.exportAppUsageData(dayStats)
          summaries.push(summary)
        }
      }

      // 导出工作模式会话数据
      const sessions = this.workModeManager.getSessionHistory(days)
      if (sessions.length > 0) {
        const sessionSummary = await this.feishuService.exportWorkModeSessions(sessions)
        summaries.push(sessionSummary)
      }

      const allSuccess = summaries.every(s => s.success)
      
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

  // 启用自动导出
  public enableAutoExport(intervalHours: number = 24): boolean {
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

  // 开始自动导出
  private startAutoExport() {
    if (!this.config?.autoExport || !this.feishuService) {
      return
    }

    this.stopAutoExport() // 先停止现有的定时器

    const intervalMs = this.config.exportInterval * 60 * 60 * 1000 // 转换为毫秒
    
    this.exportInterval = setInterval(async () => {
      console.log('Auto export triggered')
      try {
        const result = await this.exportTodayData()
        if (result.success) {
          console.log('Auto export completed successfully')
          if (this.config) {
            this.config.lastExportTime = Date.now()
            this.saveConfig()
          }
        } else {
          console.error('Auto export failed:', result.error)
        }
      } catch (error) {
        console.error('Auto export error:', error)
      }
    }, intervalMs)

    console.log(`Auto export started with interval: ${this.config.exportInterval} hours`)
  }

  // 停止自动导出
  private stopAutoExport() {
    if (this.exportInterval) {
      clearInterval(this.exportInterval)
      this.exportInterval = null
      console.log('Auto export stopped')
    }
  }

  // 获取导出状态
  public getExportStatus(): {
    configured: boolean
    autoExport: boolean
    lastExportTime: number
    nextExportTime: number
  } {
    return {
      configured: !!this.feishuService,
      autoExport: this.config?.autoExport || false,
      lastExportTime: this.config?.lastExportTime || 0,
      nextExportTime: this.config?.lastExportTime 
        ? this.config.lastExportTime + (this.config.exportInterval * 60 * 60 * 1000)
        : 0
    }
  }

  // 清理资源
  public cleanup() {
    this.stopAutoExport()
  }
}
