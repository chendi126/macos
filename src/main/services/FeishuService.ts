import axios, { AxiosInstance } from 'axios'
import { shell } from 'electron'
import { DayStats, AppUsageData } from './AppTracker'

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

export interface TableCreationResult {
  success: boolean
  appToken?: string
  tableId?: string
  summaryTableId?: string
  shareUrl?: string // 表格分享链接
  accessInstructions?: string // 访问说明
  error?: string
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

export interface WorkModeSession {
  id: string
  startTime: number
  endTime: number
  productiveTime: number
  distractingTime: number
  modeId: string
  modeName: string
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

      // 1. 导出应用详细数据
      const appRecords: FeishuRecord[] = []
      Object.values(dayStats.apps).forEach(app => {
        const percentage = totalTime > 0 ? (app.duration / totalTime) : 0
        appRecords.push({
          fields: {
            '日期': dateTimestamp, // 日期字段放在第一个位置
            '应用名称': app.name,
            '使用时长': app.duration / (1000 * 60 * 60), // 转换为小时
            '占比': Math.round(percentage * 1000) / 1000 // 保留3位小数
          }
        })
      })

      let totalInserted = 0
      const batchSize = 100

      // 导出应用详细数据，使用UPDATE策略（按应用名称+日期匹配）
      if (appRecords.length > 0) {
        console.log(`Processing ${appRecords.length} app records for date ${dayStats.date}`)

        // 为每个应用记录检查是否存在现有记录
        const recordsToCreate = []
        const recordsToUpdate = []

        for (const appRecord of appRecords) {
          const appName = appRecord.fields['应用名称']
          const existingRecordId = await this.findAppRecordByDateAndName(dayStats.date, appName)

          if (existingRecordId) {
            // 找到现有记录，准备更新
            recordsToUpdate.push({
              recordId: existingRecordId,
              fields: appRecord.fields,
              appName: appName
            })
            console.log(`Will update existing record for ${appName}`)
          } else {
            // 没有找到现有记录，准备创建
            recordsToCreate.push(appRecord)
            console.log(`Will create new record for ${appName}`)
          }
        }

        // 更新现有记录
        if (recordsToUpdate.length > 0) {
          console.log(`Updating ${recordsToUpdate.length} existing app records...`)
          for (const updateRecord of recordsToUpdate) {
            const success = await this.updateRecord(this.config.tableId, updateRecord.recordId, updateRecord.fields)
            if (success) {
              console.log(`✅ Updated record for ${updateRecord.appName}`)
              totalInserted++
            } else {
              console.error(`❌ Failed to update record for ${updateRecord.appName}`)
            }
          }
        }

        // 创建新记录
        if (recordsToCreate.length > 0) {
          console.log(`Creating ${recordsToCreate.length} new app records...`)
          for (let i = 0; i < recordsToCreate.length; i += batchSize) {
            const batch = recordsToCreate.slice(i, i + batchSize)

            const response = await this.axiosInstance.post(
              `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.tableId}/records/batch_create`,
              {
                records: batch
              }
            )

            if (response.data.code === 0) {
              totalInserted += batch.length
              console.log(`✅ Created batch ${Math.floor(i / batchSize) + 1}: ${batch.length} new app records`)
            } else {
              throw new Error(`Failed to create app records batch: ${response.data.msg}`)
            }
          }
        }

        console.log(`App records processing completed: ${recordsToUpdate.length} updated, ${recordsToCreate.length} created`)
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

  // 计算效率统计（与前端AppContext中的逻辑完全一致）
  private calculateEfficiencyStats(apps: { [key: string]: any }, usageData?: any) {
    const productiveCategories = ['开发工具', '工作效率', '设计与创意']
    const distractingCategories = ['娱乐', '通讯与社交']

    let productiveTime = 0
    let distractingTime = 0
    let totalTime = 0

    // 计算各应用的时间分类
    Object.values(apps).forEach((app: any) => {
      totalTime += app.duration
      if (productiveCategories.includes(app.category || '')) {
        productiveTime += app.duration
      } else if (distractingCategories.includes(app.category || '')) {
        distractingTime += app.duration
      }
    })

    // 如果有工作模式时间数据，采用简化逻辑：
    // 工作模式时间直接替换为高效时间
    if (usageData && usageData.workModeTime > 0) {
      // 使用usageData.totalTime作为总时长基准（这是AppTracker计算的实时总时长）
      const realTotalTime = usageData.totalTime || totalTime

      // 计算非工作模式时间
      const nonWorkModeTime = realTotalTime - usageData.workModeTime

      // 重新分配时间：工作模式时间全部为高效时间
      productiveTime = usageData.workModeTime

      // 非工作模式时间按原有逻辑分配
      let nonWorkModeProductiveTime = 0
      let nonWorkModeDistractingTime = 0

      Object.values(apps).forEach((app: any) => {
        // 这里简化处理，假设应用时间均匀分布在工作模式和非工作模式中
        const appNonWorkModeTime = nonWorkModeTime > 0 ?
          app.duration * (nonWorkModeTime / totalTime) : 0

        if (productiveCategories.includes(app.category || '')) {
          nonWorkModeProductiveTime += appNonWorkModeTime
        } else if (distractingCategories.includes(app.category || '')) {
          nonWorkModeDistractingTime += appNonWorkModeTime
        }
      })

      productiveTime += nonWorkModeProductiveTime
      distractingTime = nonWorkModeDistractingTime

      // 使用实际的总时长
      totalTime = realTotalTime
    }

    const neutralTime = totalTime - productiveTime - distractingTime
    const efficiencyScore = totalTime > 0 ? (productiveTime / totalTime) : 0

    return {
      totalTime,
      productiveTime,
      distractingTime,
      neutralTime,
      efficiencyScore
    }
  }

  // 导出基于应用使用数据的汇总数据（与前端AppTracking页面完全一致）
  async exportAppUsageSummary(dayStats: DayStats): Promise<ExportSummary> {
    try {
      await this.setAuthHeaders()

      // 使用dayStats.totalTime作为总时长（与前端realTimeTotalTime对应）
      // 这是AppTracker计算的实时总时长，包含当前应用的实时时间
      const totalTime = dayStats.totalTime

      // 使用与前端AppTracking页面相同的逻辑计算效率统计
      // 但使用dayStats.totalTime作为基准，而不是重新计算totalTime
      const stats = this.calculateEfficiencyStats(dayStats.apps, dayStats)

      console.log('App usage summary - dayStats:', {
        totalTime: dayStats.totalTime,
        workModeTime: dayStats.workModeTime,
        appsCount: Object.keys(dayStats.apps).length
      })

      // 详细的应用时间分析
      console.log('App usage summary - apps breakdown:')
      Object.values(dayStats.apps).forEach((app: any) => {
        console.log(`  ${app.name}: ${app.duration}ms (${app.category || 'Unknown'})`)
      })

      console.log('App usage summary - calculated stats:', stats)

      // 确保数据有效性
      if (totalTime <= 0) {
        throw new Error('Total time is zero or invalid')
      }

      // 转换为小时 - 使用dayStats.totalTime而不是stats.totalTime
      const totalHours = totalTime / (1000 * 60 * 60)
      const productiveHours = stats.productiveTime / (1000 * 60 * 60)
      const distractingHours = stats.distractingTime / (1000 * 60 * 60)

      // 效率得分基于dayStats.totalTime计算，返回小数格式（如0.75表示75%）
      const efficiencyScore = totalTime > 0 ? Math.round((stats.productiveTime / totalTime) * 1000) / 1000 : 0

      console.log('App usage summary - final data:', {
        totalHours,
        productiveHours,
        distractingHours,
        efficiencyScore: (efficiencyScore * 100).toFixed(1) + '%'
      })

      // 创建汇总记录，日期字段放在第一个位置
      const summaryRecord: FeishuRecord = {
        fields: {
          '日期': new Date(dayStats.date).getTime(), // 日期字段（时间戳格式）
          '总时长': Math.round(totalHours * 100) / 100, // 小时，保留2位小数
          '专注时长': Math.round(productiveHours * 100) / 100, // 小时，保留2位小数
          '分心时长': Math.round(distractingHours * 100) / 100, // 小时，保留2位小数
          '效率得分': efficiencyScore // 小数格式，如0.75表示75%
        }
      }

      console.log('App usage summary record:', JSON.stringify(summaryRecord, null, 2))

      // 查找指定日期是否已有汇总记录
      const existingRecordId = await this.findSummaryRecordByDate(dayStats.date)

      let success = false
      let operation = ''

      if (existingRecordId) {
        // 更新现有记录
        success = await this.updateRecord(this.config.summaryTableId, existingRecordId, summaryRecord.fields)
        operation = 'updated'
        console.log(`App usage summary record ${success ? 'updated' : 'update failed'} (ID: ${existingRecordId})`)
      } else {
        // 创建新记录
        const response = await this.axiosInstance.post(
          `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.summaryTableId}/records/batch_create`,
          {
            records: [summaryRecord]
          }
        )

        success = response.data.code === 0
        operation = 'created'

        if (success) {
          console.log(`App usage summary record created successfully`)
        } else {
          throw new Error(`Failed to create app usage summary: ${response.data.msg}`)
        }
      }

      if (success) {
        return {
          date: dayStats.date,
          totalRecords: 1,
          appRecords: 0,
          sessionRecords: 1,
          success: true
        }
      } else {
        throw new Error(`Failed to ${operation} app usage summary`)
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

      // 按日期分组会话数据
      const sessionsByDate = new Map<string, WorkModeSession[]>()
      sessions.forEach(session => {
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0]
        if (!sessionsByDate.has(sessionDate)) {
          sessionsByDate.set(sessionDate, [])
        }
        sessionsByDate.get(sessionDate)!.push(session)
      })

      let totalInserted = 0

      // 为每个日期处理会话数据
      for (const [date, dateSessions] of sessionsByDate) {
        const dateTimestamp = new Date(date).getTime()

        console.log(`Processing work mode sessions for date: ${date} (${dateSessions.length} sessions)`)

        // 先删除该日期的现有工作模式会话记录
        await this.deleteWorkModeSessionsByDate(date)

        // 创建该日期的会话记录
        const records: FeishuRecord[] = dateSessions.map(session => {
          const totalTime = session.productiveTime + session.distractingTime
          const focusRate = totalTime > 0 ? (session.productiveTime / totalTime) : 0
          const efficiencyScore = Math.round(focusRate * 1000) / 1000 // 效率得分（小数形式，保留3位小数）

          return {
            fields: {
              '日期': dateTimestamp, // 添加日期字段
              '总时长': totalTime / (1000 * 60 * 60), // 转换为小时
              '专注时长': session.productiveTime / (1000 * 60 * 60), // 转换为小时
              '分心时长': session.distractingTime / (1000 * 60 * 60), // 转换为小时
              '效率得分': efficiencyScore, // 效率得分（小数形式，如0.3表示30%）
              '会话类型': 'work_mode' // 标识这是工作模式会话记录
            }
          }
        })

        // 批量插入该日期的记录
        const batchSize = 100
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
            console.log(`Work mode session batch for ${date} inserted successfully: ${batch.length} records`)
          } else {
            throw new Error(`Failed to insert work mode session batch for ${date}: ${response.data.msg}`)
          }
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

  // 查找指定日期的现有记录
  private async findExistingRecord(tableId: string, date: string): Promise<string | null> {
    try {
      const dateTimestamp = new Date(date).getTime()

      // 查询记录，使用日期字段过滤
      const response = await this.axiosInstance.get(
        `/bitable/v1/apps/${this.config.appToken}/tables/${tableId}/records`,
        {
          params: {
            filter: `CurrentValue.[日期] = ${dateTimestamp}`,
            page_size: 1
          }
        }
      )

      if (response.data.code === 0 && response.data.data.items.length > 0) {
        return response.data.data.items[0].record_id
      }

      return null
    } catch (error) {
      console.error('Error finding existing record:', error)
      return null
    }
  }

  // 查找指定日期的汇总记录（现在汇总表也有日期字段了）
  private async findSummaryRecordByDate(date: string): Promise<string | null> {
    try {
      const dateTimestamp = new Date(date).getTime()

      console.log(`Searching for existing summary record with date: ${date} (timestamp: ${dateTimestamp})`)

      // 查询所有记录，然后在客户端筛选（因为飞书API的过滤器可能有限制）
      const response = await this.axiosInstance.get(
        `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.summaryTableId}/records`,
        {
          params: {
            page_size: 100 // 获取足够多的记录进行筛选
          }
        }
      )

      if (response.data.code === 0 && response.data.data && response.data.data.items) {
        console.log(`Found ${response.data.data.items.length} total summary records, searching for date match...`)

        // 在客户端筛选匹配的日期记录
        for (const item of response.data.data.items) {
          const recordDate = item.fields['日期']
          console.log(`Checking record ${item.record_id}: date field = ${recordDate}`)

          if (recordDate === dateTimestamp) {
            console.log(`Found matching summary record: ${item.record_id}`)
            return item.record_id
          }
        }

        console.log(`No matching summary record found for date ${date}`)
      }

      return null
    } catch (error) {
      console.error('Error finding summary record by date:', error)
      return null
    }
  }

  // 查找指定日期和应用名称的应用详细记录
  private async findAppRecordByDateAndName(date: string, appName: string): Promise<string | null> {
    try {
      const dateTimestamp = new Date(date).getTime()

      console.log(`Searching for existing app record with date: ${date} and app: ${appName}`)

      // 查询所有记录，然后在客户端筛选
      const response = await this.axiosInstance.get(
        `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.tableId}/records`,
        {
          params: {
            page_size: 500 // 应用记录可能比较多
          }
        }
      )

      if (response.data.code === 0 && response.data.data && response.data.data.items) {
        console.log(`Found ${response.data.data.items.length} total app records, searching for date and app matches...`)

        // 在客户端筛选匹配的日期和应用名称记录
        for (const item of response.data.data.items) {
          const recordDate = item.fields['日期']
          const recordAppName = item.fields['应用名称']

          if (recordDate === dateTimestamp && recordAppName === appName) {
            console.log(`Found matching app record: ${item.record_id} (${appName} on ${date})`)
            return item.record_id
          }
        }

        console.log(`No existing app record found for ${appName} on ${date}`)
        return null
      }

      return null
    } catch (error) {
      console.error('Error finding app record by date and name:', error)
      return null
    }
  }

  // 更新现有记录
  private async updateRecord(tableId: string, recordId: string, fields: any): Promise<boolean> {
    try {
      const response = await this.axiosInstance.put(
        `/bitable/v1/apps/${this.config.appToken}/tables/${tableId}/records/${recordId}`,
        {
          fields
        }
      )

      return response.data.code === 0
    } catch (error) {
      console.error('Error updating record:', error)
      return false
    }
  }

  // 注意：batchDeleteRecords 方法已被移除，现在使用精确的单个记录更新策略

  // 注意：deleteRecordsByDate 方法已被移除，现在使用更简洁的 UPDATE 策略

  // 删除指定日期的工作模式会话记录
  private async deleteWorkModeSessionsByDate(date: string): Promise<void> {
    try {
      const dateTimestamp = new Date(date).getTime()

      console.log(`Searching for existing work mode sessions to delete with date: ${date} (timestamp: ${dateTimestamp})`)

      // 查询所有记录，然后在客户端筛选工作模式会话记录
      const response = await this.axiosInstance.get(
        `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.summaryTableId}/records`,
        {
          params: {
            page_size: 500 // 获取足够多的记录
          }
        }
      )

      if (response.data.code === 0 && response.data.data && response.data.data.items) {
        console.log(`Found ${response.data.data.items.length} total summary records, searching for work mode sessions...`)

        // 在客户端筛选匹配的工作模式会话记录
        const recordsToDelete = []
        for (const item of response.data.data.items) {
          const recordDate = item.fields['日期']
          const sessionType = item.fields['会话类型']

          if (recordDate === dateTimestamp && sessionType === 'work_mode') {
            recordsToDelete.push(item.record_id)
            console.log(`Found work mode session to delete: ${item.record_id} (date: ${recordDate})`)
          }
        }

        if (recordsToDelete.length > 0) {
          console.log(`Found ${recordsToDelete.length} existing work mode sessions for date ${date}, deleting...`)

          // 批量删除记录
          const deleteResponse = await this.axiosInstance.delete(
            `/bitable/v1/apps/${this.config.appToken}/tables/${this.config.summaryTableId}/records/batch_delete`,
            {
              data: {
                records: recordsToDelete
              }
            }
          )

          if (deleteResponse.data.code === 0) {
            console.log(`Successfully deleted ${recordsToDelete.length} existing work mode sessions for date ${date}`)
          } else {
            console.error(`Failed to delete existing work mode sessions: ${deleteResponse.data.msg}`)
          }
        } else {
          console.log(`No existing work mode sessions found for date ${date}`)
        }
      } else {
        console.log(`No records found in summary table`)
      }
    } catch (error) {
      console.error('Error deleting work mode sessions by date:', error)
      // 不抛出错误，允许继续插入新记录
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

  /**
   * 生成飞书多维表格的URL
   */
  private generateTableUrl(tableId?: string): string {
    const targetTableId = tableId || this.config.tableId
    return `https://feishu.cn/base/${this.config.appToken}?table=${targetTableId}&view=vewqhz5UFN`
  }

  /**
   * 打开飞书多维表格
   */
  async openTable(tableId?: string): Promise<void> {
    try {
      const url = this.generateTableUrl(tableId)
      await shell.openExternal(url)
      console.log('已打开飞书表格:', url)
    } catch (error) {
      console.error('打开飞书表格失败:', error)
      throw error
    }
  }

  /**
   * 打开应用详细数据表
   */
  async openDetailTable(): Promise<void> {
    return this.openTable(this.config.tableId)
  }

  /**
   * 打开汇总数据表
   */
  async openSummaryTable(): Promise<void> {
    return this.openTable(this.config.summaryTableId)
  }

  /**
   * 获取表格字段信息（用于调试字段名称问题）
   */
  async getTableFields(tableId: string): Promise<any> {
    try {
      await this.setAuthHeaders()

      const response = await this.axiosInstance.get(
        `/bitable/v1/apps/${this.config.appToken}/tables/${tableId}/fields`
      )

      if (response.data.code === 0) {
        console.log(`Table ${tableId} fields:`, JSON.stringify(response.data.data.items, null, 2))
        return response.data.data.items
      } else {
        console.error(`Failed to get table fields: ${response.data.msg}`)
        return null
      }
    } catch (error) {
      console.error('Error getting table fields:', error)
      return null
    }
  }

  /**
   * 调试方法：获取所有表格的字段信息
   */
  async debugTableStructure(): Promise<void> {
    console.log('=== 调试表格结构 ===')

    console.log('\n1. 应用详细数据表字段:')
    await this.getTableFields(this.config.tableId)

    console.log('\n2. 汇总数据表字段:')
    await this.getTableFields(this.config.summaryTableId)

    console.log('=== 调试完成 ===')
  }

  /**
   * 临时测试方法：使用指定的配置获取表格字段
   */
  static async testGetTableFields(): Promise<void> {
    try {
      // 使用提供的测试配置
      const testConfig: FeishuConfig = {
        appId: 'cli_a808ad9d0878d00c',
        appSecret: 'RWK6uKuO6yNjpVq0IMcdVcyGFgJ5DAKg',
        appToken: 'Wrw1bQmDVasiLXssPc8c9SjknRb',
        tableId: 'tblvIdQDd3s2jVEL', // 应用详细数据表
        summaryTableId: 'tblYtClzdFEqBwg8', // 汇总数据表
        blockTypeId: ''
      }

      const testService = new FeishuService(testConfig)

      console.log('=== 测试获取表格字段信息 ===')

      console.log('\n1. 应用详细数据表字段 (tblvIdQDd3s2jVEL):')
      await testService.getTableFields(testConfig.tableId)

      console.log('\n2. 汇总数据表字段 (tblYtClzdFEqBwg8):')
      await testService.getTableFields(testConfig.summaryTableId)

      console.log('=== 测试完成 ===')
    } catch (error) {
      console.error('测试获取表格字段失败:', error)
    }
  }

  /**
   * 为用户创建独立的飞书多维表格
   */
  async createUserTable(userId: string, templateConfig: FeishuConfig): Promise<TableCreationResult> {
    try {
      // 确保有访问令牌
      await this.setAuthHeaders()

      // 1. 创建新的多维表格
      const appResponse = await this.axiosInstance.post('/bitable/v1/apps', {
        name: `桌面助手数据表_${userId}_${new Date().toISOString().split('T')[0]}`,
        folder_token: '' // 可以指定文件夹，留空则创建在根目录
      })

      if (appResponse.data.code !== 0) {
        throw new Error(`创建多维表格失败: ${appResponse.data.msg}`)
      }

      const newAppToken = appResponse.data.data.app.app_token
      console.log('创建新多维表格成功:', newAppToken)

      // 2. 创建应用详细数据表（4个字段）
      const detailTableId = await this.createDetailTable(newAppToken)

      // 3. 创建汇总数据表（5个字段）
      const summaryTableId = await this.createSummaryTable(newAppToken)

      // 4. 设置表格为公开可访问（任何人可查看和编辑）
      try {
        await this.setTablePublicAccess(newAppToken)
        console.log('成功设置表格为公开访问')
      } catch (error) {
        console.warn('设置表格公开访问失败，但表格创建成功:', error)
      }

      // 5. 尝试设置用户编辑权限
      try {
        const hasEditPermission = await this.setUserEditPermission(newAppToken)
        if (hasEditPermission) {
          console.log('成功设置用户编辑权限')
        } else {
          console.warn('设置用户编辑权限失败，用户需要手动设置')
        }
      } catch (error) {
        console.warn('设置用户编辑权限异常:', error)
      }

      // 6. 生成表格访问链接和说明
      const shareUrl = this.generateTableUrl(detailTableId)
      const accessInstructions = this.generateAccessInstructions(newAppToken, userId)

      return {
        success: true,
        appToken: newAppToken,
        tableId: detailTableId,
        summaryTableId: summaryTableId,
        shareUrl: shareUrl,
        accessInstructions: accessInstructions
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
   * 获取表格结构
   */
  private async getTableStructure(appToken: string): Promise<{detailTable: any, summaryTable: any}> {
    // 确保有访问令牌
    await this.setAuthHeaders()

    // 获取应用详细数据表结构
    const detailFieldsResponse = await this.axiosInstance.get(
      `/bitable/v1/apps/${appToken}/tables/${this.config.tableId}/fields`
    )

    // 获取汇总数据表结构
    const summaryFieldsResponse = await this.axiosInstance.get(
      `/bitable/v1/apps/${appToken}/tables/${this.config.summaryTableId}/fields`
    )

    if (detailFieldsResponse.data.code !== 0 || summaryFieldsResponse.data.code !== 0) {
      throw new Error('获取模板表格结构失败')
    }

    return {
      detailTable: detailFieldsResponse.data.data.items,
      summaryTable: summaryFieldsResponse.data.data.items
    }
  }

  /**
   * 根据模板结构创建数据表
   */
  private async createTableWithStructure(appToken: string, tableName: string, fields: any[]): Promise<string> {
    // 确保有访问令牌
    await this.setAuthHeaders()

    // 1. 创建数据表
    const tableResponse = await this.axiosInstance.post(
      `/bitable/v1/apps/${appToken}/tables`,
      {
        table: {
          name: tableName
        }
      }
    )

    if (tableResponse.data.code !== 0) {
      throw new Error(`创建数据表 ${tableName} 失败: ${tableResponse.data.msg}`)
    }

    const tableId = tableResponse.data.data.table_id
    console.log(`创建数据表 ${tableName} 成功:`, tableId)

    // 2. 删除默认字段（除了第一个字段，通常是文本字段）
    const defaultFields = await this.axiosInstance.get(
      `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`
    )

    if (defaultFields.data.code === 0 && defaultFields.data.data.items.length > 1) {
      // 删除除第一个字段外的所有默认字段
      for (let i = 1; i < defaultFields.data.data.items.length; i++) {
        const fieldId = defaultFields.data.data.items[i].field_id
        await this.axiosInstance.delete(
          `/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${fieldId}`
        )
      }
    }

    // 3. 根据模板添加字段
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]

      if (i === 0) {
        // 更新第一个字段
        await this.axiosInstance.put(
          `/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${defaultFields.data.data.items[0].field_id}`,
          {
            field_name: field.field_name,
            type: field.type,
            property: field.property
          }
        )
      } else {
        // 添加新字段
        await this.axiosInstance.post(
          `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
          {
            field_name: field.field_name,
            type: field.type,
            property: field.property
          }
        )
      }
    }

    return tableId
  }

  /**
   * 创建应用详细数据表（4个字段）
   */
  private async createDetailTable(appToken: string): Promise<string> {
    await this.setAuthHeaders()

    // 1. 创建数据表
    const tableResponse = await this.axiosInstance.post(
      `/bitable/v1/apps/${appToken}/tables`,
      {
        table: {
          name: '应用详细数据'
        }
      }
    )

    if (tableResponse.data.code !== 0) {
      throw new Error(`创建应用详细数据表失败: ${tableResponse.data.msg}`)
    }

    const tableId = tableResponse.data.data.table_id
    console.log('创建应用详细数据表成功:', tableId)

    // 2. 获取默认字段
    const defaultFields = await this.axiosInstance.get(
      `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`
    )

    // 3. 更新第一个字段为 Date
    if (defaultFields.data.code === 0 && defaultFields.data.data.items.length > 0) {
      const firstFieldId = defaultFields.data.data.items[0].field_id
      await this.axiosInstance.put(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${firstFieldId}`,
        {
          field_name: '日期',
          type: 5, // 日期时间类型
          property: {}
        }
      )
    }

    // 4. 添加其他字段
    const fieldsToAdd = [
      {
        field_name: '应用名称',
        type: 1, // 文本类型
        property: {}
      },
      {
        field_name: '使用时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '占比',
        type: 2, // 数字类型
        property: {
          formatter: '0.000'
        }
      }
    ]

    for (const field of fieldsToAdd) {
      await this.axiosInstance.post(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
        field
      )
    }

    console.log('应用详细数据表字段创建完成，共4个字段')
    return tableId
  }

  /**
   * 创建汇总数据表（5个字段）
   */
  private async createSummaryTable(appToken: string): Promise<string> {
    await this.setAuthHeaders()

    // 1. 创建数据表
    const tableResponse = await this.axiosInstance.post(
      `/bitable/v1/apps/${appToken}/tables`,
      {
        table: {
          name: '汇总数据'
        }
      }
    )

    if (tableResponse.data.code !== 0) {
      throw new Error(`创建汇总数据表失败: ${tableResponse.data.msg}`)
    }

    const tableId = tableResponse.data.data.table_id
    console.log('创建汇总数据表成功:', tableId)

    // 2. 获取默认字段
    const defaultFields = await this.axiosInstance.get(
      `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`
    )

    // 3. 更新第一个字段为 Date
    if (defaultFields.data.code === 0 && defaultFields.data.data.items.length > 0) {
      const firstFieldId = defaultFields.data.data.items[0].field_id
      await this.axiosInstance.put(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${firstFieldId}`,
        {
          field_name: '日期',
          type: 5, // 日期时间类型
          property: {}
        }
      )
    }

    // 4. 添加其他字段
    const fieldsToAdd = [
      {
        field_name: '总时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '专注时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '分心时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '效率得分',
        type: 2, // 数字类型
        property: {
          formatter: '0.000'
        }
      }
    ]

    for (const field of fieldsToAdd) {
      await this.axiosInstance.post(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
        field
      )
    }

    console.log('汇总数据表字段创建完成，共5个字段')
    return tableId
  }

  /**
   * 设置表格为公开访问
   */
  private async setTablePublicAccess(appToken: string): Promise<void> {
    await this.setAuthHeaders()

    try {
      // 方法1: 使用多维表格权限API设置编辑权限
      const bitablePermissionResponse = await this.axiosInstance.patch(
        `/bitable/v1/apps/${appToken}`,
        {
          is_advanced: false, // 设置为基础版本
          revision: 1 // 版本号
        }
      )

      if (bitablePermissionResponse.data.code === 0) {
        console.log('成功设置多维表格基础权限')
      }
    } catch (error) {
      console.log('设置多维表格基础权限失败:', error.message)
    }

    try {
      // 方法2: 尝试设置表格的公开权限
      const response = await this.axiosInstance.patch(
        `/drive/v1/permissions/${appToken}/public`,
        {
          link_share_entity: 'anyone_can_edit', // 任何人可编辑
          is_external_access_allowed: true, // 允许外部访问
          security_policy: 'anyone_can_edit' // 任何人可编辑
        }
      )

      if (response.data.code === 0) {
        console.log('成功设置表格为公开编辑访问')
        return
      } else {
        console.log('方法2失败，尝试方法3:', response.data.msg)
      }
    } catch (error) {
      console.log('方法2异常，尝试方法3:', error.message)
    }

    try {
      // 方法3: 尝试创建公开分享链接
      const shareResponse = await this.axiosInstance.post(
        `/drive/v1/permissions/${appToken}/public`,
        {
          external_access: true, // 允许外部访问
          security_policy: 'anyone_can_edit', // 任何人可编辑
          comment_entity: 'anyone_can_edit', // 任何人可编辑评论
          share_entity: 'anyone_can_edit', // 任何人可编辑分享
          link_share_entity: 'anyone_can_edit' // 链接分享权限
        }
      )

      if (shareResponse.data.code === 0) {
        console.log('成功创建公开编辑分享链接')
        return
      } else {
        console.log('方法3也失败:', shareResponse.data.msg)
      }
    } catch (error) {
      console.log('方法3异常:', error.message)
    }

    try {
      // 方法4: 尝试设置协作者权限
      const collaboratorResponse = await this.axiosInstance.post(
        `/drive/v1/permissions/${appToken}/members`,
        {
          member_type: 'anyone', // 任何人
          perm: 'edit', // 编辑权限
          type: 'user'
        }
      )

      if (collaboratorResponse.data.code === 0) {
        console.log('成功设置协作者编辑权限')
        return
      } else {
        console.log('方法4也失败:', collaboratorResponse.data.msg)
      }
    } catch (error) {
      console.log('方法4异常:', error.message)
    }

    // 如果都失败了，记录警告但不抛出错误
    console.warn('无法自动设置表格编辑权限，用户需要手动设置权限')
  }

  /**
   * 为特定用户设置表格编辑权限
   */
  async setUserEditPermission(appToken: string, userAccessToken?: string): Promise<boolean> {
    try {
      const headers = userAccessToken ?
        { 'Authorization': `Bearer ${userAccessToken}` } :
        await this.getAuthHeaders()

      // 方法1: 尝试设置当前用户为表格编辑者
      const memberResponse = await this.axiosInstance.post(
        `/drive/v1/permissions/${appToken}/members`,
        {
          member_type: 'user',
          member_id: 'me', // 当前用户
          perm: 'edit', // 编辑权限
          type: 'user'
        },
        { headers }
      )

      if (memberResponse.data.code === 0) {
        console.log('成功设置用户编辑权限')
        return true
      }

      // 方法2: 尝试通过多维表格API设置权限
      const bitableResponse = await this.axiosInstance.patch(
        `/bitable/v1/apps/${appToken}`,
        {
          is_advanced: false, // 基础版本，权限更开放
        },
        { headers }
      )

      if (bitableResponse.data.code === 0) {
        console.log('成功设置多维表格为基础版本')
        return true
      }

      return false
    } catch (error) {
      console.error('设置用户编辑权限失败:', error)
      return false
    }
  }

  /**
   * 检查用户是否有表格编辑权限
   */
  async checkUserEditPermission(appToken: string): Promise<boolean> {
    try {
      await this.setAuthHeaders()

      // 尝试获取表格信息来检查权限
      const response = await this.axiosInstance.get(
        `/bitable/v1/apps/${appToken}`
      )

      if (response.data.code === 0) {
        // 尝试获取表格列表来进一步验证编辑权限
        const tablesResponse = await this.axiosInstance.get(
          `/bitable/v1/apps/${appToken}/tables`
        )

        if (tablesResponse.data.code === 0) {
          console.log('用户具有表格访问权限')
          return true
        }
      }

      return false
    } catch (error) {
      console.error('检查用户编辑权限失败:', error)
      return false
    }
  }

  /**
   * 获取表格权限信息
   */
  async getTablePermissions(appToken: string): Promise<any> {
    try {
      await this.setAuthHeaders()

      const response = await this.axiosInstance.get(
        `/drive/v1/permissions/${appToken}/members`
      )

      if (response.data.code === 0) {
        console.log('表格权限信息:', response.data.data)
        return response.data.data
      }

      return null
    } catch (error) {
      console.error('获取表格权限信息失败:', error)
      return null
    }
  }

  /**
   * 生成表格访问说明
   */
  private generateAccessInstructions(appToken: string, userId: string): string {
    return `
🎉 您的专属数据表格已创建成功！

📋 表格信息：
• 表格名称：桌面助手数据表_${userId}_${new Date().toISOString().split('T')[0]}
• 表格ID：${appToken}

🔑 访问方法：
1. 打开飞书应用
2. 在工作台中找到您的新表格
3. 如果找不到，请在飞书中搜索表格名称

🔧 设置编辑权限（重要）：
为了确保您能正常编辑表格数据，请按以下步骤设置权限：

方法一：通过分享设置
1. 打开表格后，点击右上角的"分享"按钮
2. 在分享设置中，选择"任何人可编辑"
3. 或者选择"组织内可编辑"（推荐）
4. 点击"保存"确认设置

方法二：通过协作设置
1. 在表格中点击右上角的"协作"按钮
2. 添加协作者或设置协作权限
3. 选择"编辑者"权限级别
4. 保存设置

方法三：检查表格权限
1. 在表格设置中找到"权限管理"
2. 确保当前用户有"编辑"权限
3. 如果没有，请联系表格创建者添加权限

📊 表格包含：
• 应用详细数据表：记录每个应用的使用详情
• 汇总数据表：记录每日的使用汇总统计

现在您可以开始导出数据到您的专属表格了！
    `.trim()
  }

  /**
   * 获取当前用户信息
   */
  private async getCurrentUserInfo(): Promise<any> {
    try {
      await this.setAuthHeaders()

      const response = await this.axiosInstance.get('/authen/v1/user_info')

      if (response.data.code === 0) {
        return response.data.data
      } else {
        console.error('获取用户信息失败:', response.data.msg)
        return null
      }
    } catch (error) {
      console.error('获取用户信息时发生错误:', error)
      return null
    }
  }

  /**
   * 使用用户访问令牌创建多维表格
   */
  async createUserOwnedTable(tableName: string): Promise<TableCreationResult> {
    try {
      if (!this.userAccessToken) {
        throw new Error('User not logged in')
      }

      // 1. 创建多维表格
      const appResponse = await this.axiosInstance.post('/bitable/v1/apps', {
        name: tableName,
        folder_token: '' // 可以指定文件夹，空字符串表示根目录
      }, {
        headers: {
          'Authorization': `Bearer ${this.userAccessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (appResponse.data.code !== 0) {
        throw new Error(`Failed to create bitable: ${appResponse.data.msg}`)
      }

      const newAppToken = appResponse.data.data.app.app_token
      console.log('创建用户多维表格成功:', newAppToken)

      // 2. 创建应用详细数据表（4个字段）
      const detailTableId = await this.createUserDetailTable(newAppToken)

      // 3. 创建汇总数据表（5个字段）
      const summaryTableId = await this.createUserSummaryTable(newAppToken)

      // 4. 设置用户编辑权限
      try {
        const hasEditPermission = await this.setUserEditPermission(newAppToken, this.userAccessToken)
        if (hasEditPermission) {
          console.log('成功设置用户表格编辑权限')
        } else {
          console.warn('设置用户表格编辑权限失败')
        }
      } catch (error) {
        console.warn('设置用户表格编辑权限异常:', error)
      }

      return {
        success: true,
        appToken: newAppToken,
        tableId: detailTableId,
        summaryTableId: summaryTableId
      }

    } catch (error) {
      console.error('Error creating user owned table:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 使用用户访问令牌创建应用详细数据表
   */
  private async createUserDetailTable(appToken: string): Promise<string> {
    if (!this.userAccessToken) {
      throw new Error('User not logged in')
    }

    // 1. 创建数据表
    const tableResponse = await this.axiosInstance.post(
      `/bitable/v1/apps/${appToken}/tables`,
      {
        table: {
          name: '应用详细数据'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.userAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (tableResponse.data.code !== 0) {
      throw new Error(`创建应用详细数据表失败: ${tableResponse.data.msg}`)
    }

    const tableId = tableResponse.data.data.table_id
    console.log('创建应用详细数据表成功:', tableId)

    // 2. 获取默认字段
    const defaultFields = await this.axiosInstance.get(
      `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${this.userAccessToken}`
        }
      }
    )

    // 3. 更新第一个字段为 日期
    if (defaultFields.data.code === 0 && defaultFields.data.data.items.length > 0) {
      const firstFieldId = defaultFields.data.data.items[0].field_id
      await this.axiosInstance.put(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${firstFieldId}`,
        {
          field_name: '日期',
          type: 5, // 日期时间类型
          property: {}
        },
        {
          headers: {
            'Authorization': `Bearer ${this.userAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 4. 添加其他字段
    const fieldsToAdd = [
      {
        field_name: '应用名称',
        type: 1, // 文本类型
        property: {}
      },
      {
        field_name: '使用时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '占比',
        type: 2, // 数字类型
        property: {
          formatter: '0.000'
        }
      }
    ]

    for (const field of fieldsToAdd) {
      await this.axiosInstance.post(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
        field,
        {
          headers: {
            'Authorization': `Bearer ${this.userAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    console.log('应用详细数据表字段创建完成，共4个字段')
    return tableId
  }

  /**
   * 使用用户访问令牌创建汇总数据表
   */
  private async createUserSummaryTable(appToken: string): Promise<string> {
    if (!this.userAccessToken) {
      throw new Error('User not logged in')
    }

    // 1. 创建数据表
    const tableResponse = await this.axiosInstance.post(
      `/bitable/v1/apps/${appToken}/tables`,
      {
        table: {
          name: '汇总数据'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.userAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (tableResponse.data.code !== 0) {
      throw new Error(`创建汇总数据表失败: ${tableResponse.data.msg}`)
    }

    const tableId = tableResponse.data.data.table_id
    console.log('创建汇总数据表成功:', tableId)

    // 2. 获取默认字段
    const defaultFields = await this.axiosInstance.get(
      `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${this.userAccessToken}`
        }
      }
    )

    // 3. 更新第一个字段为 日期
    if (defaultFields.data.code === 0 && defaultFields.data.data.items.length > 0) {
      const firstFieldId = defaultFields.data.data.items[0].field_id
      await this.axiosInstance.put(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${firstFieldId}`,
        {
          field_name: '日期',
          type: 5, // 日期时间类型
          property: {}
        },
        {
          headers: {
            'Authorization': `Bearer ${this.userAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 4. 添加其他字段
    const fieldsToAdd = [
      {
        field_name: '总时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '专注时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '分心时长',
        type: 2, // 数字类型
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: '效率得分',
        type: 2, // 数字类型
        property: {
          formatter: '0.000'
        }
      }
    ]

    for (const field of fieldsToAdd) {
      await this.axiosInstance.post(
        `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
        field,
        {
          headers: {
            'Authorization': `Bearer ${this.userAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    console.log('汇总数据表字段创建完成，共5个字段')
    return tableId
  }
}
