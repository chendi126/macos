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
  startWorkMode: (id: string) => ipcRenderer.invoke('start-work-mode', id),
  stopWorkMode: (id: string) => ipcRenderer.invoke('stop-work-mode', id),
  getRunningModeId: () => ipcRenderer.invoke('get-running-mode-id'),
  
  // 自启动应用相关API
  selectExecutableFile: () => ipcRenderer.invoke('select-executable-file'),
  addAutoStartApp: (modeId: string, app: any) => ipcRenderer.invoke('add-auto-start-app', modeId, app),
  updateAutoStartApp: (modeId: string, appId: string, updates: any) => ipcRenderer.invoke('update-auto-start-app', modeId, appId, updates),
  removeAutoStartApp: (modeId: string, appId: string) => ipcRenderer.invoke('remove-auto-start-app', modeId, appId),
  
  // 黑名单应用相关API
  addBlacklistApp: (modeId: string, app: any) => ipcRenderer.invoke('add-blacklist-app', modeId, app),
  updateBlacklistApp: (modeId: string, appId: string, updates: any) => ipcRenderer.invoke('update-blacklist-app', modeId, appId, updates),
  removeBlacklistApp: (modeId: string, appId: string) => ipcRenderer.invoke('remove-blacklist-app', modeId, appId),
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),
  
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
  },
  
  // 工作模式状态管理API
  setWorkModeActive: (isActive: boolean) => ipcRenderer.invoke('set-work-mode-active', isActive),
  getWorkModeActive: () => ipcRenderer.invoke('get-work-mode-active'),
  
  // Windows 资源管理器
  openWindowsExplorer: (path?: string) => ipcRenderer.invoke('open-windows-explorer', path)
})

console.log('Preload script loaded')
