import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faTrash,
  faEdit,
  faSave,
  faTimes,
  faToggleOn,
  faToggleOff,
  faRefresh,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import { BlacklistApp } from '../types/electron'
import { useWorkMode } from '../contexts/WorkModeContext'
import './BlacklistApps.css'

interface BlacklistAppsProps {
  modeId: string
  apps: BlacklistApp[]
}

export default function BlacklistApps({ modeId, apps }: BlacklistAppsProps) {
  const {
    addBlacklistApp,
    updateBlacklistApp,
    removeBlacklistApp,
    getRunningProcesses
  } = useWorkMode()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingApp, setEditingApp] = useState<BlacklistApp | null>(null)
  const [runningProcesses, setRunningProcesses] = useState<string[]>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [newApp, setNewApp] = useState({
    name: '',
    processName: '',
    enabled: true
  })

  // 加载运行中的进程
  const loadRunningProcesses = async () => {
    setLoadingProcesses(true)
    try {
      const processes = await getRunningProcesses()
      setRunningProcesses(processes)
    } catch (error) {
      console.error('Error loading running processes:', error)
    } finally {
      setLoadingProcesses(false)
    }
  }

  // 组件挂载时加载进程列表
  useEffect(() => {
    if (showAddDialog) {
      loadRunningProcesses()
    }
  }, [showAddDialog])

  // 当弹窗显示时，隐藏横向滚动条
  useEffect(() => {
    if (showAddDialog) {
      document.body.style.overflowX = 'hidden'
    } else {
      document.body.style.overflowX = ''
    }

    // 清理函数
    return () => {
      document.body.style.overflowX = ''
    }
  }, [showAddDialog])

  // 添加新应用
  const handleAddApp = async () => {
    if (!newApp.name.trim() || !newApp.processName.trim()) return

    const success = await addBlacklistApp(modeId, {
      name: newApp.name,
      processName: newApp.processName,
      enabled: newApp.enabled
    })

    if (success) {
      setShowAddDialog(false)
      setNewApp({
        name: '',
        processName: '',
        enabled: true
      })
    }
  }

  // 切换应用启用状态
  const handleToggleApp = async (e: React.MouseEvent, app: BlacklistApp) => {
    e.preventDefault()
    e.stopPropagation()
    await updateBlacklistApp(modeId, app.id, { enabled: !app.enabled })
  }

  // 删除应用
  const handleDeleteApp = async (appId: string) => {
    await removeBlacklistApp(modeId, appId)
  }

  // 开始编辑应用
  const handleEditApp = (app: BlacklistApp) => {
    setEditingApp({ ...app })
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingApp) return

    const success = await updateBlacklistApp(modeId, editingApp.id, {
      name: editingApp.name,
      processName: editingApp.processName
    })

    if (success) {
      setEditingApp(null)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingApp(null)
  }

  // 选择进程
  const handleSelectProcess = (processName: string) => {
    setNewApp(prev => ({
      ...prev,
      processName,
      name: prev.name || processName.replace('.exe', '')
    }))
  }

  return (
    <div className="auto-start-apps">
      <div className="apps-header">
        <h4>黑名单应用列表</h4>
        <button
          className="add-app-button"
          onClick={() => setShowAddDialog(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>添加应用</span>
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="empty-apps">
          <p>暂无黑名单应用</p>
          <p className="hint">点击"添加应用"按钮来添加需要屏蔽的应用程序</p>
        </div>
      ) : (
        <div className="apps-list">
          <div className="blacklist-warning">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>警告：黑名单中的应用将被自动关闭</span>
          </div>
          {apps.map((app) => (
            <div key={app.id} className={`app-item ${!app.enabled ? 'disabled' : ''}`}>
              {editingApp && editingApp.id === app.id ? (
                // 编辑模式
                <div className="app-edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>应用名称</label>
                      <input
                        type="text"
                        value={editingApp.name}
                        onChange={(e) => setEditingApp(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>进程名称</label>
                      <input
                        type="text"
                        value={editingApp.processName}
                        onChange={(e) => setEditingApp(prev => prev ? { ...prev, processName: e.target.value } : null)}
                        className="form-input"
                        placeholder="例如: chrome.exe"
                      />
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button className="save-button" onClick={handleSaveEdit}>
                      <FontAwesomeIcon icon={faSave} />
                      保存
                    </button>
                    <button className="cancel-button" onClick={handleCancelEdit}>
                      <FontAwesomeIcon icon={faTimes} />
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                // 显示模式
                <>
                  <div className="app-info">
                    <div className="app-main">
                      <div className="app-name">{app.name}</div>
                      <div className="app-path">进程: {app.processName}</div>
                    </div>
                    <div className="app-status">
                      <span className={`status-badge ${app.enabled ? 'enabled' : 'disabled'}`}>
                        {app.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                  </div>
                  <div className="app-actions">
                    <button
                      className={`toggle-button ${app.enabled ? 'enabled' : 'disabled'}`}
                      onClick={(e) => handleToggleApp(e, app)}
                      title={app.enabled ? '禁用' : '启用'}
                    >
                      <FontAwesomeIcon icon={app.enabled ? faToggleOn : faToggleOff} />
                    </button>
                    <button
                      className="edit-button"
                      onClick={() => handleEditApp(app)}
                      title="编辑"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteApp(app.id)}
                      title="删除"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加黑名单应用对话框 - 使用Portal渲染到body */}
      {showAddDialog && createPortal(
        <AnimatePresence>
          <motion.div 
            className="blacklist-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowAddDialog(false)}
          >
            <motion.div 
              className="blacklist-modal"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="blacklist-modal-header"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <h3>添加黑名单应用</h3>
                <motion.button
                  className="blacklist-close-button"
                  onClick={() => setShowAddDialog(false)}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 90,
                    backgroundColor: "rgba(240, 238, 237, 1)"
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </motion.button>
              </motion.div>
              <motion.div 
                className="blacklist-modal-body"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="form-group">
                  <label>应用名称</label>
                  <motion.input
                    type="text"
                    value={newApp.name}
                    onChange={(e) => setNewApp(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input"
                    placeholder="输入应用名称"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>进程名称</label>
                  <motion.input
                    type="text"
                    value={newApp.processName}
                    onChange={(e) => setNewApp(prev => ({ ...prev, processName: e.target.value }))}
                    className="form-input"
                    placeholder="例如: chrome.exe"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
                </div>
                <div className="form-group">
                  <div className="process-list-header">
                    <label>运行中的进程</label>
                    <motion.button
                      className="refresh-button"
                      onClick={loadRunningProcesses}
                      disabled={loadingProcesses}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FontAwesomeIcon icon={faRefresh} spin={loadingProcesses} />
                      刷新
                    </motion.button>
                  </div>
                  <div className="process-list">
                    {loadingProcesses ? (
                      <motion.div 
                        className="loading"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        加载中...
                      </motion.div>
                    ) : runningProcesses.length === 0 ? (
                      <div className="no-processes">无法获取进程列表</div>
                    ) : (
                      runningProcesses.slice(0, 20).map((process, index) => (
                        <motion.button
                          key={process}
                          className="process-item"
                          onClick={() => handleSelectProcess(process)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02, duration: 0.3 }}
                          whileHover={{ 
                            scale: 1.02,
                            backgroundColor: "rgba(212, 165, 116, 0.1)"
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {process}
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <motion.label 
                    className="checkbox-label"
                    whileHover={{ scale: 1.02 }}
                  >
                    <input
                      type="checkbox"
                      checked={newApp.enabled}
                      onChange={(e) => setNewApp(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                    <span>启用此黑名单规则</span>
                  </motion.label>
                </div>
              </motion.div>
              <motion.div 
                className="blacklist-modal-footer"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.button
                  className="cancel-button"
                  onClick={() => setShowAddDialog(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  取消
                </motion.button>
                <motion.button
                  className="add-button"
                  onClick={handleAddApp}
                  disabled={!newApp.name.trim() || !newApp.processName.trim()}
                  whileHover={{ 
                    scale: (!newApp.name.trim() || !newApp.processName.trim()) ? 1 : 1.05,
                    boxShadow: (!newApp.name.trim() || !newApp.processName.trim()) ? "none" : "0 8px 25px rgba(212, 165, 116, 0.3)"
                  }}
                  whileTap={{ scale: (!newApp.name.trim() || !newApp.processName.trim()) ? 1 : 0.95 }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  添加
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}