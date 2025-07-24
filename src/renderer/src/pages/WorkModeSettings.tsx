import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, 
  faTrash,
  faSave,
  faTimes,
  faPlay,
  faStop,
  faDesktop
} from '@fortawesome/free-solid-svg-icons'
import { useWorkMode } from '../contexts/WorkModeContext'
import './WorkModeSettings.css'

export default function WorkModeSettings() {
  const {
    state: { modes, selectedModeId, loading, error },
    dispatch,
    createMode,
    updateMode,
    deleteMode,
    addAppToMode,
    removeAppFromMode,
    startMode,
    stopMode,
    selectAppFile,
    getSelectedMode
  } = useWorkMode()

  const [modeName, setModeName] = useState('')
  const [modeDescription, setModeDescription] = useState('')
  const [autoDesktop, setAutoDesktop] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showNewModeDialog, setShowNewModeDialog] = useState(false)
  const [newModeName, setNewModeName] = useState('')
  const [newModeDescription, setNewModeDescription] = useState('')

  const selectedMode = getSelectedMode()

  // 当选中的模式改变时，更新表单数据
  useEffect(() => {
    if (selectedMode) {
      setModeName(selectedMode.name)
      setModeDescription(selectedMode.description)
      setAutoDesktop(selectedMode.autoCreateDesktop)
      setIsEditing(false)
    }
  }, [selectedMode])

  // 保存模式更改
  const handleSaveMode = async () => {
    if (!selectedMode) return

    const success = await updateMode(selectedMode.id, {
      name: modeName,
      description: modeDescription,
      autoCreateDesktop: autoDesktop
    })

    if (success) {
      setIsEditing(false)
    }
  }

  // 创建新模式
  const handleCreateMode = async () => {
    if (!newModeName.trim()) return

    const newMode = await createMode(newModeName, newModeDescription)
    if (newMode) {
      setShowNewModeDialog(false)
      setNewModeName('')
      setNewModeDescription('')
      dispatch({ type: 'SET_SELECTED_MODE', payload: newMode.id })
    }
  }

  // 删除模式
  const handleDeleteMode = async () => {
    if (!selectedMode) return
    
    if (confirm(`确定要删除模式"${selectedMode.name}"吗？`)) {
      await deleteMode(selectedMode.id)
    }
  }

  // 添加应用
  const handleAddApp = async () => {
    if (!selectedMode) return

    const appPath = await selectAppFile()
    if (appPath) {
      await addAppToMode(selectedMode.id, appPath)
    }
  }

  // 移除应用
  const handleRemoveApp = async (appId: string) => {
    if (!selectedMode) return
    await removeAppFromMode(selectedMode.id, appId)
  }

  // 启动/停止模式
  const handleToggleMode = async () => {
    if (!selectedMode) return

    if (selectedMode.isActive) {
      await stopMode(selectedMode.id)
    } else {
      await startMode(selectedMode.id)
    }
  }

  if (loading) {
    return (
      <div className="work-mode-settings">
        <div className="loading-state">
          <p>加载工作模式...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="work-mode-settings">
      <div className="settings-header">
        <h1>工作模式设置</h1>
        {selectedMode && (
          <div className="mode-actions">
            <button 
              className={`mode-toggle-btn ${selectedMode.isActive ? 'active' : ''}`}
              onClick={handleToggleMode}
            >
              <FontAwesomeIcon icon={selectedMode.isActive ? faStop : faPlay} />
              <span>{selectedMode.isActive ? '停止模式' : '启动模式'}</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="settings-content">
        {/* 左侧模式列表 */}
        <div className="mode-sidebar">
          <h2>已创建模式</h2>
          <ul className="mode-list">
            {modes.map((mode) => (
              <li key={mode.id} className="mode-item">
                <button
                  className={`mode-button ${selectedModeId === mode.id ? 'active' : ''} ${mode.isActive ? 'running' : ''}`}
                  onClick={() => dispatch({ type: 'SET_SELECTED_MODE', payload: mode.id })}
                >
                  <span className="mode-name">{mode.name}</span>
                  {mode.isActive && <span className="running-indicator">运行中</span>}
                </button>
              </li>
            ))}
          </ul>
          <button 
            className="new-mode-button"
            onClick={() => setShowNewModeDialog(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>新建模式</span>
          </button>
        </div>

        {/* 右侧设置面板 */}
        {selectedMode ? (
          <div className="settings-panel">
            {/* 模式名称与描述 */}
            <div className="settings-card">
              <h3>模式名称与描述</h3>
              <div className="form-group">
                <label>模式名称</label>
                <input
                  type="text"
                  value={modeName}
                  onChange={(e) => {
                    setModeName(e.target.value)
                    setIsEditing(true)
                  }}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>模式描述（可选）</label>
                <textarea
                  value={modeDescription}
                  onChange={(e) => {
                    setModeDescription(e.target.value)
                    setIsEditing(true)
                  }}
                  className="form-textarea"
                />
              </div>
            </div>

            {/* 自动启动应用 */}
            <div className="settings-card">
              <h3>自动启动应用</h3>
              <div className="app-tags">
                {selectedMode.apps.map((app) => (
                  <div key={app.id} className="app-tag">
                    <div className="app-icon">
                      <FontAwesomeIcon icon={faDesktop} />
                    </div>
                    <div className="app-info">
                      <span className="app-name">{app.name}</span>
                      <span className="app-path">{app.path}</span>
                    </div>
                    <button 
                      className="remove-button"
                      onClick={() => handleRemoveApp(app.id)}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                className="add-app-button"
                onClick={handleAddApp}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>添加应用</span>
              </button>
            </div>

            {/* 自动创建新桌面 */}
            <div className="settings-card">
              <div className="card-header">
                <h3>自动创建新桌面</h3>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="auto-desktop"
                    checked={autoDesktop}
                    onChange={(e) => {
                      setAutoDesktop(e.target.checked)
                      setIsEditing(true)
                    }}
                  />
                  <label htmlFor="auto-desktop" className="toggle-label"></label>
                </div>
              </div>
              <p className="feature-hint">
                启用后，将在该模式开始时自动创建新的虚拟桌面
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="action-buttons">
              <button 
                className="delete-button"
                onClick={handleDeleteMode}
                disabled={modes.length <= 1}
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>删除模式</span>
              </button>
              <button 
                className="save-button"
                onClick={handleSaveMode}
                disabled={!isEditing}
              >
                <FontAwesomeIcon icon={faSave} />
                <span>保存更改</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-panel">
            <div className="empty-state">
              <p>请选择一个工作模式进行配置</p>
            </div>
          </div>
        )}
      </div>

      {/* 新建模式对话框 */}
      {showNewModeDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>新建工作模式</h3>
              <button 
                className="close-button"
                onClick={() => setShowNewModeDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>模式名称</label>
                <input
                  type="text"
                  value={newModeName}
                  onChange={(e) => setNewModeName(e.target.value)}
                  className="form-input"
                  placeholder="输入模式名称"
                />
              </div>
              <div className="form-group">
                <label>模式描述（可选）</label>
                <textarea
                  value={newModeDescription}
                  onChange={(e) => setNewModeDescription(e.target.value)}
                  className="form-textarea"
                  placeholder="输入模式描述"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowNewModeDialog(false)}
              >
                取消
              </button>
              <button 
                className="create-button"
                onClick={handleCreateMode}
                disabled={!newModeName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}