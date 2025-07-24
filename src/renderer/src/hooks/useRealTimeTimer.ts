import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppContext } from '../contexts/AppContext'

interface TimerState {
  currentApp: string | null
  currentAppStartTime: number
  baseAppDuration: number // 应用的基础时长（不包括当前会话）
  baseTotalTime: number   // 总的基础时长（不包括当前会话）
  lastSyncTime: number    // 上次同步时间
}

export const useRealTimeTimer = () => {
  const { state: { currentApp, usageData }, formatDuration } = useAppContext()
  const [timerState, setTimerState] = useState<TimerState>({
    currentApp: null,
    currentAppStartTime: 0,
    baseAppDuration: 0,
    baseTotalTime: 0,
    lastSyncTime: 0
  })
  const [currentTime, setCurrentTime] = useState(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 计算当前应用的实时时长
  const getCurrentAppDuration = useCallback(() => {
    if (!timerState.currentApp || timerState.currentAppStartTime === 0) {
      return 0
    }
    return currentTime - timerState.currentAppStartTime
  }, [timerState.currentApp, timerState.currentAppStartTime, currentTime])

  // 计算当前应用的总时长（基础 + 当前会话）
  const getCurrentAppTotalDuration = useCallback(() => {
    return timerState.baseAppDuration + getCurrentAppDuration()
  }, [timerState.baseAppDuration, getCurrentAppDuration])

  // 计算实时总时长
  const getRealTimeTotalTime = useCallback(() => {
    return timerState.baseTotalTime + getCurrentAppDuration()
  }, [timerState.baseTotalTime, getCurrentAppDuration])

  // 同步状态到最新数据
  const syncTimerState = useCallback(async () => {
    try {
      const [currentAppName, startTime] = await Promise.all([
        window.electronAPI.getCurrentApp(),
        window.electronAPI.getCurrentAppStartTime()
      ])

      const now = Date.now()
      
      setTimerState(prev => {
        // 如果应用切换了，需要重新计算基础时长
        if (prev.currentApp !== currentAppName) {
          const currentAppData = usageData?.apps[currentAppName || '']
          const baseAppDuration = currentAppData?.duration || 0
          const baseTotalTime = usageData?.totalTime || 0

          return {
            currentApp: currentAppName,
            currentAppStartTime: startTime,
            baseAppDuration,
            baseTotalTime,
            lastSyncTime: now
          }
        }

        // 应用没有切换，只更新开始时间（可能是重新启动）
        return {
          ...prev,
          currentAppStartTime: startTime,
          lastSyncTime: now
        }
      })
    } catch (error) {
      console.error('Error syncing timer state:', error)
    }
  }, [usageData])

  // 启动实时计时器
  useEffect(() => {
    // 立即同步一次状态
    syncTimerState()

    // 启动高频率的时间更新（每100ms更新一次，更丝滑）
    intervalRef.current = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100)

    // 定期同步状态（每5秒同步一次）
    const syncInterval = setInterval(syncTimerState, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      clearInterval(syncInterval)
    }
  }, [syncTimerState])

  // 当usageData变化时，更新基础时长
  useEffect(() => {
    if (usageData && timerState.currentApp) {
      const currentAppData = usageData.apps[timerState.currentApp]
      const baseAppDuration = currentAppData?.duration || 0
      const baseTotalTime = usageData.totalTime || 0

      setTimerState(prev => ({
        ...prev,
        baseAppDuration,
        baseTotalTime
      }))
    }
  }, [usageData, timerState.currentApp])

  // 页面可见性变化时立即同步
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncTimerState()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', syncTimerState)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', syncTimerState)
    }
  }, [syncTimerState])

  return {
    currentApp: timerState.currentApp,
    currentAppTotalDuration: getCurrentAppTotalDuration(),
    realTimeTotalTime: getRealTimeTotalTime(),
    formatDuration,
    isTracking: timerState.currentApp !== null && timerState.currentAppStartTime > 0
  }
}