import { NavLink, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCog, 
  faDesktop, 
  faChartLine 
} from '@fortawesome/free-solid-svg-icons'
import './Sidebar.css'

const menuItems = [
  { path: '/work-mode', label: '工作模式设置', icon: faCog },
  { path: '/app-tracking', label: '应用追踪', icon: faDesktop },
  { path: '/time-analysis', label: '时间分析', icon: faChartLine },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-logo">
          <h2>Focus Manager</h2>
        </div>
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `menu-item ${isActive ? 'active' : ''}`
                }
              >
                <div className="menu-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <span className="menu-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
