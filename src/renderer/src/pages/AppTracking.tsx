import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faChartLine,
  faExclamationTriangle,
  faStar,
  faDownload,
  faCode,
  faDesktop,
  faFileText,
  faComment,
  faGamepad,
  faPlay,
} from '@fortawesome/free-solid-svg-icons'
import {
  faChrome,
  faFigma,
  faSlack
} from '@fortawesome/free-brands-svg-icons'
import { useAppContext } from '../contexts/AppContext'
import { useRealTimeTimer } from '../hooks/useRealTimeTimer'

import { DayStats } from '../types/electron'
import './AppTracking.css'

interface StatsCardProps {
  title: string
  value: string
  change?: string
  icon: any
  bgColor: string
  delay?: number
}

function StatsCard({ title, value, change, icon, bgColor, delay = 0 }: StatsCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay,
        ease: "easeOut"
      }}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="stats-card"
      style={{
        background: isHovered
          ? `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)`
          : `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)`,
        backdropFilter: isHovered ? 'blur(20px)' : 'blur(15px)',
        borderRadius: '20px',
        border: isHovered
          ? '2px solid rgba(212, 165, 116, 0.4)'
          : '1px solid rgba(240, 238, 237, 0.3)',
        boxShadow: isHovered
          ? '0 25px 50px rgba(212, 165, 116, 0.2), 0 0 40px rgba(212, 165, 116, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
          : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* 多层背景效果 */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(212, 165, 116, 0.1) 60deg, transparent 120deg)`,
          transform: 'rotate(0deg)'
        }}
        animate={{
          transform: isHovered ? 'rotate(360deg)' : 'rotate(0deg)'
        }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* 渐变光束 */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg, transparent 20%, rgba(212, 165, 116, 0.15) 50%, transparent 80%)`,
          transform: 'translateX(-120%)'
        }}
        animate={{
          transform: isHovered ? 'translateX(120%)' : 'translateX(-120%)'
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      {/* 边框光效 */}
      <motion.div
        className="absolute inset-0 rounded-[20px]"
        style={{
          background: 'linear-gradient(45deg, transparent, rgba(212, 165, 116, 0.3), transparent)',
          padding: '1px',
          opacity: 0
        }}
        animate={{
          opacity: isHovered ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full h-full bg-transparent rounded-[19px]" />
      </motion.div>

      {/* 载入时的粒子效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`load-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              background: `radial-gradient(circle, #D4A574, transparent)`,
              left: `${Math.random() * 100}%`,
              top: `${80 + Math.random() * 20}%`, // 从底部开始
            }}
            initial={{
              opacity: 0,
              y: 40,
              scale: 0
            }}
            animate={{
              opacity: [0, 0.6, 0],
              y: -60,
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 0.3,
              delay: delay + i * 0.02,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* hover时的粒子效果 */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`hover-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                background: `radial-gradient(circle, #D4A574, transparent)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                x: [0, Math.random() * 60 - 30, Math.random() * 120 - 60],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}

      {/* 脉冲环效果 */}
      <motion.div
        className="absolute inset-0 rounded-[20px] border-2 border-[#D4A574]"
        style={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? [0, 0.6, 0] : 0,
          scale: isHovered ? [1, 1.1, 1.2] : 1
        }}
        transition={{
          duration: 1.5,
          repeat: isHovered ? Infinity : 0,
          ease: "easeOut"
        }}
      />

      <div className="stats-header relative z-10">
        <motion.p
          className="stats-title"
          animate={{ color: isHovered ? '#D4A574' : '#8B8073' }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.p>
        <motion.div
          className="stats-icon"
          style={{ backgroundColor: bgColor }}
          animate={{
            scale: isHovered ? 1.15 : 1,
            rotate: isHovered ? 10 : 0,
            boxShadow: isHovered
              ? `0 0 20px ${bgColor}40, 0 0 40px ${bgColor}20`
              : '0 2px 8px rgba(0,0,0,0.1)'
          }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
        >
          <FontAwesomeIcon icon={icon} />
        </motion.div>
      </div>
      <motion.p
        className="stats-value relative z-10"
        animate={{
          scale: isHovered ? 1.05 : 1,
          color: isHovered ? '#D4A574' : '#2A2520'
        }}
        transition={{ duration: 0.3 }}
        style={{
          fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 700,
          fontSize: '28px',
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </motion.p>
      {change && (
        <motion.p
          className="stats-change relative z-10"
          animate={{ opacity: isHovered ? 0.8 : 0.6 }}
          transition={{ duration: 0.3 }}
        >
          {change}
        </motion.p>
      )}
    </motion.div>
  )
}

// 获取应用图标
function getAppIcon(appName: string, category?: string) {
  const name = appName.toLowerCase()

  // 特定应用图标
  if (name.includes('chrome')) return faChrome
  if (name.includes('figma')) return faFigma
  if (name.includes('slack')) return faSlack

  // 根据分类返回图标
  switch (category) {
    case '开发工具': return faCode
    case '浏览器': return faDesktop
    case '设计与创意': return faFileText
    case '通讯与社交': return faComment
    case '工作效率': return faFileText
    case '娱乐': return faGamepad
    case '系统工具': return faDesktop
    default: return faDesktop
  }
}

// 获取应用颜色
function getAppColor(appName: string, category?: string): string {
  const name = appName.toLowerCase()

  // 特定应用颜色
  if (name.includes('chrome')) return '#4285F4'
  if (name.includes('figma')) return '#A259FF'
  if (name.includes('slack')) return '#4A154B'
  if (name.includes('code') || name.includes('visual studio')) return '#007ACC'

  // 根据分类返回颜色
  switch (category) {
    case '开发工具': return '#007ACC'
    case '浏览器': return '#4285F4'
    case '设计与创意': return '#A259FF'
    case '通讯与社交': return '#4A154B'
    case '工作效率': return '#000000'
    case '娱乐': return '#FF6B6B'
    case '系统工具': return '#6C757D'
    default: return '#8B8073'
  }
}

// 当前活动应用卡片组件
function CurrentAppCard() {
  const { currentApp, currentAppTotalDuration, formatDuration, isTracking } = useRealTimeTimer()
  const { state: { usageData } } = useAppContext()

  if (!currentApp) return null

  const appData = usageData?.apps[currentApp]

  return (
    <motion.div
      initial={{ opacity: 0, x: -80, scale: 0.9, rotateY: -15 }}
      animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
      transition={{
        duration: 0.3,
        type: "spring",
        stiffness: 150,
        damping: 25,
        delay: 0.3
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
        rotateX: -2,
        transition: { duration: 0.3, type: "spring", stiffness: 400 }
      }}
      className="current-app-card"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.92) 100%)`,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(240, 238, 237, 0.4)',
        borderLeft: '5px solid #D4A574',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.12), 0 5px 15px rgba(212, 165, 116, 0.1)',
        position: 'relative',
        overflow: 'hidden',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 多层背景装饰 */}
      <motion.div
        className="absolute top-0 right-0 w-40 h-40 opacity-15"
        style={{
          background: `conic-gradient(from 45deg, #D4A574 0%, transparent 50%, #D4A574 100%)`,
          transform: 'translate(25%, -25%)'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* 动态光晕 */}
      <motion.div
        className="absolute -top-10 -right-10 w-20 h-20 opacity-20"
        style={{
          background: `radial-gradient(circle, #D4A574 0%, transparent 70%)`,
          filter: 'blur(10px)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* 边框流光效果 */}
      <motion.div
        className="absolute inset-0 rounded-[20px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.4), transparent)',
          transform: 'translateX(-100%)'
        }}
        animate={{
          transform: ['translateX(-100%)', 'translateX(100%)']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeInOut"
        }}
      />

      <div className="current-app-header relative z-10">
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#2A2520',
            fontSize: '18px',
            fontWeight: 600
          }}
        >
          <motion.div
            animate={{ rotate: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
          >
            <FontAwesomeIcon icon={faPlay} style={{ color: '#D4A574' }} />
          </motion.div>
          当前活动应用
        </motion.h3>
        {isTracking && (
          <div className="relative">
            <motion.div
              className="tracking-indicator"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#4CAF50',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(76, 175, 80, 0.4)'
              }}
            />
          </div>
        )}
      </div>
      <motion.div
        className="current-app-info relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.25 }}
      >
        <motion.div
          className="app-icon"
          style={{ backgroundColor: getAppColor(currentApp, appData?.category) }}
          whileHover={{
            scale: 1.1,
            rotate: [0, -5, 5, 0],
            boxShadow: `0 0 20px ${getAppColor(currentApp, appData?.category)}40`
          }}
          transition={{ duration: 0.3 }}
        >
          <FontAwesomeIcon icon={getAppIcon(currentApp, appData?.category)} />
        </motion.div>
        <div className="app-details">
          <motion.span
            className="app-name"
            whileHover={{ color: '#D4A574' }}
            transition={{ duration: 0.2 }}
          >
            {currentApp}
          </motion.span>
          <span
            className="total-time"
            style={{
              fontFamily: '"SF Mono", "Monaco", monospace',
              fontWeight: 700,
              fontSize: '24px',
              letterSpacing: '1px'
            }}
          >
            {formatDuration(currentAppTotalDuration)}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AppTracking() {
  const {
    state: { usageData, loading },
    formatDuration,
    getEfficiencyStats,
    getTopApps
  } = useAppContext()

  const { realTimeTotalTime, currentApp: realtimeCurrentApp, currentAppTotalDuration } = useRealTimeTimer()
  const [isWorkModeActive, setIsWorkModeActive] = useState(false)

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

  // 检查工作模式状态
  useEffect(() => {
    const checkWorkModeStatus = async () => {
      try {
        const isActive = await (window as any).electronAPI.getWorkModeActive()
        setIsWorkModeActive(isActive)
      } catch (error) {
        console.error('Error checking work mode status:', error)
      }
    }

    checkWorkModeStatus()
    // 每5秒检查一次状态
    const interval = setInterval(checkWorkModeStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // 计算实时统计数据
  const getRealTimeStats = () => {
    if (!usageData) return null

    // 创建包含当前应用实时时间的应用数据
    const realTimeApps = { ...usageData.apps }
    if (realtimeCurrentApp && currentAppTotalDuration > 0) {
      realTimeApps[realtimeCurrentApp] = {
        ...realTimeApps[realtimeCurrentApp],
        name: realtimeCurrentApp,
        title: realTimeApps[realtimeCurrentApp]?.title || '',
        duration: currentAppTotalDuration,
        launches: realTimeApps[realtimeCurrentApp]?.launches || 1,
        lastActive: Date.now(),
        category: realTimeApps[realtimeCurrentApp]?.category
      }
    }

    // 计算实时总时间
    const calculatedTotalTime = usageData.totalTime + (realtimeCurrentApp && currentAppTotalDuration > 0 ?
      currentAppTotalDuration - (usageData.apps[realtimeCurrentApp]?.duration || 0) : 0)

    // 计算实时工作模式时间
    let realTimeWorkModeTime = usageData.workModeTime || 0

    // 如果工作模式当前激活，并且有当前应用时间，需要加上增量
    if (isWorkModeActive && realtimeCurrentApp && currentAppTotalDuration > 0) {
      const savedAppDuration = usageData.apps[realtimeCurrentApp]?.duration || 0
      const currentAppIncrement = currentAppTotalDuration - savedAppDuration
      realTimeWorkModeTime += currentAppIncrement
    }

    // 创建实时的使用数据，包含工作模式时间
    const realTimeUsageData = {
      ...usageData,
      apps: realTimeApps,
      totalTime: calculatedTotalTime,
      workModeTime: realTimeWorkModeTime
    }

    // 添加调试日志
    console.log('Real-time stats calculation:', {
      isWorkModeActive,
      savedWorkModeTime: usageData.workModeTime,
      realTimeWorkModeTime,
      savedTotalTime: usageData.totalTime,
      calculatedTotalTime,
      currentApp: realtimeCurrentApp,
      currentAppDuration: currentAppTotalDuration
    })

    return getEfficiencyStats(realTimeApps, realTimeUsageData)
  }

  const stats = getRealTimeStats()
  const topApps = usageData ? getTopApps(usageData.apps, realTimeTotalTime) : []

  // 生成时间轴数据
  const getTimelineData = (timeline: DayStats['timeline']) => {
    if (!timeline || timeline.length === 0) return []

    const timelineMap = new Map<string, Array<{ start: number; end: number }>>()

    // 按应用分组时间段
    for (let i = 0; i < timeline.length - 1; i++) {
      const current = timeline[i]
      const next = timeline[i + 1]

      if (!timelineMap.has(current.app)) {
        timelineMap.set(current.app, [])
      }

      timelineMap.get(current.app)!.push({
        start: current.timestamp,
        end: next.timestamp
      })
    }

    // 转换为百分比位置
    const dayStart = new Date().setHours(0, 0, 0, 0)
    const dayEnd = new Date().setHours(23, 59, 59, 999)
    const dayDuration = dayEnd - dayStart

    const result: Array<{
      app: string
      segments: Array<{ left: number; width: number }>
    }> = []

    timelineMap.forEach((segments, app) => {
      const appSegments = segments.map(segment => ({
        left: ((segment.start - dayStart) / dayDuration) * 100,
        width: ((segment.end - segment.start) / dayDuration) * 100
      }))

      result.push({ app, segments: appSegments })
    })

    return result
  }

  const timelineData = usageData ? getTimelineData(usageData.timeline) : []

  if (loading) {
    return (
      <div className="app-tracking">
        <div className="mouse-follow-bg" />
        <div className="main-content">
          <motion.div
            className="loading-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
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
              transition={{ delay: 0.15, duration: 0.25 }}
            >
              正在加载应用使用数据...
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
      </div>
    )
  }
  return (
    <div className="app-tracking">
      {/* 鼠标跟随背景 */}
      <div className="mouse-follow-bg" />

      {/* 动画背景 */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      >
        {/* 浮动粒子 - 减少数量和动画强度 */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#D4A574] rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}


      </motion.div>


      <div className="main-content">
        {/* 导出按钮 */}
        <div className="content-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1>应用追踪</h1>
            {isWorkModeActive && (
              <motion.div
                className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{
                  background: 'linear-gradient(45deg, #10B981, #06B6D4)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(16, 185, 129, 0.4)',
                    '0 0 0 8px rgba(16, 185, 129, 0)',
                    '0 0 0 0 rgba(16, 185, 129, 0)'
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                工作模式已激活
              </motion.div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="export-button"
              onClick={async () => {
                try {
                  const result = await (window as any).electronAPI.openWindowsExplorer()
                  if (result) {
                    console.log('Windows 资源管理器启动成功')
                  } else {
                    console.error('Windows 资源管理器启动失败')
                  }
                } catch (error) {
                  console.error('启动 Windows 资源管理器时出错:', error)
                }
              }}
            >
              <span>打开资源管理器</span>
              <FontAwesomeIcon icon={faDesktop} />
            </button>
            <button className="export-button">
              <span>导出报告</span>
              <FontAwesomeIcon icon={faDownload} />
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="stats-grid">
          <StatsCard
            title="总使用时长"
            value={formatDuration(realTimeTotalTime)}
            icon={faClock}
            bgColor="#F5E8D3"
            delay={0.1}
          />
          <StatsCard
            title="高效时长"
            value={stats ? formatDuration(stats.productiveTime) : '00:00:00'}
            icon={faChartLine}
            bgColor="#E5F0E0"
            delay={0.2}
          />
          <StatsCard
            title="分心时长"
            value={stats ? formatDuration(stats.distractingTime) : '00:00:00'}
            icon={faExclamationTriangle}
            bgColor="#F7E5DE"
            delay={0.3}
          />
          <StatsCard
            title="效率得分"
            value={stats ? `${stats.efficiencyScore}%` : '0%'}
            icon={faStar}
            bgColor="#F5E8D3"
            delay={0.4}
          />
        </div>

        {/* 当前活动应用 */}
        <CurrentAppCard />

        {/* 现代化应用使用统计 */}
        <motion.div
          className="modern-chart-container"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <motion.h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#2A2520',
              margin: '0 0 32px 0',
              textAlign: 'center'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            应用使用统计
          </motion.h2>

          <div className="modern-chart-bars">
            {topApps.slice(0, 5).map((app, index) => {
              const maxHeight = 240
              const height = topApps.length > 0 ? (app.duration / topApps[0].duration) * maxHeight : 0
              const appColor = getAppColor(app.name, app.category)

              return (
                <motion.div
                  key={index}
                  className="modern-chart-bar"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <motion.div
                    className="modern-bar"
                    style={{
                      '--bar-color': appColor,
                      '--bar-color-dark': `${appColor}DD`,
                      transformOrigin: 'bottom'
                    } as any}
                    initial={{
                      height: 0,
                      scaleY: 0
                    }}
                    animate={{
                      height: `${height}px`,
                      scaleY: 1
                    }}
                    transition={{
                      height: {
                        duration: 1.2,
                        delay: index * 0.15 + 0.3,
                        ease: [0.23, 1, 0.32, 1]
                      },
                      scaleY: {
                        duration: 1.2,
                        delay: index * 0.15 + 0.3,
                        ease: [0.23, 1, 0.32, 1]
                      }
                    }}
                  >
                    <motion.div
                      className="modern-bar-value"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05 + 0.4,
                        duration: 0.2,
                        ease: "easeOut"
                      }}
                    >
                      {formatDuration(app.duration)}
                    </motion.div>
                  </motion.div>

                  <motion.div
                    className="modern-bar-label"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.05 + 0.3,
                      duration: 0.2,
                      ease: "easeOut"
                    }}
                  >
                    {app.name}
                  </motion.div>
                </motion.div>
              )
            })}
          </div>

          {/* 现代化应用列表 */}
          <div className="modern-app-list">
            <div className="modern-list-header">
              <div>应用名称</div>
              <div>使用时长</div>
              <div>启动次数</div>
              <div>分类</div>
            </div>
            {topApps.map((app, index) => (
              <motion.div
                key={index}
                className="modern-app-row"
                style={{
                  '--app-color': getAppColor(app.name, app.category)
                } as any}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.02 + 0.5,
                  type: "spring",
                  stiffness: 120
                }}
              >
                <div className="modern-app-info">
                  <motion.div
                    className="modern-app-icon"
                    style={{ backgroundColor: getAppColor(app.name, app.category) }}
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <FontAwesomeIcon icon={getAppIcon(app.name, app.category)} />
                  </motion.div>
                  <div className="modern-app-name">{app.name}</div>
                </div>
                <div className="modern-col-time">{formatDuration(app.duration)}</div>
                <div className="modern-col-launches">{app.launches}</div>
                <div>
                  <span className="modern-category-tag">{app.category || '其他'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 活动时间轴 */}
        <motion.div
          className="timeline-card glass-card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2>活动时间轴</h2>
          <div className="timeline-header">
            <div className="time-labels">
              <span>0:00</span>
              <span>2:00</span>
              <span>4:00</span>
              <span>6:00</span>
              <span>8:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>16:00</span>
              <span>18:00</span>
              <span>20:00</span>
              <span>22:00</span>
              <span>24:00</span>
            </div>
            <div className="timeline-track"></div>
          </div>

          <div className="timeline-apps">
            {timelineData.map((item, index) => {
              const appData = usageData?.apps[item.app]
              const color = getAppColor(item.app, appData?.category)
              return (
                <motion.div
                  key={index}
                  className="timeline-row"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.03,
                    type: "spring",
                    stiffness: 80
                  }}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: 'rgba(212, 165, 116, 0.05)',
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.div
                    className="timeline-app-icon"
                    style={{ backgroundColor: color }}
                    whileHover={{
                      scale: 1.1,
                      rotate: 360,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <FontAwesomeIcon icon={getAppIcon(item.app, appData?.category)} />
                  </motion.div>
                  <span className="timeline-app-name">{item.app}</span>
                  <div className="timeline-segments">
                    {item.segments.map((segment, segIndex) => (
                      <motion.div
                        key={segIndex}
                        className="timeline-segment"
                        style={{
                          left: `${segment.left}%`,
                          width: `${segment.width}%`,
                          backgroundColor: color
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.03 + segIndex * 0.03,
                          ease: "easeOut"
                        }}
                        whileHover={{
                          scaleY: 1.2,
                          boxShadow: `0 4px 12px ${color}40`,
                          transition: { duration: 0.2 }
                        }}
                      ></motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="timeline-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#007ACC' }}></div>
              <span>开发工具</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#4285F4' }}></div>
              <span>浏览器</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#A259FF' }}></div>
              <span>设计与创意</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#4A154B' }}></div>
              <span>通讯与社交</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#000000' }}></div>
              <span>工作效率</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
