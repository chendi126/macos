import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faTrash,
  faSave,
  faTimes,
  faPlay,
  faPause
} from '@fortawesome/free-solid-svg-icons'
import { useWorkMode } from '../contexts/WorkModeContext'
import AutoStartApps from '../components/AutoStartApps'
import BlacklistApps from '../components/BlacklistApps'
import './WorkModeSettings.css'

export default function WorkModeSettings() {
  const {
    state: { modes, selectedModeId, runningModeId, loading, error },
    dispatch,
    createMode,
    updateMode,
    deleteMode,
    startMode,
    stopMode,
    getSelectedMode
  } = useWorkMode()

  const [modeName, setModeName] = useState('')
  const [modeDescription, setModeDescription] = useState('')
  const [autoDesktop, setAutoDesktop] = useState(false)
  const [enableBlacklist, setEnableBlacklist] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showNewModeDialog, setShowNewModeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [newModeName, setNewModeName] = useState('')
  const [newModeDescription, setNewModeDescription] = useState('')

  const selectedMode = getSelectedMode()

  // 当选中的模式改变时，更新表单数据
  useEffect(() => {
    if (selectedMode) {
      setModeName(selectedMode.name)
      setModeDescription(selectedMode.description)
      setAutoDesktop(selectedMode.autoCreateDesktop)
      setEnableBlacklist(selectedMode.enableBlacklist || false)
      setIsEditing(false)
    }
  }, [selectedMode])

  // 保存模式更改
  const handleSaveMode = async () => {
    if (!selectedMode) return

    const success = await updateMode(selectedMode.id, {
      name: modeName,
      description: modeDescription,
      autoCreateDesktop: autoDesktop,
      enableBlacklist: enableBlacklist
    })

    if (success) {
      setIsEditing(false)
    }
  }

  // 切换黑名单模式
  const handleToggleBlacklist = (enabled: boolean) => {
    setEnableBlacklist(enabled)
    setIsEditing(true)
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

  // 切换模式（启动/停止）
  const handleToggleMode = async () => {
    if (!selectedMode) return

    setIsToggling(true)
    try {
      const isCurrentlyRunning = runningModeId === selectedMode.id

      if (isCurrentlyRunning) {
        // 停止当前模式
        await stopMode(selectedMode.id)
      } else {
        // 启动新模式（会自动停止其他运行的模式）
        await startMode(selectedMode.id)
      }
    } finally {
      setIsToggling(false)
    }
  }

  // 删除模式
  const handleDeleteMode = async () => {
    if (!selectedMode) return

    await deleteMode(selectedMode.id)
    setShowDeleteDialog(false)
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
              className={`mode-toggle-btn ${runningModeId === selectedMode.id ? 'active' : ''}`}
              onClick={handleToggleMode}
              disabled={isToggling}
            >
              <FontAwesomeIcon icon={runningModeId === selectedMode.id ? faPause : faPlay} />
              <span>
                {isToggling
                  ? (runningModeId === selectedMode.id ? '停止中...' : '启动中...')
                  : (runningModeId === selectedMode.id ? '停止模式' : '启动模式')
                }
              </span>
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
            {modes && modes.map((mode) => (
              <li key={mode.id} className="mode-item">
                <button
                  className={`mode-button ${selectedModeId === mode.id ? 'active' : ''} ${runningModeId === mode.id ? 'running' : ''}`}
                  onClick={() => dispatch({ type: 'SET_SELECTED_MODE', payload: mode.id })}
                >
                  <span className="mode-name">{mode.name}</span>
                  {runningModeId === mode.id && (
                    <span className="running-indicator">运行中</span>
                  )}
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
              <p className="feature-hint">
                配置在启动此工作模式时需要自动启动的应用程序
              </p>
              <AutoStartApps 
                modeId={selectedMode.id} 
                apps={selectedMode.autoStartApps || []} 
              />
            </div>

            {/* 应用黑名单 */}
            <div className="settings-card">
              <div className="card-header">
                <h3>应用黑名单</h3>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="enable-blacklist"
                    checked={enableBlacklist}
                    onChange={(e) => handleToggleBlacklist(e.target.checked)}
                  />
                  <label htmlFor="enable-blacklist" className="toggle-label"></label>
                </div>
              </div>
              <p className="feature-hint">
                启用后，系统将自动关闭黑名单中的应用程序
              </p>
              
              {enableBlacklist && (
                <BlacklistApps 
                  modeId={selectedMode.id} 
                  apps={selectedMode.blacklistApps || []} 
                />
              )}
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
                onClick={() => setShowDeleteDialog(true)}
                disabled={!modes || modes.length <= 1}
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
              <p>请选择一个工作模式进行配置，或创建新的工作模式</p>
              <button
                className="create-first-mode-button"
                onClick={() => setShowNewModeDialog(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>创建第一个工作模式</span>
              </button>
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

      {/* 删除确认对话框 */}
      {showDeleteDialog && selectedMode && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h3>确认删除</h3>
              <button
                className="close-button"
                onClick={() => setShowDeleteDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <FontAwesomeIcon icon={faTrash} className="warning-icon" />
                <p>确定要删除工作模式 <strong>"{selectedMode.name}"</strong> 吗？</p>
                <p className="warning-text">此操作无法撤销。</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowDeleteDialog(false)}
              >
                取消
              </button>
              <button
                className="delete-confirm-button"
                onClick={handleDeleteMode}
              >
                <FontAwesomeIcon icon={faTrash} />
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}