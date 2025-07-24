import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 应用追踪相关API
  getAppUsageData: (date?: string) => ipcRenderer.invoke('get-app-usage-data', date),
  getCurrentApp: () => ipcRenderer.invoke('get-current-app'),
  getTodayStats: () => ipcRenderer.invoke('get-today-stats'),
  getCurrentAppStartTime: () => ipcRenderer.invoke('get-current-app-start-time'),
  getDataDirectory: () => ipcRenderer.invoke('get-data-directory'),
  getTodayDataFilePath: () => ipcRenderer.invoke('get-today-data-file-path'),
  
  // 工作模式相关API
  getAllWorkModes: () => ipcRenderer.invoke('get-all-work-modes'),
  getWorkMode: (id: string) => ipcRenderer.invoke('get-work-mode', id),
  createWorkMode: (name: string, description?: string) => ipcRenderer.invoke('create-work-mode', name, description),
  updateWorkMode: (id: string, updates: any) => ipcRenderer.invoke('update-work-mode', id, updates),
  deleteWorkMode: (id: string) => ipcRenderer.invoke('delete-work-mode', id),
  
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
