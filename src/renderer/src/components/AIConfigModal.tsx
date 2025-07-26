import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faCog, faRobot, faServer, faKey, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import { AIConfig } from '../types/aiAnalysis'
import { DailySummaryManager } from '../services/aiAnalysisService'

interface AIConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: AIConfig) => void
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // 加载现有配置
      const existingConfig = DailySummaryManager.getAIConfig()
      if (existingConfig) {
        setConfig(existingConfig)
      }
      setError('')
      setSuccess(false)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (!config.apiKey.trim() && config.provider !== 'local') {
      setError('请输入API密钥')
      return
    }

    if (config.provider === 'local' && !config.baseUrl?.trim()) {
      setError('请输入服务地址')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      DailySummaryManager.saveAIConfig(config)
      setSuccess(true)
      onSave(config)

      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 1500)
    } catch (error) {
      setError(error instanceof Error ? error.message : '保存配置失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleProviderChange = (provider: AIConfig['provider']) => {
    setConfig(prev => ({
      ...prev,
      provider,
      model: getDefaultModel(provider),
      baseUrl: provider === 'local' ? 'http://localhost:11434' : ''
    }))
  }

  const getDefaultModel = (provider: AIConfig['provider']): string => {
    switch (provider) {
      case 'openai':
        return 'gpt-4o-mini'
      case 'claude':
        return 'claude-3-5-sonnet-20241022'
      case 'deepseek':
        return 'deepseek-chat'
      case 'kimi':
        return 'moonshot-v1-8k'
      case 'local':
        return 'llama2'
      default:
        return ''
    }
  }

  const getProviderInfo = (provider: AIConfig['provider']) => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI GPT',
          description: '使用OpenAI的GPT模型进行分析',
          needsApiKey: true,
          needsBaseUrl: false,
          models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini']
        }
      case 'claude':
        return {
          name: 'Anthropic Claude',
          description: '使用Anthropic的Claude模型进行分析',
          needsApiKey: true,
          needsBaseUrl: false,
          models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']
        }
      case 'deepseek':
        return {
          name: 'DeepSeek',
          description: '使用DeepSeek的高性价比AI模型',
          needsApiKey: true,
          needsBaseUrl: false,
          models: ['deepseek-chat', 'deepseek-reasoner']
        }
      case 'kimi':
        return {
          name: 'Kimi',
          description: '使用月之暗面Kimi的智能AI模型',
          needsApiKey: true,
          needsBaseUrl: false,
          models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
        }
      case 'local':
        return {
          name: '本地AI模型',
          description: '使用本地部署的AI模型（如Ollama）',
          needsApiKey: false,
          needsBaseUrl: true,
          models: ['llama2', 'mistral', 'codellama', 'qwen']
        }
      default:
        return {
          name: '未知提供商',
          description: '',
          needsApiKey: false,
          needsBaseUrl: false,
          models: []
        }
    }
  }

  if (!isOpen) return null

  const providerInfo = getProviderInfo(config.provider)

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="ai-config-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="header-icon">
              <FontAwesomeIcon icon={faCog} />
            </div>
            <h2>AI分析配置</h2>
            <button className="close-btn" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div className="modal-content">
            {/* AI服务提供商选择 */}
            <div className="form-group">
              <label>AI服务提供商</label>
              <div className="provider-options">
                {(['openai', 'claude', 'deepseek', 'kimi', 'local'] as const).map(provider => (
                  <motion.div
                    key={provider}
                    className={`provider-option ${config.provider === provider ? 'active' : ''}`}
                    data-provider={provider}
                    onClick={() => handleProviderChange(provider)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FontAwesomeIcon
                      icon={provider === 'local' ? faServer : faRobot}
                      className="provider-icon"
                    />
                    <div className="provider-info">
                      <div className="provider-name">{getProviderInfo(provider).name}</div>
                      <div className="provider-desc">{getProviderInfo(provider).description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* API密钥输入 */}
            {providerInfo.needsApiKey && (
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faKey} className="label-icon" />
                  API密钥
                </label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="请输入API密钥"
                  className="form-input"
                />
              </div>
            )}

            {/* 基础URL输入 */}
            {providerInfo.needsBaseUrl && (
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faServer} className="label-icon" />
                  服务地址
                </label>
                <input
                  type="url"
                  value={config.baseUrl}
                  onChange={e => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="http://localhost:11434"
                  className="form-input"
                />
              </div>
            )}

            {/* 模型选择 */}
            <div className="form-group">
              <label>模型</label>
              <select
                value={config.model}
                onChange={e => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className="form-select"
              >
                {providerInfo.models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
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

            {/* 成功提示 */}
            {success && (
              <motion.div
                className="success-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FontAwesomeIcon icon={faCheck} />
                配置保存成功！
              </motion.div>
            )}
          </div>

          <div className="modal-footer">
            <button className="cancel-btn" onClick={onClose}>
              取消
            </button>
            <motion.button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSaving ? (
                <>
                  <FontAwesomeIcon icon={faCog} className="spinning" />
                  保存中...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} />
                  保存配置
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AIConfigModal