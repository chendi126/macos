import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { DayStats, TodayStats, AppUsageData } from '../types/electron'

// 状态类型定义
interface AppState {
  todayStats: TodayStats | null
  usageData: DayStats | null
  currentApp: string | null
  loading: boolean
  selectedDate: string | null
}

// Action类型定义
type AppAction = 
  | { type: 'SET_TODAY_STATS'; payload: TodayStats }
  | { type: 'SET_USAGE_DATA'; payload: DayStats | null }
  | { type: 'SET_CURRENT_APP'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SELECTED_DATE'; payload: string | null }
  | { type: 'UPDATE_APP_USAGE'; payload: { currentApp: string; todayStats: TodayStats } }
  | { type: 'INCREMENTAL_UPDATE'; payload: { 
      appName: string; 
      appData: AppUsageData & { durationDelta: number }; 
      currentApp: string; 
      totalTimeDelta: number;
      workModeTimeDelta?: number;
    } }

// 初始状态
const initialState: AppState = {
  todayStats: null,
  usageData: null,
  currentApp: null,
  loading: true,
  selectedDate: null
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TODAY_STATS':
      return { ...state, todayStats: action.payload }
    case 'SET_USAGE_DATA':
      return { ...state, usageData: action.payload, loading: false }
    case 'SET_CURRENT_APP':
      return { ...state, currentApp: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload }
    case 'UPDATE_APP_USAGE':
      return { 
        ...state, 
        currentApp: action.payload.currentApp,
        todayStats: action.payload.todayStats
      }
    case 'INCREMENTAL_UPDATE':
      // 增量更新当前数据，避免重新获取整个数据集
      if (!state.usageData || state.selectedDate) return state // 只更新今天的数据
      
      const updatedApps = {
        ...state.usageData.apps,
        [action.payload.appName]: {
          ...action.payload.appData,
          duration: action.payload.appData.duration // 使用绝对值，不是增量
        }
      }
      
      return {
        ...state,
        currentApp: action.payload.currentApp,
        usageData: {
          ...state.usageData,
          apps: updatedApps,
          totalTime: state.usageData.totalTime + action.payload.totalTimeDelta,
          workModeTime: (state.usageData.workModeTime || 0) + (action.payload.workModeTimeDelta || 0)
        }
      }
    default:
      return state
  }
}

// Context类型定义
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // 辅助函数
  formatDuration: (milliseconds: number) => string
  getEfficiencyStats: (apps: { [key: string]: AppUsageData }, usageData?: any) => {
    totalTime: number
    productiveTime: number
    distractingTime: number
    neutralTime: number
    efficiencyScore: number
  }
  getTopApps: (apps: { [key: string]: AppUsageData }, limit?: number) => Array<AppUsageData & { formattedDuration: string; percentage: number }>
  fetchUsageData: (date?: string) => Promise<void>
  fetchTodayStats: () => Promise<void>
  fetchCurrentApp: () => Promise<void>
}

// 创建Context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider组件
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 格式化时间显示为HH:MM:SS格式
  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // 计算效率统计
  const getEfficiencyStats = (apps: { [key: string]: AppUsageData }, usageData?: any) => {
    const productiveCategories = ['开发工具', '工作效率', '设计与创意']
    const distractingCategories = ['娱乐', '通讯与社交']
    
    let productiveTime = 0
    let distractingTime = 0
    let totalTime = 0

    // 计算各应用的时间分类
    Object.values(apps).forEach(app => {
      totalTime += app.duration
      if (productiveCategories.includes(app.category || '')) {
        productiveTime += app.duration
      } else if (distractingCategories.includes(app.category || '')) {
        distractingTime += app.duration
      }
    })

    // 如果有工作模式时间数据，采用简化逻辑：
    // 工作模式时间直接替换为高效时间
    if (usageData && usageData.workModeTime > 0) {
      // 计算非工作模式时间
      const nonWorkModeTime = totalTime - usageData.workModeTime
      
      // 重新分配时间：工作模式时间全部为高效时间
      productiveTime = usageData.workModeTime
      
      // 非工作模式时间按原有逻辑分配
      let nonWorkModeProductiveTime = 0
      let nonWorkModeDistractingTime = 0
      
      Object.values(apps).forEach(app => {
        // 这里简化处理，假设应用时间均匀分布在工作模式和非工作模式中
        const appNonWorkModeTime = nonWorkModeTime > 0 ? 
          app.duration * (nonWorkModeTime / totalTime) : 0
          
        if (productiveCategories.includes(app.category || '')) {
          nonWorkModeProductiveTime += appNonWorkModeTime
        } else if (distractingCategories.includes(app.category || '')) {
          nonWorkModeDistractingTime += appNonWorkModeTime
        }
      })
      
      productiveTime += nonWorkModeProductiveTime
      distractingTime = nonWorkModeDistractingTime
    }

    const neutralTime = totalTime - productiveTime - distractingTime
    const efficiencyScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0

    return {
      totalTime,
      productiveTime,
      distractingTime,
      neutralTime,
      efficiencyScore
    }
  }

  // 获取应用排行
  const getTopApps = (apps: { [key: string]: AppUsageData }, totalTime?: number, limit = 5) => {
    // 如果没有提供totalTime，则计算它（向后兼容）
    const calculatedTotalTime = totalTime ?? Object.values(apps).reduce((sum, app) => sum + app.duration, 0)
    
    return Object.values(apps)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(app => ({
        ...app,
        formattedDuration: formatDuration(app.duration),
        percentage: calculatedTotalTime > 0 ? Math.round((app.duration / calculatedTotalTime) * 100) : 0
      }))
  }

  // 获取使用数据（仅用于AppTracking，始终获取今天的数据）
  const fetchUsageData = async (date?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      // AppTracking始终显示今天的数据，忽略date参数
      const data = await window.electronAPI.getAppUsageData()
      dispatch({ type: 'SET_USAGE_DATA', payload: data })
      dispatch({ type: 'SET_SELECTED_DATE', payload: null })
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 获取今日统计数据
  const fetchTodayStats = async () => {
    try {
      const stats = await window.electronAPI.getTodayStats()
      dispatch({ type: 'SET_TODAY_STATS', payload: stats })
    } catch (error) {
      console.error('Error fetching today stats:', error)
    }
  }

  // 获取当前活动应用
  const fetchCurrentApp = async () => {
    try {
      const app = await window.electronAPI.getCurrentApp()
      dispatch({ type: 'SET_CURRENT_APP', payload: app })
    } catch (error) {
      console.error('Error fetching current app:', error)
    }
  }

  useEffect(() => {
    // 初始加载数据
    fetchTodayStats()
    fetchUsageData()
    fetchCurrentApp()

    // 监听实时增量更新
    window.electronAPI.onAppUsageIncrementalUpdate((data) => {
      // 只在应用切换时更新Context，实时计时由useRealTimeTimer处理
      dispatch({ type: 'INCREMENTAL_UPDATE', payload: data })
    })

    return () => {
      window.electronAPI.removeAppUsageListener()
    }
  }, [])

  const contextValue: AppContextType = {
    state,
    dispatch,
    formatDuration,
    getEfficiencyStats,
    getTopApps,
    fetchUsageData,
    fetchTodayStats,
    fetchCurrentApp
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

// Hook来使用Context
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}