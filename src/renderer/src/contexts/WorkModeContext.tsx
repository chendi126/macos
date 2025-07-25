import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { WorkMode, AutoStartApp, BlacklistApp } from '../types/electron'

// 状态类型定义
interface WorkModeState {
  modes: WorkMode[]
  selectedModeId: string | null
  runningModeId: string | null
  loading: boolean
  error: string | null
}

// Action类型定义
type WorkModeAction = 
  | { type: 'SET_MODES'; payload: WorkMode[] }
  | { type: 'SET_SELECTED_MODE'; payload: string | null }
  | { type: 'SET_RUNNING_MODE'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MODE'; payload: WorkMode }
  | { type: 'UPDATE_MODE'; payload: WorkMode }
  | { type: 'DELETE_MODE'; payload: string }

// 初始状态
const initialState: WorkModeState = {
  modes: [],
  selectedModeId: null,
  runningModeId: null,
  loading: true,
  error: null
}

// Reducer
function workModeReducer(state: WorkModeState, action: WorkModeAction): WorkModeState {
  switch (action.type) {
    case 'SET_MODES':
      return { ...state, modes: action.payload || [], loading: false }
    case 'SET_SELECTED_MODE':
      return { ...state, selectedModeId: action.payload }
    case 'SET_RUNNING_MODE':
      return { ...state, runningModeId: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'ADD_MODE':
      return { 
        ...state, 
        modes: [...state.modes, action.payload],
        selectedModeId: action.payload.id
      }
    case 'UPDATE_MODE':
      return {
        ...state,
        modes: state.modes.map(mode => 
          mode.id === action.payload.id ? action.payload : mode
        )
      }
    case 'DELETE_MODE': {
      const remainingModes = state.modes.filter(mode => mode.id !== action.payload)
      const newSelectedModeId = state.selectedModeId === action.payload 
        ? (remainingModes.length > 0 ? remainingModes[0].id : null)
        : state.selectedModeId
      return {
        ...state,
        modes: remainingModes,
        selectedModeId: newSelectedModeId
      }
    }
    default:
      return state
  }
}

// Context类型定义
interface WorkModeContextType {
  state: WorkModeState
  dispatch: React.Dispatch<WorkModeAction>
  // 辅助函数
  loadModes: () => Promise<void>
  createMode: (name: string, description?: string) => Promise<WorkMode | null>
  updateMode: (id: string, updates: Partial<WorkMode>) => Promise<WorkMode | null>
  deleteMode: (id: string) => Promise<boolean>
  startMode: (id: string) => Promise<boolean>
  stopMode: (id: string) => Promise<boolean>
  // 自启动应用管理
  selectExecutableFile: () => Promise<string | null>
  addAutoStartApp: (modeId: string, app: Omit<AutoStartApp, 'id'>) => Promise<AutoStartApp | null>
  updateAutoStartApp: (modeId: string, appId: string, updates: Partial<AutoStartApp>) => Promise<boolean>
  removeAutoStartApp: (modeId: string, appId: string) => Promise<boolean>
  // 黑名单应用管理
  addBlacklistApp: (modeId: string, app: Omit<BlacklistApp, 'id'>) => Promise<BlacklistApp | null>
  updateBlacklistApp: (modeId: string, appId: string, updates: Partial<BlacklistApp>) => Promise<boolean>
  removeBlacklistApp: (modeId: string, appId: string) => Promise<boolean>
  getRunningProcesses: () => Promise<string[]>
  getSelectedMode: () => WorkMode | null
}

// 创建Context
const WorkModeContext = createContext<WorkModeContextType | undefined>(undefined)

// Provider组件
export function WorkModeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workModeReducer, initialState)

  // 加载所有模式
  const loadModes = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const modes = await window.electronAPI.getAllWorkModes()
      dispatch({ type: 'SET_MODES', payload: modes || [] })
      
      // 获取当前运行的模式ID
      const runningModeId = await window.electronAPI.getRunningModeId()
      dispatch({ type: 'SET_RUNNING_MODE', payload: runningModeId })
      
      // 如果没有选中的模式且有模式存在，选中第一个
      if (!state.selectedModeId && modes && modes.length > 0) {
        dispatch({ type: 'SET_SELECTED_MODE', payload: modes[0].id })
      }
    } catch (error) {
      console.error('Error loading work modes:', error)
      dispatch({ type: 'SET_ERROR', payload: '加载工作模式失败' })
      // 确保在错误情况下也设置一个空数组
      dispatch({ type: 'SET_MODES', payload: [] })
    }
  }

  // 创建新模式
  const createMode = async (name: string, description?: string): Promise<WorkMode | null> => {
    try {
      const newMode = await window.electronAPI.createWorkMode(name, description)
      dispatch({ type: 'ADD_MODE', payload: newMode })
      return newMode
    } catch (error) {
      console.error('Error creating work mode:', error)
      dispatch({ type: 'SET_ERROR', payload: '创建工作模式失败' })
      return null
    }
  }

  // 更新模式
  const updateMode = async (id: string, updates: Partial<WorkMode>): Promise<WorkMode | null> => {
    try {
      const updatedMode = await window.electronAPI.updateWorkMode(id, updates)
      if (updatedMode) {
        dispatch({ type: 'UPDATE_MODE', payload: updatedMode })
      }
      return updatedMode
    } catch (error) {
      console.error('Error updating work mode:', error)
      dispatch({ type: 'SET_ERROR', payload: '更新工作模式失败' })
      return null
    }
  }

  // 删除模式
  const deleteMode = async (id: string): Promise<boolean> => {
    try {
      const success = await window.electronAPI.deleteWorkMode(id)
      if (success) {
        dispatch({ type: 'DELETE_MODE', payload: id })
      }
      return success
    } catch (error) {
      console.error('Error deleting work mode:', error)
      dispatch({ type: 'SET_ERROR', payload: '删除工作模式失败' })
      return false
    }
  }

  // 选择可执行文件
  const selectExecutableFile = async (): Promise<string | null> => {
    try {
      return await window.electronAPI.selectExecutableFile()
    } catch (error) {
      console.error('Error selecting executable file:', error)
      return null
    }
  }

  // 添加自启动应用
  const addAutoStartApp = async (modeId: string, app: Omit<AutoStartApp, 'id'>): Promise<AutoStartApp | null> => {
    try {
      const newApp = await window.electronAPI.addAutoStartApp(modeId, app)
      if (newApp) {
        // 重新加载模式数据以更新UI
        await loadModes()
      }
      return newApp
    } catch (error) {
      console.error('Error adding auto start app:', error)
      dispatch({ type: 'SET_ERROR', payload: '添加自启动应用失败' })
      return null
    }
  }

  // 更新自启动应用
  const updateAutoStartApp = async (modeId: string, appId: string, updates: Partial<AutoStartApp>): Promise<boolean> => {
    try {
      const success = await window.electronAPI.updateAutoStartApp(modeId, appId, updates)
      if (success) {
        // 重新加载模式数据以更新UI
        await loadModes()
      }
      return success
    } catch (error) {
      console.error('Error updating auto start app:', error)
      dispatch({ type: 'SET_ERROR', payload: '更新自启动应用失败' })
      return false
    }
  }

  // 移除自启动应用
  const removeAutoStartApp = async (modeId: string, appId: string): Promise<boolean> => {
    try {
      const success = await window.electronAPI.removeAutoStartApp(modeId, appId)
      if (success) {
        // 重新加载模式数据以更新UI
        await loadModes()
      }
      return success
    } catch (error) {
      console.error('Error removing auto start app:', error)
      dispatch({ type: 'SET_ERROR', payload: '移除自启动应用失败' })
      return false
    }
  }

  // 添加黑名单应用
  const addBlacklistApp = async (modeId: string, app: Omit<BlacklistApp, 'id'>): Promise<BlacklistApp | null> => {
    try {
      const newApp = await window.electronAPI.addBlacklistApp(modeId, app)
      if (newApp) {
        // 重新加载模式数据以更新UI
        await loadModes()
      }
      return newApp
    } catch (error) {
      console.error('Error adding blacklist app:', error)
      dispatch({ type: 'SET_ERROR', payload: '添加黑名单应用失败' })
      return null
    }
  }

  // 更新黑名单应用
  const updateBlacklistApp = async (modeId: string, appId: string, updates: Partial<BlacklistApp>): Promise<boolean> => {
    try {
      const success = await window.electronAPI.updateBlacklistApp(modeId, appId, updates)
      if (success) {
        // 重新加载模式数据以更新UI
        await loadModes()
      }
      return success
    } catch (error) {
      console.error('Error updating blacklist app:', error)
      dispatch({ type: 'SET_ERROR', payload: '更新黑名单应用失败' })
      return false
    }
  }

  // 移除黑名单应用
  const removeBlacklistApp = async (modeId: string, appId: string): Promise<boolean> => {
    try {
      const success = await window.electronAPI.removeBlacklistApp(modeId, appId)
      if (success) {
        // 重新加载模式数据以更新UI
        await loadModes()
      }
      return success
    } catch (error) {
      console.error('Error removing blacklist app:', error)
      dispatch({ type: 'SET_ERROR', payload: '移除黑名单应用失败' })
      return false
    }
  }

  // 获取运行中的进程
  const getRunningProcesses = async (): Promise<string[]> => {
    try {
      return await window.electronAPI.getRunningProcesses()
    } catch (error) {
      console.error('Error getting running processes:', error)
      return []
    }
  }

  // 启动模式
  const startMode = async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // 如果有其他模式在运行，先停止它
      if (state.runningModeId && state.runningModeId !== id) {
        console.log('Stopping current running mode:', state.runningModeId)
        // 这里可以添加实际的停止逻辑
      }
      
      const success = await window.electronAPI.startWorkMode(id)
      if (success) {
        dispatch({ type: 'SET_RUNNING_MODE', payload: id })
      } else {
        dispatch({ type: 'SET_ERROR', payload: '启动工作模式失败' })
      }
      return success
    } catch (error) {
      console.error('Error starting work mode:', error)
      dispatch({ type: 'SET_ERROR', payload: '启动工作模式失败' })
      return false
    }
  }

  // 停止模式
  const stopMode = async (id: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      const success = await window.electronAPI.stopWorkMode(id)
      if (success) {
        dispatch({ type: 'SET_RUNNING_MODE', payload: null })
      } else {
        dispatch({ type: 'SET_ERROR', payload: '停止工作模式失败' })
      }
      return success
    } catch (error) {
      console.error('Error stopping work mode:', error)
      dispatch({ type: 'SET_ERROR', payload: '停止工作模式失败' })
      return false
    }
  }



  // 获取当前选中的模式
  const getSelectedMode = (): WorkMode | null => {
    if (!state.selectedModeId) return null
    return state.modes.find(mode => mode.id === state.selectedModeId) || null
  }

  useEffect(() => {
    loadModes()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue: WorkModeContextType = {
    state,
    dispatch,
    loadModes,
    createMode,
    updateMode,
    deleteMode,
    startMode,
    stopMode,
    selectExecutableFile,
    addAutoStartApp,
    updateAutoStartApp,
    removeAutoStartApp,
    getSelectedMode
  }

  return (
    <WorkModeContext.Provider value={contextValue}>
      {children}
    </WorkModeContext.Provider>
  )
}

// Hook来使用Context
export function useWorkMode() {
  const context = useContext(WorkModeContext)
  if (context === undefined) {
    throw new Error('useWorkMode must be used within a WorkModeProvider')
  }
  return context
}