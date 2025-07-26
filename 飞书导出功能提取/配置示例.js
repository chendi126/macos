// 飞书多维表格导出功能 - 配置示例

// 1. 飞书应用配置
const feishuConfig = {
  // 从飞书开放平台获取
  appId: 'cli_xxxxxxxxxxxxxxxxx',        // 应用ID
  appSecret: 'xxxxxxxxxxxxxxxxxxxxxxxx', // 应用密钥
  
  // 从飞书多维表格获取
  appToken: 'xxxxxxxxxxxxxxxxxxxxxxxx',  // 多维表格Token
  tableId: 'tblxxxxxxxxxxxxxxx',         // 应用详细数据表ID
  summaryTableId: 'tblxxxxxxxxxxxxxxx',  // 汇总数据表ID
  blockTypeId: 'blk_xxxxxxxxxxxxxxx'     // 块类型ID（可选）
}

// 2. 导出配置
const exportConfig = {
  feishu: feishuConfig,
  autoExport: false,      // 是否启用自动导出
  exportInterval: 24,     // 导出间隔（小时）
  lastExportTime: 0       // 上次导出时间（时间戳）
}

// 3. 数据表字段结构

// 应用详细数据表字段
const appDetailTableFields = {
  '应用名称': 'text',      // 文本类型
  '使用时长': 'number',    // 数字类型（小时）
  '日期': 'number',        // 数字类型（时间戳）
  '占比': 'number'         // 数字类型（小数，如0.3表示30%）
}

// 汇总数据表字段
const summaryTableFields = {
  '总时长': 'number',      // 数字类型（小时）
  '专注时长': 'number',    // 数字类型（小时）
  '分心时长': 'number',    // 数字类型（小时）
  '效率得分': 'number'     // 数字类型（小数，如0.8表示80%）
}

// 4. 示例数据格式

// 应用使用数据示例
const appUsageExample = {
  fields: {
    '应用名称': 'Google Chrome',
    '使用时长': 2.5,                    // 2.5小时
    '日期': 1735142400000,              // 时间戳
    '占比': 0.3                         // 30%
  }
}

// 汇总数据示例
const summaryDataExample = {
  fields: {
    '总时长': 8.5,                      // 8.5小时
    '专注时长': 6.8,                    // 6.8小时
    '分心时长': 1.7,                    // 1.7小时
    '效率得分': 0.8                     // 80%
  }
}

// 5. API端点配置
const apiEndpoints = {
  baseURL: 'https://open.feishu.cn/open-apis',
  auth: '/auth/v3/tenant_access_token/internal',
  app: '/bitable/v1/apps/{app_token}',
  tables: '/bitable/v1/apps/{app_token}/tables',
  fields: '/bitable/v1/apps/{app_token}/tables/{table_id}/fields',
  records: '/bitable/v1/apps/{app_token}/tables/{table_id}/records',
  batchCreate: '/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create'
}

// 6. 使用示例

// 初始化服务
const feishuService = new FeishuService(feishuConfig)
const dataExportManager = new DataExportManager(appTracker, workModeManager)

// 设置配置
await dataExportManager.setFeishuConfig(feishuConfig)

// 测试连接
const connectionResult = await dataExportManager.testFeishuConnection()
console.log('连接测试结果:', connectionResult)

// 导出今日数据
const exportResult = await dataExportManager.exportTodayData()
console.log('导出结果:', exportResult)

// 启用自动导出
await dataExportManager.enableAutoExport(24) // 24小时间隔

// 7. 环境变量配置（推荐）
/*
在生产环境中，建议使用环境变量存储敏感信息：

FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_APP_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_TABLE_ID=tblxxxxxxxxxxxxxxx
FEISHU_SUMMARY_TABLE_ID=tblxxxxxxxxxxxxxxx
FEISHU_BLOCK_TYPE_ID=blk_xxxxxxxxxxxxxxx
*/

// 从环境变量读取配置
const envConfig = {
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  appToken: process.env.FEISHU_APP_TOKEN,
  tableId: process.env.FEISHU_TABLE_ID,
  summaryTableId: process.env.FEISHU_SUMMARY_TABLE_ID,
  blockTypeId: process.env.FEISHU_BLOCK_TYPE_ID
}

module.exports = {
  feishuConfig,
  exportConfig,
  appDetailTableFields,
  summaryTableFields,
  appUsageExample,
  summaryDataExample,
  apiEndpoints,
  envConfig
}