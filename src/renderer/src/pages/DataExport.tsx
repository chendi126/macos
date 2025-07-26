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
  faCloudUpload,
  faTable,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons'
import { FeishuConfig, ExportConfig, ExportStatus, ExportResult, UserTableSetupResult } from '../types/electron'
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
  const [autoOpenTable, setAutoOpenTable] = useState(true)
  const [isUsingSharedTable, setIsUsingSharedTable] = useState(true)
  const [userId, setUserId] = useState('')
  const [isCreatingUserTable, setIsCreatingUserTable] = useState(false)
  const [showAccessInstructions, setShowAccessInstructions] = useState(false)
  const [accessInstructions, setAccessInstructions] = useState('')


  // 加载配置和状态
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([loadConfig(), loadStatus(), loadUserTableStatus()])
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
        setAutoOpenTable(savedConfig.autoOpenTable ?? true) // 默认启用
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

  const loadUserTableStatus = async () => {
    try {
      const [isShared, currentUserId] = await Promise.all([
        window.electronAPI.isUsingSharedTable(),
        window.electronAPI.getUserId()
      ])
      setIsUsingSharedTable(isShared)
      setUserId(currentUserId)
    } catch (error) {
      console.error('Error loading user table status:', error)
    }
  }

  // 创建用户独立表格
  const createUserTable = async () => {
    if (!config.appId || !config.appSecret) {
      alert('请先配置飞书应用信息')
      return
    }

    setIsCreatingUserTable(true)
    try {
      const templateConfig: FeishuConfig = {
        ...config,
        isTemplate: true
      }

      const result: UserTableSetupResult = await window.electronAPI.createUserTable(templateConfig)

      if (result.success && result.config) {
        setConfig(result.config)
        setIsUsingSharedTable(false)
        await loadConfig() // 重新加载配置
        await loadStatus() // 重新加载状态

        // 显示详细的访问说明
        if (result.accessInstructions) {
          setAccessInstructions(result.accessInstructions)
          setShowAccessInstructions(true)
        } else {
          alert('用户独立表格创建成功！现在您拥有了专属的数据表格。')
        }
      } else {
        alert(`创建用户表格失败: ${result.error}`)
      }
    } catch (error) {
      console.error('Error creating user table:', error)
      alert('创建用户表格时发生错误')
    } finally {
      setIsCreatingUserTable(false)
    }
  }

  // 处理自动打开表格设置变化
  const handleAutoOpenTableChange = async (enabled: boolean) => {
    try {
      await window.electronAPI.setAutoOpenTable(enabled)
      setAutoOpenTable(enabled)
    } catch (error) {
      console.error('Error setting auto open table:', error)
      // 如果设置失败，恢复原来的状态
      setAutoOpenTable(!enabled)
    }
  }

  // 调试表格结构
  const debugTableStructure = async () => {
    try {
      await window.electronAPI.debugTableStructure()
      alert('表格结构信息已输出到控制台，请查看开发者工具')
    } catch (error) {
      console.error('Error debugging table structure:', error)
      alert('调试表格结构失败')
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
        {/* 表格配置区域 */}
        <motion.div
          className="export-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="section-header">
            <FontAwesomeIcon icon={faTable} className="section-icon" />
            <h2>表格配置</h2>
          </div>

          <div className="user-table-config">
            <div className="table-status">
              <div className="status-info">
                <h3>当前表格状态</h3>
                <p className={`status-text ${isUsingSharedTable ? 'shared' : 'private'}`}>
                  {isUsingSharedTable ? '使用共享表格' : '使用独立表格'}
                </p>
                <p className="user-id">用户ID: {userId}</p>
                {isUsingSharedTable && (
                  <div className="warning-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>您正在使用共享表格，数据可能被其他用户看到</span>
                  </div>
                )}
              </div>

              <div className="table-actions">
                {isUsingSharedTable && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={createUserTable}
                      disabled={isCreatingUserTable}
                    >
                      {isCreatingUserTable ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin />
                          创建中...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faUpload} />
                          创建独立表格
                        </>
                      )}
                    </button>
                    <p className="action-description">
                      创建您专属的飞书表格，确保数据隐私
                    </p>
                  </>
                )}

                {!isUsingSharedTable && (
                  <div className="private-table-info">
                    <p>✅ 您正在使用独立表格</p>
                    <p>数据安全，仅您可见</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>



        {/* 飞书配置区域 */}
        <motion.div
          className="export-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="section-header">
            <FontAwesomeIcon icon={faCog} className="section-icon" />
            <h2>飞书配置</h2>
          </div>

          {/* 配置指导说明 */}
          <div className="config-guide">
            <div className="guide-header">
              <h3>📋 配置指导</h3>
              <p>按照以下步骤获取飞书应用配置信息：</p>
            </div>

            <div className="guide-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>创建飞书应用</h4>
                  <p>访问 <a href="https://open.feishu.cn/app" target="_blank" rel="noopener noreferrer">飞书开放平台</a></p>
                  <p>点击"创建企业自建应用"，填写应用名称和描述</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>获取应用凭证</h4>
                  <p>在应用详情页面，找到"凭证与基础信息"</p>
                  <p>复制 <strong>App ID</strong> 和 <strong>App Secret</strong></p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>配置应用权限</h4>
                  <p>在"权限管理"中添加以下权限：</p>
                  <ul>
                    <li>多维表格：读取、编辑多维表格</li>
                    <li>云文档：读取、编辑云文档</li>
                  </ul>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>创建多维表格</h4>
                  <p>在飞书中创建一个新的多维表格</p>
                  <p>从表格URL中获取 <strong>多维表格Token</strong></p>
                  <p>格式：https://feishu.cn/base/<strong>bascnxxxxxx</strong></p>
                </div>
              </div>
            </div>

            <div className="guide-tips">
              <h4>💡 小贴士</h4>
              <ul>
                <li>应用创建后需要发布才能正常使用</li>
                <li>确保应用权限配置正确，否则可能无法访问表格</li>
                <li>多维表格Token可以从表格分享链接中获取</li>
                <li>如果不确定表格ID，可以先点击"创建独立表格"自动生成</li>
              </ul>
            </div>
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

              {connectionStatus?.success && (
                <button
                  className="btn btn-secondary"
                  onClick={debugTableStructure}
                  disabled={isLoading}
                  style={{ marginLeft: '10px' }}
                >
                  <FontAwesomeIcon icon={faCog} />
                  调试表格结构
                </button>
              )}
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

                  <div className="auto-open-setting">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={autoOpenTable}
                        onChange={(e) => handleAutoOpenTableChange(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      导出成功后自动打开飞书表格
                    </label>
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

      {/* 访问说明模态对话框 */}
      {showAccessInstructions && (
        <div className="modal-overlay" onClick={() => setShowAccessInstructions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎉 表格创建成功！</h3>
              <button
                className="modal-close"
                onClick={() => setShowAccessInstructions(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <pre className="access-instructions">{accessInstructions}</pre>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowAccessInstructions(false)}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
