import { createHashRouter, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import WorkModeSettings from '../pages/WorkModeSettings'
import AppTracking from '../pages/AppTracking'
import TimeAnalysis from '../pages/TimeAnalysis'
import DataExport from '../pages/DataExport'

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/work-mode" replace />
      },
      {
        path: 'work-mode',
        element: <WorkModeSettings />
      },
      {
        path: 'app-tracking',
        element: <AppTracking />
      },
      {
        path: 'time-analysis',
        element: <TimeAnalysis />
      },
      {
        path: 'data-export',
        element: <DataExport />
      }
    ]
  }
])