import { DayStats, AppUsageData } from '../types/electron'

/**
 * 格式化时间显示为HH:MM:SS格式
 */
export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * 计算效率统计
 */
export const calculateEfficiencyStats = (apps: { [key: string]: AppUsageData }, workModeTime: number) => {
  const distractingCategories = ['娱乐', '通讯与社交']

  let distractingTime = 0
  let totalTime = 0

  Object.values(apps).forEach(app => {
    totalTime += app.duration
    if (distractingCategories.includes(app.category || '')) {
      distractingTime += app.duration
    }
  })

  const productiveTime = workModeTime
  const neutralTime = totalTime - productiveTime - distractingTime
  const efficiencyScore = totalTime > 0 ? Math.round((productiveTime / totalTime) * 100) : 0

  return {
    totalTime,
    productiveTime,
    distractingTime,
    neutralTime,
    efficiencyScore
  }
}

/**
 * 获取应用排行
 */
export const getTopApps = (apps: { [key: string]: AppUsageData }, dayTotalTime: number) => {
  return Object.values(apps)
    .sort((a, b) => b.duration - a.duration)
    .map(app => ({
      ...app,
      formattedDuration: formatDuration(app.duration),
      percentage: dayTotalTime > 0 ? Math.round((app.duration / dayTotalTime) * 100) : 0
    }))
}

/**
 * 生成AI分析的数据格式
 */
export const generateAIAnalysisData = (dayStats: DayStats) => {
  const stats = calculateEfficiencyStats(dayStats.apps, dayStats.workModeTime)
  const topApps = getTopApps(dayStats.apps, dayStats.totalTime)

  // 按分类统计应用使用时间
  const categoryStats: { [category: string]: { duration: number, apps: string[] } } = {}
  Object.values(dayStats.apps).forEach(app => {
    const category = app.category || '其他'
    if (!categoryStats[category]) {
      categoryStats[category] = { duration: 0, apps: [] }
    }
    categoryStats[category].duration += app.duration
    categoryStats[category].apps.push(app.name)
  })

  // 格式化分类统计
  const formattedCategoryStats = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.duration - a.duration)
    .map(([category, data]) => ({
      category,
      duration: data.duration,
      formattedDuration: formatDuration(data.duration),
      percentage: Math.round((data.duration / dayStats.totalTime) * 100),
      appCount: data.apps.length,
      apps: data.apps
    }))

  return {
    // 基本信息
    date: dayStats.date,
    totalTime: formatDuration(dayStats.totalTime),
    workModeTime: formatDuration(dayStats.workModeTime),
    efficiencyScore: stats.efficiencyScore,
    
    // 时间分布
    timeDistribution: {
      productive: {
        duration: stats.productiveTime,
        formattedDuration: formatDuration(stats.productiveTime),
        percentage: Math.round((stats.productiveTime / dayStats.totalTime) * 100)
      },
      distracting: {
        duration: stats.distractingTime,
        formattedDuration: formatDuration(stats.distractingTime),
        percentage: Math.round((stats.distractingTime / dayStats.totalTime) * 100)
      },
      neutral: {
        duration: stats.neutralTime,
        formattedDuration: formatDuration(stats.neutralTime),
        percentage: Math.round((stats.neutralTime / dayStats.totalTime) * 100)
      }
    },

    // 应用使用详情
    topApps: topApps.slice(0, 10), // 取前10个应用
    
    // 分类统计
    categoryStats: formattedCategoryStats,
    
    // 应用切换分析
    appSwitchingAnalysis: {
      totalApps: Object.keys(dayStats.apps).length,
      totalLaunches: Object.values(dayStats.apps).reduce((sum, app) => sum + app.launches, 0),
      averageLaunchesPerApp: Math.round(Object.values(dayStats.apps).reduce((sum, app) => sum + app.launches, 0) / Object.keys(dayStats.apps).length),
      mostLaunchedApps: Object.values(dayStats.apps)
        .sort((a, b) => b.launches - a.launches)
        .slice(0, 5)
        .map(app => ({
          name: app.name,
          launches: app.launches,
          avgSessionTime: formatDuration(app.duration / app.launches)
        }))
    },

    // 工作模式分析
    workModeAnalysis: {
      isUsed: dayStats.workModeTime > 0,
      duration: dayStats.workModeTime,
      formattedDuration: formatDuration(dayStats.workModeTime),
      percentage: Math.round((dayStats.workModeTime / dayStats.totalTime) * 100),
      effectivenessRating: dayStats.workModeTime > 0 ? 
        (dayStats.workModeTime / dayStats.totalTime >= 0.3 ? '优秀' : 
         dayStats.workModeTime / dayStats.totalTime >= 0.15 ? '良好' : '需改进') : '未使用'
    }
  }
}

/**
 * 生成简洁高效的AI分析prompt
 */
export const generateAIAnalysisPrompt = (dayStats: DayStats): string => {
  const analysisData = generateAIAnalysisData(dayStats)
  
  const prompt = `你是时间管理专家，请基于以下数据生成简洁的每日时间复盘总结。

## 数据概览
日期: ${analysisData.date}
总时长: ${analysisData.totalTime}
工作模式记录: ${analysisData.workModeTime} (${analysisData.workModeAnalysis.percentage}%)
系统效率得分: ${analysisData.efficiencyScore}%

## 应用使用详情
${analysisData.topApps.slice(0, 5).map((app, index) => 
  `${index + 1}. ${app.name} (${app.category || '其他'}): ${app.formattedDuration} (${app.percentage}%)`
).join('\n')}

## 分类统计
${analysisData.categoryStats.slice(0, 4).map(cat => 
  `${cat.category}: ${cat.formattedDuration} (${cat.percentage}%)`
).join('\n')}

## 分析要求
请智能推测用户的实际工作状态，不要完全依赖工作模式记录：

1. **应用功能推测**: 根据应用名称和使用时长，推测用户可能的工作内容
   - VS Code/WebStorm/IntelliJ = 编程开发
   - Figma/Photoshop/Sketch = 设计工作  
   - Word/Excel/PowerPoint = 文档处理
   - Chrome/Firefox长时间使用 = 可能在查资料或开发调试

2. **实际高效时间推测**: 结合应用功能和使用模式，推测真实的工作时间
   - 考虑用户可能忘记开启工作模式
   - 长时间使用工作类应用应视为高效时间
   - 根据应用类型和使用时长判断工作强度

## 输出要求
用纯文本格式输出4个部分，每部分2-3句话：

1. 实际表现：基于应用推测的真实工作状态和效率评估
2. 时间分配：分析主要工作内容和潜在的分心因素
3. 工作模式：评估工作模式使用情况，指出可能遗漏的工作时间
4. 改进建议：提供3个具体可行的优化建议

要求：
- 智能推测，不局限于工作模式数据
- 基于应用功能分析真实工作状态  
- 语言简洁明了，总字数300字以内
- 建议具体可执行`

  return prompt
}