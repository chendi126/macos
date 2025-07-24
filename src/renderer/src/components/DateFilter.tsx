import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays } from '@fortawesome/free-solid-svg-icons'

interface DateFilterProps {
  selectedDate?: string
  onDateChange: (date?: string) => void
}

export default function DateFilter({ selectedDate, onDateChange }: DateFilterProps) {
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today')

  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter)
    
    switch (filter) {
      case 'today':
        onDateChange()
        break
      case 'week':
        // 获取一周前的日期
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        onDateChange(weekAgo.toISOString().split('T')[0])
        break
      case 'month':
        // 获取一个月前的日期
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        onDateChange(monthAgo.toISOString().split('T')[0])
        break
      case 'custom':
        // 自定义日期选择将通过日期输入处理
        break
    }
  }

  const handleCustomDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value
    onDateChange(date)
  }

  return (
    <div className="time-filters">
      <button 
        className={`filter-button ${activeFilter === 'today' ? 'active' : ''}`}
        onClick={() => handleFilterChange('today')}
      >
        今日
      </button>
      <button 
        className={`filter-button ${activeFilter === 'week' ? 'active' : ''}`}
        onClick={() => handleFilterChange('week')}
      >
        近7天
      </button>
      <button 
        className={`filter-button ${activeFilter === 'month' ? 'active' : ''}`}
        onClick={() => handleFilterChange('month')}
      >
        近30天
      </button>
      <div className="custom-date-filter">
        <input
          type="date"
          value={selectedDate || ''}
          onChange={handleCustomDateChange}
          className="date-input"
        />
        <FontAwesomeIcon icon={faCalendarDays} className="calendar-icon" />
      </div>
    </div>
  )
}