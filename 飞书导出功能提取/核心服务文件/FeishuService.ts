import axios, { AxiosInstance } from 'axios'
import { DayStats, AppUsageData, WorkModeSession } from '../types/electron'

export interface FeishuConfig {
  appId: string
  appSecret: string
  appToken: string
  tableId: string // 应用详细数据表ID
  summaryTableId: string // 汇总数据表ID
  blockTypeId: string
}

export interface FeishuRecord {
  record_id?: string
  fields: {
    [key: string]: any
  }
}

export interface ExportSummary {
  date: string
  totalRecords: number
  appRecords: number
  sessionRecords: number
  success: boolean
  error?: string
}

export class FeishuService {
  private config: FeishuConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0
  private axiosInstance: AxiosInstance

  constructor(config: FeishuConfig) {
    this.config = config
    this.axiosInstance = axios.create({
      baseURL: 'https://open.feishu.cn/open-apis',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // 获取访问令牌
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await this.axiosInstance.post('/auth/v3/tenant_access_token/internal', {
        app_id: this.config.appId,
        app_secret: this.config.appSecret
      })

      if (response.data.code === 0) {
        this.accessToken = response.data.tenant_access_token
        this.tokenExpiry = Date.now() + (response.data.expire - 60) * 1000 // 提前60秒刷新
        return this.accessToken
      } else {
        throw new Error(`Failed to get access token: ${response.data.msg}`)
      }
    } catch (error) {
      console.error('Error getting access token:', error)
      throw error
    }
  }

  // 设置请求头
  private async setAuthHeaders() {
    const token = await this.getAccessToken()
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // 格式化时长为可读格式
  private formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // 导出应用使用数据
  async exportAppUsageData(dayStats: DayStats): Promise<ExportSummary> {
    try {
      await this.setAuthHeaders()

      const dateTimestamp = new Date(dayStats.date).getTime()
      const totalTime = dayStats.totalTime

      // 1. 导出应用详细数据到 tblIcUV8Fz6JuQ7J
      const appRecords: FeishuRecord[] = []
      Object.values(dayStats.apps).forEach(app => {
        const percentage = totalTime > 0 ? (app.duration / totalTime) : 0
        appRecords.push({
          fields: {
            '应用名称': app.name,
            '使用时长': app.duration / (1000 * 60 * 60), // 转换为小时
            '日期': dateTimestamp,
            '占比': Math.round(percentage * 1000) / 1000 // 保留3位小数
          }
        })
      })

      let totalInserted = 0
      const batchSize = 100

      // 只导出应用详细数据，不导出汇总数据（汇总数据由工作模式会话导出）
      if (appRecords.length > 0) {
        for (let i = 0; i < appRecords.length; i += batchSize) {
          const batch = appRecords.slice(i, i + batchSize)

          const response = await this.axiosInstance.post(
            `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.tableId}/records/batch_create`,
            {
              records: batch
            }
          )

          if (response.data.code === 0) {
            totalInserted += batch.length
            console.log(`App records batch ${Math.floor(i / batchSize) + 1} inserted successfully: ${batch.length} records`)
          } else {
            throw new Error(`Failed to insert app records batch: ${response.data.msg}`)
          }
        }
      }

      return {
        date: dayStats.date,
        totalRecords: totalInserted,
        appRecords: Object.keys(dayStats.apps).length,
        sessionRecords: 0,
        success: true
      }

    } catch (error) {
      console.error('Error exporting app usage data:', error)
      return {
        date: dayStats.date,
        totalRecords: 0,
        appRecords: 0,
        sessionRecords: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 计算效率统计（与前端AppContext中的逻辑保持一致）
  private calculateEfficiencyStats(apps: { [key: string]: any }) {
    const productiveCategories = ['开发工具', '工作效率', '设计与创意']
    const distractingCategories = ['娱乐', '通讯与社交']

    let productiveTime = 0
    let distractingTime = 0
    let totalTime = 0

    Object.values(apps).forEach((app: any) => {
      totalTime += app.duration
      if (productiveCategories.includes(app.category || '')) {
        productiveTime += app.duration
      } else if (distractingCategories.includes(app.category || '')) {
        distractingTime += app.duration
      }
    })

    const efficiencyScore = totalTime > 0 ? (productiveTime / totalTime) : 0

    return {
      totalTime,
      productiveTime,
      distractingTime,
      efficiencyScore
    }
  }

  // 导出基于应用使用数据的汇总数据
  async exportAppUsageSummary(dayStats: DayStats): Promise<ExportSummary> {
    try {
      await this.setAuthHeaders()

      // 使用dayStats.totalTime作为总时长（与前端realTimeTotalTime对应）
      const totalTime = dayStats.totalTime || 0

      // 使用与前端相同的逻辑计算效率统计（基于应用分类）
      const stats = this.calculateEfficiencyStats(dayStats.apps)

      console.log('App usage summary - dayStats.totalTime:', totalTime)
      console.log('App usage summary - calculated stats:', stats)

      // 确保数据有效性
      if (totalTime <= 0) {
        throw new Error('Total time is zero or invalid')
      }

      // 转换为小时
      const totalHours = totalTime / (1000 * 60 * 60) // 使用dayStats.totalTime
      const productiveHours = stats.productiveTime / (1000 * 60 * 60)
      const distractingHours = stats.distractingTime / (1000 * 60 * 60)

      // 效率得分基于总时长计算（与前端逻辑一致）
      const efficiencyScore = totalTime > 0 ? (stats.productiveTime / totalTime) : 0

      console.log('App usage summary - final data:', {
        totalHours,
        productiveHours,
        distractingHours,
        efficiencyScore
      })

      // 创建基于应用使用的汇总记录，确保与前端显示的数据完全一致
      const summaryRecord: FeishuRecord = {
        fields: {
          '总时长': Math.round(totalHours * 100) / 100, // 使用dayStats.totalTime
          '专注时长': Math.round(productiveHours * 100) / 100, // 高效应用时长
          '分心时长': Math.round(distractingHours * 100) / 100, // 分心应用时长
          '效率得分': Math.round(efficiencyScore * 1000) / 1000 // 基于总时长的效率得分
        }
      }

      console.log('App usage summary record:', JSON.stringify(summaryRecord, null, 2))

      const response = await this.axiosInstance.post(
        `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.summaryTableId}/records/batch_create`,
        {
          records: [summaryRecord]
        }
      )

      if (response.data.code === 0) {
        console.log(`App usage summary record inserted successfully`)
        return {
          date: dayStats.date,
          totalRecords: 1,
          appRecords: 0,
          sessionRecords: 1,
          success: true
        }
      } else {
        throw new Error(`Failed to insert app usage summary: ${response.data.msg}`)
      }

    } catch (error) {
      console.error('Error exporting app usage summary:', error)
      return {
        date: dayStats.date,
        totalRecords: 0,
        appRecords: 0,
        sessionRecords: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 导出工作模式会话数据到汇总表
  async exportWorkModeSessions(sessions: WorkModeSession[]): Promise<ExportSummary> {
    try {
      await this.setAuthHeaders()

      const records: FeishuRecord[] = sessions.map(session => {
        const totalTime = session.productiveTime + session.distractingTime
        const focusRate = totalTime > 0 ? (session.productiveTime / totalTime) : 0
        const efficiencyScore = Math.round(focusRate * 1000) / 1000 // 效率得分（小数形式，保留3位小数）

        return {
          fields: {
            '总时长': totalTime / (1000 * 60 * 60), // 转换为小时
            '专注时长': session.productiveTime / (1000 * 60 * 60), // 转换为小时
            '分心时长': session.distractingTime / (1000 * 60 * 60), // 转换为小时
            '效率得分': efficiencyScore // 效率得分（小数形式，如0.3表示30%）
          }
        }
      })

      // 批量插入记录到汇总表
      const batchSize = 100
      let totalInserted = 0

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)

        const response = await this.axiosInstance.post(
          `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.summaryTableId}/records/batch_create`,
          {
            records: batch
          }
        )

        if (response.data.code === 0) {
          totalInserted += batch.length
          console.log(`Session batch ${Math.floor(i / batchSize) + 1} inserted to summary table successfully: ${batch.length} records`)
        } else {
          throw new Error(`Failed to insert session batch to summary table: ${response.data.msg}`)
        }
      }

      return {
        date: new Date().toISOString().split('T')[0],
        totalRecords: totalInserted,
        appRecords: 0,
        sessionRecords: sessions.length,
        success: true
      }

    } catch (error) {
      console.error('Error exporting work mode sessions:', error)
      return {
        date: new Date().toISOString().split('T')[0],
        totalRecords: 0,
        appRecords: 0,
        sessionRecords: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 测试连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.setAuthHeaders()

      // 测试获取应用信息
      const appResponse = await this.axiosInstance.get(
        `/bitable/v1/apps/${this.config.appToken}`
      )

      if (appResponse.data.code === 0) {
        // 测试获取应用详细数据表字段信息
        const appFieldsResponse = await this.axiosInstance.get(
          `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.tableId}/fields`
        )

        if (appFieldsResponse.data.code === 0) {
          // 测试获取汇总数据表字段信息
          const summaryFieldsResponse = await this.axiosInstance.get(
            `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.summaryTableId}/fields`
          )

          if (summaryFieldsResponse.data.code === 0) {
            const appFieldCount = appFieldsResponse.data.data.items.length
            const summaryFieldCount = summaryFieldsResponse.data.data.items.length
            return {
              success: true,
              message: `连接成功！应用: ${appResponse.data.data.app.name}, 应用详细表字段数: ${appFieldCount}, 汇总表字段数: ${summaryFieldCount}`
            }
          } else {
            return {
              success: false,
              message: `汇总表字段获取失败: ${summaryFieldsResponse.data.msg}`
            }
          }
        } else {
          return {
            success: false,
            message: `应用详细表字段获取失败: ${appFieldsResponse.data.msg}`
          }
        }
      } else {
        return {
          success: false,
          message: `应用连接失败: ${appResponse.data.msg}`
        }
      }
    } catch (error) {
      console.error('Connection test error:', error)
      if (error.response) {
        return {
          success: false,
          message: `连接错误 (${error.response.status}): ${error.response.data?.msg || error.message}`
        }
      }
      return {
        success: false,
        message: `连接错误: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}
