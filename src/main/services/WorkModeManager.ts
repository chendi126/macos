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

  // 获取数据目录
  public getDataDirectory(): string {
    return this.dataDir
  }
}