import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArrowLeft, 
  faPlus, 
  faCode, 
  faFileText,
  faComment,
  faEnvelope,
  faBell,
  faSearch,
  faTrash,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons'
import './WorkModeSettings.css'

const workModes = [
  { id: 1, name: '深度工作模式', active: true },
  { id: 2, name: '学习模式', active: false },
  { id: 3, name: '会议模式', active: false },
]

const autoStartApps = [
  { id: 1, name: '文档编辑器', icon: faFileText },
  { id: 2, name: '代码编辑器', icon: faCode },
]

const blacklistApps = [
  { id: 1, name: '社交应用', icon: faComment },
  { id: 2, name: '邮件客户端', icon: faEnvelope },
  { id: 3, name: '通知中心', icon: faBell },
]

export default function WorkModeSettings() {
  const [selectedMode, setSelectedMode] = useState(1)
  const [modeName, setModeName] = useState('深度工作模式')
  const [modeDescription, setModeDescription] = useState('用于需要高度专注的工作场景，屏蔽干扰应用。')
  const [appRestriction, setAppRestriction] = useState(true)
  const [blacklistMode, setBlacklistMode] = useState(true)
  const [autoDesktop, setAutoDesktop] = useState(true)

  return (
    <div className="work-mode-settings">
      <div className="settings-header">
        <button className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>工作模式设置</h1>
      </div>

      <div className="settings-content">
        {/* 左侧模式列表 */}
        <div className="mode-sidebar">
          <h2>已创建模式</h2>
          <ul className="mode-list">
            {workModes.map((mode) => (
              <li key={mode.id} className="mode-item">
                <button
                  className={`mode-button ${mode.active ? 'active' : ''}`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  {mode.name}
                </button>
              </li>
            ))}
          </ul>
          <button className="new-mode-button">
            <FontAwesomeIcon icon={faPlus} />
            <span>新建模式</span>
          </button>
        </div>

        {/* 右侧设置面板 */}
        <div className="settings-panel">
          {/* 模式名称与描述 */}
          <div className="settings-card">
            <h3>模式名称与描述</h3>
            <div className="form-group">
              <label>模式名称</label>
              <input
                type="text"
                value={modeName}
                onChange={(e) => setModeName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>模式描述（可选）</label>
              <textarea
                value={modeDescription}
                onChange={(e) => setModeDescription(e.target.value)}
                className="form-textarea"
              />
            </div>
          </div>

          {/* 自动启动应用 */}
          <div className="settings-card">
            <h3>自动启动应用</h3>
            <div className="app-tags">
              {autoStartApps.map((app) => (
                <div key={app.id} className="app-tag">
                  <div className="app-icon">
                    <FontAwesomeIcon icon={app.icon} />
                  </div>
                  <span>{app.name}</span>
                  <button className="remove-button">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>
            <button className="add-app-button">
              <FontAwesomeIcon icon={faPlus} />
              <span>添加应用</span>
            </button>
          </div>

          {/* 应用限制 */}
          <div className="settings-card">
            <div className="card-header">
              <h3>应用限制</h3>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="app-restriction"
                  checked={appRestriction}
                  onChange={(e) => setAppRestriction(e.target.checked)}
                />
                <label htmlFor="app-restriction" className="toggle-label"></label>
              </div>
            </div>

            <div className="restriction-modes">
              <button
                className={`mode-toggle ${blacklistMode ? 'active' : ''}`}
                onClick={() => setBlacklistMode(true)}
              >
                黑名单
              </button>
              <button
                className={`mode-toggle ${!blacklistMode ? 'active' : ''}`}
                onClick={() => setBlacklistMode(false)}
              >
                白名单
              </button>
            </div>
            <p className="restriction-hint">
              黑名单模式：列表中的应用将被禁止使用
            </p>

            <div className="search-section">
              <div className="search-input-wrapper">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  type="text"
                  placeholder="搜索应用..."
                  className="search-input"
                />
              </div>
              <div className="app-tags">
                {blacklistApps.map((app) => (
                  <div key={app.id} className="app-tag">
                    <div className="app-icon">
                      <FontAwesomeIcon icon={app.icon} />
                    </div>
                    <span>{app.name}</span>
                    <button className="remove-button">
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
                  onChange={(e) => setAutoDesktop(e.target.checked)}
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
            <button className="delete-button">
              <FontAwesomeIcon icon={faTrash} />
              <span>删除模式</span>
            </button>
            <button className="save-button">
              <FontAwesomeIcon icon={faSave} />
              <span>保存更改</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
