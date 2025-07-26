import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealTimeTimer } from '../hooks/useRealTimeTimer'

export default function AppTimer() {
  const { realTimeTotalTime, formatDuration } = useRealTimeTimer()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [prevTotalTime, setPrevTotalTime] = useState(realTimeTotalTime)

  // 每秒更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 检测总时间变化以添加动画效果
  useEffect(() => {
    if (realTimeTotalTime !== prevTotalTime) {
      setPrevTotalTime(realTimeTotalTime)
    }
  }, [realTimeTotalTime, prevTotalTime])

  return (
    <motion.div
      className="app-timer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="timer-section">
        <span className="timer-label">总使用时长</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={formatDuration(realTimeTotalTime)}
            className="timer-value"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {formatDuration(realTimeTotalTime)}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="timer-section">
        <span className="timer-label">当前时间</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentTime.getSeconds()}
            className="timer-value"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            {currentTime.toLocaleTimeString('zh-CN', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}