import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faTrash,
  faSave,
  faTimes,
  faPlay,
  faPause,
  faCog,
  faRocket,
  faShield
} from '@fortawesome/free-solid-svg-icons'
import { useWorkMode } from '../contexts/WorkModeContext'
import AutoStartApps from '../components/AutoStartApps'
import BlacklistApps from '../components/BlacklistApps'
import './WorkModeSettings.css'
import { faDesktop } from '@fortawesome/free-solid-svg-icons/faDesktop'

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

  // 鼠标跟随背景效果
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      document.documentElement.style.setProperty('--mouse-x', `${x}%`)
      document.documentElement.style.setProperty('--mouse-y', `${y}%`)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
        <div className="mouse-follow-bg" />
        <motion.div 
          className="loading-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* 现代化加载动画 */}
          <motion.div className="modern-loading-container">
            <motion.div 
              className="modern-loading-ring"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <div className="loading-ring-segment"></div>
              <div className="loading-ring-segment"></div>
              <div className="loading-ring-segment"></div>
            </motion.div>
            
            {/* 脉冲效果 */}
            <motion.div 
              className="loading-pulse"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </motion.div>
          
          <motion.p 
            className="loading-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            正在加载工作模式配置...
          </motion.p>
          
          {/* 加载进度点 */}
          <motion.div className="loading-dots">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="loading-dot"
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div 
      className="work-mode-settings"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* 鼠标跟随背景 */}
      <div className="mouse-follow-bg" />

      {/* 静态背景装饰 */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#D4A574] rounded-full opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div 
        className="settings-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <motion.h1
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          工作模式设置
        </motion.h1>
        <AnimatePresence>
          {selectedMode && (
            <motion.div 
              className="mode-actions"
              initial={{ x: 20, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 20, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                className={`mode-toggle-btn ${runningModeId === selectedMode.id ? 'active' : ''}`}
                onClick={handleToggleMode}
                disabled={isToggling}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 8px 25px rgba(212, 165, 116, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: runningModeId === selectedMode.id 
                    ? ["0 0 0 0 rgba(217, 123, 90, 0.4)", "0 0 0 8px rgba(217, 123, 90, 0)", "0 0 0 0 rgba(217, 123, 90, 0)"]
                    : "0 4px 15px rgba(212, 165, 116, 0.2)"
                }}
                transition={{
                  boxShadow: {
                    duration: runningModeId === selectedMode.id ? 2 : 0.3,
                    repeat: runningModeId === selectedMode.id ? Infinity : 0,
                    ease: "easeInOut"
                  }
                }}
              >
                <motion.div
                  animate={{ rotate: isToggling ? 360 : 0 }}
                  transition={{ duration: isToggling ? 1 : 0.3, repeat: isToggling ? Infinity : 0, ease: "linear" }}
                >
                  <FontAwesomeIcon icon={runningModeId === selectedMode.id ? faPause : faPlay} />
                </motion.div>
                <span>
                  {isToggling
                    ? (runningModeId === selectedMode.id ? '停止中...' : '启动中...')
                    : (runningModeId === selectedMode.id ? '停止模式' : '启动模式')
                  }
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <motion.p
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {error}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>



      <motion.div 
        className="settings-content"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {/* 左侧模式列表 */}
        <motion.div 
          className="mode-sidebar"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.h2
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            已创建模式
          </motion.h2>
          <motion.ul 
            className="mode-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {modes && modes.map((mode, index) => (
              <motion.li 
                key={mode.id} 
                className="mode-item"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.7 + index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <motion.button
                  className={`mode-button ${selectedModeId === mode.id ? 'active' : ''} ${runningModeId === mode.id ? 'running' : ''}`}
                  onClick={() => dispatch({ type: 'SET_SELECTED_MODE', payload: mode.id })}
                  whileHover={{ 
                    x: 4,
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="mode-name">{mode.name}</span>
                  <AnimatePresence>
                    {runningModeId === mode.id && (
                      <motion.span 
                        className="running-indicator"
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        运行中
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.li>
            ))}
          </motion.ul>
          <motion.button
            className="new-mode-button"
            onClick={() => setShowNewModeDialog(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: "0 4px 15px rgba(212, 165, 116, 0.2)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <FontAwesomeIcon icon={faPlus} />
            </motion.div>
            <span>新建模式</span>
          </motion.button>
        </motion.div>

        {/* 右侧设置面板 */}
        <AnimatePresence mode="wait">
          {selectedMode ? (
            <motion.div 
              key={selectedMode.id}
              className="settings-panel"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* 模式名称与描述 */}
              <motion.div 
                className="settings-card enhanced-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 15px 35px rgba(212, 165, 116, 0.15)"
                }}
              >
                <motion.div className="card-icon-header">
                  <motion.div 
                    className="card-icon"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FontAwesomeIcon icon={faCog} />
                  </motion.div>
                  <h3>模式名称与描述</h3>
                </motion.div>
                <motion.div className="form-group">
                  <label>模式名称</label>
                  <motion.input
                    type="text"
                    value={modeName}
                    onChange={(e) => {
                      setModeName(e.target.value)
                      setIsEditing(true)
                    }}
                    className="form-input"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
                </motion.div>
                <motion.div className="form-group">
                  <label>模式描述（可选）</label>
                  <motion.textarea
                    value={modeDescription}
                    onChange={(e) => {
                      setModeDescription(e.target.value)
                      setIsEditing(true)
                    }}
                    className="form-textarea"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
                </motion.div>
              </motion.div>

              {/* 自动启动应用 */}
              <motion.div 
                className="settings-card enhanced-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 15px 35px rgba(212, 165, 116, 0.15)"
                }}
              >
                <motion.div className="card-icon-header">
                  <motion.div 
                    className="card-icon"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FontAwesomeIcon icon={faRocket} />
                  </motion.div>
                  <h3>自动启动应用</h3>
                </motion.div>
                <p className="feature-hint">
                  配置在启动此工作模式时需要自动启动的应用程序
                </p>
                <AutoStartApps 
                  modeId={selectedMode.id} 
                  apps={selectedMode.autoStartApps || []} 
                />
              </motion.div>

              {/* 应用黑名单 */}
              <motion.div 
                className="settings-card enhanced-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 15px 35px rgba(212, 165, 116, 0.15)"
                }}
              >
                <div className="card-header">
                  <motion.div className="card-icon-header">
                    <motion.div 
                      className="card-icon"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FontAwesomeIcon icon={faShield} />
                    </motion.div>
                    <h3>应用黑名单</h3>
                  </motion.div>
                  <motion.div 
                    className="toggle-switch"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <input
                      type="checkbox"
                      id="enable-blacklist"
                      checked={enableBlacklist}
                      onChange={(e) => handleToggleBlacklist(e.target.checked)}
                    />
                    <label htmlFor="enable-blacklist" className="toggle-label"></label>
                  </motion.div>
                </div>
                <p className="feature-hint">
                  启用后，系统将自动关闭黑名单中的应用程序
                </p>
                
                <AnimatePresence>
                  {enableBlacklist && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <BlacklistApps 
                        modeId={selectedMode.id} 
                        apps={selectedMode.blacklistApps || []} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 自动创建新桌面 */}
              <motion.div 
                className="settings-card enhanced-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 15px 35px rgba(212, 165, 116, 0.15)"
                }}
              >
                <div className="card-header">
                  <motion.div className="card-icon-header">
                    <motion.div 
                      className="card-icon"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FontAwesomeIcon icon={faDesktop} />
                    </motion.div>
                    <h3>自动创建新桌面</h3>
                  </motion.div>
                  <motion.div 
                    className="toggle-switch"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
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
                  </motion.div>
                </div>
                <p className="feature-hint">
                  启用后，将在该模式开始时自动创建新的虚拟桌面
                </p>
              </motion.div>

              {/* 操作按钮 */}
              <motion.div 
                className="action-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <motion.button
                  className="delete-button"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={!modes || modes.length <= 1}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 8px 25px rgba(217, 123, 90, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </motion.div>
                  <span>删除模式</span>
                </motion.button>
                <motion.button
                  className="save-button"
                  onClick={handleSaveMode}
                  disabled={!isEditing}
                  whileHover={{ 
                    scale: isEditing ? 1.05 : 1,
                    boxShadow: isEditing ? "0 8px 25px rgba(212, 165, 116, 0.3)" : "none"
                  }}
                  whileTap={{ scale: isEditing ? 0.95 : 1 }}
                  animate={{
                    opacity: isEditing ? 1 : 0.5,
                    boxShadow: isEditing 
                      ? ["0 0 0 0 rgba(212, 165, 116, 0.4)", "0 0 0 4px rgba(212, 165, 116, 0)", "0 0 0 0 rgba(212, 165, 116, 0)"]
                      : "none"
                  }}
                  transition={{
                    boxShadow: {
                      duration: isEditing ? 2 : 0.3,
                      repeat: isEditing ? Infinity : 0,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <motion.div
                    animate={{ rotate: isEditing ? [0, 360] : 0 }}
                    transition={{ 
                      duration: isEditing ? 2 : 0.3,
                      repeat: isEditing ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <FontAwesomeIcon icon={faSave} />
                  </motion.div>
                  <span>保存更改</span>
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              className="settings-panel"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                className="empty-state"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div
                  className="empty-icon"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FontAwesomeIcon icon={faCog} size="3x" />
                </motion.div>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  请选择一个工作模式进行配置，或创建新的工作模式
                </motion.p>
                <motion.button
                  className="create-first-mode-button"
                  onClick={() => setShowNewModeDialog(true)}
                  initial={{ y: 20, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 30px rgba(212, 165, 116, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                  </motion.div>
                  <span>创建第一个工作模式</span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 新建模式对话框 */}
      <AnimatePresence>
        {showNewModeDialog && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowNewModeDialog(false)}
          >
            <motion.div 
              className="modal"
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="modal-header"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <h3>新建工作模式</h3>
                <motion.button
                  className="close-button"
                  onClick={() => setShowNewModeDialog(false)}
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
                className="modal-body"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="form-group">
                  <label>模式名称</label>
                  <motion.input
                    type="text"
                    value={newModeName}
                    onChange={(e) => setNewModeName(e.target.value)}
                    className="form-input"
                    placeholder="输入模式名称"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>模式描述（可选）</label>
                  <motion.textarea
                    value={newModeDescription}
                    onChange={(e) => setNewModeDescription(e.target.value)}
                    className="form-textarea"
                    placeholder="输入模式描述"
                    whileFocus={{ 
                      scale: 1.02,
                      boxShadow: "0 0 0 3px rgba(212, 165, 116, 0.2)"
                    }}
                  />
                </div>
              </motion.div>
              <motion.div 
                className="modal-footer"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.button
                  className="cancel-button"
                  onClick={() => setShowNewModeDialog(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  取消
                </motion.button>
                <motion.button
                  className="create-button"
                  onClick={handleCreateMode}
                  disabled={!newModeName.trim()}
                  whileHover={{ 
                    scale: newModeName.trim() ? 1.05 : 1,
                    boxShadow: newModeName.trim() ? "0 8px 25px rgba(212, 165, 116, 0.3)" : "none"
                  }}
                  whileTap={{ scale: newModeName.trim() ? 0.95 : 1 }}
                >
                  创建
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 删除确认对话框 */}
      <AnimatePresence>
        {showDeleteDialog && selectedMode && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowDeleteDialog(false)}
          >
            <motion.div 
              className="modal delete-modal"
              initial={{ opacity: 0, scale: 0.8, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div 
                className="modal-header"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <h3>确认删除</h3>
                <motion.button
                  className="close-button"
                  onClick={() => setShowDeleteDialog(false)}
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
                className="modal-body"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="delete-warning">
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <FontAwesomeIcon icon={faTrash} className="warning-icon" />
                  </motion.div>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    确定要删除工作模式 <strong>"{selectedMode.name}"</strong> 吗？
                  </motion.p>
                  <motion.p 
                    className="warning-text"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    此操作无法撤销。
                  </motion.p>
                </div>
              </motion.div>
              <motion.div 
                className="modal-footer"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.button
                  className="cancel-button"
                  onClick={() => setShowDeleteDialog(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  取消
                </motion.button>
                <motion.button
                  className="delete-confirm-button"
                  onClick={handleDeleteMode}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 8px 25px rgba(217, 123, 90, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </motion.div>
                  删除
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}