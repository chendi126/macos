import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用追踪相关API
  getAppUsageData: (date?: string) => ipcRenderer.invoke('get-app-usage-data', date),
  getCurrentApp: () => ipcRenderer.invoke('get-current-app'),
  getTodayStats: () => ipcRenderer.invoke('get-today-stats'),
  getCurrentAppStartTime: () => ipcRenderer.invoke('get-current-app-start-time'),
  
  // 监听应用使用更新
  onAppUsageUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on('app-usage-updated', (event, data) => callback(data))
  },
  
  // 监听增量更新
  onAppUsageIncrementalUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on('app-usage-incremental-update', (event, data) => callback(data))
  },
  
  // 移除监听器
  removeAppUsageListener: () => {
    ipcRenderer.removeAllListeners('app-usage-updated')
    ipcRenderer.removeAllListeners('app-usage-incremental-update')
  }
})

console.log('Preload script loaded')
