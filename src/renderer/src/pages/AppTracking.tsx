import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faClock,
  faChartLine,
  faExclamationTriangle,
  faStar,
  faCalendarDays,
  faDownload,
  faCode,
  faDesktop,
  faFileText,
  faComment,
  faEnvelope,
  faBell,
  faGamepad
} from '@fortawesome/free-solid-svg-icons'
import {
  faChrome,
  faFigma,
  faSlack
} from '@fortawesome/free-brands-svg-icons'
import { useAppContext } from '../contexts/AppContext'
import { useRealTimeTimer } from '../hooks/useRealTimeTimer'
import DateFilter from '../components/DateFilter'
import { DayStats } from '../types/electron'
import './AppTracking.css'

interface StatsCardProps {
  title: string
  value: string
  change?: string
  icon: any
  bgColor: string
}

function StatsCard({ title, value, change, icon, bgColor }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="stats-header">
        <p className="stats-title">{title}</p>
        <div className="stats-icon" style={{ backgroundColor: bgColor }}>
          <FontAwesomeIcon icon={icon} />
        </div>
      </div>
      <p className="stats-value">{value}</p>
      {change && <p className="stats-change">{change}</p>}
    </div>
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
    <div className="current-app-card">
      <div className="current-app-header">
        <h3>当前活动应用</h3>
        {isTracking && <div className="tracking-indicator"></div>}
      </div>
      <div className="current-app-info">
        <div className="app-icon" style={{ backgroundColor: getAppColor(currentApp, appData?.category) }}>
          <FontAwesomeIcon icon={getAppIcon(currentApp, appData?.category)} />
        </div>
        <div className="app-details">
          <span className="app-name">{currentApp}</span>
          <span className="total-time">{formatDuration(currentAppTotalDuration)}</span>
        </div>
      </div>
    </div>
  )
}

export default function AppTracking() {
  const {
    state: { usageData, currentApp, loading },
    formatDuration,
    getEfficiencyStats,
    getTopApps,
    fetchUsageData
  } = useAppContext()

  const { realTimeTotalTime, currentApp: realtimeCurrentApp, currentAppTotalDuration } = useRealTimeTimer()

  const [selectedDate, setSelectedDate] = useState<string>()

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

    return getEfficiencyStats(realTimeApps)
  }

  const stats = getRealTimeStats()
  const topApps = usageData ? getTopApps(usageData.apps) : []

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

  // 处理日期选择
  const handleDateChange = (date?: string) => {
    setSelectedDate(date)
    fetchUsageData(date)
  }

  if (loading) {
    return (
      <div className="app-tracking">
        <div className="main-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">加载应用使用数据...</p>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="app-tracking">
      <div className="main-content">
        {/* 时间范围选择和导出按钮 */}
        <div className="content-header">
          <DateFilter
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
          <button className="export-button">
            <span>导出报告</span>
            <FontAwesomeIcon icon={faDownload} />
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="stats-grid">
          <StatsCard
            title="总使用时长"
            value={formatDuration(realTimeTotalTime)}
            icon={faClock}
            bgColor="#F5E8D3"
          />
          <StatsCard
            title="高效时长"
            value={stats ? formatDuration(stats.productiveTime) : '00:00:00'}
            icon={faChartLine}
            bgColor="#E5F0E0"
          />
          <StatsCard
            title="分心时长"
            value={stats ? formatDuration(stats.distractingTime) : '00:00:00'}
            icon={faExclamationTriangle}
            bgColor="#F7E5DE"
          />
          <StatsCard
            title="效率得分"
            value={stats ? `${stats.efficiencyScore}%` : '0%'}
            icon={faStar}
            bgColor="#F5E8D3"
          />
        </div>

        {/* 当前活动应用 */}
        <CurrentAppCard />

        {/* 应用使用统计 */}
        <div className="usage-chart-card">
          <h2>应用使用统计</h2>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {topApps.slice(0, 5).map((app, index) => {
                const maxHeight = 200
                const height = topApps.length > 0 ? (app.duration / topApps[0].duration) * maxHeight : 0
                return (
                  <div key={index} className="chart-bar" style={{ height: `${height}px` }}>
                    <div className="bar" style={{ backgroundColor: getAppColor(app.name, app.category) }}></div>
                    <span className="bar-value">{formatDuration(app.duration)}</span>
                    <span className="bar-label">{app.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 应用列表 */}
          <div className="app-list">
            <div className="list-header">
              <div className="col-app">应用名称</div>
              <div className="col-time">使用时长</div>
              <div className="col-launches">启动次数</div>
              <div className="col-category">分类</div>
            </div>
            {topApps.map((app, index) => (
              <div key={index} className={`app-row ${index === 0 ? 'selected' : ''}`}>
                <div className="col-app">
                  <div className="app-info">
                    <div className="app-icon" style={{ backgroundColor: getAppColor(app.name, app.category) }}>
                      <FontAwesomeIcon icon={getAppIcon(app.name, app.category)} />
                    </div>
                    <span>{app.name}</span>
                  </div>
                </div>
                <div className="col-time">{formatDuration(app.duration)}</div>
                <div className="col-launches">{app.launches}</div>
                <div className="col-category">
                  <span className="category-tag">{app.category || '其他'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 活动时间轴 */}
        <div className="timeline-card">
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
                <div key={index} className="timeline-row">
                  <div className="timeline-app-icon" style={{ backgroundColor: color }}>
                    <FontAwesomeIcon icon={getAppIcon(item.app, appData?.category)} />
                  </div>
                  <span className="timeline-app-name">{item.app}</span>
                  <div className="timeline-segments">
                    {item.segments.map((segment, segIndex) => (
                      <div
                        key={segIndex}
                        className="timeline-segment"
                        style={{
                          left: `${segment.left}%`,
                          width: `${segment.width}%`,
                          backgroundColor: color
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
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
        </div>
      </div>
    </div>
  )
}
