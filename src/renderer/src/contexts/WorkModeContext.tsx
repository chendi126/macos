import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { WorkMode } from '../types/electron'

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
  addAppToMode: (modeId: string, appPath: string, appName?: string) => Promise<any>
  removeAppFromMode: (modeId: string, appId: string) => Promise<boolean>
  startMode: (id: string) => Promise<boolean>
  stopMode: (id: string) => Promise<boolean>
  selectAppFile: () => Promise<string | null>
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

  // 添加应用到模式 (暂时返回null，因为简化版本没有应用管理)
  const addAppToMode = async (modeId: string, appPath: string, appName?: string): Promise<any> => {
    console.log('Add app to mode:', modeId, appPath, appName)
    return null
  }

  // 从模式中移除应用 (暂时返回true，因为简化版本没有应用管理)
  const removeAppFromMode = async (modeId: string, appId: string): Promise<boolean> => {
    console.log('Remove app from mode:', modeId, appId)
    return true
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

  // 选择应用文件 (暂时返回null)
  const selectAppFile = async (): Promise<string | null> => {
    console.log('Select app file')
    return null
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
    addAppToMode,
    removeAppFromMode,
    startMode,
    stopMode,
    selectAppFile,
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