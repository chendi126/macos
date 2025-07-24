import { useState, useEffect } from 'react'
import { useRealTimeTimer } from '../hooks/useRealTimeTimer'

export default function AppTimer() {
  const { realTimeTotalTime, formatDuration } = useRealTimeTimer()
  const [currentTime, setCurrentTime] = useState(new Date())

  // 每秒更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="app-timer">
      <div className="timer-section">
        <span className="timer-label">总使用时长</span>
        <span className="timer-value">{formatDuration(realTimeTotalTime)}</span>
      </div>
      <div className="timer-section">
        <span className="timer-label">当前时间</span>
        <span className="timer-value">
          {currentTime.toLocaleTimeString('zh-CN', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
      </div>
    </div>
  )
}