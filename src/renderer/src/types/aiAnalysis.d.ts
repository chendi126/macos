export interface AIConfig {
  provider: 'openai' | 'claude' | 'deepseek' | 'local'
  apiKey: string
  baseUrl?: string
  model?: string
}

export interface DailySummary {
  date: string
  summary: string
  createdAt: number
  analysisData: {
    totalTime: string
    workModeTime: string
    efficiencyScore: number
    topApps: Array<{
      name: string
      duration: string
      percentage: number
      category: string
    }>
  }
}

export interface AIAnalysisService {
  analyzeTimeUsage(dayStats: any): Promise<string>
}