import { ref, computed } from 'vue'

/**
 * 保存的数据记录
 */
export interface SavedDataRecord {
  /** 记录唯一标识 */
  id: string
  /** 批次ID - 同一次导入的文件共享同一个批次ID */
  batchId: string
  /** 批次名称 */
  batchName: string
  /** 文件名 */
  fileName: string
  /** 文件类型 */
  fileType: string
  /** 文件大小（字节） */
  fileSize: number
  /** 保存时间 */
  savedAt: string
  /** 原始文件内容（base64编码，用于图片等） */
  fileContent?: string
  /** 数据行数（仅Excel等表格文件） */
  rowCount?: number
  /** 表格数据（仅Excel等表格文件） */
  data?: Record<string, any>[]
  /** 文件描述 */
  description?: string
  /** 文件分类标签（如：发票、流水、合同等） */
  tags?: string[]
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
        const data = JSON.parse(stored)
        // 验证和清理数据，过滤掉不符合新结构的旧数据
        records.value = data.filter((record: any) => {
          // 必需字段检查
          return record.id && 
                 record.batchId && 
                 record.batchName && 
                 record.fileName && 
                 record.fileType !== undefined && 
                 record.fileSize !== undefined &&
                 record.savedAt
        })
        
        // 如果过滤后数据有变化，保存清理后的数据
        if (records.value.length !== data.length) {
          console.log(`已清理 ${data.length - records.value.length} 条无效记录`)
          saveToStorage()
        }
      }
    } catch (error) {
      console.error('加载保存的数据记录失败:', error)
      // 如果数据损坏，清空记录
      records.value = []
    }
  }

  /**
   * 保存记录到 localStorage
   */
  const saveToStorage = () => {
    try {
      const dataStr = JSON.stringify(records.value)
      console.log(`[useSavedData] 尝试保存 ${records.value.length} 条记录，大小: ${(dataStr.length / 1024 / 1024).toFixed(2)} MB`)
      localStorage.setItem(SAVED_DATA_KEY, dataStr)
      console.log('[useSavedData] 保存成功')
    } catch (error: any) {
      console.error('[useSavedData] 保存数据记录失败:', error)
      
      // 如果是配额超出错误
      if (error.name === 'QuotaExceededError') {
        alert(`存储空间不足！\n当前已保存 ${records.value.length} 条记录。\n建议：\n1. 删除一些旧数据\n2. 导出重要数据后清空存储\n3. 减少大文件（图片、PDF）的存储`)
        throw error
      }
    }
  }

  /**
   * 获取指定批次的所有记录
   */
  const getRecordsByBatch = (batchId: string) => {
    return computed(() => 
      records.value.filter(r => r.batchId === batchId)
    )
  }

  /**
   * 获取所有批次列表
   */
  const getBatches = () => {
    const batchMap = new Map<string, { id: string; name: string; count: number; savedAt: string }>()
    
    records.value.forEach(record => {
      if (!batchMap.has(record.batchId)) {
        batchMap.set(record.batchId, {
          id: record.batchId,
          name: record.batchName,
          count: 0,
          savedAt: record.savedAt
        })
      }
      const batch = batchMap.get(record.batchId)!
      batch.count++
      // 使用最新的保存时间
      if (record.savedAt > batch.savedAt) {
        batch.savedAt = record.savedAt
      }
    })

    return Array.from(batchMap.values()).sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    )
  }

  /**
   * 添加新的数据记录
   */
  const addRecord = (
    batchId: string,
    batchName: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    fileContent?: string,
    data?: Record<string, any>[],
    description?: string,
    tags?: string[]
  ): SavedDataRecord => {
    const record: SavedDataRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      batchId,
      batchName,
      fileName,
      fileType,
      fileSize,
      savedAt: new Date().toISOString(),
      fileContent,
      rowCount: data?.length,
      data,
      description,
      tags: tags || []
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
    const totalRecords = records.value.length
    const totalRows = records.value.reduce((sum, r) => sum + (r.rowCount || 0), 0)
    const batches = getBatches()
    
    return {
      totalRecords,
      totalRows,
      batchCount: batches.length
    }
  }

  /**
   * 更新记录的标签
   */
  const updateRecordTags = (id: string, tags: string[]) => {
    const record = records.value.find(r => r.id === id)
    if (record) {
      record.tags = tags
      saveToStorage()
    }
  }

  /**
   * 批量更新记录的标签
   */
  const updateRecordTagsBatch = (ids: string[], tags: string[]) => {
    ids.forEach(id => {
      const record = records.value.find(r => r.id === id)
      if (record) {
        record.tags = [...(record.tags || []), ...tags].filter((t, i, arr) => arr.indexOf(t) === i) // 去重
      }
    })
    saveToStorage()
  }

  /**
   * 获取存储使用情况
   */
  const getStorageInfo = () => {
    try {
      const dataStr = JSON.stringify(records.value)
      const sizeInBytes = dataStr.length
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2)
      // localStorage 通常限制在 5-10 MB
      const estimatedLimit = 5 * 1024 * 1024 // 5MB
      const usagePercent = ((sizeInBytes / estimatedLimit) * 100).toFixed(1)
      
      return {
        records: records.value.length,
        sizeInBytes,
        sizeInMB,
        usagePercent
      }
    } catch (error) {
      console.error('获取存储信息失败:', error)
      return null
    }
  }

  // 初始加载
  loadRecords()

  return {
    records,
    getRecordsByBatch,
    getBatches,
    addRecord,
    deleteRecord,
    deleteRecords,
    getRecordById,
    getStats,
    updateRecordTags,
    updateRecordTagsBatch,
    getStorageInfo
  }
}
