import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faCog, 
  faDesktop, 
  faChartLine 
} from '@fortawesome/free-solid-svg-icons'
import { Page } from '../App'
import './Sidebar.css'

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

const menuItems = [
  { id: 'work-mode' as Page, label: '工作模式设置', icon: faCog },
  { id: 'app-tracking' as Page, label: '应用追踪', icon: faDesktop },
  { id: 'time-analysis' as Page, label: '时间分析', icon: faChartLine },
]

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-logo">
          <h2>Focus Manager</h2>
        </div>
        <ul className="menu-list">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onPageChange(item.id)}
              >
                <div className="menu-icon">
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <span className="menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
