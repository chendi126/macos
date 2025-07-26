import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload,
  faCheck,
  faTimes,
  faCog,
  faPlay,
  faStop,
  faCalendarDay,
  faSpinner,
  faExclamationTriangle,
  faCloudUpload
} from '@fortawesome/free-solid-svg-icons'
import { FeishuConfig, ExportConfig, ExportStatus, ExportResult } from '../types/electron'
import './DataExport.css'

export default function DataExport() {
  const [config, setConfig] = useState<FeishuConfig>({
    appId: '',
    appSecret: '',
    appToken: '',
    tableId: '', // 应用详细数据表
    summaryTableId: '', // 汇总数据表
    blockTypeId: ''
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
      <div className="data-export">
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-header-icon">
              <FontAwesomeIcon icon={faCloudUpload} />
            </div>
            <div className="page-header-text">
              <h1 className="page-title">数据导出</h1>
              <p className="page-description">
                将应用使用数据和工作模式会话数据导出到飞书多维表格
              </p>
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">加载配置中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="data-export">
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-icon">
            <FontAwesomeIcon icon={faCloudUpload} />
          </div>
          <div className="page-header-text">
            <h1 className="page-title">数据导出</h1>
            <p className="page-description">
              将应用使用数据和工作模式会话数据导出到飞书多维表格
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* 飞书配置区域 */}
        <motion.div
          className="export-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="section-header">
            <FontAwesomeIcon icon={faCog} className="section-icon" />
            <h2>飞书配置</h2>
          </div>
          
          <div className="config-form">
            <div className="form-row">
              <div className="form-group">
                <label>应用ID</label>
                <input
                  type="text"
                  value={config.appId}
                  onChange={(e) => setConfig({...config, appId: e.target.value})}
                  placeholder="输入飞书应用ID"
                />
              </div>
              <div className="form-group">
                <label>应用密钥</label>
                <input
                  type="password"
                  value={config.appSecret}
                  onChange={(e) => setConfig({...config, appSecret: e.target.value})}
                  placeholder="输入飞书应用密钥"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>多维表格Token</label>
                <input
                  type="text"
                  value={config.appToken}
                  onChange={(e) => setConfig({...config, appToken: e.target.value})}
                  placeholder="输入多维表格Token"
                />
              </div>
              <div className="form-group">
                <label>块类型ID</label>
                <input
                  type="text"
                  value={config.blockTypeId}
                  onChange={(e) => setConfig({...config, blockTypeId: e.target.value})}
                  placeholder="输入块类型ID"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>应用详细数据表ID</label>
                <input
                  type="text"
                  value={config.tableId}
                  onChange={(e) => setConfig({...config, tableId: e.target.value})}
                  placeholder="输入应用详细数据表ID"
                />
              </div>
              <div className="form-group">
                <label>汇总数据表ID</label>
                <input
                  type="text"
                  value={config.summaryTableId}
                  onChange={(e) => setConfig({...config, summaryTableId: e.target.value})}
                  placeholder="输入汇总数据表ID"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={testConnection}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    测试中...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} />
                    测试连接
                  </>
                )}
              </button>
            </div>
            
            {connectionStatus && (
              <div className={`connection-status ${connectionStatus.success ? 'success' : 'error'}`}>
                <FontAwesomeIcon icon={connectionStatus.success ? faCheck : faTimes} />
                <span>{connectionStatus.message}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 导出操作区域 */}
        {exportStatus?.configured && (
          <motion.div
            className="export-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="section-header">
              <FontAwesomeIcon icon={faUpload} className="section-icon" />
              <h2>数据导出</h2>
            </div>

            <div className="export-actions">
              <div className="action-group">
                <h3>
                  <FontAwesomeIcon icon={faCalendarDay} />
                  今日数据
                </h3>
                <p>导出今天的应用使用数据和工作模式会话数据</p>
                <button
                  className="btn btn-primary"
                  onClick={exportTodayData}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      导出中...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUpload} />
                      导出今日数据
                    </>
                  )}
                </button>
              </div>



              <div className="action-group">
                <h3>
                  <FontAwesomeIcon icon={faUpload} />
                  汇总数据
                </h3>
                <p>导出基于应用分类的效率汇总数据</p>
                <button
                  className="btn btn-primary"
                  onClick={exportAppUsageSummary}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      导出中...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUpload} />
                      导出汇总数据
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 自动导出设置 */}
        {exportStatus?.configured && (
          <motion.div
            className="export-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="section-header">
              <FontAwesomeIcon icon={faCog} className="section-icon" />
              <h2>自动导出设置</h2>
            </div>

            <div className="auto-export-config">
              <div className="auto-export-status">
                <div className="status-info">
                  <h3>
                    <FontAwesomeIcon icon={exportStatus.autoExport ? faPlay : faStop} />
                    自动导出状态
                  </h3>
                  <p className={`status-text ${exportStatus.autoExport ? 'active' : 'inactive'}`}>
                    {exportStatus.autoExport ? '已启用' : '已禁用'}
                  </p>
                  {exportStatus.autoExport && (
                    <p className="interval-text">
                      导出间隔: {exportStatus.exportInterval} 小时
                    </p>
                  )}
                  <p className="last-export">
                    上次导出: {formatTime(exportStatus.lastExportTime)}
                  </p>
                </div>

                <div className="auto-export-controls">
                  <div className="interval-setting">
                    <label>导出间隔 (小时)</label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={autoExportInterval}
                      onChange={(e) => setAutoExportInterval(parseInt(e.target.value) || 24)}
                      disabled={exportStatus.autoExport}
                    />
                  </div>

                  <button
                    className={`btn ${exportStatus.autoExport ? 'btn-danger' : 'btn-success'}`}
                    onClick={toggleAutoExport}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        处理中...
                      </>
                    ) : exportStatus.autoExport ? (
                      <>
                        <FontAwesomeIcon icon={faStop} />
                        停止自动导出
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPlay} />
                        启用自动导出
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 导出结果显示 */}
        {exportResult && (
          <motion.div
            className="export-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="section-header">
              <FontAwesomeIcon icon={exportResult.success ? faCheck : faExclamationTriangle} className="section-icon" />
              <h2>导出结果</h2>
            </div>

            <div className={`export-result ${exportResult.success ? 'success' : 'error'}`}>
              <div className="result-header">
                <FontAwesomeIcon icon={exportResult.success ? faCheck : faTimes} />
                <span className="result-status">
                  {exportResult.success ? '导出成功' : '导出失败'}
                </span>
              </div>

              {exportResult.error && (
                <div className="error-message">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{exportResult.error}</span>
                </div>
              )}

              {exportResult.summary.length > 0 && (
                <div className="export-summary">
                  <h4>导出详情</h4>
                  {exportResult.summary.map((summary, index) => (
                    <div key={index} className="summary-item">
                      <div className="summary-header">
                        <FontAwesomeIcon icon={summary.success ? faCheck : faTimes} />
                        <span>日期: {summary.date}</span>
                      </div>
                      <div className="summary-details">
                        <span>总记录数: {summary.totalRecords}</span>
                        <span>应用记录: {summary.appRecords}</span>
                        <span>会话记录: {summary.sessionRecords}</span>
                      </div>
                      {summary.error && (
                        <div className="summary-error">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          <span>{summary.error}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
