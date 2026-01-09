/**
 * 系统字段配置
 * 定义系统中可用的标准字段
 */

export interface SystemField {
  /** 字段唯一标识 */
  key: string
  /** 字段显示名称 */
  label: string
  /** 字段类型 */
  type: 'string' | 'number' | 'date' | 'boolean' | 'object'
  /** 是否必填 */
  required?: boolean
  /** 字段描述 */
  description?: string
}

/**
 * 数据导入场景类型
 */
export interface DataImportScenario {
  /** 场景唯一标识 */
  key: string
  /** 场景名称 */
  name: string
  /** 场景描述 */
  description: string
  /** 该场景的系统字段配置 */
  fields: SystemField[]
}

/**
 * 银行流水系统字段配置
 */
export const BANK_STATEMENT_FIELDS: SystemField[] = [
  {
    key: 'transactionDate',
    label: '交易日期',
    type: 'date',
    required: true,
    description: '银行交易发生的日期'
  },
  {
    key: 'transactionTime',
    label: '交易时间',
    type: 'string',
    required: false,
    description: '具体交易时间'
  },
  {
    key: 'summary',
    label: '摘要',
    type: 'string',
    required: true,
    description: '交易摘要说明'
  },
  {
    key: 'oppositeAccount',
    label: '对方账户',
    type: 'string',
    required: false,
    description: '对方账号或名称'
  },
  {
    key: 'oppositeName',
    label: '对方户名',
    type: 'string',
    required: false,
    description: '对方账户名称'
  },
  {
    key: 'debitAmount',
    label: '借方金额',
    type: 'number',
    required: false,
    description: '支出金额'
  },
  {
    key: 'creditAmount',
    label: '贷方金额',
    type: 'number',
    required: false,
    description: '收入金额'
  },
  {
    key: 'balance',
    label: '余额',
    type: 'number',
    required: false,
    description: '账户余额'
  },
  {
    key: 'currencyType',
    label: '币种',
    type: 'string',
    required: false,
    description: '货币类型：人民币、美元等'
  },
  {
    key: 'serialNumber',
    label: '流水号',
    type: 'string',
    required: false,
    description: '银行流水号'
  },
  {
    key: 'remarks',
    label: '备注',
    type: 'string',
    required: false,
    description: '其他备注信息'
  }
]

/**
 * 发票系统字段配置
 */
export const INVOICE_FIELDS: SystemField[] = [
  {
    key: 'invoiceNumber',
    label: '发票号码',
    type: 'string',
    required: true,
    description: '发票唯一编号'
  },
  {
    key: 'invoiceCode',
    label: '发票代码',
    type: 'string',
    required: false,
    description: '发票代码'
  },
  {
    key: 'invoiceDate',
    label: '开票日期',
    type: 'date',
    required: true,
    description: '发票开具日期'
  },
  {
    key: 'invoiceType',
    label: '发票类型',
    type: 'string',
    required: true,
    description: '增值税专用发票、普通发票等'
  },
  {
    key: 'buyerName',
    label: '购买方名称',
    type: 'string',
    required: true,
    description: '购买方公司名称'
  },
  {
    key: 'buyerTaxNumber',
    label: '购买方税号',
    type: 'string',
    required: false,
    description: '购买方纳税人识别号'
  },
  {
    key: 'sellerName',
    label: '销售方名称',
    type: 'string',
    required: true,
    description: '销售方公司名称'
  },
  {
    key: 'sellerTaxNumber',
    label: '销售方税号',
    type: 'string',
    required: false,
    description: '销售方纳税人识别号'
  },
  {
    key: 'totalAmount',
    label: '合计金额',
    type: 'number',
    required: true,
    description: '不含税金额'
  },
  {
    key: 'taxAmount',
    label: '税额',
    type: 'number',
    required: true,
    description: '增值税税额'
  },
  {
    key: 'totalWithTax',
    label: '价税合计',
    type: 'number',
    required: true,
    description: '含税总金额'
  },
  {
    key: 'taxRate',
    label: '税率',
    type: 'string',
    required: false,
    description: '适用税率'
  },
  {
    key: 'remarks',
    label: '备注',
    type: 'string',
    required: false,
    description: '发票备注信息'
  }
]

/**
 * 凭证系统字段配置
 */
export const VOUCHER_FIELDS: SystemField[] = [
  {
    key: 'voucherNumber',
    label: '凭证号',
    type: 'string',
    required: true,
    description: '记账凭证编号'
  },
  {
    key: 'voucherDate',
    label: '凭证日期',
    type: 'date',
    required: true,
    description: '记账日期'
  },
  {
    key: 'voucherType',
    label: '凭证类型',
    type: 'string',
    required: false,
    description: '收款凭证、付款凭证、转账凭证'
  },
  {
    key: 'accountCode',
    label: '科目编码',
    type: 'string',
    required: true,
    description: '会计科目编码'
  },
  {
    key: 'accountName',
    label: '科目名称',
    type: 'string',
    required: true,
    description: '会计科目名称'
  },
  {
    key: 'summary',
    label: '摘要',
    type: 'string',
    required: true,
    description: '业务摘要说明'
  },
  {
    key: 'debitAmount',
    label: '借方金额',
    type: 'number',
    required: false,
    description: '借方发生额'
  },
  {
    key: 'creditAmount',
    label: '贷方金额',
    type: 'number',
    required: false,
    description: '贷方发生额'
  },
  {
    key: 'auxiliaryItem',
    label: '辅助核算',
    type: 'string',
    required: false,
    description: '辅助核算项目'
  },
  {
    key: 'preparedBy',
    label: '制单人',
    type: 'string',
    required: false,
    description: '凭证制作人'
  },
  {
    key: 'reviewedBy',
    label: '审核人',
    type: 'string',
    required: false,
    description: '凭证审核人'
  },
  {
    key: 'remarks',
    label: '备注',
    type: 'string',
    required: false,
    description: '凭证备注信息'
  }
]

/**
 * 财务报表系统字段配置
 */
export const FINANCIAL_STATEMENT_FIELDS: SystemField[] = [
  {
    key: 'reportDate',
    label: '报表日期',
    type: 'date',
    required: true,
    description: '财务报表所属期间'
  },
  {
    key: 'reportType',
    label: '报表类型',
    type: 'string',
    required: true,
    description: '资产负债表、利润表、现金流量表'
  },
  {
    key: 'accountCode',
    label: '科目编码',
    type: 'string',
    required: true,
    description: '会计科目编码'
  },
  {
    key: 'accountName',
    label: '科目名称',
    type: 'string',
    required: true,
    description: '会计科目名称'
  },
  {
    key: 'lineNumber',
    label: '行次',
    type: 'string',
    required: false,
    description: '报表行次'
  },
  {
    key: 'beginningBalance',
    label: '期初余额',
    type: 'number',
    required: false,
    description: '期初余额'
  },
  {
    key: 'endingBalance',
    label: '期末余额',
    type: 'number',
    required: true,
    description: '期末余额'
  },
  {
    key: 'yearBeginningBalance',
    label: '年初余额',
    type: 'number',
    required: false,
    description: '年度期初余额'
  },
  {
    key: 'remarks',
    label: '备注',
    type: 'string',
    required: false,
    description: '备注说明'
  }
]

/**
 * 所有数据导入场景配置
 */
export const DATA_IMPORT_SCENARIOS: DataImportScenario[] = [
  {
    key: 'bank_statement',
    name: '银行流水',
    description: '导入银行流水数据，包括交易日期、摘要、借贷金额、余额等',
    fields: BANK_STATEMENT_FIELDS
  },
  {
    key: 'invoice',
    name: '发票',
    description: '导入发票数据，包括发票号码、开票日期、购销方信息、金额等',
    fields: INVOICE_FIELDS
  },
  {
    key: 'voucher',
    name: '凭证',
    description: '导入会计凭证，包括凭证号、科目、摘要、借贷金额等',
    fields: VOUCHER_FIELDS
  },
  {
    key: 'financial_statement',
    name: '财务报表',
    description: '导入财务报表数据，包括报表类型、科目、期初期末余额等',
    fields: FINANCIAL_STATEMENT_FIELDS
  }
]

/**
 * 字段映射类型
 */
export interface FieldMapping {
  /** 导入文件的字段名 */
  sourceField: string
  /** 系统字段 key */
  targetField: string
  /** 系统字段中文名称（用于展示） */
  targetLabel?: string
}

/**
 * 映射规则模板
 */
export interface MappingTemplate {
  /** 模板唯一标识 */
  id: string
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description?: string
  /** 场景类型 */
  scenarioKey: string
  /** 字段映射配置 */
  mappings: FieldMapping[]
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/**
 * 导入数据类型
 */
export interface ImportData {
  /** 原始数据 */
  rawData: Record<string, any>[]
  /** 字段映射配置 */
  mappings: FieldMapping[]
  /** 导入时间 */
  importTime: string
  /** 文件名 */
  fileName: string
}
