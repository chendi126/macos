import { ReactNode } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import Sidebar from './Sidebar'
import { Page } from '../App'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  currentPage: Page
  onPageChange: (page: Page) => void
}

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div className="layout">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      
      {/* Main Area */}
      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="header-title">Focus Manager</h1>
          </div>
          <div className="header-right">
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
          {children}
        </main>
      </div>
    </div>
  )
}
