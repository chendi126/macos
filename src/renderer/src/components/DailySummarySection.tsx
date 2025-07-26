import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faRobot, 
  faCog, 
  faSpinner, 
  faExclamationTriangle, 
  faCheck,
  faCalendarDay,
  faRefresh
} from '@fortawesome/free-solid-svg-icons'
import { DayStats } from '../types/electron'
import { DailySummary, AIConfig } from '../types/aiAnalysis'
import { DailySummaryManager } from '../services/aiAnalysisService'
import AIConfigModal from './AIConfigModal'

interface DailySummarySectionProps {
  dayStats: DayStats | null
}

export const DailySummarySection: React.FC<DailySummarySectionProps> = ({ dayStats }) => {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)

  // 检查是否有当天的总结
  useEffect(() => {
    if (dayStats) {
      const existingSummary = DailySummaryManager.getSummary(dayStats.date)
      setSummary(existingSummary)
      
      // 检查AI配置
      const config = DailySummaryManager.getAIConfig()
      setAiConfig(config)
    }
  }, [dayStats])

  // 生成AI总结
  const handleGenerateSummary = async () => {
    if (!dayStats) return

    setIsGenerating(true)
    setError('')

    try {
      const newSummary = await DailySummaryManager.generateSummary(dayStats)
      setSummary(newSummary)
    } catch (error) {
      console.error('生成总结失败:', error)
      setError(error instanceof Error ? error.message : '生成总结失败')
    } finally {
      setIsGenerating(false)
    }
  }

  // 重新生成总结
  const handleRegenerateSummary = async () => {
    if (!dayStats) return

    // 删除现有总结
    DailySummaryManager.deleteSummary(dayStats.date)
    setSummary(null)
    
    // 重新生成
    await handleGenerateSummary()
  }

  // 保存AI配置
  const handleSaveConfig = (config: AIConfig) => {
    setAiConfig(config)
    setShowConfigModal(false)
  }

  // 格式化创建时间
  const formatCreatedTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!dayStats) {
    return null
  }

  const hasConfig = aiConfig && aiConfig.apiKey
  const hasSummary = summary !== null

  return (
    <>
      <motion.div
        className="daily-summary-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.5 }}
        whileHover={{ scale: 1.01 }}
      >
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.3, duration: 0.3 }}
        >
          <motion.div
            className="section-icon"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <FontAwesomeIcon icon={faRobot} />
          </motion.div>
          <h3>每日总结</h3>
          <div className="section-date">
            <FontAwesomeIcon icon={faCalendarDay} />
            {dayStats.date}
          </div>
        </motion.div>

        {/* 如果有总结，显示总结内容 */}
        {hasSummary ? (
          <motion.div
            className="summary-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.4 }}
          >
            <div className="summary-meta">
              <span className="summary-time">
                生成于 {formatCreatedTime(summary.createdAt)}
              </span>
              <motion.button
                className="regenerate-btn"
                onClick={handleRegenerateSummary}
                disabled={isGenerating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="重新生成总结"
              >
                <FontAwesomeIcon 
                  icon={isGenerating ? faSpinner : faRefresh} 
                  className={isGenerating ? 'spinning' : ''}
                />
              </motion.button>
            </div>
            
            <div className="summary-text">
              <pre>{summary.summary}</pre>
            </div>
          </motion.div>
        ) : (
          /* 如果没有总结，显示生成按钮 */
          <motion.div
            className="summary-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.4 }}
          >
            <div className="action-description">
              <p>使用AI分析您的时间使用数据，生成个性化的每日总结和建议</p>
            </div>

            <div className="action-buttons">
              {!hasConfig && (
                <motion.button
                  className="config-btn"
                  onClick={() => setShowConfigModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FontAwesomeIcon icon={faCog} />
                  配置AI服务
                </motion.button>
              )}

              <motion.button
                className="generate-btn"
                onClick={handleGenerateSummary}
                disabled={!hasConfig || isGenerating}
                whileHover={{ scale: hasConfig ? 1.02 : 1 }}
                whileTap={{ scale: hasConfig ? 0.98 : 1 }}
              >
                <FontAwesomeIcon 
                  icon={isGenerating ? faSpinner : faRobot} 
                  className={isGenerating ? 'spinning' : ''}
                />
                {isGenerating ? '生成中...' : '生成每日总结'}
              </motion.button>

              {hasConfig && (
                <motion.button
                  className="config-btn secondary"
                  onClick={() => setShowConfigModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FontAwesomeIcon icon={faCog} />
                  修改配置
                </motion.button>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {error}
              </motion.div>
            )}

            {/* 配置提示 */}
            {!hasConfig && (
              <motion.div
                className="config-hint"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, duration: 0.3 }}
              >
                <FontAwesomeIcon icon={faCheck} />
                首次使用需要配置AI服务（支持OpenAI、Claude或本地模型）
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* AI配置模态框 */}
      <AIConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveConfig}
      />
    </>
  )
}

export default DailySummarySection