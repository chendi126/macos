import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faUpload, 
  faCheck, 
  faTimes, 
  faCog, 
  faPlay, 
  faStop,
  faHistory,
  faCalendarDay,
  faSpinner,
  faExclamationTriangle,
  faCloudUpload
} from '@fortawesome/free-solid-svg-icons'
import { FeishuConfig, ExportConfig, ExportStatus, ExportResult } from '../types/electron'
import PageTransition from '../components/PageTransition'
import PageHeader from '../components/PageHeader'
import '../components/PageTransition.css'
import '../components/PageHeader.css'
import './DataExport.css'

export default function DataExport() {
  const [config, setConfig] = useState<FeishuConfig>({
    appId: 'cli_a808ad9d0878d00c',
    appSecret: 'RWK6uKuO6yNjpVq0IMcdVcyGFgJ5DAKg',
    appToken: 'WuYSbjMu8avijdsKwlpcgQOInUv',
    tableId: 'tblIcUV8Fz6JuQ7J', // 应用详细数据表
    summaryTableId: 'tblzplhyYamB0XvW', // 汇总数据表
    blockTypeId: 'blk_68821180a94000030d5cde2e'
  })
  
  const [, setExportConfig] = useState<ExportConfig | null>(null)
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [autoExportInterval, setAutoExportInterval] = useState(24)

  // 加载配置和状态
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([loadConfig(), loadStatus()])
      setIsInitialLoading(false)
    }
    initializeData()
  }, [])

  const loadConfig = async () => {
    try {
      const savedConfig = await window.electronAPI.getExportConfig()
      if (savedConfig) {
        setExportConfig(savedConfig)
        setConfig(savedConfig.feishu)
        setAutoExportInterval(savedConfig.exportInterval)
      }
    } catch (error) {
      console.error('Error loading export config:', error)
    }
  }

  const loadStatus = async () => {
    try {
      const status = await window.electronAPI.getExportStatus()
      setExportStatus(status)
    } catch (error) {
      console.error('Error loading export status:', error)
    }
  }

  // 测试连接
  const testConnection = async () => {
    setIsLoading(true)
    try {
      // 先保存配置
      await window.electronAPI.setFeishuConfig(config)
      
      // 测试连接
      const result = await window.electronAPI.testFeishuConnection()
      setConnectionStatus(result)
      
      if (result.success) {
        await loadConfig()
        await loadStatus()
      }
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: `连接失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 导出今日数据
  const exportTodayData = async () => {
    setIsLoading(true)
    setExportResult(null)
    try {
      const result = await window.electronAPI.exportTodayData()
      setExportResult(result)
      await loadStatus()
    } catch (error) {
      setExportResult({
        success: false,
        summary: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 导出历史数据
  const exportHistoryData = async (days: number) => {
    setIsLoading(true)
    setExportResult(null)
    try {
      const result = await window.electronAPI.exportHistoryData(days)
      setExportResult(result)
      await loadStatus()
    } catch (error) {
      setExportResult({
        success: false,
        summary: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 导出应用使用汇总数据
  const exportAppUsageSummary = async () => {
    setIsLoading(true)
    setExportResult(null)
    try {
      const result = await window.electronAPI.exportAppUsageSummary()
      setExportResult(result)
      await loadStatus()
    } catch (error) {
      setExportResult({
        success: false,
        summary: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 切换自动导出
  const toggleAutoExport = async () => {
    setIsLoading(true)
    try {
      if (exportStatus?.autoExport) {
        await window.electronAPI.disableAutoExport()
      } else {
        await window.electronAPI.enableAutoExport(autoExportInterval)
      }
      await loadStatus()
    } catch (error) {
      console.error('Error toggling auto export:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '从未'
    return new Date(timestamp).toLocaleString()
  }

  if (isInitialLoading) {
    return (
      <PageTransition>
        <div className="data-export page-container">
          <PageHeader
            title="数据导出"
            description="将应用使用数据和工作模式会话数据导出到飞书多维表格，支持自动化导出和历史数据批量处理"
            icon={faCloudUpload}
          />
          <div className="page-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">加载配置中...</p>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="data-export page-container">
        <PageHeader
          title="数据导出"
          description="将应用使用数据和工作模式会话数据导出到飞书多维表格，支持自动化导出和历史数据批量处理"
          icon={faCloudUpload}
        />

        <div className="page-content">
          {/* 飞书配置 */}
          <div className="glass-card delay-1">
          <h2 className="card-title">
            <FontAwesomeIcon icon={faCog} />
            飞书配置
          </h2>
          
          <div className="config-form">
            <div className="form-group">
              <label>App ID</label>
              <input
                type="text"
                className="glass-input"
                value={config.appId}
                onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                placeholder="输入飞书应用 App ID"
              />
            </div>
            
            <div className="form-group">
              <label>App Secret</label>
              <input
                type="password"
                className="glass-input"
                value={config.appSecret}
                onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
                placeholder="输入飞书应用 App Secret"
              />
            </div>
            
            <div className="form-group">
              <label>App Token</label>
              <input
                type="text"
                className="glass-input"
                value={config.appToken}
                onChange={(e) => setConfig({ ...config, appToken: e.target.value })}
                placeholder="输入飞书多维表格 App Token"
              />
            </div>
            
            <div className="form-group">
              <label>应用详细数据表 ID</label>
              <input
                type="text"
                className="glass-input"
                value={config.tableId}
                onChange={(e) => setConfig({ ...config, tableId: e.target.value })}
                placeholder="输入应用详细数据表 ID"
              />
            </div>

            <div className="form-group">
              <label>汇总数据表 ID</label>
              <input
                type="text"
                className="glass-input"
                value={config.summaryTableId}
                onChange={(e) => setConfig({ ...config, summaryTableId: e.target.value })}
                placeholder="输入汇总数据表 ID"
              />
            </div>

            <div className="form-group">
              <label>Block Type ID</label>
              <input
                type="text"
                className="glass-input"
                value={config.blockTypeId}
                onChange={(e) => setConfig({ ...config, blockTypeId: e.target.value })}
                placeholder="输入块类型 ID"
              />
            </div>
            
            <button 
              className="glass-button primary"
              onClick={testConnection}
              disabled={isLoading}
            >
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faCheck} />
              )}
              测试连接
            </button>
            
            {connectionStatus && (
              <div className={`status-indicator ${connectionStatus.success ? 'success' : 'error'}`}>
                <FontAwesomeIcon icon={connectionStatus.success ? faCheck : faTimes} />
                {connectionStatus.message}
              </div>
            )}
          </div>
        </div>

          {/* 导出操作 */}
          {exportStatus?.configured && (
            <div className="glass-card delay-2">
            <h2 className="card-title">
              <FontAwesomeIcon icon={faUpload} />
              数据导出
            </h2>
            
            <div className="export-actions">
              <button
                className="glass-button primary"
                onClick={exportTodayData}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faCalendarDay} />
                导出今日数据
              </button>

              <button
                className="glass-button"
                onClick={() => exportHistoryData(7)}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faHistory} />
                导出近7天数据
              </button>

              <button
                className="glass-button"
                onClick={() => exportHistoryData(30)}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faHistory} />
                导出近30天数据
              </button>

              <button
                className="glass-button success"
                onClick={exportAppUsageSummary}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faUpload} />
                导出汇总数据
              </button>
            </div>
            
            {/* 自动导出设置 */}
            <div className="auto-export-section">
              <h3>自动导出设置</h3>
              
              <div className="auto-export-controls">
                <div className="interval-setting">
                  <label>导出间隔（小时）</label>
                  <input
                    type="number"
                    className="glass-input"
                    min="1"
                    max="168"
                    value={autoExportInterval}
                    onChange={(e) => setAutoExportInterval(parseInt(e.target.value))}
                    disabled={exportStatus?.autoExport}
                  />
                </div>
                
                <button 
                  className={`glass-button ${exportStatus?.autoExport ? 'danger' : 'success'}`}
                  onClick={toggleAutoExport}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={exportStatus?.autoExport ? faStop : faPlay} />
                  {exportStatus?.autoExport ? '停止自动导出' : '启用自动导出'}
                </button>
              </div>
              
              {exportStatus && (
                <div className="export-status-info">
                  <div className="status-item">
                    <span>上次导出时间：</span>
                    <span>{formatTime(exportStatus.lastExportTime)}</span>
                  </div>
                  {exportStatus.autoExport && (
                    <div className="status-item">
                      <span>下次导出时间：</span>
                      <span>{formatTime(exportStatus.nextExportTime)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          )}

          {/* 导出结果 */}
          {exportResult && (
            <div className="glass-card delay-3">
            <h3 className="card-title">
              <FontAwesomeIcon icon={exportResult.success ? faCheck : faExclamationTriangle} />
              导出结果
            </h3>
            
            <div className={`result-summary ${exportResult.success ? 'success' : 'error'}`}>
              {exportResult.success ? '导出成功' : '导出失败'}
              {exportResult.error && <span>：{exportResult.error}</span>}
            </div>
            
            {exportResult.summary.length > 0 && (
              <div className="result-details">
                {exportResult.summary.map((summary, index) => (
                  <div key={index} className="summary-item">
                    <div className="summary-header">
                      <span>{summary.date}</span>
                      <span className={summary.success ? 'success' : 'error'}>
                        {summary.success ? '成功' : '失败'}
                      </span>
                    </div>
                    <div className="summary-stats">
                      <span>总记录：{summary.totalRecords}</span>
                      <span>应用记录：{summary.appRecords}</span>
                      <span>会话记录：{summary.sessionRecords}</span>
                    </div>
                    {summary.error && (
                      <div className="summary-error">{summary.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
