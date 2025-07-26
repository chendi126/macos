import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartLine,
  faClock,
  faExclamationTriangle,
  faStar,
  faCalendarDays,
  faCheck,
  faClipboardList,
  faCog,
  faCode,
  faDesktop,
  faFileText,
  faComment,
  faGamepad
} from '@fortawesome/free-solid-svg-icons'
import {
  faChrome,
  faFigma,
  faSlack
} from '@fortawesome/free-brands-svg-icons'
import { DayStats, AppUsageData } from '../types/electron'
import DailySummarySection from '../components/DailySummarySection'
import '../components/DailySummarySection.css'
import './TimeAnalysis.css'

interface StatsCardProps {
  title: string
  value: string
  change: string
  icon: any
  bgColor: string
}

function StatsCard({ title, value, change, icon, bgColor }: StatsCardProps) {
  return (
    <motion.div
      className="stats-card"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{
        y: -8,
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(212, 165, 116, 0.15)",
        transition: { duration: 0.2, ease: "easeOut" }
      }}
    >
      <div className="stats-header">
        <motion.p
          className="stats-title"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {title}
        </motion.p>
        <motion.div
          className="stats-icon"
          style={{ backgroundColor: bgColor }}
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          whileHover={{ rotate: 360, scale: 1.1 }}
        >
          <FontAwesomeIcon icon={icon} />
        </motion.div>
      </div>
      <motion.p
        className="stats-value"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {value}
      </motion.p>
      <motion.p
        className="stats-change"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {change}
      </motion.p>
    </motion.div>
  )
}

interface ChartPlaceholderProps {
  type: 'pie' | 'bar' | 'line'
  data: any[]
}

function ChartPlaceholder({ type }: ChartPlaceholderProps) {
  if (type === 'pie') {
    return (
      <div className="chart-container">
        <div className="pie-chart">
          <div className="pie-center">
            <span>效率分布</span>
          </div>
          <div className="pie-segments">
            <div className="pie-segment high-efficiency" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
            <div className="pie-segment medium-efficiency" style={{ clipPath: 'polygon(50% 50%, 85% 100%, 50% 100%)' }}></div>
            <div className="pie-segment low-efficiency" style={{ clipPath: 'polygon(50% 50%, 15% 100%, 85% 100%)' }}></div>
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot high"></div>
            <span>高效工作 (65%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot medium"></div>
            <span>中性使用 (25%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot low"></div>
            <span>分心使用 (10%)</span>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'bar') {
    return (
      <div className="chart-container">
        <div className="bar-chart">
          {['VS Code', 'Chrome', 'Figma', 'Slack', 'Notion'].map((app, index) => (
            <div key={app} className="bar-item">
              <div className="bar" style={{ height: `${(5 - index) * 30}px` }}>
                <span className="bar-value">{152 - index * 20}m</span>
              </div>
              <span className="bar-label">{app}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'line') {
    return (
      <div className="chart-container">
        <div className="line-chart">
          <svg width="100%" height="200" viewBox="0 0 800 200">
            {/* 总使用时长 */}
            <polyline
              fill="none"
              stroke="#D4A574"
              strokeWidth="2"
              points="50,150 150,120 250,130 350,110 450,125 550,160 650,170"
            />
            {/* 高效时长 */}
            <polyline
              fill="none"
              stroke="#7A9B6C"
              strokeWidth="2"
              points="50,160 150,140 250,150 350,120 450,145 550,180 650,190"
            />
            {/* 分心时长 */}
            <polyline
              fill="none"
              stroke="#D97B5A"
              strokeWidth="2"
              points="50,180 150,170 250,175 350,185 450,180 550,190 650,180"
            />
          </svg>
          <div className="chart-labels">
            <span>周一</span>
            <span>周二</span>
            <span>周三</span>
            <span>周四</span>
            <span>周五</span>
            <span>周六</span>
            <span>周日</span>
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-line total"></div>
            <span>总使用时长</span>
          </div>
          <div className="legend-item">
            <div className="legend-line efficient"></div>
            <span>高效时长</span>
          </div>
          <div className="legend-item">
            <div className="legend-line distracted"></div>
            <span>分心时长</span>
          </div>
        </div>
      </div>
    )
  }

  return null
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

export default function TimeAnalysis() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [analysisData, setAnalysisData] = useState<DayStats | null>(null)
  const [loading, setLoading] = useState(false)

  // 格式化时间显示为HH:MM:SS格式
  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // 计算效率统计
  const getEfficiencyStats = (apps: { [key: string]: AppUsageData }, workModeTime: number) => {
    const distractingCategories = ['娱乐', '通讯与社交']

    let distractingTime = 0
    let totalTime = 0

    Object.values(apps).forEach(app => {
      totalTime += app.duration
      if (distractingCategories.includes(app.category || '')) {
        distractingTime += app.duration
      }
    })

    // 只有工作模式时间算作高效时间
    const productiveTime = workModeTime
    const neutralTime = totalTime - productiveTime - distractingTime
    const efficiencyScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0

    return {
      totalTime,
      productiveTime, // 只包含工作模式时间
      distractingTime,
      neutralTime,
      efficiencyScore,
      workModeTime // 工作模式时间
    }
  }

  // 获取应用排行
  const getTopApps = (apps: { [key: string]: AppUsageData }, dayTotalTime: number, limit = 5) => {
    return Object.values(apps)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(app => ({
        ...app,
        formattedDuration: formatDuration(app.duration),
        percentage: dayTotalTime > 0 ? Math.round((app.duration / dayTotalTime) * 100) : 0
      }))
  }

  // 获取历史分析数据（独立于AppContext）
  const fetchAnalysisData = async (date?: string) => {
    try {
      setLoading(true)
      const data = await window.electronAPI.getAppUsageData(date)
      setAnalysisData(data)
    } catch (error) {
      console.error('Error fetching analysis data:', error)
      setAnalysisData(null)
    } finally {
      setLoading(false)
    }
  }

  // 处理日期选择
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value
    setSelectedDate(date)
    fetchAnalysisData(date)
  }

  // 初始化时加载今天的数据
  useEffect(() => {
    fetchAnalysisData()
  }, [])

  // 使用AppTracker计算好的总时间，而不是重新计算
  const totalTime = analysisData ? analysisData.totalTime : 0
  const workModeTime = analysisData ? analysisData.workModeTime : 0

  // 计算统计数据
  const stats = analysisData ? getEfficiencyStats(analysisData.apps, workModeTime) : null
  const topApps = analysisData ? getTopApps(analysisData.apps, totalTime) : []

  return (
    <motion.div
      className="time-analysis"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="main-content">
        {/* 日期选择 */}
        <motion.div
          className="content-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            className="date-selector"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <label htmlFor="date-input">选择日期：</label>
            <motion.div
              className="date-input-wrapper"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
            >
              <input
                id="date-input"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="date-input"
              />
              <FontAwesomeIcon icon={faCalendarDays} className="calendar-icon" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* 统计卡片 */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              className="loading-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="loading-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.p
                className="loading-text"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                加载分析数据...
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              className="stats-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {[
                {
                  title: "总使用时长",
                  value: formatDuration(totalTime),
                  change: selectedDate ? `${selectedDate} 数据` : '今日数据',
                  icon: faClock,
                  bgColor: "#F5E8D3"
                },
                {
                  title: "高效时长",
                  value: stats ? formatDuration(stats.productiveTime) : '00:00:00',
                  change: `工作模式专注时间`,
                  icon: faChartLine,
                  bgColor: "#E5F0E0"
                },
                {
                  title: "分心时长",
                  value: stats ? formatDuration(stats.distractingTime) : '00:00:00',
                  change: selectedDate ? `${selectedDate} 数据` : '今日数据',
                  icon: faExclamationTriangle,
                  bgColor: "#F7E5DE"
                },
                {
                  title: "效率得分",
                  value: stats ? `${stats.efficiencyScore}%` : '0%',
                  change: selectedDate ? `${selectedDate} 数据` : '今日数据',
                  icon: faStar,
                  bgColor: "#F5E8D3"
                }
              ].map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.4 + index * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <StatsCard {...card} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 图表区域 */}
        <motion.div
          className="charts-grid"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* 应用使用详情 */}
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            whileHover={{
              y: -5,
              boxShadow: "0 15px 35px rgba(212, 165, 116, 0.15)"
            }}
          >
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.3 }}
            >
              应用使用详情
            </motion.h2>
            {topApps.length > 0 ? (
              <motion.div
                className="modern-apps-container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
              >
                {/* 现代化应用列表 */}
                <div className="modern-app-list">
                  <div className="modern-list-header">
                    <div>应用名称</div>
                    <div>使用时长</div>
                    <div>占比</div>
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
                        duration: 0.5,
                        delay: 1.2 + index * 0.1,
                        type: "spring",
                        stiffness: 80
                      }}
                      whileHover={{
                        scale: 1.02,
                        backgroundColor: 'rgba(212, 165, 116, 0.05)',
                        transition: { duration: 0.2 }
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
                      <div className="modern-app-time">{app.formattedDuration}</div>
                      <div className="modern-app-percentage">{app.percentage}%</div>
                      <div className="modern-app-category">
                        <span className="category-tag" style={{ backgroundColor: `${getAppColor(app.name, app.category)}20` }}>
                          {app.category || '未分类'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="no-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.3 }}
              >
                <p>暂无数据</p>
              </motion.div>
            )}
          </motion.div>

          {/* 使用时长排行 - 仪表盘样式 */}
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            whileHover={{
              y: -5,
              boxShadow: "0 15px 35px rgba(212, 165, 116, 0.15)"
            }}
          >
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.3 }}
            >
              使用时长排行
            </motion.h2>
            {topApps.length > 0 ? (
              <motion.div
                className="dashboard-container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                {/* 主要仪表盘 */}
                <div className="main-dashboard">
                  {topApps.slice(0, 1).map((app, index) => {
                    const appColor = getAppColor(app.name, app.category)
                    const percentage = app.percentage
                    const circumference = 2 * Math.PI * 45 // 半径45的圆周长
                    const strokeDasharray = circumference
                    const strokeDashoffset = circumference - (percentage / 100) * circumference

                    return (
                      <motion.div
                        key={index}
                        className="primary-gauge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.6,
                          delay: 1.3,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                      >
                        <div className="gauge-container">
                          <svg className="gauge-svg" width="120" height="120" viewBox="0 0 120 120">
                            {/* 背景圆环 */}
                            <circle
                              cx="60"
                              cy="60"
                              r="45"
                              fill="none"
                              stroke="rgba(240, 238, 237, 0.3)"
                              strokeWidth="8"
                            />
                            {/* 进度圆环 */}
                            <motion.circle
                              cx="60"
                              cy="60"
                              r="45"
                              fill="none"
                              stroke={appColor}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              transform="rotate(-90 60 60)"
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset }}
                              transition={{
                                duration: 1.5,
                                delay: 1.4,
                                ease: [0.23, 1, 0.32, 1]
                              }}
                            />
                          </svg>

                          {/* 中心内容 */}
                          <div className="gauge-center">
                            <motion.div
                              className="gauge-app-icon"
                              style={{ backgroundColor: appColor }}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.6, duration: 0.4 }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                              <FontAwesomeIcon icon={getAppIcon(app.name, app.category)} />
                            </motion.div>
                            <motion.div
                              className="gauge-percentage"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.7, duration: 0.4 }}
                            >
                              {percentage}%
                            </motion.div>
                          </div>
                        </div>

                        <motion.div
                          className="gauge-info"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.8, duration: 0.4 }}
                        >
                          <div className="gauge-app-name">{app.name}</div>
                          <div className="gauge-app-time">{app.formattedDuration}</div>
                          <div className="gauge-app-category">{app.category || '未分类'}</div>
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* 次要应用仪表盘 */}
                <div className="secondary-dashboards">
                  {topApps.slice(1, 5).map((app, index) => {
                    const appColor = getAppColor(app.name, app.category)
                    const percentage = app.percentage
                    const circumference = 2 * Math.PI * 25 // 半径25的圆周长
                    const strokeDasharray = circumference
                    const strokeDashoffset = circumference - (percentage / 100) * circumference

                    return (
                      <motion.div
                        key={index}
                        className="secondary-gauge"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 1.9 + index * 0.1,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        whileHover={{
                          scale: 1.05,
                          y: -5,
                          transition: { duration: 0.2 }
                        }}
                      >
                        <div className="mini-gauge-container">
                          <svg className="mini-gauge-svg" width="70" height="70" viewBox="0 0 70 70">
                            {/* 背景圆环 */}
                            <circle
                              cx="35"
                              cy="35"
                              r="25"
                              fill="none"
                              stroke="rgba(240, 238, 237, 0.3)"
                              strokeWidth="5"
                            />
                            {/* 进度圆环 */}
                            <motion.circle
                              cx="35"
                              cy="35"
                              r="25"
                              fill="none"
                              stroke={appColor}
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              transform="rotate(-90 35 35)"
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset }}
                              transition={{
                                duration: 1.2,
                                delay: 2.0 + index * 0.1,
                                ease: [0.23, 1, 0.32, 1]
                              }}
                            />
                          </svg>

                          {/* 中心内容 */}
                          <div className="mini-gauge-center">
                            <motion.div
                              className="mini-gauge-app-icon"
                              style={{ backgroundColor: appColor }}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 2.1 + index * 0.1, duration: 0.3 }}
                            >
                              <FontAwesomeIcon icon={getAppIcon(app.name, app.category)} />
                            </motion.div>
                          </div>
                        </div>

                        <motion.div
                          className="mini-gauge-info"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 2.2 + index * 0.1, duration: 0.3 }}
                        >
                          <div className="mini-gauge-app-name">{app.name}</div>
                          <div className="mini-gauge-stats">
                            <span className="mini-gauge-time">{app.formattedDuration}</span>
                            <span className="mini-gauge-percentage">{percentage}%</span>
                          </div>
                        </motion.div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="no-data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.3 }}
              >
                <p>暂无数据</p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* 每日总结 */}
        <DailySummarySection dayStats={analysisData} />

        {/* 效率洞察 */}
        <motion.div
          className="insights-card"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          whileHover={{
            y: -3,
            boxShadow: "0 20px 40px rgba(212, 165, 116, 0.12)"
          }}
        >
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6, duration: 0.4 }}
          >
            效率洞察
          </motion.h2>
          <motion.div
            className="insights-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.5 }}
          >
            {/* 工作模式效果 */}
            <motion.div
              className="insight-item"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="insight-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.9, duration: 0.3 }}
              >
                <motion.div
                  className="insight-icon efficiency"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <FontAwesomeIcon icon={faCog} />
                </motion.div>
                <h3>工作模式效果</h3>
              </motion.div>
              <p className="insight-description">工作模式是唯一的高效时间标准：</p>
              <div className="time-slots">
                <div className="time-slot">
                  <div className="time-dot high"></div>
                  <span className="time-label">工作模式时长</span>
                  <span className="efficiency-score">{formatDuration(workModeTime)}</span>
                </div>
                <div className="time-slot">
                  <div className="time-dot high"></div>
                  <span className="time-label">占总时长比例</span>
                  <span className="efficiency-score">
                    {totalTime > 0 ? Math.round((workModeTime / totalTime) * 100) : 0}%
                  </span>
                </div>
                <div className="time-slot">
                  <div className="time-dot high"></div>
                  <span className="time-label">效率得分</span>
                  <span className="efficiency-score">
                    {stats ? `${stats.efficiencyScore}%` : '0%'}
                  </span>
                </div>
              </div>
              <div className="work-mode-note">
                <p>💡 只有主动开启工作模式的时间才计入高效时长</p>
              </div>
            </motion.div>

            {/* 分心因素 */}
            <motion.div
              className="insight-item"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.0, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className="insight-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.1, duration: 0.3 }}
              >
                <motion.div
                  className="insight-icon distraction"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </motion.div>
                <h3>分心因素</h3>
              </motion.div>
              <p className="insight-description">主要分心来源分析：</p>
              <div className="distraction-sources">
                {topApps.filter(app => {
                  const distractingCategories = ['娱乐', '通讯与社交']
                  return distractingCategories.includes(app.category || '')
                }).slice(0, 3).map((app) => (
                  <motion.div
                    key={app.name}
                    className="distraction-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.2, duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="distraction-app-icon" style={{ backgroundColor: getAppColor(app.name, app.category) }}>
                      <FontAwesomeIcon icon={getAppIcon(app.name, app.category)} />
                    </div>
                    <div className="distraction-info">
                      <span className="source-label">{app.name}</span>
                      <span className="source-category">{app.category || '未分类'}</span>
                    </div>
                    <span className="time-spent">{app.formattedDuration}</span>
                  </motion.div>
                ))}
                {topApps.filter(app => {
                  const distractingCategories = ['娱乐', '通讯与社交']
                  return distractingCategories.includes(app.category || '')
                }).length === 0 && (
                    <motion.div
                      className="distraction-item no-distraction"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.2, duration: 0.4 }}
                    >
                      <div className="distraction-app-icon success">
                        <FontAwesomeIcon icon={faCheck} />
                      </div>
                      <div className="distraction-info">
                        <span className="source-label">无明显分心应用</span>
                        <span className="source-category">保持专注！</span>
                      </div>
                      <span className="time-spent success">优秀</span>
                    </motion.div>
                  )}
              </div>
            </motion.div>


          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
