import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { AppTracker } from './services/AppTracker'

let mainWindow: BrowserWindow
let appTracker: AppTracker

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true // 隐藏菜单栏
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
