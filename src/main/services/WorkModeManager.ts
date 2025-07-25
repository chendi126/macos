import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface WorkMode {
  id: string
  name: string
  description: string
  autoCreateDesktop: boolean
  createdAt: number
  updatedAt: number
}

export class WorkModeManager {
  private dataDir: string
  private modesFilePath: string
  private modes: WorkMode[] = []
  private currentRunningModeId: string | null = null

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'work-modes')
    this.modesFilePath = path.join(this.dataDir, 'modes.json')
    this.ensureDataDir()
    this.loadModes()
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

      // 设置当前运行的模式
      this.currentRunningModeId = id
      
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
}