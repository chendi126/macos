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
  faFolder
} from '@fortawesome/free-solid-svg-icons'
import { AutoStartApp } from '../types/electron'
import { useWorkMode } from '../contexts/WorkModeContext'
import './AutoStartApps.css'

interface AutoStartAppsProps {
  modeId: string
  apps: AutoStartApp[]
  onAddApp?: (app: AutoStartApp) => void
  onUpdateApp?: (appId: string, updates: Partial<AutoStartApp>) => void
  onRemoveApp?: (appId: string) => void
}

export default function AutoStartApps({ 
  modeId, 
  apps, 
  onAddApp, 
  onUpdateApp, 
  onRemoveApp 
}: AutoStartAppsProps) {
  const {
    selectExecutableFile,
    addAutoStartApp,
    updateAutoStartApp,
    removeAutoStartApp
  } = useWorkMode()

  // 判断是否使用缓存模式
  const isCacheMode = !!(onAddApp && onUpdateApp && onRemoveApp)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingApp, setEditingApp] = useState<AutoStartApp | null>(null)
  const [newApp, setNewApp] = useState({
    name: '',
    path: '',
    arguments: '',
    workingDirectory: '',
    enabled: true
  })

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

  // 选择应用文件
  const handleSelectFile = async () => {
    const filePath = await selectExecutableFile()
    if (filePath) {
      // 从文件路径提取应用名称
      const fileName = filePath.split('\\').pop()?.replace(/\.[^/.]+$/, '') || ''
      setNewApp(prev => ({
        ...prev,
        path: filePath,
        name: fileName
      }))
    }
  }

  // 添加新应用
  const handleAddApp = async () => {
    if (!newApp.name.trim() || !newApp.path.trim()) return

    if (isCacheMode && onAddApp) {
      // 缓存模式：直接添加到本地状态
      const newAppData: AutoStartApp = {
        id: Date.now().toString(), // 临时ID
        name: newApp.name,
        path: newApp.path,
        arguments: newApp.arguments,
        workingDirectory: newApp.workingDirectory,
        enabled: newApp.enabled
      }
      onAddApp(newAppData)
      
      setShowAddDialog(false)
      setNewApp({
        name: '',
        path: '',
        arguments: '',
        workingDirectory: '',
        enabled: true
      })
    } else {
      // 原有模式：直接保存到后端
      const success = await addAutoStartApp(modeId, {
        name: newApp.name,
        path: newApp.path,
        arguments: newApp.arguments,
        workingDirectory: newApp.workingDirectory,
        enabled: newApp.enabled
      })

      if (success) {
        setShowAddDialog(false)
        setNewApp({
          name: '',
          path: '',
          arguments: '',
          workingDirectory: '',
          enabled: true
        })
      }
    }
  }

  // 切换应用启用状态
  const handleToggleApp = async (app: AutoStartApp) => {
    if (isCacheMode && onUpdateApp) {
      // 缓存模式：更新本地状态
      onUpdateApp(app.id, { enabled: !app.enabled })
    } else {
      // 原有模式：直接保存到后端
      await updateAutoStartApp(modeId, app.id, { enabled: !app.enabled })
    }
  }

  // 删除应用
  const handleDeleteApp = async (appId: string) => {
    if (isCacheMode && onRemoveApp) {
      // 缓存模式：从本地状态删除
      onRemoveApp(appId)
    } else {
      // 原有模式：直接从后端删除
      await removeAutoStartApp(modeId, appId)
    }
  }

  // 开始编辑应用
  const handleEditApp = (app: AutoStartApp) => {
    setEditingApp({ ...app })
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingApp) return

    if (isCacheMode && onUpdateApp) {
      // 缓存模式：更新本地状态
      onUpdateApp(editingApp.id, {
        name: editingApp.name,
        arguments: editingApp.arguments,
        workingDirectory: editingApp.workingDirectory
      })
      setEditingApp(null)
    } else {
      // 原有模式：直接保存到后端
      const success = await updateAutoStartApp(modeId, editingApp.id, {
        name: editingApp.name,
        arguments: editingApp.arguments,
        workingDirectory: editingApp.workingDirectory
      })

      if (success) {
        setEditingApp(null)
      }
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingApp(null)
  }

  return (
    <div className="auto-start-apps">
      <div className="apps-header">
        <h4>自启动应用列表</h4>
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
          <p>暂无自启动应用</p>
          <p className="hint">点击"添加应用"按钮来添加需要自动启动的应用程序</p>
        </div>
      ) : (
        <div className="apps-list">
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
                      <label>启动参数（可选）</label>
                      <input
                        type="text"
                        value={editingApp.arguments || ''}
                        onChange={(e) => setEditingApp(prev => prev ? { ...prev, arguments: e.target.value } : null)}
                        className="form-input"
                        placeholder="例如: --minimized"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>工作目录（可选）</label>
                      <input
                        type="text"
                        value={editingApp.workingDirectory || ''}
                        onChange={(e) => setEditingApp(prev => prev ? { ...prev, workingDirectory: e.target.value } : null)}
                        className="form-input"
                        placeholder="例如: C:\\MyProject"
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
                      <div className="app-path">{app.path}</div>
                      {app.arguments && (
                        <div className="app-args">参数: {app.arguments}</div>
                      )}
                      {app.workingDirectory && (
                        <div className="app-workdir">工作目录: {app.workingDirectory}</div>
                      )}
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
                      onClick={() => handleToggleApp(app)}
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

      {/* 添加应用对话框 - 使用Portal渲染到body */}
      {showAddDialog && createPortal(
        <AnimatePresence>
          <motion.div 
            className="auto-start-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowAddDialog(false)}
          >
            <motion.div 
              className="auto-start-modal"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="auto-start-modal-header"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <h3>添加自启动应用</h3>
                <motion.button
                  className="auto-start-close-button"
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
                className="auto-start-modal-body"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="form-group">
                  <label>应用程序路径</label>
                  <div className="file-input-group">
                    <motion.input
                      type="text"
                      value={newApp.path}
                      onChange={(e) => setNewApp(prev => ({ ...prev, path: e.target.value }))}
                      className="form-input"
                      placeholder="选择应用程序文件"
                      readOnly
                      whileFocus={{ 
                        scale: 1.02,
                        boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                      }}
                    />
                    <motion.button
                      className="browse-button"
                      onClick={handleSelectFile}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FontAwesomeIcon icon={faFolder} />
                      浏览
                    </motion.button>
                  </div>
                </div>
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
                  <label>启动参数（可选）</label>
                  <motion.input
                    type="text"
                    value={newApp.arguments}
                    onChange={(e) => setNewApp(prev => ({ ...prev, arguments: e.target.value }))}
                    className="form-input"
                    placeholder="例如: --minimized"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>工作目录（可选）</label>
                  <motion.input
                    type="text"
                    value={newApp.workingDirectory}
                    onChange={(e) => setNewApp(prev => ({ ...prev, workingDirectory: e.target.value }))}
                    className="form-input"
                    placeholder="例如: C:\\MyProject"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
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
                    <span>启用此应用</span>
                  </motion.label>
                </div>
              </motion.div>
              <motion.div 
                className="auto-start-modal-footer"
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
                  disabled={!newApp.name.trim() || !newApp.path.trim()}
                  whileHover={{ 
                    scale: (!newApp.name.trim() || !newApp.path.trim()) ? 1 : 1.05,
                    boxShadow: (!newApp.name.trim() || !newApp.path.trim()) ? "none" : "0 8px 25px rgba(212, 165, 116, 0.3)"
                  }}
                  whileTap={{ scale: (!newApp.name.trim() || !newApp.path.trim()) ? 1 : 0.95 }}
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