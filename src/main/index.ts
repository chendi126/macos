import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron'
import { join } from 'path'
import { AppTracker } from './services/AppTracker'
import { WorkModeManager } from './services/WorkModeManager'
import { DataExportManager } from './services/DataExportManager'

let mainWindow: BrowserWindow
let appTracker: AppTracker
let workModeManager: WorkModeManager
let dataExportManager: DataExportManager
let tray: Tray | null = null
let isQuiting = false

function createTray() {
  const { nativeImage } = require('electron')
  
  // 尝试使用项目中的 PNG 图标文件
  let icon: Electron.NativeImage
  
  try {
    const iconPath = process.env.NODE_ENV === 'development' 
      ? join(process.cwd(), 'resources', 'icon.png')
      : join(__dirname, 'vctime-icon.png')
    const tempIcon = nativeImage.createFromPath(iconPath)
    
    // 如果图标太大，调整大小为适合托盘的尺寸
    if (tempIcon && !tempIcon.isEmpty()) {
      icon = tempIcon.resize({ width: 16, height: 16 })
    } else {
      // 使用空图标，系统会提供默认图标
      icon = nativeImage.createEmpty()
    }
  } catch (error) {
    console.log('未找到图标文件，使用默认图标')
    // 使用空图标，系统会提供默认图标
    icon = nativeImage.createEmpty()
  }
  
  tray = new Tray(icon)
  
  // 设置托盘提示文本
  tray.setToolTip('DesktopAide - 桌面助手')
  
  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: '退出应用',
      click: () => {
        isQuiting = true
        if (appTracker) {
          appTracker.stop()
        }
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  
  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function createWindow() {
  // 完全禁用菜单栏
  Menu.setApplicationMenu(null)
  
  const iconPath = process.env.NODE_ENV === 'development' 
    ? join(process.cwd(), 'resources', 'icon.png')
    : join(__dirname, 'vctime-icon.png')
    
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'VCTime - 桌面时间管理助手',
    icon: iconPath,
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

  // 处理窗口关闭事件 - 最小化到托盘而不是退出
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault()
      mainWindow.hide()
      
      // 可选：显示托盘通知
      if (tray) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'DesktopAide',
          content: '应用已最小化到系统托盘，双击托盘图标可重新打开窗口'
        })
      }
    }
  })

  // 创建系统托盘
  createTray()

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

ipcMain.handle('set-auto-open-table', async (event, enabled: boolean) => {
  return dataExportManager.setAutoOpenTable(enabled)
})

// 用户表格管理
ipcMain.handle('create-user-table', async (event, templateConfig: any) => {
  return dataExportManager.createUserTable(templateConfig)
})

ipcMain.handle('is-using-shared-table', async () => {
  return dataExportManager.isUsingSharedTable()
})

ipcMain.handle('get-user-id', async () => {
  return dataExportManager.getUserId()
})

// 调试表格结构
ipcMain.handle('debug-table-structure', async () => {
  return dataExportManager.debugTableStructure()
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // 在 Windows 和 Linux 上，当所有窗口关闭时不退出应用
  // 应用会继续在系统托盘中运行
  // 在 macOS 上保持默认行为
  if (process.platform === 'darwin') {
    if (appTracker) {
      appTracker.stop()
    }
    app.quit()
  }
  // 在其他平台上，应用继续在托盘中运行
})

app.on('activate', () => {
  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，重新创建窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else if (mainWindow) {
    // 如果窗口存在但被隐藏，显示它
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('before-quit', () => {
  // 设置正在退出标志，允许窗口真正关闭
  isQuiting = true
  if (appTracker) {
    appTracker.stop()
  }
  // 销毁托盘图标
  if (tray) {
    tray.destroy()
  }
})
