/**
 * 数据分析相关类型定义
 */

/**
 * 分析诉求模板
 */
export interface AnalysisPromptTemplate {
  /** 模板唯一标识 */
  id: string
  /** 模板名称 */
  name: string
  /** 分析诉求内容 */
  content: string
  /** 创建时间 */
  createdAt: string
  /** 最后使用时间 */
  lastUsedAt?: string
}

/**
 * 分析记录
 */
export interface AnalysisRecord {
  /** 记录唯一标识 */
  id: string
  /** 分析标题 */
  title: string
  /** 使用的数据记录ID列表 */
  dataRecordIds: string[]
  /** 数据快照（包含批次、文件等信息） */
  dataSnapshot: {
    batchId: string
    batchName: string
    fileName: string
    fileType: string
    fileSize: number
    rowCount?: number
    data?: Record<string, any>[]
    description?: string
  }[]
  /** 用户的分析诉求 */
  prompt: string
  /** DeepSeek 的分析结果 */
  result: string
  /** 分析时间 */
  analyzedAt: string
  /** 分析耗时（毫秒） */
  duration?: number
  /** 是否已生成图表 */
  hasCharts?: boolean
  /** 图表配置数据 */
  charts?: ChartConfig[]
}

/**
 * 图表配置
 */
export interface ChartConfig {
  /** 图表ID */
  id: string
  /** 图表标题 */
  title: string
  /** 图表类型 */
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'radar'
  /** 图表配置选项 */
  option: any
  /** 图表数据说明 */
  description?: string
}
