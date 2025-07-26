import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { AppTracker } from './services/AppTracker'
import { WorkModeManager } from './services/WorkModeManager'
import { DataExportManager } from './services/DataExportManager'

let mainWindow: BrowserWindow
let appTracker: AppTracker
let workModeManager: WorkModeManager
let dataExportManager: DataExportManager

function createWindow() {
  // 完全禁用菜单栏
  Menu.setApplicationMenu(null)
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 开发环境加载开发服务器，生产环境加载构建文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 初始化应用追踪器
  appTracker = new AppTracker(mainWindow)
  appTracker.start()

  // 初始化工作模式管理器
  workModeManager = new WorkModeManager()

  // 设置 AppTracker 引用到 WorkModeManager
  workModeManager.setAppTracker(appTracker)

  // 初始化数据导出管理器
  dataExportManager = new DataExportManager(appTracker, workModeManager)
}

// IPC 处理程序
ipcMain.handle('get-app-usage-data', async (event, date?: string) => {
  if (date) {
    return appTracker.getUsageData(date)
  } else {
    // 对于今天的数据，返回实时数据
    return appTracker.getRealTimeUsageData()
  }
})

ipcMain.handle('get-current-app', async () => {
  return appTracker.getCurrentApp()
})

ipcMain.handle('get-today-stats', async () => {
  return appTracker.getTodayStats()
})

ipcMain.handle('get-current-app-start-time', async () => {
  return appTracker.getCurrentAppStartTime()
})

ipcMain.handle('get-data-directory', async () => {
  return appTracker.getDataDirectory()
})

ipcMain.handle('get-today-data-file-path', async () => {
  return appTracker.getTodayDataFilePath()
})

// 工作模式相关IPC处理程序
ipcMain.handle('get-all-work-modes', async () => {
  return workModeManager.getAllModes()
})

ipcMain.handle('get-work-mode', async (event, id: string) => {
  return workModeManager.getMode(id)
})

ipcMain.handle('create-work-mode', async (event, name: string, description?: string) => {
  return workModeManager.createMode(name, description)
})

ipcMain.handle('update-work-mode', async (event, id: string, updates: any) => {
  return workModeManager.updateMode(id, updates)
})

ipcMain.handle('delete-work-mode', async (event, id: string) => {
  return workModeManager.deleteMode(id)
})

ipcMain.handle('start-work-mode', async (event, id: string) => {
  return workModeManager.startMode(id)
})

ipcMain.handle('stop-work-mode', async (event, id: string) => {
  return workModeManager.stopMode(id)
})

ipcMain.handle('get-running-mode-id', async () => {
  return workModeManager.getCurrentRunningModeId()
})

// 自启动应用相关IPC处理程序
ipcMain.handle('select-executable-file', async () => {
  return workModeManager.selectExecutableFile()
})

ipcMain.handle('add-auto-start-app', async (event, modeId: string, app: any) => {
  return workModeManager.addAutoStartApp(modeId, app)
})

ipcMain.handle('update-auto-start-app', async (event, modeId: string, appId: string, updates: any) => {
  return workModeManager.updateAutoStartApp(modeId, appId, updates)
})

ipcMain.handle('remove-auto-start-app', async (event, modeId: string, appId: string) => {
  return workModeManager.removeAutoStartApp(modeId, appId)
})

// 黑名单应用相关IPC处理程序
ipcMain.handle('add-blacklist-app', async (event, modeId: string, app: any) => {
  return workModeManager.addBlacklistApp(modeId, app)
})

ipcMain.handle('update-blacklist-app', async (event, modeId: string, appId: string, updates: any) => {
  return workModeManager.updateBlacklistApp(modeId, appId, updates)
})

ipcMain.handle('remove-blacklist-app', async (event, modeId: string, appId: string) => {
  return workModeManager.removeBlacklistApp(modeId, appId)
})

ipcMain.handle('get-running-processes', async () => {
  return workModeManager.getRunningProcesses()
})

ipcMain.handle('open-windows-explorer', async (event, path?: string) => {
  return workModeManager.openWindowsExplorer(path)
})

// 工作模式状态管理
ipcMain.handle('set-work-mode-active', async (event, isActive: boolean) => {
  if (appTracker) {
    appTracker.setWorkModeActive(isActive)
    return true
  }
  return false
})

ipcMain.handle('get-work-mode-active', async () => {
  if (appTracker) {
    return appTracker.getWorkModeActive()
  }
  return false
})

// 数据导出相关IPC处理程序
ipcMain.handle('set-feishu-config', async (event, config: any) => {
  return dataExportManager.setFeishuConfig(config)
})

ipcMain.handle('get-export-config', async () => {
  return dataExportManager.getConfig()
})

ipcMain.handle('test-feishu-connection', async () => {
  return dataExportManager.testFeishuConnection()
})

ipcMain.handle('export-today-data', async () => {
  return dataExportManager.exportTodayData()
})

ipcMain.handle('export-date-data', async (event, date: string) => {
  return dataExportManager.exportDateData(date)
})



ipcMain.handle('enable-auto-export', async (event, intervalHours: number) => {
  return dataExportManager.enableAutoExport(intervalHours)
})

ipcMain.handle('disable-auto-export', async () => {
  return dataExportManager.disableAutoExport()
})

ipcMain.handle('get-export-status', async () => {
  return dataExportManager.getExportStatus()
})

ipcMain.handle('export-app-usage-summary', async (event, date?: string) => {
  return dataExportManager.exportAppUsageSummary(date)
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (appTracker) {
    appTracker.stop()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  if (appTracker) {
    appTracker.stop()
  }
})
