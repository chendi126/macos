import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faChartBar,
  faClock,
  faChartLine,
  faExclamationTriangle,
  faStar,
  faCalendarDays,
  faDownload
} from '@fortawesome/free-solid-svg-icons'
import { 
  faChrome,
  faFigma,
  faSlack
} from '@fortawesome/free-brands-svg-icons'
import Sidebar from '../components/Sidebar'
import './AppTracking.css'

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

const appUsageData = [
  { name: 'VS Code', time: '2h 32m', launches: 15, category: '开发工具', color: '#007ACC', icon: 'code' },
  { name: 'Chrome', time: '2h 14m', launches: 22, category: '浏览器', color: '#4285F4', icon: faChrome },
  { name: 'Figma', time: '1h 52m', launches: 8, category: '设计与创意', color: '#A259FF', icon: faFigma },
  { name: 'Slack', time: '1h 26m', launches: 31, category: '通讯与社交', color: '#4A154B', icon: faSlack },
  { name: 'Notion', time: '1h 04m', launches: 12, category: '工作效率', color: '#000000', icon: 'book' },
]

const timelineData = [
  { app: 'VS Code', color: '#007ACC', segments: [{ left: 10, width: 15 }, { left: 35, width: 25 }, { left: 70, width: 20 }] },
  { app: 'Chrome', color: '#4285F4', segments: [{ left: 5, width: 10 }, { left: 20, width: 10 }, { left: 40, width: 20 }, { left: 65, width: 15 }, { left: 85, width: 10 }] },
  { app: 'Figma', color: '#A259FF', segments: [{ left: 30, width: 30 }, { left: 75, width: 15 }] },
  { app: 'Slack', color: '#4A154B', segments: [{ left: 5, width: 5 }, { left: 15, width: 5 }, { left: 25, width: 5 }, { left: 45, width: 10 }, { left: 60, width: 5 }, { left: 75, width: 5 }, { left: 90, width: 5 }] },
  { app: 'Notion', color: '#000000', segments: [{ left: 15, width: 20 }, { left: 50, width: 15 }] },
]

export default function AppTracking() {
  return (
    <div className="app-tracking">
      <div className="page-layout">
        <Sidebar activeMenu="overview" onMenuChange={() => {}} />
        
        <div className="main-content">
          {/* 时间范围选择和导出按钮 */}
          <div className="content-header">
            <div className="time-filters">
              <button className="filter-button active">今日</button>
              <button className="filter-button">近7天</button>
              <button className="filter-button">近30天</button>
              <button className="filter-button custom">
                <span>自定义</span>
                <FontAwesomeIcon icon={faCalendarDays} />
              </button>
            </div>
            <button className="export-button">
              <span>导出报告</span>
              <FontAwesomeIcon icon={faDownload} />
            </button>
          </div>

          {/* 统计卡片 */}
          <div className="stats-grid">
            <StatsCard
              title="总使用时长"
              value="8h 23m"
              change="较前日 +15%"
              icon={faClock}
              bgColor="#F5E8D3"
            />
            <StatsCard
              title="高效时长"
              value="5h 47m"
              change="较前日 +10%"
              icon={faChartLine}
              bgColor="#E5F0E0"
            />
            <StatsCard
              title="分心时长"
              value="2h 36m"
              change="较前日 +25%"
              icon={faExclamationTriangle}
              bgColor="#F7E5DE"
            />
            <StatsCard
              title="效率得分"
              value="68%"
              change="较前日 -5%"
              icon={faStar}
              bgColor="#F5E8D3"
            />
          </div>

          {/* 应用使用统计 */}
          <div className="usage-chart-card">
            <h2>应用使用统计</h2>
            <div className="chart-placeholder">
              <div className="chart-bars">
                {appUsageData.map((app, index) => (
                  <div key={index} className="chart-bar" style={{ height: `${200 - index * 30}px` }}>
                    <div className="bar" style={{ backgroundColor: app.color }}></div>
                    <span className="bar-value">{app.time.split(' ')[0]}m</span>
                    <span className="bar-label">{app.name}</span>
                  </div>
                ))}
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
              {appUsageData.map((app, index) => (
                <div key={index} className={`app-row ${index === 0 ? 'selected' : ''}`}>
                  <div className="col-app">
                    <div className="app-info">
                      <div className="app-icon" style={{ backgroundColor: app.color }}>
                        {typeof app.icon === 'string' ? (
                          <i className={`fas fa-${app.icon}`}></i>
                        ) : (
                          <FontAwesomeIcon icon={app.icon} />
                        )}
                      </div>
                      <span>{app.name}</span>
                    </div>
                  </div>
                  <div className="col-time">{app.time}</div>
                  <div className="col-launches">{app.launches}</div>
                  <div className="col-category">
                    <span className="category-tag">{app.category}</span>
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
                <span>8:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span>14:00</span>
                <span>16:00</span>
                <span>18:00</span>
                <span>20:00</span>
              </div>
              <div className="timeline-track"></div>
            </div>

            <div className="timeline-apps">
              {timelineData.map((item, index) => (
                <div key={index} className="timeline-row">
                  <div className="timeline-app-icon" style={{ backgroundColor: item.color }}>
                    {item.app === 'VS Code' && <i className="fas fa-code"></i>}
                    {item.app === 'Chrome' && <FontAwesomeIcon icon={faChrome} />}
                    {item.app === 'Figma' && <FontAwesomeIcon icon={faFigma} />}
                    {item.app === 'Slack' && <FontAwesomeIcon icon={faSlack} />}
                    {item.app === 'Notion' && <i className="fas fa-book"></i>}
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
                          backgroundColor: item.color
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
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
    </div>
  )
}
