import { AIConfig, AIAnalysisService, DailySummary } from '../types/aiAnalysis'
import { DayStats } from '../types/electron'
import { generateAIAnalysisPrompt } from '../utils/aiAnalysisHelper'

// OpenAI服务
class OpenAIService implements AIAnalysisService {
  constructor(private config: AIConfig) {}

  async analyzeTimeUsage(dayStats: DayStats): Promise<string> {
    const prompt = generateAIAnalysisPrompt(dayStats)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的时间管理分析师，请用中文提供详细的时间使用分析报告。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API错误: ${error.error?.message || '未知错误'}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
}

// Claude服务
class ClaudeService implements AIAnalysisService {
  constructor(private config: AIConfig) {}

  async analyzeTimeUsage(dayStats: DayStats): Promise<string> {
    const prompt = generateAIAnalysisPrompt(dayStats)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Claude API错误: ${error.error?.message || '未知错误'}`)
    }

    const data = await response.json()
    return data.content[0].text
  }
}

// DeepSeek服务
class DeepSeekService implements AIAnalysisService {
  constructor(private config: AIConfig) {}

  async analyzeTimeUsage(dayStats: DayStats): Promise<string> {
    const prompt = generateAIAnalysisPrompt(dayStats)
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的时间管理分析师，请用中文提供详细的时间使用分析报告。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`DeepSeek API错误: ${error.error?.message || '未知错误'}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
}

// 本地AI服务
class LocalAIService implements AIAnalysisService {
  constructor(private config: AIConfig) {}

  async analyzeTimeUsage(dayStats: DayStats): Promise<string> {
    const prompt = generateAIAnalysisPrompt(dayStats)
    const baseUrl = this.config.baseUrl || 'http://localhost:11434'
    
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model || 'llama2',
        prompt: prompt,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`本地AI服务错误: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response
  }
}

// AI服务工厂
export const createAIService = (config: AIConfig): AIAnalysisService => {
  switch (config.provider) {
    case 'openai':
      return new OpenAIService(config)
    case 'claude':
      return new ClaudeService(config)
    case 'deepseek':
      return new DeepSeekService(config)
    case 'local':
      return new LocalAIService(config)
    default:
      throw new Error('不支持的AI服务提供商')
  }
}

// 每日总结管理器
export class DailySummaryManager {
  private static readonly STORAGE_KEY = 'daily-summaries'
  private static readonly CONFIG_KEY = 'ai-config'

  // 获取AI配置
  static getAIConfig(): AIConfig | null {
    try {
      const config = localStorage.getItem(this.CONFIG_KEY)
      return config ? JSON.parse(config) : null
    } catch (error) {
      console.error('获取AI配置失败:', error)
      return null
    }
  }

  // 保存AI配置
  static saveAIConfig(config: AIConfig): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config))
    } catch (error) {
      console.error('保存AI配置失败:', error)
      throw new Error('保存配置失败')
    }
  }

  // 获取所有每日总结
  static getAllSummaries(): { [date: string]: DailySummary } {
    try {
      const summaries = localStorage.getItem(this.STORAGE_KEY)
      return summaries ? JSON.parse(summaries) : {}
    } catch (error) {
      console.error('获取每日总结失败:', error)
      return {}
    }
  }

  // 获取指定日期的总结
  static getSummary(date: string): DailySummary | null {
    const summaries = this.getAllSummaries()
    return summaries[date] || null
  }

  // 保存每日总结
  static saveSummary(summary: DailySummary): void {
    try {
      const summaries = this.getAllSummaries()
      summaries[summary.date] = summary
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(summaries))
    } catch (error) {
      console.error('保存每日总结失败:', error)
      throw new Error('保存总结失败')
    }
  }

  // 删除指定日期的总结
  static deleteSummary(date: string): void {
    try {
      const summaries = this.getAllSummaries()
      delete summaries[date]
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(summaries))
    } catch (error) {
      console.error('删除每日总结失败:', error)
      throw new Error('删除总结失败')
    }
  }

  // 生成每日总结
  static async generateSummary(dayStats: DayStats): Promise<DailySummary> {
    const config = this.getAIConfig()
    if (!config) {
      throw new Error('请先配置AI服务')
    }

    const aiService = createAIService(config)
    const summaryText = await aiService.analyzeTimeUsage(dayStats)

    const summary: DailySummary = {
      date: dayStats.date,
      summary: summaryText,
      createdAt: Date.now(),
      analysisData: {
        totalTime: this.formatDuration(dayStats.totalTime),
        workModeTime: this.formatDuration(dayStats.workModeTime),
        efficiencyScore: Math.round((dayStats.workModeTime / dayStats.totalTime) * 100) || 0,
        topApps: Object.values(dayStats.apps)
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
          .map(app => ({
            name: app.name,
            duration: this.formatDuration(app.duration),
            percentage: Math.round((app.duration / dayStats.totalTime) * 100),
            category: app.category || '其他'
          }))
      }
    }

    this.saveSummary(summary)
    return summary
  }

  // 格式化时间
  private static formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}