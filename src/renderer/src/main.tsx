import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './contexts/AppContext'
import { WorkModeProvider } from './contexts/WorkModeContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <WorkModeProvider>
        <App />
      </WorkModeProvider>
    </AppProvider>
  </React.StrictMode>
)
