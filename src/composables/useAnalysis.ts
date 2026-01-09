/**
 * 数据分析管理 Composable
 */

import { ref, computed } from 'vue'
import type { AnalysisPromptTemplate, AnalysisRecord, ChartConfig } from '@/types/analysis'
import type { SavedDataRecord } from './useSavedData'

const TEMPLATES_KEY = 'analysis_prompt_templates'
const RECORDS_KEY = 'analysis_records'

/**
 * 分析诉求模板管理
 */
export function useAnalysisPrompts() {
  const templates = ref<AnalysisPromptTemplate[]>([])

  // 从 localStorage 加载模板
  const loadTemplates = () => {
    try {
      const data = localStorage.getItem(TEMPLATES_KEY)
      if (data) {
        templates.value = JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load analysis prompt templates:', error)
      templates.value = []
    }
  }

  // 保存模板到 localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates.value))
    } catch (error) {
      console.error('Failed to save analysis prompt templates:', error)
    }
  }

  // 创建模板
  const createTemplate = (name: string, content: string): AnalysisPromptTemplate => {
    const template: AnalysisPromptTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      content,
      createdAt: new Date().toISOString()
    }
    
    templates.value.push(template)
    saveToStorage()
    
    return template
  }

  // 更新模板
  const updateTemplate = (id: string, updates: Partial<AnalysisPromptTemplate>) => {
    const index = templates.value.findIndex(t => t.id === id)
    if (index >= 0) {
      templates.value[index] = { ...templates.value[index], ...updates }
      saveToStorage()
    }
  }

  // 删除模板
  const deleteTemplate = (id: string) => {
    templates.value = templates.value.filter(t => t.id !== id)
    saveToStorage()
  }

  // 更新最后使用时间
  const updateLastUsed = (id: string) => {
    const template = templates.value.find(t => t.id === id)
    if (template) {
      template.lastUsedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  // 获取最近使用的模板
  const recentTemplates = computed(() => {
    return [...templates.value]
      .filter(t => t.lastUsedAt)
      .sort((a, b) => {
        const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0
        const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 5)
  })

  // 初始化时加载
  loadTemplates()

  return {
    templates,
    recentTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateLastUsed,
    loadTemplates
  }
}

/**
 * 分析记录管理
 */
export function useAnalysisRecords() {
  const records = ref<AnalysisRecord[]>([])

  // 从 localStorage 加载记录
  const loadRecords = () => {
    try {
      const data = localStorage.getItem(RECORDS_KEY)
      if (data) {
        records.value = JSON.parse(data)
      }
    } catch (error) {
      console.error('Failed to load analysis records:', error)
      records.value = []
    }
  }

  // 保存记录到 localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(records.value))
    } catch (error) {
      console.error('Failed to save analysis records:', error)
    }
  }

  // 创建分析记录
  const createRecord = (
    title: string,
    dataRecords: SavedDataRecord[],
    prompt: string,
    result: string,
    duration?: number,
    charts?: ChartConfig[]
  ): AnalysisRecord => {
    const record: AnalysisRecord = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      dataRecordIds: dataRecords.map(r => r.id),
      dataSnapshot: dataRecords.map(r => ({
        batchId: r.batchId,
        batchName: r.batchName,
        fileName: r.fileName,
        fileType: r.fileType,
        fileSize: r.fileSize,
        rowCount: r.rowCount,
        data: r.data,
        description: r.description
      })),
      prompt,
      result,
      analyzedAt: new Date().toISOString(),
      duration,
      hasCharts: charts && charts.length > 0,
      charts: charts || []
    }
    
    records.value.unshift(record) // 新记录放在最前面
    saveToStorage()
    
    return record
  }

  // 更新记录的图表
  const updateCharts = (id: string, charts: ChartConfig[]) => {
    const record = records.value.find(r => r.id === id)
    if (record) {
      record.charts = charts
      record.hasCharts = charts.length > 0
      saveToStorage()
    }
  }

  // 删除记录
  const deleteRecord = (id: string) => {
    records.value = records.value.filter(r => r.id !== id)
    saveToStorage()
  }

  // 批量删除记录
  const deleteRecords = (ids: string[]) => {
    records.value = records.value.filter(r => !ids.includes(r.id))
    saveToStorage()
  }

  // 获取记录详情
  const getRecord = (id: string) => {
    return records.value.find(r => r.id === id)
  }

  // 统计信息
  const stats = computed(() => {
    return {
      totalRecords: records.value.length,
      totalDataAnalyzed: records.value.reduce((sum, r) => sum + r.dataRecordIds.length, 0),
      avgDuration: records.value.reduce((sum, r) => sum + (r.duration || 0), 0) / (records.value.length || 1)
    }
  })

  // 初始化时加载
  // 初始化时加载
  loadRecords()

  return {
    records,
    stats,
    createRecord,
    deleteRecord,
    deleteRecords,
    getRecord,
    updateCharts,
    loadRecords
  }
}
