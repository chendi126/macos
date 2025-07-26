import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCog,
  faDesktop,
  faChartLine,
  faCloudUpload,
  faHome
} from '@fortawesome/free-solid-svg-icons'
import Sidebar from './Sidebar'
import AppTimer from './AppTimer'
import './Layout.css'

export default function Layout() {
  const location = useLocation()
  
  // 根据路径获取页面标题、描述和图标
  const getPageInfo = () => {
    switch (location.pathname) {
      case '/work-mode':
        return {
          title: '工作模式',
          subtitle: '专注工作，提升效率',
          icon: faCog
        }
      case '/app-tracking':
        return {
          title: '应用追踪',
          subtitle: '了解你的时间去向',
          icon: faDesktop
        }
      case '/time-analysis':
        return {
          title: '时间分析',
          subtitle: '数据驱动的时间管理',
          icon: faChartLine
        }
      case '/data-export':
        return {
          title: '数据导出',
          subtitle: '导出和分享你的数据',
          icon: faCloudUpload
        }
      default:
        return {
          title: 'VCTime',
          subtitle: '桌面时间管理助手',
          icon: faHome
        }
    }
  }

  const pageInfo = getPageInfo()

  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Area */}
      <div className="main-area">
        {/* Header */}
        <motion.header 
          className="header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="header-content">
            <motion.div 
              className="header-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div 
                className="page-icon"
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <FontAwesomeIcon icon={pageInfo.icon} />
              </motion.div>
              <div className="page-info">
                <motion.h1 
                  className="page-title"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {pageInfo.title}
                </motion.h1>
                <motion.p 
                  className="page-subtitle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {pageInfo.subtitle}
                </motion.p>
              </div>
            </motion.div>
            
            <motion.div 
              className="header-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AppTimer />
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
