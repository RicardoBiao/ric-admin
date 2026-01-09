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
  /** 数据快照（包含场景、字段等信息） */
  dataSnapshot: {
    scenarioKey: string
    scenarioName: string
    fileName: string
    rowCount: number
    data: Record<string, any>[]
    mappings: Array<{
      sourceField: string
      targetField: string
      targetLabel: string
    }>
  }[]
  /** 用户的分析诉求 */
  prompt: string
  /** DeepSeek 的分析结果 */
  result: string
  /** 分析时间 */
  analyzedAt: string
  /** 分析耗时（毫秒） */
  duration?: number
}
