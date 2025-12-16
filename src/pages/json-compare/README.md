# JSON 对比工具

## 功能概述

一个强大的 JSON 数据对比工具，支持多种输入方式和灵活的键名过滤，能够快速定位数据差异并生成详细的统计报告。

### 主要功能

#### 1. 双模式数据输入
- **Excel 上传模式**
  - 上传 `.xlsx` 或 `.xls` 格式文件
  - 自动解析第一个工作表
  - 选择任意两列进行对比
  - 支持逐行导航（上一条/下一条）
  - 适用于批量数据对比场景

- **直接输入模式**
  - 支持直接粘贴或输入 JSON 数据
  - 提供 JSON 格式化按钮
  - 实时语法校验和错误提示
  - 适用于临时对比或调试场景

#### 2. 智能键名过滤
- **可视化选择**
  - 自动提取两个 JSON 中的所有键名
  - 去重并排序显示
  - 弹窗式多选界面
  - 全选/清空快捷操作

- **JSON 配置**
  - 支持粘贴 JSON 数组：`["key1", "key2"]`
  - 支持粘贴 JSON 对象：`{"key1": "", "key2": ""}`
  - 自动从对象中提取键名

- **匹配规则**
  - 完全匹配：键名完全相同
  - 路径结尾匹配：支持嵌套对象（如 `data.key` 匹配 `key`）

#### 3. 多维度统计分析
- **当前行统计**（Excel 模式）
  - 完全一致：键值完全相同的数量
  - 同键不同值：键存在但值不同的数量
  - 仅列 A：只在左侧 JSON 存在的键
  - 仅列 B：只在右侧 JSON 存在的键
  - 一致率：匹配百分比（精确到 0.1%）

- **全量汇总**（Excel 批量模式）
  - 按行统计整个 Excel 文件的对比结果
  - 一致行数/不同值行数/单侧存在行数
  - 整体一致率计算
  - 支持键名过滤后的重新统计

#### 4. 差异可视化
- **颜色编码**
  - 🟢 绿色：完全一致
  - 🟡 黄色：同键不同值
  - 🔴 红色：仅左侧存在
  - 🔵 蓝色：仅右侧存在

- **详细对比表格**
  - 键名（Key）：扁平化路径显示
  - 左侧值（JSON A / 列 A）
  - 右侧值（JSON B / 列 B）
  - 状态标识

#### 5. 交互优化
- **折叠预览**
  - 列 A 和列 B 原始数据默认折叠
  - 点击任一列标题同步展开/收起
  - 节省屏幕空间，聚焦对比结果

- **快速导航**
  - 点击统计卡片自动滚动到对比结果区域
  - 逐行导航控制
  - 列选择器快速切换

## 技术实现核心

### 1. 数据结构扁平化（toPathMap）

```typescript
function toPathMap(input: any, parentKey = ''): Record<string, any>
```

**核心思想**：将嵌套的 JSON 对象/数组转换为扁平化的键值对映射

**实现要点**：
- 递归处理对象和数组
- 使用点号（`.`）连接对象路径
- 使用方括号（`[index]`）标记数组索引
- 支持任意深度的嵌套结构

**示例转换**：
```javascript
// 输入
{ 
  user: { 
    name: "张三", 
    tags: ["VIP", "活跃"] 
  } 
}

// 输出
{
  "user.name": "张三",
  "user.tags.[0]": "VIP",
  "user.tags.[1]": "活跃"
}
```

### 2. 差异计算算法（computeDiff）

```typescript
function computeDiff(leftParsed: any, rightParsed: any): DiffRow[]
```

**流程**：
1. 将左右两个 JSON 分别扁平化
2. 合并所有键名（并集）
3. 应用键名过滤（如果有）
4. 逐键比较差异：
   - 两侧都存在 → 深度相等检查 → `same` / `diff-value`
   - 仅左侧存在 → `left-only`
   - 仅右侧存在 → `right-only`

### 3. 响应式状态管理

**核心状态**：
```typescript
// 数据源
const rows = ref<Record<string, any>[]>([])  // Excel 数据
const directJsonLeft = ref('')                // 直接输入
const directJsonRight = ref('')

// 配置
const colLeft = ref<string>('')               // 列选择
const rowIndex = ref<number>(0)               // 行索引
const filteredKeys = ref<string[]>([])        // 过滤键

// UI 状态
const showPreview = ref(false)                // 预览折叠
const showKeyFilterModal = ref(false)         // 弹窗显示
```

**计算属性链**：
```
currentRow (当前行数据)
    ↓
currentJson (当前对比的 JSON)
    ↓
availableKeys (可用键名列表)
    ↓
diffRows (差异行列表)
    ↓
summary (当前统计) / globalSummary (全量统计)
```

### 4. 双模式自动检测

```typescript
const currentJson = computed(() => {
  const hasDirectInput = directJsonLeft.value.trim() || directJsonRight.value.trim()
  
  if (hasDirectInput) {
    // 直接输入模式
    return { leftParsed, rightParsed, isDirectInput: true }
  }
  
  // Excel 模式
  return { leftParsed, rightParsed, isDirectInput: false }
})
```

**优先级**：直接输入 > Excel 上传

### 5. 键名过滤匹配策略

```typescript
// 完全匹配
if (fullKey === filterKey) return true

// 路径结尾匹配（支持嵌套）
if (fullKey.endsWith('.' + filterKey)) return true
if (fullKey.endsWith('[' + filterKey + ']')) return true
```

**场景覆盖**：
- 顶层键：`name` 匹配 `name`
- 嵌套键：`user.name` 被过滤器 `name` 匹配
- 数组键：`tags[0]` 被过滤器 `0` 匹配

### 6. 全量统计算法

**Excel 模式特殊处理**：
```typescript
rows.value.forEach(row => {
  const leftParsed = safeParseSilent(row[colLeft.value])
  const rightParsed = safeParseSilent(row[colRight.value])
  
  if (filteredKeys.value.length > 0) {
    // 按过滤后的键进行逐行对比
    // 有任意键不同 → diffValue，全部一致 → same
  } else {
    // 深度相等检查整个对象
    if (isDeepEqual(leftParsed, rightParsed)) same++
  }
})
```

## 依赖库

- **Vue 3**：响应式框架
- **XLSX**（SheetJS）：Excel 文件解析
- **TypeScript**：类型安全

## 使用场景

1. **数据验证**：对比系统输出与预期结果
2. **配置审查**：比较不同环境的配置文件
3. **API 测试**：验证接口返回数据一致性
4. **数据迁移**：确认迁移前后数据完整性
5. **批量对账**：Excel 批量数据核对

## 性能优化点

1. **计算属性缓存**：避免重复计算
2. **按需渲染**：折叠/弹窗控制 DOM 数量
3. **扁平化一次**：缓存 pathMap 结果
4. **静默解析**：全量统计时不触发错误提示

## 扩展可能性

- [ ] 支持导出对比报告（PDF/Excel）
- [ ] 高亮显示具体差异字符
- [ ] 支持 CSV/JSON 文件上传
- [ ] 自定义匹配规则（正则/模糊匹配）
- [ ] 历史记录保存
- [ ] 并排 Diff 视图模式
