import { useState } from 'react'
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
}

export default function AutoStartApps({ modeId, apps }: AutoStartAppsProps) {
  const {
    selectExecutableFile,
    addAutoStartApp,
    updateAutoStartApp,
    removeAutoStartApp
  } = useWorkMode()

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingApp, setEditingApp] = useState<AutoStartApp | null>(null)
  const [newApp, setNewApp] = useState({
    name: '',
    path: '',
    arguments: '',
    workingDirectory: '',
    enabled: true
  })

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

  // 切换应用启用状态
  const handleToggleApp = async (app: AutoStartApp) => {
    await updateAutoStartApp(modeId, app.id, { enabled: !app.enabled })
  }

  // 删除应用
  const handleDeleteApp = async (appId: string) => {
    await removeAutoStartApp(modeId, appId)
  }

  // 开始编辑应用
  const handleEditApp = (app: AutoStartApp) => {
    setEditingApp({ ...app })
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingApp) return

    const success = await updateAutoStartApp(modeId, editingApp.id, {
      name: editingApp.name,
      arguments: editingApp.arguments,
      workingDirectory: editingApp.workingDirectory
    })

    if (success) {
      setEditingApp(null)
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

      {/* 添加应用对话框 */}
      {showAddDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>添加自启动应用</h3>
              <button
                className="close-button"
                onClick={() => setShowAddDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>应用程序路径</label>
                <div className="file-input-group">
                  <input
                    type="text"
                    value={newApp.path}
                    onChange={(e) => setNewApp(prev => ({ ...prev, path: e.target.value }))}
                    className="form-input"
                    placeholder="选择应用程序文件"
                    readOnly
                  />
                  <button
                    className="browse-button"
                    onClick={handleSelectFile}
                  >
                    <FontAwesomeIcon icon={faFolder} />
                    浏览
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>应用名称</label>
                <input
                  type="text"
                  value={newApp.name}
                  onChange={(e) => setNewApp(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="输入应用名称"
                />
              </div>
              <div className="form-group">
                <label>启动参数（可选）</label>
                <input
                  type="text"
                  value={newApp.arguments}
                  onChange={(e) => setNewApp(prev => ({ ...prev, arguments: e.target.value }))}
                  className="form-input"
                  placeholder="例如: --minimized"
                />
              </div>
              <div className="form-group">
                <label>工作目录（可选）</label>
                <input
                  type="text"
                  value={newApp.workingDirectory}
                  onChange={(e) => setNewApp(prev => ({ ...prev, workingDirectory: e.target.value }))}
                  className="form-input"
                  placeholder="例如: C:\\MyProject"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newApp.enabled}
                    onChange={(e) => setNewApp(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                  <span>启用此应用</span>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowAddDialog(false)}
              >
                取消
              </button>
              <button
                className="add-button"
                onClick={handleAddApp}
                disabled={!newApp.name.trim() || !newApp.path.trim()}
              >
                <FontAwesomeIcon icon={faPlus} />
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}