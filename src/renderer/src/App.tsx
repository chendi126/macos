import { useState } from 'react'
import Layout from './components/Layout'
import WorkModeSettings from './pages/WorkModeSettings'
import AppTracking from './pages/AppTracking'
import TimeAnalysis from './pages/TimeAnalysis'
import './App.css'

export type Page = 'work-mode' | 'app-tracking' | 'time-analysis'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('work-mode')

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'work-mode':
        return <WorkModeSettings />
      case 'app-tracking':
        return <AppTracking />
      case 'time-analysis':
        return <TimeAnalysis />
      default:
        return <WorkModeSettings />
    }
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  )
}

export default App
