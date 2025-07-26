import axios, { AxiosInstance } from 'axios'
import { DayStats, AppUsageData } from './AppTracker'

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
}
