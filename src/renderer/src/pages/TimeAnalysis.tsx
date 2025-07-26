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
  faCog
} from '@fortawesome/free-solid-svg-icons'
import { DayStats, AppUsageData } from '../types/electron'
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
    const productiveCategories = ['开发工具', '工作效率', '设计与创意']
    const distractingCategories = ['娱乐', '通讯与社交']
    
    let productiveTime = 0
    let distractingTime = 0
    let totalTime = 0

    Object.values(apps).forEach(app => {
      totalTime += app.duration
      if (productiveCategories.includes(app.category || '')) {
        productiveTime += app.duration
      } else if (distractingCategories.includes(app.category || '')) {
        distractingTime += app.duration
      }
    })

    // 将工作模式时间加入到高效时间计算中
    const totalProductiveTime = productiveTime + workModeTime
    const neutralTime = totalTime - productiveTime - distractingTime
    const efficiencyScore = totalTime > 0 ? Math.round((totalProductiveTime / totalTime) * 100) : 0

    return {
      totalTime,
      productiveTime: totalProductiveTime, // 包含工作模式时间
      distractingTime,
      neutralTime,
      efficiencyScore,
      workModeTime // 单独返回工作模式时间
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
                    change: `包含工作模式 ${formatDuration(workModeTime)}`,
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
            {/* 时间使用分布 */}
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
                时间使用分布
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, duration: 0.4 }}
              >
                <ChartPlaceholder type="pie" data={[]} />
              </motion.div>
            </motion.div>

            {/* 热门应用排名 */}
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
                热门应用排名
              </motion.h2>
              {topApps.length > 0 ? (
                <motion.div 
                  className="chart-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                >
                  <div className="bar-chart">
                    {topApps.slice(0, 5).map((app, index) => {
                      const maxHeight = 200
                      const height = topApps.length > 0 ? (app.duration / topApps[0].duration) * maxHeight : 0
                      return (
                        <motion.div 
                          key={app.name} 
                          className="bar-item"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            delay: 1.3 + index * 0.1, 
                            duration: 0.4 
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <motion.div 
                            className="bar" 
                            style={{ height: `${height}px` }}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}px` }}
                            transition={{ 
                              delay: 1.4 + index * 0.1, 
                              duration: 0.6,
                              ease: "easeOut"
                            }}
                          >
                            <span className="bar-value">{formatDuration(app.duration)}</span>
                          </motion.div>
                          <span className="bar-label">{app.name}</span>
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
                <p className="insight-description">工作模式帮助您保持专注：</p>
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
                  }).slice(0, 2).map((app) => (
                    <div key={app.name} className="distraction-item">
                      <div className="time-dot low"></div>
                      <span className="source-label">{app.name}</span>
                      <span className="time-spent">{app.formattedDuration}</span>
                    </div>
                  ))}
                  {topApps.filter(app => {
                    const distractingCategories = ['娱乐', '通讯与社交']
                    return distractingCategories.includes(app.category || '')
                  }).length === 0 && (
                    <div className="distraction-item">
                      <div className="time-dot high"></div>
                      <span className="source-label">无明显分心应用</span>
                      <span className="time-spent">保持专注！</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 提升效率建议 */}
              <motion.div 
                className="insight-item full-width"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.5 }}
                whileHover={{ scale: 1.01 }}
              >
                <motion.div 
                  className="insight-header"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.3, duration: 0.3 }}
                >
                  <motion.div 
                    className="insight-icon suggestions"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FontAwesomeIcon icon={faClipboardList} />
                  </motion.div>
                  <h3>提升效率建议</h3>
                </motion.div>
                <ul className="suggestions-list">
                  {[
                    workModeTime > 0 
                      ? `工作模式使用良好，建议继续保持专注工作习惯。`
                      : `建议启用工作模式来提高专注度和工作效率。`,
                    stats && stats.efficiencyScore >= 70
                      ? `当前效率得分为 ${stats.efficiencyScore}%，表现优秀！`
                      : `当前效率得分为 ${stats?.efficiencyScore || 0}%，可以通过减少分心应用使用来提升。`,
                    `定期查看时间分析报告，了解自己的使用习惯，持续优化工作效率。`
                  ].map((suggestion, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.4 + index * 0.1, duration: 0.4 }}
                      whileHover={{ x: 5 }}
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 2.5 + index * 0.1, duration: 0.3 }}
                      >
                        <FontAwesomeIcon icon={faCheck} className="check-icon" />
                      </motion.div>
                      <span>{suggestion}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </motion.div>
      </div>
    </motion.div>
  )
}
