import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import type { FieldMapping, ImportData } from '@/types/system-fields'
import { toast } from 'vue-sonner'

/**
 * 数据导入 composable
 */
export function useDataImport() {
  // 选中的场景类型
  const selectedScenario = ref<string>('')
  // 原始数据
  const rawData = ref<Record<string, any>[]>([])
  // 导入的字段列表
  const importedFields = ref<string[]>([])
  // 字段映射
  const fieldMappings = ref<FieldMapping[]>([])
  // 文件名
  const fileName = ref<string>('')
  // 导入时间
  const importTime = ref<string>('')
  // 是否正在加载
  const loading = ref(false)

  /**
   * 获取缓存 key（包含场景标识）
   */
  const getStorageKey = () => {
    return selectedScenario.value 
      ? `data_import_cache_${selectedScenario.value}` 
      : 'data_import_cache'
  }

  /**
   * 将 Excel 日期序列号转换为 Date 对象
   */
  const excelDateToJSDate = (serial: number): Date => {
    // Excel 日期从 1900-01-01 开始计数（Windows 系统）
    // 注意：Excel 错误地将 1900 当作闰年，所以需要减去 1
    const utc_days = Math.floor(serial - 25569)
    const utc_value = utc_days * 86400
    const date_info = new Date(utc_value * 1000)
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate())
  }

  /**
   * 格式化日期为字符串
   */
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 检测值是否可能是 Excel 日期序列号
   */
  const isExcelDateSerial = (value: any): boolean => {
    // Excel 日期序列号通常在 1 到 50000+ 之间（对应 1900-2036+ 年）
    return typeof value === 'number' && value > 1 && value < 100000 && Number.isInteger(value)
  }

  /**
   * 从 Excel 文件读取数据
   */
  const importFromExcel = async (file: File): Promise<void> => {
    loading.value = true
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      
      // 读取第一个 sheet
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // 转换为 JSON，保留原始单元格格式
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' })
      
      if (jsonData.length === 0) {
        toast.error('Excel 文件中没有数据')
        return
      }

      // 处理日期格式：将可能的 Excel 日期序列号转换为日期字符串
      const processedData = jsonData.map(row => {
        const processedRow: Record<string, any> = {}
        Object.entries(row as Record<string, any>).forEach(([key, value]) => {
          // 如果是日期对象，转换为字符串
          if (value instanceof Date) {
            processedRow[key] = formatDate(value)
          }
          // 如果是可能的 Excel 日期序列号，尝试转换
          else if (isExcelDateSerial(value)) {
            try {
              const date = excelDateToJSDate(value)
              // 验证转换后的日期是否合理（1900-2100年之间）
              if (date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                processedRow[key] = formatDate(date)
              } else {
                processedRow[key] = value
              }
            } catch {
              processedRow[key] = value
            }
          } else {
            processedRow[key] = value
          }
        })
        return processedRow
      })

      // 设置数据
      rawData.value = processedData
      fileName.value = file.name
      importTime.value = new Date().toISOString()
      
      // 提取字段名
      const firstRow = processedData[0] as Record<string, any>
      importedFields.value = Object.keys(firstRow)
      
      // 初始化空的映射
      fieldMappings.value = []
      
      // 缓存到 localStorage
      cacheData()
      
      toast.success(`成功导入 ${processedData.length} 条数据`)
    } catch (error) {
      console.error('导入失败:', error)
      toast.error('导入失败，请检查文件格式')
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加新的映射配置
   */
  const addMapping = () => {
    fieldMappings.value.push({
      sourceField: '',
      targetField: ''
    })
    cacheData()
  }

  /**
   * 更新映射的源字段
   */
  const updateMappingSource = (index: number, sourceField: string) => {
    if (fieldMappings.value[index]) {
      fieldMappings.value[index].sourceField = sourceField
      cacheData()
    }
  }

  /**
   * 更新映射的目标字段
   */
  const updateMappingTarget = (index: number, targetField: string) => {
    if (fieldMappings.value[index]) {
      fieldMappings.value[index].targetField = targetField
      cacheData()
    }
  }

  /**
   * 删除指定的映射
   */
  const removeMapping = (index: number) => {
    fieldMappings.value.splice(index, 1)
    cacheData()
  }

  /**
   * 获取已映射的数据
   */
  const getMappedData = computed(() => {
    if (!rawData.value.length || !fieldMappings.value.length) {
      return []
    }

    return rawData.value.map(row => {
      const mappedRow: Record<string, any> = {}
      
      // 只映射有效的配置（两个字段都已选择）
      fieldMappings.value.forEach(mapping => {
        if (mapping.sourceField && mapping.targetField) {
          mappedRow[mapping.targetField] = row[mapping.sourceField]
        }
      })
      
      return mappedRow
    })
  })

  /**
   * 缓存数据到 localStorage
   */
  const cacheData = () => {
    try {
      const cacheData: ImportData = {
        rawData: rawData.value,
        mappings: fieldMappings.value,
        importTime: importTime.value,
        fileName: fileName.value
      }
      localStorage.setItem(getStorageKey(), JSON.stringify(cacheData))
    } catch (error) {
      console.error('缓存数据失败:', error)
    }
  }

  /**
   * 从缓存加载数据
   */
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(getStorageKey())
      if (cached) {
        const data: ImportData = JSON.parse(cached)
        rawData.value = data.rawData
        fieldMappings.value = data.mappings
        importTime.value = data.importTime
        fileName.value = data.fileName
        
        // 提取字段名
        if (data.rawData.length > 0) {
          importedFields.value = Object.keys(data.rawData[0])
        }
        
        return true
      }
    } catch (error) {
      console.error('加载缓存失败:', error)
    }
    return false
  }

  /**
   * 清除缓存和数据
   */
  const clearData = () => {
    rawData.value = []
    importedFields.value = []
    fieldMappings.value = []
    fileName.value = ''
    importTime.value = ''
    localStorage.removeItem(getStorageKey())
    toast.success('已清除数据')
  }

  /**
   * 保存映射后的数据（可以对接后端 API）
   * 返回保存的数据，以便调用方可以添加到记录中
   */
  const saveMappedData = async () => {
    if (!fieldMappings.value.length) {
      toast.error('请先配置字段映射')
      return { success: false, data: [] }
    }

    loading.value = true
    try {
      const mappedData = getMappedData.value
      
      // TODO: 这里可以调用后端 API 保存数据
      // await post('/api/data-import/save', { data: mappedData })
      
      console.log('准备保存的数据:', mappedData)
      toast.success(`成功保存 ${mappedData.length} 条映射数据`)
      
      return { 
        success: true, 
        data: mappedData,
        mappings: fieldMappings.value,
        fileName: fileName.value
      }
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败，请稍后重试')
      return { success: false, data: [] }
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    selectedScenario,
    rawData,
    importedFields,
    fieldMappings,
    fileName,
    importTime,
    loading,
    getMappedData,
    
    // 方法
    importFromExcel,
    addMapping,
    updateMappingSource,
    updateMappingTarget,
    removeMapping,
    loadFromCache,
    clearData,
    saveMappedData
  }
}
