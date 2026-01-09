import { ref, computed } from 'vue'
import type { FieldMapping } from '@/types/system-fields'

/**
 * 保存的数据记录
 */
export interface SavedDataRecord {
  /** 记录唯一标识 */
  id: string
  /** 场景类型 */
  scenarioKey: string
  /** 场景名称 */
  scenarioName: string
  /** 文件名 */
  fileName: string
  /** 保存时间 */
  savedAt: string
  /** 数据行数 */
  rowCount: number
  /** 字段映射配置 */
  mappings: FieldMapping[]
  /** 映射后的数据 */
  data: Record<string, any>[]
}

const SAVED_DATA_KEY = 'saved_data_records'

/**
 * 已保存数据管理 composable
 */
export function useSavedData() {
  const records = ref<SavedDataRecord[]>([])

  /**
   * 从 localStorage 加载所有记录
   */
  const loadRecords = () => {
    try {
      const stored = localStorage.getItem(SAVED_DATA_KEY)
      if (stored) {
        records.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载保存的数据记录失败:', error)
    }
  }

  /**
   * 保存记录到 localStorage
   */
  const saveToStorage = () => {
    try {
      localStorage.setItem(SAVED_DATA_KEY, JSON.stringify(records.value))
    } catch (error) {
      console.error('保存数据记录失败:', error)
    }
  }

  /**
   * 获取指定场景的所有记录
   */
  const getRecordsByScenario = (scenarioKey: string) => {
    return computed(() => 
      records.value.filter(r => r.scenarioKey === scenarioKey)
    )
  }

  /**
   * 添加新的数据记录
   */
  const addRecord = (
    scenarioKey: string,
    scenarioName: string,
    fileName: string,
    mappings: FieldMapping[],
    data: Record<string, any>[]
  ): SavedDataRecord => {
    const record: SavedDataRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scenarioKey,
      scenarioName,
      fileName,
      savedAt: new Date().toISOString(),
      rowCount: data.length,
      mappings,
      data
    }

    records.value.unshift(record) // 新记录放在最前面
    saveToStorage()
    
    return record
  }

  /**
   * 删除记录
   */
  const deleteRecord = (id: string) => {
    const index = records.value.findIndex(r => r.id === id)
    if (index >= 0) {
      records.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 批量删除记录
   */
  const deleteRecords = (ids: string[]) => {
    records.value = records.value.filter(r => !ids.includes(r.id))
    saveToStorage()
  }

  /**
   * 根据 ID 获取记录
   */
  const getRecordById = (id: string) => {
    return records.value.find(r => r.id === id)
  }

  /**
   * 获取统计信息
   */
  const getStats = () => {
    return computed(() => {
      const totalRecords = records.value.length
      const totalRows = records.value.reduce((sum, r) => sum + r.rowCount, 0)
      const scenarioStats = new Map<string, number>()
      
      records.value.forEach(r => {
        scenarioStats.set(
          r.scenarioKey,
          (scenarioStats.get(r.scenarioKey) || 0) + 1
        )
      })

      return {
        totalRecords,
        totalRows,
        scenarioStats: Object.fromEntries(scenarioStats)
      }
    })
  }

  // 初始加载
  loadRecords()

  return {
    records,
    getRecordsByScenario,
    addRecord,
    deleteRecord,
    deleteRecords,
    getRecordById,
    getStats,
    loadRecords
  }
}
