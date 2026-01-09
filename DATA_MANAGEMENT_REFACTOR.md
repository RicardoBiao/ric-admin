# 数据管理重构说明

## 改动概述

将数据管理系统从**场景类型+字段映射**模式重构为**批次+任意文件**模式，极大简化了用户操作流程。

## 主要变更

### 1. 数据模型变更 (`src/composables/useSavedData.ts`)

**之前：**
```typescript
interface SavedDataRecord {
  id: string
  scenarioKey: string      // 场景类型（银行流水、发票等）
  scenarioName: string
  fileName: string
  mappings: FieldMapping[] // 字段映射配置
  data: Record<string, any>[]
  rowCount: number
}
```

**现在：**
```typescript
interface SavedDataRecord {
  id: string
  batchId: string          // 批次ID（同批次文件共享）
  batchName: string        // 批次名称
  fileName: string
  fileType: string         // 文件MIME类型
  fileSize: number
  fileContent?: string     // base64内容（图片等）
  data?: Record<string, any>[]      // 表格数据（仅Excel）
  rowCount?: number        // 数据行数（仅Excel）
  description?: string
}
```

### 2. 新增功能

#### 批次管理
- `getBatches()`: 获取所有批次列表，按时间倒序
- `getRecordsByBatch()`: 按批次ID筛选文件
- 批次自动分组：同一次导入的多个文件共享同一个batchId

#### 多文件类型支持
- **图片**：存储base64内容，支持预览
- **Excel**：解析为JSON数据，支持数据预览和导出
- **PDF/其他**：存储base64内容，显示文件信息

### 3. 组件变更

#### 新增 `FileImportSheet.vue`
替代原 `DataImportSheet.vue`，核心特性：
- 移除场景选择步骤
- 移除字段映射配置
- 支持多文件批量上传（`multiple` 属性）
- 图片文件自动生成预览
- Excel文件自动解析为JSON

**使用示例：**
```vue
<FileImportSheet
  v-model:open="showImportSheet"
  @saved="handleDataImported"
/>
```

#### 数据管理页面 (`src/pages/data-management/index.vue`)
**侧边栏变更：**
- 从"按场景分类"改为"按批次分类"
- 显示批次名称、文件数量、创建时间

**列表显示变更：**
- 添加文件类型图标（Excel绿色、PDF红色、图片预览）
- 显示文件大小而非数据行数
- 仅Excel文件显示"导出"按钮

**详情对话框变更：**
- 显示批次名称、文件类型、文件大小
- 图片文件支持预览
- Excel数据显示所有列（不再依赖映射配置）

### 4. 工具函数

新增 `formatFileSize(bytes)`：
```typescript
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
```

### 5. DeepSeek 分析调整

**数据上下文生成：**
```typescript
// 之前：强制要求场景和映射
const dataContext = `
场景类型：${record.scenarioName}
字段列表：${record.mappings.map(...).join('、')}
数据预览：${JSON.stringify(record.data.slice(0, 5))}
`

// 现在：根据文件类型动态生成
const dataContext = `
文件名：${record.fileName}
批次：${record.batchName}
文件类型：${record.fileType}
${record.data ? `数据预览：${JSON.stringify(record.data.slice(0, 5))}` : ''}
`
```

**图表生成：**
- 移除自动图表生成逻辑（`generateFinancialCharts`）
- 仅依赖 DeepSeek AI 解析的图表配置
- 如果AI未返回图表，分析结果将不包含图表

## 使用流程

### 旧流程（5步）
1. 打开导入侧滑
2. 选择数据类型（银行流水/发票/凭证/财务报表）
3. 上传Excel文件
4. 配置字段映射（拖拽匹配）
5. 保存

### 新流程（3步）
1. 打开导入侧滑
2. 输入批次名称（如"2026年Q1财务数据"）
3. 选择任意数量的文件（Excel、图片、PDF等）→ 保存

## 兼容性说明

### 向后不兼容
- 旧的 `SavedDataRecord` 数据无法直接迁移
- localStorage中的旧数据需要手动清除：`localStorage.removeItem('saved_data_records')`

### API兼容
- `useSavedData()` composable 接口完全变更
- 移除：`getRecordsByScenario()`
- 新增：`getBatches()`, `getRecordsByBatch()`
- `addRecord()` 参数签名完全不同

## 示例代码

### 导入多个文件到同一批次
```typescript
const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const batchName = '2026年Q1财务数据'

// 导入Excel
const excelData = XLSX.utils.sheet_to_json(sheet)
addRecord(batchId, batchName, 'sales.xlsx', 'application/vnd.ms-excel', 
          50000, undefined, excelData, `共${excelData.length}行`)

// 导入图片
const imageBase64 = await readAsDataURL(imageFile)
addRecord(batchId, batchName, 'receipt.jpg', 'image/jpeg', 
          15000, imageBase64, undefined, '发票扫描件')

// 导入PDF
const pdfBase64 = await readAsDataURL(pdfFile)
addRecord(batchId, batchName, 'contract.pdf', 'application/pdf', 
          200000, pdfBase64, undefined, '合同文件')
```

### 查询批次文件
```typescript
const batches = getBatches() 
// [{ id: 'batch_xxx', name: '2026年Q1财务数据', count: 3, savedAt: '...' }]

const batchFiles = getRecordsByBatch('batch_xxx').value
// [{ fileName: 'sales.xlsx', ... }, { fileName: 'receipt.jpg', ... }]
```

## 后续优化建议

1. **文件预览增强**：PDF预览、Word文档预览
2. **批量操作**：批次级别的删除、导出
3. **文件关联**：建立文件之间的关联关系
4. **版本管理**：同一文件的多个版本管理
5. **搜索优化**：支持文件内容搜索（OCR、全文检索）

## 测试检查点

- [ ] 批量导入多种类型文件
- [ ] 图片文件预览正常
- [ ] Excel数据解析正确
- [ ] 批次侧边栏显示正常
- [ ] 文件详情对话框信息完整
- [ ] DeepSeek分析支持多文件类型
- [ ] 导出Excel功能正常
- [ ] 删除文件和批次功能正常
