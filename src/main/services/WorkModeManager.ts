import * as fs from 'fs'
import * as path from 'path'
import { app, dialog } from 'electron'
import { spawn } from 'child_process'

export interface AutoStartApp {
  id: string
  name: string
  path: string
  arguments?: string
  workingDirectory?: string
  enabled: boolean
}

export interface BlacklistApp {
  id: string
  name: string
  processName: string
  enabled: boolean
}

export interface WorkMode {
  id: string
  name: string
  description: string
  autoCreateDesktop: boolean
  autoStartApps: AutoStartApp[]
  blacklistApps: BlacklistApp[]
  enableBlacklist: boolean
  createdAt: number
  updatedAt: number
}

export class WorkModeManager {
  private dataDir: string
  private modesFilePath: string
  private modes: WorkMode[] = []
  private currentRunningModeId: string | null = null
  private blacklistMonitorInterval: NodeJS.Timeout | null = null
  private appTracker: any = null // 添加 AppTracker 引用

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'work-modes')
    this.modesFilePath = path.join(this.dataDir, 'modes.json')
    this.ensureDataDir()
    this.loadModes()
    this.migrateOldData()
  }

  // 设置 AppTracker 引用
  public setAppTracker(appTracker: any) {
    this.appTracker = appTracker
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }

  private loadModes() {
    try {
      if (fs.existsSync(this.modesFilePath)) {
        const data = fs.readFileSync(this.modesFilePath, 'utf8')
        this.modes = JSON.parse(data)
      } else {
        // 创建默认模式
        this.createDefaultModes()
      }
    } catch (error) {
      console.error('Error loading work modes:', error)
      this.createDefaultModes()
    }
  }

  private createDefaultModes() {
    this.modes = [
      {
        id: 'default-focus',
        name: '深度工作模式',
        description: '用于需要高度专注的工作场景，屏蔽干扰应用。',
        autoCreateDesktop: true,
        autoStartApps: [],
        blacklistApps: [],
        enableBlacklist: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]
    this.saveModes()
  }

  private saveModes() {
    try {
      fs.writeFileSync(this.modesFilePath, JSON.stringify(this.modes, null, 2))
    } catch (error) {
      console.error('Error saving work modes:', error)
    }
  }

  // 获取所有模式
  public getAllModes(): WorkMode[] {
    return this.modes
  }

  // 获取单个模式
  public getMode(id: string): WorkMode | null {
    return this.modes.find(mode => mode.id === id) || null
  }

  // 创建新模式
  public createMode(name: string, description: string = ''): WorkMode {
    const newMode: WorkMode = {
      id: `mode-${Date.now()}`,
      name,
      description,
      autoCreateDesktop: false,
      autoStartApps: [],
      blacklistApps: [],
      enableBlacklist: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.modes.push(newMode)
    this.saveModes()
    return newMode
  }

  // 更新模式
  public updateMode(id: string, updates: Partial<Omit<WorkMode, 'id' | 'createdAt'>>): WorkMode | null {
    const modeIndex = this.modes.findIndex(mode => mode.id === id)
    if (modeIndex === -1) return null

    this.modes[modeIndex] = {
      ...this.modes[modeIndex],
      ...updates,
      updatedAt: Date.now()
    }

    this.saveModes()
    return this.modes[modeIndex]
  }

  // 删除模式
  public deleteMode(id: string): boolean {
    const modeIndex = this.modes.findIndex(mode => mode.id === id)
    if (modeIndex === -1) return false

    this.modes.splice(modeIndex, 1)
    this.saveModes()
    return true
  }

  // 启动模式
  public async startMode(id: string): Promise<boolean> {
    const mode = this.getMode(id)
    if (!mode) {
      console.error('Mode not found:', id)
      return false
    }

    try {
      // 如果有其他模式在运行，先停止它
      if (this.currentRunningModeId && this.currentRunningModeId !== id) {
        console.log(`Stopping current running mode: ${this.currentRunningModeId}`)
        this.currentRunningModeId = null
      }

      console.log(`Starting work mode: ${mode.name}`)
      
      // 如果启用了自动创建桌面功能
      if (mode.autoCreateDesktop) {
        const desktopCreated = await this.createNewVirtualDesktop()
        if (!desktopCreated) {
          console.warn('Failed to create virtual desktop, but continuing with mode start')
        }
      }

      // 启动自启动应用
      if (mode.autoStartApps && mode.autoStartApps.length > 0) {
        await this.startAutoStartApps(mode.autoStartApps)
      }

      // 启动黑名单监控
      if (mode.enableBlacklist && mode.blacklistApps && mode.blacklistApps.length > 0) {
        this.startBlacklistMonitoring(mode.blacklistApps)
      }

      // 设置当前运行的模式
      this.currentRunningModeId = id
      
      // 通知 AppTracker 工作模式已激活
      if (this.appTracker) {
        this.appTracker.setWorkModeActive(true)
      }
      
      console.log(`Work mode "${mode.name}" started successfully`)
      return true
    } catch (error) {
      console.error('Error starting work mode:', error)
      return false
    }
  }

  // 停止模式
  public stopMode(id: string): boolean {
    if (this.currentRunningModeId === id) {
      console.log(`Stopping work mode: ${id}`)
      
      // 停止黑名单监控
      this.stopBlacklistMonitoring()
      
      // 通知 AppTracker 工作模式已停用
      if (this.appTracker) {
        this.appTracker.setWorkModeActive(false)
      }
      
      this.currentRunningModeId = null
      return true
    }
    return false
  }

  // 获取当前运行的模式ID
  public getCurrentRunningModeId(): string | null {
    return this.currentRunningModeId
  }

  // 创建新的虚拟桌面
  private async createNewVirtualDesktop(): Promise<boolean> {
    try {
      const { spawn } = require('child_process')
      // 获取主窗口并尝试聚焦（确保按键注入有效）
      try {
        const { BrowserWindow } = require('electron')
        const allWindows = BrowserWindow.getAllWindows()
        if (allWindows && allWindows.length > 0) {
          allWindows[0].focus()
        }
      } catch (e) {
        // 忽略聚焦异常
      }
      // 使用 PowerShell + WinAPI keybd_event 模拟 Win+Ctrl+D
      // 注意 Here-String 结尾 @" 必须顶格，不能有缩进
      const powershellScript = `Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinAPI {
  [DllImport(\"user32.dll\")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
  public const int VK_LWIN = 0x5B;
  public const int VK_LCONTROL = 0xA2;
  public const int VK_D = 0x44;
  public const uint KEYEVENTF_KEYUP = 0x0002;
}
"@ -Language CSharp

# 按下Win键
[WinAPI]::keybd_event([WinAPI]::VK_LWIN, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 50
# 按下Ctrl键
[WinAPI]::keybd_event([WinAPI]::VK_LCONTROL, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 50
# 按下D键
[WinAPI]::keybd_event([WinAPI]::VK_D, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 50
# 释放D键
[WinAPI]::keybd_event([WinAPI]::VK_D, 0, [WinAPI]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 50
# 释放Ctrl键
[WinAPI]::keybd_event([WinAPI]::VK_LCONTROL, 0, [WinAPI]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 50
# 释放Win键
[WinAPI]::keybd_event([WinAPI]::VK_LWIN, 0, [WinAPI]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 100
Write-Host \"Virtual desktop creation command sent via keybd_event\"
`;

      return new Promise((resolve) => {
        // 1. 用 powershell.exe 保证和 test.js 一致
        const process = spawn('powershell.exe', ['-Command', powershellScript], {
          windowsHide: true
        })

        let output = ''
        let errorOutput = ''
        process.stdout.on('data', (data) => {
          output += data.toString()
        })
        process.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        process.on('close', (code) => {
          console.log('PowerShell output:', output)
          if (errorOutput) {
            console.error('PowerShell stderr:', errorOutput)
          }
          if (code === 0) {
            console.log('Virtual desktop creation command executed successfully')
            resolve(true)
          } else {
            console.error('Failed to execute virtual desktop command, code:', code)
            resolve(false)
          }
        })

        process.on('error', (error) => {
          console.error('Error executing virtual desktop command:', error)
          resolve(false)
        })

        // 设置超时
        setTimeout(() => {
          process.kill()
          console.log('Virtual desktop command timed out')
          resolve(false)
        }, 4000)
      })
    } catch (error) {
      console.error('Error in createNewVirtualDesktop:', error)
      return false
    }
  }

  // 获取数据目录
  public getDataDirectory(): string {
    return this.dataDir
  }

  // 启动 Windows 资源管理器
  public async openWindowsExplorer(path?: string): Promise<boolean> {
    try {
      const targetPath = path || 'C:\\'
      const { spawn } = require('child_process')
      
      console.log(`Opening Windows Explorer at: ${targetPath}`)
      
      const child = spawn('explorer.exe', [targetPath], {
        detached: true,
        stdio: 'ignore'
      })
      
      child.on('error', (error) => {
        console.error('Error opening Windows Explorer:', error)
        return false
      })
      
      child.unref()
      console.log('Windows Explorer opened successfully')
      return true
    } catch (error) {
      console.error('Failed to open Windows Explorer:', error)
      return false
    }
  }

  // 选择可执行文件
  public async selectExecutableFile(): Promise<string | null> {
    try {
      const result = await dialog.showOpenDialog({
        title: '选择应用程序',
        filters: [
          { name: '可执行文件', extensions: ['exe'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return null
      }

      return result.filePaths[0]
    } catch (error) {
      console.error('Error selecting executable file:', error)
      return null
    }
  }

  // 添加自启动应用
  public addAutoStartApp(modeId: string, app: Omit<AutoStartApp, 'id'>): AutoStartApp | null {
    const mode = this.getMode(modeId)
    if (!mode) {
      console.error('Mode not found:', modeId)
      return null
    }

    const newApp: AutoStartApp = {
      id: `app-${Date.now()}`,
      ...app
    }

    if (!mode.autoStartApps) {
      mode.autoStartApps = []
    }

    mode.autoStartApps.push(newApp)
    mode.updatedAt = Date.now()
    this.saveModes()

    return newApp
  }

  // 更新自启动应用
  public updateAutoStartApp(modeId: string, appId: string, updates: Partial<AutoStartApp>): boolean {
    const mode = this.getMode(modeId)
    if (!mode || !mode.autoStartApps) {
      console.error('Mode or apps not found:', modeId)
      return false
    }

    const appIndex = mode.autoStartApps.findIndex(app => app.id === appId)
    if (appIndex === -1) {
      console.error('App not found:', appId)
      return false
    }

    mode.autoStartApps[appIndex] = {
      ...mode.autoStartApps[appIndex],
      ...updates
    }
    mode.updatedAt = Date.now()
    this.saveModes()

    return true
  }

  // 移除自启动应用
  public removeAutoStartApp(modeId: string, appId: string): boolean {
    const mode = this.getMode(modeId)
    if (!mode || !mode.autoStartApps) {
      console.error('Mode or apps not found:', modeId)
      return false
    }

    const appIndex = mode.autoStartApps.findIndex(app => app.id === appId)
    if (appIndex === -1) {
      console.error('App not found:', appId)
      return false
    }

    mode.autoStartApps.splice(appIndex, 1)
    mode.updatedAt = Date.now()
    this.saveModes()

    return true
  }

  // 添加黑名单应用
  public addBlacklistApp(modeId: string, app: Omit<BlacklistApp, 'id'>): BlacklistApp | null {
    const mode = this.getMode(modeId)
    if (!mode) {
      console.error('Mode not found:', modeId)
      return null
    }

    const newApp: BlacklistApp = {
      id: `blacklist-${Date.now()}`,
      ...app
    }

    if (!mode.blacklistApps) {
      mode.blacklistApps = []
    }

    mode.blacklistApps.push(newApp)
    mode.updatedAt = Date.now()
    this.saveModes()

    return newApp
  }

  // 更新黑名单应用
  public updateBlacklistApp(modeId: string, appId: string, updates: Partial<BlacklistApp>): boolean {
    const mode = this.getMode(modeId)
    if (!mode || !mode.blacklistApps) {
      console.error('Mode or blacklist apps not found:', modeId)
      return false
    }

    const appIndex = mode.blacklistApps.findIndex(app => app.id === appId)
    if (appIndex === -1) {
      console.error('Blacklist app not found:', appId)
      return false
    }

    mode.blacklistApps[appIndex] = {
      ...mode.blacklistApps[appIndex],
      ...updates
    }
    mode.updatedAt = Date.now()
    this.saveModes()

    return true
  }

  // 移除黑名单应用
  public removeBlacklistApp(modeId: string, appId: string): boolean {
    const mode = this.getMode(modeId)
    if (!mode || !mode.blacklistApps) {
      console.error('Mode or blacklist apps not found:', modeId)
      return false
    }

    const appIndex = mode.blacklistApps.findIndex(app => app.id === appId)
    if (appIndex === -1) {
      console.error('Blacklist app not found:', appId)
      return false
    }

    mode.blacklistApps.splice(appIndex, 1)
    mode.updatedAt = Date.now()
    this.saveModes()

    return true
  }

  // 获取运行中的进程列表
  public async getRunningProcesses(): Promise<string[]> {
    return new Promise((resolve) => {
      try {
        const { exec } = require('child_process')
        
        // 使用 tasklist 命令获取运行中的进程
        exec('tasklist /fo csv /nh', (error: any, stdout: string) => {
          if (error) {
            console.error('Error getting running processes:', error)
            resolve([])
            return
          }

          try {
            // 解析CSV输出，提取进程名
            const processes = stdout
              .split('\n')
              .filter(line => line.trim())
              .map(line => {
                // 解析CSV格式的行，获取第一个字段（进程名）
                const match = line.match(/^"([^"]+)"/)
                return match ? match[1] : null
              })
              .filter(name => name !== null)
              .map(name => name!.toLowerCase())
              // 去重
              .filter((name, index, array) => array.indexOf(name) === index)
              .sort()

            resolve(processes)
          } catch (parseError) {
            console.error('Error parsing process list:', parseError)
            resolve([])
          }
        })
      } catch (error) {
        console.error('Error in getRunningProcesses:', error)
        resolve([])
      }
    })
  }

  // 启动自启动应用
  private async startAutoStartApps(apps: AutoStartApp[]): Promise<void> {
    const enabledApps = apps.filter(app => app.enabled)
    
    if (enabledApps.length === 0) {
      console.log('No enabled auto-start apps to launch')
      return
    }

    console.log(`Starting ${enabledApps.length} auto-start apps`)

    for (const app of enabledApps) {
      try {
        await this.startSingleApp(app)
        // 在应用启动之间添加短暂延迟，避免系统负载过高
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Failed to start app ${app.name}:`, error)
      }
    }
  }

  // 启动单个应用
  private async startSingleApp(app: AutoStartApp): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Starting app: ${app.name} (${app.path})`)

      // 准备启动参数
      const args = app.arguments ? app.arguments.split(' ').filter(arg => arg.trim()) : []
      const options: any = {
        detached: true,
        stdio: 'ignore'
      }

      // 设置工作目录
      if (app.workingDirectory && fs.existsSync(app.workingDirectory)) {
        options.cwd = app.workingDirectory
      }

      try {
        const child = spawn(app.path, args, options)
        
        child.on('error', (error) => {
          console.error(`Error starting app ${app.name}:`, error)
          reject(error)
        })

        child.on('spawn', () => {
          console.log(`App ${app.name} started successfully`)
          child.unref() // 允许父进程退出而不等待子进程
          resolve()
        })

        // 设置超时
        setTimeout(() => {
          console.log(`App ${app.name} start timeout, assuming success`)
          resolve()
        }, 3000)

      } catch (error) {
        console.error(`Failed to spawn app ${app.name}:`, error)
        reject(error)
      }
    })
  }

  // 迁移旧数据（为现有模式添加新字段）
  private migrateOldData() {
    let needsSave = false
    
    for (const mode of this.modes) {
      if (!mode.autoStartApps) {
        mode.autoStartApps = []
        needsSave = true
      }
      if (!mode.blacklistApps) {
        mode.blacklistApps = []
        needsSave = true
      }
      if (mode.enableBlacklist === undefined) {
        mode.enableBlacklist = false
        needsSave = true
      }
    }

    if (needsSave) {
      this.saveModes()
      console.log('Migrated old work mode data to include new fields')
    }
  }

  // 启动黑名单监控
  private startBlacklistMonitoring(blacklistApps: BlacklistApp[]): void {
    // 先停止现有的监控
    this.stopBlacklistMonitoring()

    const enabledApps = blacklistApps.filter(app => app.enabled)
    if (enabledApps.length === 0) {
      console.log('No enabled blacklist apps to monitor')
      return
    }

    console.log(`Starting blacklist monitoring for ${enabledApps.length} apps`)

    // 每5秒检查一次
    this.blacklistMonitorInterval = setInterval(async () => {
      try {
        await this.checkAndKillBlacklistedProcesses(enabledApps)
      } catch (error) {
        console.error('Error in blacklist monitoring:', error)
      }
    }, 5000)
  }

  // 停止黑名单监控
  private stopBlacklistMonitoring(): void {
    if (this.blacklistMonitorInterval) {
      clearInterval(this.blacklistMonitorInterval)
      this.blacklistMonitorInterval = null
      console.log('Stopped blacklist monitoring')
    }
  }

  // 检查并关闭黑名单进程
  private async checkAndKillBlacklistedProcesses(blacklistApps: BlacklistApp[]): Promise<void> {
    try {
      const runningProcesses = await this.getRunningProcesses()
      
      for (const app of blacklistApps) {
        const processName = app.processName.toLowerCase()
        
        // 检查进程是否在运行
        if (runningProcesses.includes(processName)) {
          console.log(`Found blacklisted process: ${app.name} (${processName})`)
          await this.killProcess(processName)
        }
      }
    } catch (error) {
      console.error('Error checking blacklisted processes:', error)
    }
  }

  // 关闭指定进程
  private async killProcess(processName: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const { exec } = require('child_process')
        
        // 使用 taskkill 命令关闭进程
        exec(`taskkill /f /im "${processName}"`, (error: any, stdout: string, stderr: string) => {
          if (error) {
            console.error(`Error killing process ${processName}:`, error.message)
          } else {
            console.log(`Successfully killed process: ${processName}`)
          }
          resolve()
        })
      } catch (error) {
        console.error(`Error in killProcess for ${processName}:`, error)
        resolve()
      }
    })
  }
}