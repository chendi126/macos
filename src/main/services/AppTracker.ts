import { BrowserWindow } from 'electron'
import activeWin from 'active-win'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface AppUsageData {
  name: string
  title: string
  duration: number // 毫秒
  launches: number
  lastActive: number
  category?: string
}

export interface DayStats {
  date: string
  totalTime: number
  apps: { [appName: string]: AppUsageData }
  timeline: Array<{
    timestamp: number
    app: string
    title: string
  }>
}

export class AppTracker {
  private isTracking = false
  private currentApp: string | null = null
  private currentAppStartTime = 0
  private trackingInterval: NodeJS.Timeout | null = null
  private dataDir: string
  private todayData: DayStats
  private mainWindow: BrowserWindow | null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.dataDir = path.join(app.getPath('userData'), 'app-usage')
    this.ensureDataDir()
    this.loadTodayData()
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0]
  }

  private getDataFilePath(date: string): string {
    return path.join(this.dataDir, `${date}.json`)
  }

  private loadTodayData() {
    const today = this.getTodayDateString()
    const filePath = this.getDataFilePath(today)
    
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8')
        this.todayData = JSON.parse(data)
      } catch (error) {
        console.error('Error loading today data:', error)
        this.initTodayData()
      }
    } else {
      this.initTodayData()
    }
  }

  private initTodayData() {
    this.todayData = {
      date: this.getTodayDateString(),
      totalTime: 0,
      apps: {},
      timeline: []
    }
  }

  private saveData() {
    const filePath = this.getDataFilePath(this.todayData.date)
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.todayData, null, 2))
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  private async getCurrentActiveApp(): Promise<{ name: string; title: string } | null> {
    try {
      const result = await activeWin()
      if (result) {
        return {
          name: result.owner?.name || result.owner?.path?.split('\\').pop()?.split('/').pop() || 'Unknown',
          title: result.title || 'Unknown'
        }
      }
    } catch (error) {
      console.error('Error getting active window:', error)
    }
    return null
  }

  private updateAppUsage(appName: string, title: string, duration: number) {
    if (!this.todayData.apps[appName]) {
      this.todayData.apps[appName] = {
        name: appName,
        title: title,
        duration: 0,
        launches: 0,
        lastActive: Date.now(),
        category: this.categorizeApp(appName)
      }
    }

    const appData = this.todayData.apps[appName]
    appData.duration += duration
    appData.lastActive = Date.now()
    appData.title = title

    this.todayData.totalTime += duration

    // 添加到时间轴（实时更新）
    this.todayData.timeline.push({
      timestamp: Date.now(),
      app: appName,
      title: title
    })

    // 保持时间轴不超过1000条记录
    if (this.todayData.timeline.length > 1000) {
      this.todayData.timeline = this.todayData.timeline.slice(-1000)
    }

    // 立即保存数据（实时保存）
    this.saveData()
    
    // 发送实时更新到渲染进程（检查窗口是否还存在）
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('app-usage-incremental-update', {
        appName,
        appData: {
          ...appData,
          durationDelta: duration
        },
        currentApp: appName,
        totalTimeDelta: duration
      })
    }
  }



  private categorizeApp(appName: string): string {
    const categories: { [key: string]: string[] } = {
      '开发工具': ['Visual Studio Code', 'WebStorm', 'IntelliJ IDEA', 'Sublime Text', 'Atom', 'Notepad++'],
      '浏览器': ['Google Chrome', 'Firefox', 'Safari', 'Microsoft Edge', 'Opera'],
      '设计与创意': ['Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Sketch', 'Canva'],
      '通讯与社交': ['Slack', 'Discord', 'Microsoft Teams', 'Zoom', 'Skype', 'WeChat', 'QQ'],
      '工作效率': ['Notion', 'Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Trello', 'Asana'],
      '娱乐': ['Spotify', 'Netflix', 'YouTube', 'Steam', 'Epic Games Launcher'],
      '系统工具': ['Task Manager', 'System Preferences', 'Control Panel', 'Terminal', 'Command Prompt']
    }

    for (const [category, apps] of Object.entries(categories)) {
      if (apps.some(app => appName.toLowerCase().includes(app.toLowerCase()))) {
        return category
      }
    }

    return '其他'
  }

  private async trackActiveApp() {
    const activeApp = await this.getCurrentActiveApp()
    
    if (activeApp) {
      const now = Date.now()
      
      if (this.currentApp && this.currentApp !== activeApp.name) {
        // 切换到新应用，记录之前应用的使用时间
        const duration = now - this.currentAppStartTime
        if (duration > 0) {
          this.updateAppUsage(this.currentApp, '', duration)
        }
      }
      
      if (this.currentApp !== activeApp.name) {
        // 新应用启动
        this.currentApp = activeApp.name
        this.currentAppStartTime = now
        
        if (this.todayData.apps[activeApp.name]) {
          this.todayData.apps[activeApp.name].launches++
        }
      }
    }
  }

  public start() {
    if (this.isTracking) return
    
    this.isTracking = true
    this.trackingInterval = setInterval(() => {
      this.trackActiveApp()
    }, 1000) // 每秒检查一次

    console.log('App tracking started')
  }

  public stop() {
    if (!this.isTracking) return
    
    this.isTracking = false
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }

    // 保存当前应用的最后使用时间
    if (this.currentApp) {
      const duration = Date.now() - this.currentAppStartTime
      if (duration > 0) {
        // 直接保存数据，不发送到渲染进程
        if (!this.todayData.apps[this.currentApp]) {
          this.todayData.apps[this.currentApp] = {
            name: this.currentApp,
            title: '',
            duration: 0,
            launches: 0,
            lastActive: Date.now(),
            category: this.categorizeApp(this.currentApp)
          }
        }
        
        this.todayData.apps[this.currentApp].duration += duration
        this.todayData.totalTime += duration
        this.saveData()
      }
    }

    // 清空窗口引用
    this.mainWindow = null
    console.log('App tracking stopped')
  }

  public getUsageData(date?: string): DayStats | null {
    const targetDate = date || this.getTodayDateString()
    
    if (targetDate === this.getTodayDateString()) {
      return this.todayData
    }
    
    const filePath = this.getDataFilePath(targetDate)
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
      } catch (error) {
        console.error('Error loading data for date:', targetDate, error)
      }
    }
    
    return null
  }

  public getCurrentApp(): string | null {
    return this.currentApp
  }

  public getCurrentAppStartTime(): number {
    return this.currentAppStartTime
  }

  public getTodayStats() {
    const apps = Object.values(this.todayData.apps)
    const sortedApps = apps.sort((a, b) => b.duration - a.duration)
    
    // 计算当前应用的实时时间
    let currentAppDuration = 0
    let realTimeTotalTime = this.todayData.totalTime
    
    if (this.currentApp && this.currentAppStartTime > 0) {
      currentAppDuration = Date.now() - this.currentAppStartTime
      realTimeTotalTime += currentAppDuration
    }
    
    return {
      totalTime: realTimeTotalTime,
      totalApps: apps.length,
      topApps: sortedApps.slice(0, 5),
      currentApp: this.currentApp,
      currentAppDuration,
      currentAppStartTime: this.currentAppStartTime,
      date: this.todayData.date
    }
  }

  public getRealTimeUsageData(): DayStats {
    // 返回包含当前应用实时时间的数据
    const realTimeData = { ...this.todayData }
    
    if (this.currentApp && this.currentAppStartTime > 0) {
      const currentAppDuration = Date.now() - this.currentAppStartTime
      
      // 更新当前应用的实时时间
      if (realTimeData.apps[this.currentApp]) {
        realTimeData.apps[this.currentApp] = {
          ...realTimeData.apps[this.currentApp],
          duration: realTimeData.apps[this.currentApp].duration + currentAppDuration
        }
      }
      
      // 更新总时间
      realTimeData.totalTime += currentAppDuration
    }
    
    return realTimeData
  }
}