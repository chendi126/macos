import { Outlet, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import Sidebar from './Sidebar'
import AppTimer from './AppTimer'
import './Layout.css'

export default function Layout() {
  const location = useLocation()
  
  // 根据路径获取页面标题
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/work-mode':
        return 'Focus Manager'
      case '/app-tracking':
        return 'Focus Manager'
      case '/time-analysis':
        return 'Focus Manager'
      default:
        return 'Focus Manager'
    }
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Area */}
      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="header-title">{getPageTitle()}</h1>
          </div>
          <div className="header-right">
            <AppTimer />
            <div className="notification-icon">
              <FontAwesomeIcon icon={faBell} />
            </div>
            <div className="avatar">
              <img 
                src="https://static.paraflowcontent.com/public/resource/image/614518a9-276b-4d5b-a7dd-efa71addf98d.jpeg" 
                alt="用户头像"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
