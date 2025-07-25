import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartLine,
  faClock,
  faExclamationTriangle,
  faStar,
  faCalendarDays,
  faShare,
  faDownload,
  faLightbulb,
  faCheck,
  faClipboardList
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
    <div className="stats-card">
      <div className="stats-header">
        <p className="stats-title">{title}</p>
        <div className="stats-icon" style={{ backgroundColor: bgColor }}>
          <FontAwesomeIcon icon={icon} />
        </div>
      </div>
      <p className="stats-value">{value}</p>
      <p className="stats-change">{change}</p>
    </div>
  )
}

interface ChartPlaceholderProps {
  type: 'pie' | 'bar' | 'line'
  data: any[]
}

function ChartPlaceholder({ type, data }: ChartPlaceholderProps) {
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
  const getEfficiencyStats = (apps: { [key: string]: AppUsageData }) => {
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
  
  // 计算统计数据
  const stats = analysisData ? getEfficiencyStats(analysisData.apps) : null
  const topApps = analysisData ? getTopApps(analysisData.apps, totalTime) : []

  return (
    <div className="time-analysis">
      <div className="main-content">
          {/* 日期选择和操作按钮 */}
          <div className="content-header">
            <div className="date-selector">
              <label htmlFor="date-input">选择日期：</label>
              <div className="date-input-wrapper">
                <input
                  id="date-input"
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="date-input"
                />
                <FontAwesomeIcon icon={faCalendarDays} className="calendar-icon" />
              </div>
            </div>
            <div className="action-buttons">
              <button className="action-button">
                <span>分享报告</span>
                <FontAwesomeIcon icon={faShare} />
              </button>
              <button className="action-button">
                <span>导出报告</span>
                <FontAwesomeIcon icon={faDownload} />
              </button>
            </div>
          </div>

          {/* 统计卡片 */}
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">加载分析数据...</p>
            </div>
          ) : (
            <div className="stats-grid">
              <StatsCard
                title="总使用时长"
                value={formatDuration(totalTime)}
                change={selectedDate ? `${selectedDate} 数据` : '今日数据'}
                icon={faClock}
                bgColor="#F5E8D3"
              />
              <StatsCard
                title="高效时长"
                value={stats ? formatDuration(stats.productiveTime) : '00:00:00'}
                change={selectedDate ? `${selectedDate} 数据` : '今日数据'}
                icon={faChartLine}
                bgColor="#E5F0E0"
              />
              <StatsCard
                title="分心时长"
                value={stats ? formatDuration(stats.distractingTime) : '00:00:00'}
                change={selectedDate ? `${selectedDate} 数据` : '今日数据'}
                icon={faExclamationTriangle}
                bgColor="#F7E5DE"
              />
              <StatsCard
                title="效率得分"
                value={stats ? `${stats.efficiencyScore}%` : '0%'}
                change={selectedDate ? `${selectedDate} 数据` : '今日数据'}
                icon={faStar}
                bgColor="#F5E8D3"
              />
            </div>
          )}

          {/* 图表区域 */}
          <div className="charts-grid">
            {/* 时间使用分布 */}
            <div className="chart-card">
              <h2>时间使用分布</h2>
              <ChartPlaceholder type="pie" data={[]} />
            </div>

            {/* 热门应用排名 */}
            <div className="chart-card">
              <h2>热门应用排名</h2>
              {topApps.length > 0 ? (
                <div className="chart-container">
                  <div className="bar-chart">
                    {topApps.slice(0, 5).map((app, index) => {
                      const maxHeight = 200
                      const height = topApps.length > 0 ? (app.duration / topApps[0].duration) * maxHeight : 0
                      return (
                        <div key={app.name} className="bar-item">
                          <div className="bar" style={{ height: `${height}px` }}>
                            <span className="bar-value">{formatDuration(app.duration)}</span>
                          </div>
                          <span className="bar-label">{app.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <p>暂无数据</p>
                </div>
              )}
            </div>
          </div>

          {/* 使用趋势图 */}
          <div className="trend-card">
            <h2>使用趋势图</h2>
            <ChartPlaceholder type="line" data={[]} />
          </div>

          {/* 效率洞察 */}
          <div className="insights-card">
            <h2>效率洞察</h2>
            <div className="insights-grid">
              {/* 最高效率时段 */}
              <div className="insight-item">
                <div className="insight-header">
                  <div className="insight-icon efficiency">
                    <FontAwesomeIcon icon={faLightbulb} />
                  </div>
                  <h3>最高效率时段</h3>
                </div>
                <p className="insight-description">根据分析，您在以下时段工作效率最高：</p>
                <div className="time-slots">
                  <div className="time-slot">
                    <div className="time-dot high"></div>
                    <span className="time-label">上午 9:00 - 11:30</span>
                    <span className="efficiency-score">高效指数: 92%</span>
                  </div>
                  <div className="time-slot">
                    <div className="time-dot high"></div>
                    <span className="time-label">下午 2:00 - 4:30</span>
                    <span className="efficiency-score">高效指数: 87%</span>
                  </div>
                </div>
              </div>

              {/* 分心因素 */}
              <div className="insight-item">
                <div className="insight-header">
                  <div className="insight-icon distraction">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                  </div>
                  <h3>分心因素</h3>
                </div>
                <p className="insight-description">以下应用是您最主要的分心来源：</p>
                <div className="distraction-sources">
                  <div className="distraction-item">
                    <div className="time-dot low"></div>
                    <span className="source-label">社交媒体</span>
                    <span className="time-spent">1h 15m</span>
                  </div>
                  <div className="distraction-item">
                    <div className="time-dot low"></div>
                    <span className="source-label">视频娱乐</span>
                    <span className="time-spent">45m</span>
                  </div>
                </div>
              </div>

              {/* 提升效率建议 */}
              <div className="insight-item full-width">
                <div className="insight-header">
                  <div className="insight-icon suggestions">
                    <FontAwesomeIcon icon={faClipboardList} />
                  </div>
                  <h3>提升效率建议</h3>
                </div>
                <ul className="suggestions-list">
                  <li>
                    <FontAwesomeIcon icon={faCheck} className="check-icon" />
                    <span>尝试在上午9点至11点30分间安排重要任务，利用您的高效率时段。</span>
                  </li>
                  <li>
                    <FontAwesomeIcon icon={faCheck} className="check-icon" />
                    <span>考虑在社交媒体应用上设置每日使用限制，当前使用时间已超过建议值约35%。</span>
                  </li>
                  <li>
                    <FontAwesomeIcon icon={faCheck} className="check-icon" />
                    <span>周末的使用时间显著下降，这是健康的工作与生活平衡表现，建议继续保持。</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
