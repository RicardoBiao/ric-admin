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
 * 客户交易原始数据系统字段配置
 */
export const CUSTOMER_TRANSACTION_FIELDS: SystemField[] = [
  {
    key: 'customerName',
    label: '客户名称',
    type: 'string',
    required: true,
    description: '客户的公司或个人名称'
  },
  {
    key: 'transactionDate',
    label: '交易日期',
    type: 'date',
    required: true,
    description: '交易发生的日期'
  },
  {
    key: 'transactionAmount',
    label: '交易金额',
    type: 'number',
    required: true,
    description: '交易的金额数值'
  },
  {
    key: 'productName',
    label: '产品名称',
    type: 'string',
    required: false,
    description: '交易的产品或服务名称'
  },
  {
    key: 'invoiceNumber',
    label: '发票号码',
    type: 'string',
    required: false,
    description: '发票的唯一编号'
  },
  {
    key: 'paymentMethod',
    label: '支付方式',
    type: 'string',
    required: false,
    description: '支付方式：现金、转账、支票等'
  },
  {
    key: 'taxAmount',
    label: '税额',
    type: 'number',
    required: false,
    description: '交易的税额'
  },
  {
    key: 'discount',
    label: '折扣',
    type: 'number',
    required: false,
    description: '折扣金额或比例'
  },
  {
    key: 'status',
    label: '状态',
    type: 'string',
    required: false,
    description: '交易状态：待处理、已完成、已取消等'
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
 * 员工信息系统字段配置
 */
export const EMPLOYEE_FIELDS: SystemField[] = [
  {
    key: 'employeeId',
    label: '员工编号',
    type: 'string',
    required: true,
    description: '员工的唯一编号'
  },
  {
    key: 'employeeName',
    label: '姓名',
    type: 'string',
    required: true,
    description: '员工姓名'
  },
  {
    key: 'department',
    label: '部门',
    type: 'string',
    required: true,
    description: '所属部门'
  },
  {
    key: 'position',
    label: '职位',
    type: 'string',
    required: false,
    description: '职位名称'
  },
  {
    key: 'email',
    label: '邮箱',
    type: 'string',
    required: false,
    description: '电子邮箱地址'
  },
  {
    key: 'phone',
    label: '电话',
    type: 'string',
    required: false,
    description: '联系电话'
  },
  {
    key: 'hireDate',
    label: '入职日期',
    type: 'date',
    required: false,
    description: '入职时间'
  },
  {
    key: 'salary',
    label: '薪资',
    type: 'number',
    required: false,
    description: '员工薪资'
  }
]

/**
 * 产品库存系统字段配置
 */
export const PRODUCT_INVENTORY_FIELDS: SystemField[] = [
  {
    key: 'productCode',
    label: '产品编码',
    type: 'string',
    required: true,
    description: '产品的唯一编码'
  },
  {
    key: 'productName',
    label: '产品名称',
    type: 'string',
    required: true,
    description: '产品的名称'
  },
  {
    key: 'category',
    label: '产品类别',
    type: 'string',
    required: false,
    description: '产品所属类别'
  },
  {
    key: 'quantity',
    label: '库存数量',
    type: 'number',
    required: true,
    description: '当前库存数量'
  },
  {
    key: 'unitPrice',
    label: '单价',
    type: 'number',
    required: false,
    description: '产品单价'
  },
  {
    key: 'unit',
    label: '单位',
    type: 'string',
    required: false,
    description: '计量单位'
  },
  {
    key: 'warehouse',
    label: '仓库位置',
    type: 'string',
    required: false,
    description: '存放的仓库位置'
  },
  {
    key: 'supplier',
    label: '供应商',
    type: 'string',
    required: false,
    description: '产品供应商'
  }
]

/**
 * 财务报表系统字段配置
 */
export const FINANCIAL_STATEMENT_FIELDS: SystemField[] = [
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
    key: 'period',
    label: '期间',
    type: 'string',
    required: true,
    description: '会计期间'
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
    key: 'balance',
    label: '余额',
    type: 'number',
    required: false,
    description: '期末余额'
  },
  {
    key: 'balanceDirection',
    label: '余额方向',
    type: 'string',
    required: false,
    description: '借方或贷方'
  }
]

/**
 * 所有数据导入场景配置
 */
export const DATA_IMPORT_SCENARIOS: DataImportScenario[] = [
  {
    key: 'customer_transaction',
    name: '客户交易数据',
    description: '导入客户交易原始数据，包括交易日期、金额、产品等信息',
    fields: CUSTOMER_TRANSACTION_FIELDS
  },
  {
    key: 'employee',
    name: '员工信息',
    description: '导入员工基本信息，包括编号、姓名、部门、职位等',
    fields: EMPLOYEE_FIELDS
  },
  {
    key: 'product_inventory',
    name: '产品库存',
    description: '导入产品库存数据，包括产品编码、名称、库存数量等',
    fields: PRODUCT_INVENTORY_FIELDS
  },
  {
    key: 'financial_statement',
    name: '财务报表',
    description: '导入财务报表数据，包括科目编码、借贷金额等',
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
