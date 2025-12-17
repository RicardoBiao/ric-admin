<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue'
import * as XLSX from 'xlsx'

interface DiffRow {
  key: string
  left: unknown
  right: unknown
  status: 'same' | 'diff-value' | 'left-only' | 'right-only'
}

const rows = ref<Record<string, any>[]>([])
const headers = ref<string[]>([])
const colLeft = ref<string>('')
const colRight = ref<string>('')
const rowIndex = ref<number>(0)
const parseErrors = reactive({ left: '', right: '' })
const loading = ref(false)
const fileName = ref('')
const resultSection = ref<HTMLElement | null>(null)

// 直接输入模式
const directJsonLeft = ref('')
const directJsonRight = ref('')
const keyFilterJson = ref('')
const editorErrors = reactive({ left: '', right: '', filter: '' })
const filteredKeys = ref<string[]>([])
const showPreview = ref(false)
const showKeyFilterModal = ref(false)
const inputMode = ref<'excel' | 'direct'>('excel') // 输入模式切换

const currentRow = computed(() => rows.value[rowIndex.value] || null)
const keySearchQuery = ref('')

const currentJson = computed(() => {
  // 根据当前模式决定使用哪种输入源
  if (inputMode.value === 'direct') {
    const leftClean = directJsonLeft.value.trim()
    const rightClean = directJsonRight.value.trim()
    const leftParsed = safeParse(leftClean, 'left')
    const rightParsed = safeParse(rightClean, 'right')
    return {
      leftRaw: leftClean,
      rightRaw: rightClean,
      leftParsed,
      rightParsed,
      isDirectInput: true,
    }
  }
  
  // Excel 模式
  const leftRaw = currentRow.value && colLeft.value ? (currentRow.value[colLeft.value] ?? '').toString().trim() : ''
  const rightRaw = currentRow.value && colRight.value ? (currentRow.value[colRight.value] ?? '').toString().trim() : ''

  const leftParsed = safeParse(leftRaw, 'left')
  const rightParsed = safeParse(rightRaw, 'right')

  return {
    leftRaw: typeof leftRaw === 'string' ? leftRaw : JSON.stringify(leftRaw ?? ''),
    rightRaw: typeof rightRaw === 'string' ? rightRaw : JSON.stringify(rightRaw ?? ''),
    leftParsed,
    rightParsed,
    isDirectInput: false,
  }
})

const availableKeys = computed(() => {
  const leftParsed = currentJson.value.leftParsed
  const rightParsed = currentJson.value.rightParsed
  if (!leftParsed && !rightParsed) return []
  
  const leftMap = leftParsed ? toPathMap(leftParsed) : {}
  const rightMap = rightParsed ? toPathMap(rightParsed) : {}
  const allKeys = new Set([...Object.keys(leftMap), ...Object.keys(rightMap)])
  return Array.from(allKeys).sort()
})

const filteredAvailableKeys = computed(() => {
  if (!keySearchQuery.value.trim()) {
    return availableKeys.value
  }
  const query = keySearchQuery.value.toLowerCase()
  return availableKeys.value.filter(key => key.toLowerCase().includes(query))
})

const diffRows = computed<DiffRow[]>(() => computeDiff(currentJson.value.leftParsed, currentJson.value.rightParsed))

const summary = computed(() => {
  const total = diffRows.value.length
  const same = diffRows.value.filter(r => r.status === 'same').length
  const diffValue = diffRows.value.filter(r => r.status === 'diff-value').length
  const leftOnly = diffRows.value.filter(r => r.status === 'left-only').length
  const rightOnly = diffRows.value.filter(r => r.status === 'right-only').length
  const matchPercent = total === 0 ? 0 : Math.round((same / total) * 1000) / 10 // 0.1 精度
  return { total, same, diffValue, leftOnly, rightOnly, matchPercent }
})

const globalSummary = computed(() => {
  const totalRows = rows.value.length
  if (!colLeft.value || !colRight.value || totalRows === 0) {
    return { totalRows: 0, same: 0, diffValue: 0, leftOnly: 0, rightOnly: 0, matchPercent: 0 }
  }

  let same = 0
  let diffValue = 0
  let leftOnly = 0
  let rightOnly = 0

  rows.value.forEach(row => {
    const leftParsed = safeParseSilent(row[colLeft.value])
    const rightParsed = safeParseSilent(row[colRight.value])

    // 如果两边都为空，判断为一致
    if (!leftParsed && !rightParsed) {
      same += 1
      return
    }

    if (leftParsed && rightParsed) {
      // 如果有键过滤，只比较过滤后的键
      if (filteredKeys.value.length > 0) {
        const leftMap = toPathMap(leftParsed)
        const rightMap = toPathMap(rightParsed)
        const allKeys = new Set([...Object.keys(leftMap), ...Object.keys(rightMap)])
        const matchedKeys = Array.from(allKeys).filter(fullKey => 
          filteredKeys.value.some(filterKey => matchesFilterKey(fullKey, filterKey))
        )
        
        // 如果没有匹配的键，检查过滤的键是否在两边都不存在
        if (matchedKeys.length === 0) {
          let allFilteredKeysNotExist = true
          filteredKeys.value.forEach(filterKey => {
            const leftHasKey = Object.keys(leftMap).some(k => matchesFilterKey(k, filterKey))
            const rightHasKey = Object.keys(rightMap).some(k => matchesFilterKey(k, filterKey))
            
            if (leftHasKey && !rightHasKey) {
              leftOnly += 1
              allFilteredKeysNotExist = false
            } else if (!leftHasKey && rightHasKey) {
              rightOnly += 1
              allFilteredKeysNotExist = false
            } else if (leftHasKey || rightHasKey) {
              allFilteredKeysNotExist = false
            }
          })
          
          // 如果所有过滤的键在两边都不存在，记为一致
          if (allFilteredKeysNotExist) {
            same += 1
          }
          return
        }
        
        let hasAnyDiff = false
        matchedKeys.forEach(key => {
          const l = leftMap[key]
          const r = rightMap[key]
          if (l !== undefined && r !== undefined) {
            if (!isDeepEqual(l, r)) {
              hasAnyDiff = true
            }
          } else {
            hasAnyDiff = true
          }
        })
        
        if (hasAnyDiff) {
          diffValue += 1
        } else {
          same += 1
        }
      } else {
        if (isDeepEqual(leftParsed, rightParsed)) {
          same += 1
        } else {
          diffValue += 1
        }
      }
    } else if (leftParsed) {
      leftOnly += 1
    } else if (rightParsed) {
      rightOnly += 1
    }
  })

  const matchPercent = totalRows === 0 ? 0 : Math.round((same / totalRows) * 1000) / 10
  return { totalRows, same, diffValue, leftOnly, rightOnly, matchPercent }
})

// 键名匹配辅助函数
function matchesFilterKey(fullKey: string, filterKey: string): boolean {
  if (fullKey === filterKey) return true
  if (fullKey.endsWith('.' + filterKey)) return true
  if (fullKey.includes('.' + filterKey)) return true
  const parts = fullKey.split('.')
  if (parts[parts.length - 1] === filterKey) return true
  return false
}

function toPathMap(input: any, parentKey = ''): Record<string, any> {
  const map: Record<string, any> = {}

  const makeKey = (suffix: string) => (parentKey ? `${parentKey}.${suffix}` : suffix)

  if (Array.isArray(input)) {
    input.forEach((item, idx) => {
      const key = makeKey(`[${idx}]`)
      if (item !== null && typeof item === 'object') {
        Object.assign(map, toPathMap(item, key))
      } else {
        map[key] = item
      }
    })
    return map
  }

  if (input !== null && typeof input === 'object') {
    Object.entries(input).forEach(([k, v]) => {
      const key = makeKey(k)
      if (v !== null && typeof v === 'object') {
        Object.assign(map, toPathMap(v, key))
      } else {
        map[key] = v
      }
    })
    return map
  }

  // primitive fallback
  map[parentKey || '(root)'] = input
  return map
}

function computeDiff(leftParsed: any, rightParsed: any): DiffRow[] {
  // 只有当两边都是 null/undefined 时才返回空数组
  if (leftParsed === null && rightParsed === null) return []
  if (leftParsed === undefined && rightParsed === undefined) return []
  
  const leftMap = toPathMap(leftParsed || {})
  const rightMap = toPathMap(rightParsed || {})
  let keys = new Set([...Object.keys(leftMap), ...Object.keys(rightMap)])
  
  // 如果有键名过滤，只比对指定的键
  if (filteredKeys.value.length > 0) {
    const allKeys = Array.from(keys)
    const matchedKeys = allKeys.filter(fullKey => 
      filteredKeys.value.some(filterKey => matchesFilterKey(fullKey, filterKey))
    )
    keys = new Set(matchedKeys)
  }
  
  const result: DiffRow[] = []
  
  // 如果启用了过滤但没有匹配的键，检查过滤的键是否在两边都不存在
  if (filteredKeys.value.length > 0 && keys.size === 0) {
    // 对每个过滤的键进行检查
    filteredKeys.value.forEach(filterKey => {
      const leftHasKey = Object.keys(leftMap).some(k => matchesFilterKey(k, filterKey))
      const rightHasKey = Object.keys(rightMap).some(k => matchesFilterKey(k, filterKey))
      
      if (!leftHasKey && !rightHasKey) {
        // 两边都没有 → 一致
        result.push({
          key: filterKey,
          left: '(不存在)',
          right: '(不存在)',
          status: 'same',
        })
      } else if (!leftHasKey) {
        // 只有右边有 → 仅列 B
        result.push({
          key: filterKey,
          left: '(不存在)',
          right: '(存在)',
          status: 'right-only',
        })
      } else if (!rightHasKey) {
        // 只有左边有 → 仅列 A
        result.push({
          key: filterKey,
          left: '(存在)',
          right: '(不存在)',
          status: 'left-only',
        })
      }
    })
  }

  keys.forEach(key => {
    const l = leftMap[key]
    const r = rightMap[key]

    if (l !== undefined && r !== undefined) {
      result.push({
        key,
        left: l,
        right: r,
        status: isDeepEqual(l, r) ? 'same' : 'diff-value',
      })
    } else if (l !== undefined) {
      result.push({ key, left: l, right: '', status: 'left-only' })
    } else {
      result.push({ key, left: '', right: r, status: 'right-only' })
    }
  })
  return result
}

function rowClass(status: DiffRow['status']) {
  switch (status) {
    case 'same':
      return 'bg-green-50'
    case 'diff-value':
      return 'bg-yellow-50'
    case 'left-only':
      return 'bg-red-50'
    case 'right-only':
      return 'bg-blue-50'
    default:
      return ''
  }
}

function statusText(status: DiffRow['status']) {
  switch (status) {
    case 'same':
      return '相同'
    case 'diff-value':
      return '同键不同值'
    case 'left-only':
      return '仅列 A'
    case 'right-only':
      return '仅列 B'
    default:
      return ''
  }
}

function formatCell(val: unknown) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val, null, 2)
  return String(val)
}

function safeParse(value: unknown, side: 'left' | 'right') {
  parseErrors[side] = ''
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return value as Record<string, any>
  
  let cleanValue = value.trim()
  
  // 移除 UTF-8 BOM
  if (cleanValue.charCodeAt(0) === 0xFEFF) {
    cleanValue = cleanValue.slice(1)
  }
  
  // 移除零宽字符
  cleanValue = cleanValue.replace(/[\u200B-\u200D\uFEFF]/g, '')
  
  // 尝试多种清理策略
  const strategies = [
    { name: '基础', clean: (s: string) => s },
    { name: '移除换行', clean: (s: string) => s.replace(/[\r\n]/g, '') },
    { name: '移除空白', clean: (s: string) => s.replace(/\s+/g, '') }
  ]
  
  for (const strategy of strategies) {
    try {
      const parsed = JSON.parse(strategy.clean(cleanValue))
      return parsed as Record<string, any>
    } catch (e) {
      continue
    }
  }
  
  parseErrors[side] = 'JSON 解析失败'
  return null
}

function safeParseSilent(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') return value as Record<string, any>
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function isDeepEqual(a: unknown, b: unknown) {
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch (e) {
    return false
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  fileName.value = file.name
  loading.value = true

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' })
      rows.value = json
      headers.value = json.length > 0 ? Object.keys(json[0]) : []
      rowIndex.value = 0
      colLeft.value = headers.value[0] || ''
      colRight.value = headers.value[1] || headers.value[0] || ''
    } catch (error) {
      console.error('读取文件失败', error)
      rows.value = []
      headers.value = []
      rowIndex.value = 0
    } finally {
      loading.value = false
    }
  }
  reader.readAsArrayBuffer(file)
}

function prevRow() {
  if (rowIndex.value > 0) rowIndex.value -= 1
}

function nextRow() {
  if (rowIndex.value < rows.value.length - 1) rowIndex.value += 1
}

function scrollToResult() {
  nextTick(() => {
    resultSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function formatJson(side: 'left' | 'right') {
  try {
    const input = side === 'left' ? directJsonLeft.value : directJsonRight.value
    const parsed = JSON.parse(input)
    const formatted = JSON.stringify(parsed, null, 2)
    if (side === 'left') {
      directJsonLeft.value = formatted
      editorErrors.left = ''
    } else {
      directJsonRight.value = formatted
      editorErrors.right = ''
    }
  } catch (e: any) {
    if (side === 'left') {
      editorErrors.left = `格式化失败: ${e.message}`
    } else {
      editorErrors.right = `格式化失败: ${e.message}`
    }
  }
}

function validateKeyFilter() {
  editorErrors.filter = ''
  if (!keyFilterJson.value.trim()) {
    filteredKeys.value = []
    return
  }
  
  try {
    const parsed = JSON.parse(keyFilterJson.value)
    if (Array.isArray(parsed)) {
      filteredKeys.value = parsed.map(k => String(k))
    } else if (typeof parsed === 'object' && parsed !== null) {
      filteredKeys.value = Object.keys(toPathMap(parsed))
    } else {
      editorErrors.filter = '请输入数组或对象'
      filteredKeys.value = []
    }
  } catch (e: any) {
    editorErrors.filter = `解析失败: ${e.message}`
    filteredKeys.value = []
  }
}

function toggleKeySelection(key: string) {
  const index = filteredKeys.value.indexOf(key)
  if (index > -1) {
    filteredKeys.value = filteredKeys.value.filter(k => k !== key)
  } else {
    filteredKeys.value = [...filteredKeys.value, key]
  }
}

function selectAllKeys() {
  filteredKeys.value = [...availableKeys.value]
}

function clearAllKeys() {
  filteredKeys.value = []
  keyFilterJson.value = ''
}

function openKeyFilterModal() {
  showKeyFilterModal.value = true
  keySearchQuery.value = ''
}

function closeKeyFilterModal() {
  showKeyFilterModal.value = false
  keySearchQuery.value = ''
}

watch(keyFilterJson, validateKeyFilter)

watch(rows, () => {
  rowIndex.value = 0
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- 页面标题 -->
      <div class="text-center space-y-3 pb-4">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">JSON 对比工具</h1>
        <p class="text-gray-600 max-w-2xl mx-auto">支持 Excel 上传和直接输入两种方式，智能识别差异并生成详细统计报告</p>
      </div>

      <!-- 输入区域 -->
      <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">数据输入</h2>
            
            <!-- 模式切换 -->
            <div class="flex bg-white/10 backdrop-blur-sm rounded-lg p-1 gap-1">
              <button
                @click="inputMode = 'excel'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  inputMode === 'excel' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white hover:bg-white/10'
                ]"
              >
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  Excel 上传
                </span>
              </button>
              <button
                @click="inputMode = 'direct'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  inputMode === 'direct' 
                    ? 'bg-white text-indigo-600 shadow-lg' 
                    : 'text-white hover:bg-white/10'
                ]"
              >
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                  直接输入
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- 方式一：Excel 上传 -->
          <div v-if="inputMode === 'excel'" class="space-y-3">
            <div class="flex items-center gap-2">
              <div class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">📊</div>
              <h3 class="text-base font-semibold text-gray-800">上传 Excel 文件</h3>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <label class="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 cursor-pointer transition-all duration-200 hover:-translate-y-0.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <span>选择文件</span>
                <input type="file" accept=".xlsx,.xls" class="hidden" @change="handleFileChange" />
              </label>
              <div v-if="fileName" class="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm font-medium text-green-700">{{ fileName }}</span>
              </div>
            </div>
          </div>
          
          <!-- 方式二：直接输入 -->
          <div v-if="inputMode === 'direct'" class="space-y-4">
            <div class="flex items-center gap-2">
              <div class="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">💻</div>
              <h3 class="text-base font-semibold text-gray-800">直接粘贴 JSON</h3>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span class="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600 text-xs font-bold">A</span>
                    JSON A
                  </label>
                  <button @click="formatJson('left')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors">
                    ✨ 格式化
                  </button>
                </div>
                <textarea
                  v-model="directJsonLeft"
                  placeholder='粘贴或输入 JSON A...'
                  class="w-full h-56 p-4 text-xs font-mono border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 hover:bg-white transition-colors"
                ></textarea>
                <p v-if="editorErrors.left" class="flex items-center gap-1 text-xs text-red-600">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                  {{ editorErrors.left }}
                </p>
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span class="flex items-center justify-center w-5 h-5 rounded bg-indigo-100 text-indigo-600 text-xs font-bold">B</span>
                    JSON B
                  </label>
                  <button @click="formatJson('right')" class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors">
                    ✨ 格式化
                  </button>
                </div>
                <textarea
                  v-model="directJsonRight"
                  placeholder='粘贴或输入 JSON B...'
                  class="w-full h-56 p-4 text-xs font-mono border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-50 hover:bg-white transition-colors"
                ></textarea>
                <p v-if="editorErrors.right" class="flex items-center gap-1 text-xs text-red-600">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                  {{ editorErrors.right }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- 键名过滤（两种模式共用） -->
          <div v-if="inputMode === 'excel' || inputMode === 'direct'" class="space-y-4">
            <div class="border-t border-gray-200"></div>
            
            <div class="flex items-center gap-2">
              <div class="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">🔍</div>
              <h3 class="text-base font-semibold text-gray-800">键名过滤（可选）</h3>
            </div>
            
            <div v-if="availableKeys.length > 0" class="flex flex-wrap items-center gap-3">
              <button 
                @click="openKeyFilterModal"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                <span>选择键名</span>
                <span v-if="filteredKeys.length > 0" class="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">{{ filteredKeys.length }}</span>
              </button>
              <span class="text-sm text-gray-600">从当前数据中选择要对比的键名</span>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm text-gray-600 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                或者粘贴 JSON 数组/对象
              </label>
              <textarea
                v-model="keyFilterJson"
                placeholder='例如：["购方名称", "销方名称"] 或 {"购方名称": "", "销方名称": ""}'
                class="w-full h-24 p-4 text-xs font-mono border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-gray-50 hover:bg-white transition-colors"
              ></textarea>
              <p v-if="editorErrors.filter" class="flex items-center gap-1 text-xs text-red-600">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
                {{ editorErrors.filter }}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Excel 列选择和行导航 -->
      <div v-if="!currentJson.isDirectInput && headers.length > 0" class="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-200">
        <div class="flex flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">列 A</span>
            <select v-model="colLeft" class="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium text-gray-700 hover:border-blue-300 transition-colors">
              <option v-for="h in headers" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">列 B</span>
            <select v-model="colRight" class="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-medium text-gray-700 hover:border-indigo-300 transition-colors">
              <option v-for="h in headers" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">行导航</span>
            <div class="inline-flex rounded-lg overflow-hidden shadow-sm border-2 border-gray-200 bg-white">
              <button class="px-4 py-2 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="rowIndex === 0" @click="prevRow">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <span class="px-4 py-2 bg-gray-50 border-l border-r border-gray-200 text-sm font-semibold text-gray-700 min-w-[80px] text-center">{{ rows.length === 0 ? 0 : rowIndex + 1 }} / {{ rows.length }}</span>
              <button class="px-4 py-2 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" :disabled="rowIndex >= rows.length - 1" @click="nextRow">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 当前行统计 -->
      <div v-if="!currentJson.isDirectInput && rows.length > 0" class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-green-700 font-medium mb-1">完全一致</p>
              <p class="text-xl font-bold text-green-900">{{ summary.same }}<span class="text-sm text-green-600 font-normal"> / {{ summary.total }}</span></p>
            </div>
          </div>
        </div>
        
        <div class="group bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-yellow-700 font-medium mb-1">同键不同值</p>
              <p class="text-xl font-bold text-yellow-900">{{ summary.diffValue }}</p>
            </div>
          </div>
        </div>
        
        <div class="group bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-red-700 font-medium mb-1">仅列 A</p>
              <p class="text-xl font-bold text-red-900">{{ summary.leftOnly }}</p>
            </div>
          </div>
        </div>
        
        <div class="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-blue-700 font-medium mb-1">仅列 B</p>
              <p class="text-xl font-bold text-blue-900">{{ summary.rightOnly }}</p>
            </div>
          </div>
        </div>
        
        <div class="col-span-2 md:col-span-1 group bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-purple-700 font-medium mb-1">一致率</p>
              <p class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{{ summary.matchPercent }}%</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 全量汇总 -->
      <div v-if="!currentJson.isDirectInput && rows.length > 0" class="bg-gradient-to-r from-slate-800 to-gray-900 rounded-2xl p-6 shadow-2xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-12 h-12 bg-white/10 rounded-xl backdrop-blur-sm">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">全量汇总</h3>
              <p class="text-sm text-gray-400">基于 {{ globalSummary.totalRows }} 行数据</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-4">
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded-full bg-green-400"></span>
              <span class="text-sm text-gray-300">一致</span>
              <span class="text-lg font-bold text-white">{{ globalSummary.same }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span class="text-sm text-gray-300">不同值</span>
              <span class="text-lg font-bold text-white">{{ globalSummary.diffValue }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span class="text-sm text-gray-300">仅 A</span>
              <span class="text-lg font-bold text-white">{{ globalSummary.leftOnly }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span class="text-sm text-gray-300">仅 B</span>
              <span class="text-lg font-bold text-white">{{ globalSummary.rightOnly }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-lg">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <span class="text-sm text-blue-100">一致率</span>
              <span class="text-xl font-bold text-white">{{ globalSummary.matchPercent }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 直接输入模式统计 -->
      <div v-if="currentJson.isDirectInput && directJsonLeft && directJsonRight" class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-green-700 font-medium mb-1">完全一致</p>
              <p class="text-xl font-bold text-green-900">{{ summary.same }}<span class="text-sm text-green-600 font-normal"> / {{ summary.total }}</span></p>
            </div>
          </div>
        </div>
        <div class="group bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-yellow-700 font-medium mb-1">同键不同值</p>
              <p class="text-xl font-bold text-yellow-900">{{ summary.diffValue }}</p>
            </div>
          </div>
        </div>
        <div class="group bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-red-700 font-medium mb-1">仅 A</p>
              <p class="text-xl font-bold text-red-900">{{ summary.leftOnly }}</p>
            </div>
          </div>
        </div>
        <div class="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-blue-700 font-medium mb-1">仅 B</p>
              <p class="text-xl font-bold text-blue-900">{{ summary.rightOnly }}</p>
            </div>
          </div>
        </div>
        <div class="col-span-2 md:col-span-1 group bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200" @click="scrollToResult">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-purple-700 font-medium mb-1">一致率</p>
              <p class="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{{ summary.matchPercent }}%</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载和空状态提示 -->
      <div v-if="loading" class="flex items-center justify-center gap-3 py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
        <span class="text-sm font-medium text-blue-600">读取中...</span>
      </div>
      <div v-if="!loading && rows.length === 0 && !currentJson.isDirectInput" class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <p class="text-gray-600">请上传含 JSON 字段的 Excel 文件</p>
      </div>

      <!-- 预览区域 -->
      <div v-if="!currentJson.isDirectInput && rows.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all" @click="showPreview = !showPreview">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm">
                <span class="text-white font-bold">A</span>
              </div>
              <div>
                <h3 class="font-semibold text-white">列 A</h3>
                <p class="text-xs text-blue-100">{{ colLeft || '未选择' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-blue-100">第 {{ rows.length === 0 ? 0 : rowIndex + 1 }} 行</span>
              <svg :class="['w-5 h-5 text-white transition-transform duration-200', showPreview ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div v-show="showPreview" class="p-6">
          <pre class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs whitespace-pre-wrap break-all font-mono text-gray-700 max-h-96 overflow-y-auto">{{ currentJson.leftRaw }}</pre>
          <p v-if="parseErrors.left" class="flex items-center gap-1 text-xs text-red-600 mt-2">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            {{ parseErrors.left }}
          </p>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 cursor-pointer hover:from-indigo-600 hover:to-indigo-700 transition-all" @click="showPreview = !showPreview">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm">
                <span class="text-white font-bold">B</span>
              </div>
              <div>
                <h3 class="font-semibold text-white">列 B</h3>
                <p class="text-xs text-indigo-100">{{ colRight || '未选择' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-indigo-100">第 {{ rows.length === 0 ? 0 : rowIndex + 1 }} 行</span>
              <svg :class="['w-5 h-5 text-white transition-transform duration-200', showPreview ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div v-show="showPreview" class="p-6">
          <pre class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs whitespace-pre-wrap break-all font-mono text-gray-700 max-h-96 overflow-y-auto">{{ currentJson.rightRaw }}</pre>
          <p v-if="parseErrors.right" class="flex items-center gap-1 text-xs text-red-600 mt-2">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            </svg>
            {{ parseErrors.right }}
          </p>
        </div>
      </div>
    </div>
    </div>

    <!-- 对比结果 -->
    <div v-if="currentJson.leftParsed || currentJson.rightParsed" class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100" ref="resultSection">
      <div class="bg-gradient-to-r from-slate-700 to-gray-800 px-6 py-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 bg-white/10 rounded-xl backdrop-blur-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-white text-lg">{{ currentJson.isDirectInput ? '对比结果' : '对比结果 (当前行)' }}</h3>
              <p class="text-xs text-gray-300">共 {{ diffRows.length }} 个键</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 text-xs">
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded bg-green-400"></span>
              <span class="text-white font-medium">相同</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded bg-yellow-400"></span>
              <span class="text-white font-medium">同键不同值</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded bg-red-400"></span>
              <span class="text-white font-medium">仅左侧</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
              <span class="w-2.5 h-2.5 rounded bg-blue-400"></span>
              <span class="text-white font-medium">仅右侧</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <div v-if="diffRows.length === 0" class="text-center py-12">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p v-if="filteredKeys.length > 0 && !parseErrors.left && !parseErrors.right" class="text-gray-600 mb-2">
            没有找到匹配的键名
          </p>
          <p v-else-if="parseErrors.left || parseErrors.right" class="text-gray-600 mb-4">
            无法生成对比，请检查 JSON 是否可解析
          </p>
          <p v-else class="text-gray-600 mb-4">
            暂无对比数据
          </p>
          <p v-if="filteredKeys.length > 0" class="text-sm text-blue-600 mb-4">
            当前过滤条件：{{ filteredKeys.join(', ') }}
            <button @click="filteredKeys = []" class="ml-2 text-xs underline hover:text-blue-800">清除过滤</button>
          </p>
          <div v-if="(!currentJson.isDirectInput && currentRow) && (parseErrors.left || parseErrors.right)" class="max-w-4xl mx-auto">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <div class="text-left">
                <p class="text-sm font-semibold text-red-800 mb-2">列 A 内容：</p>
                <pre class="text-xs text-red-700 bg-white rounded p-3 overflow-x-auto border border-red-200">{{ currentJson.leftRaw || '(空)' }}</pre>
              </div>
              <div class="text-left">
                <p class="text-sm font-semibold text-red-800 mb-2">列 B 内容：</p>
                <pre class="text-xs text-red-700 bg-white rounded p-3 overflow-x-auto border border-red-200">{{ currentJson.rightRaw || '(空)' }}</pre>
              </div>
              <div v-if="parseErrors.left || parseErrors.right" class="text-left">
                <p class="text-sm font-semibold text-red-800 mb-2">解析错误：</p>
                <div v-if="parseErrors.left" class="text-xs text-red-700 bg-white rounded p-3 mb-2 border border-red-200">
                  <strong>列 A：</strong>{{ parseErrors.left }}
                </div>
                <div v-if="parseErrors.right" class="text-xs text-red-700 bg-white rounded p-3 border border-red-200">
                  <strong>列 B：</strong>{{ parseErrors.right }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="overflow-x-auto rounded-xl border border-gray-200">
          <table class="min-w-full text-sm">
            <thead class="bg-gradient-to-r from-gray-50 to-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                    Key
                  </div>
                </th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-600 text-xs font-bold">A</span>
                    {{ currentJson.isDirectInput ? 'JSON A' : '列 A' }}
                  </div>
                </th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                  <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-5 h-5 rounded bg-indigo-100 text-indigo-600 text-xs font-bold">B</span>
                    {{ currentJson.isDirectInput ? 'JSON B' : '列 B' }}
                  </div>
                </th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 border-b-2 border-gray-200">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                    状态
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in diffRows" :key="row.key" :class="rowClass(row.status)" class="hover:bg-opacity-80 transition-colors">
                <td class="px-4 py-3 border-b border-gray-100 align-top font-mono text-xs font-medium text-gray-700">{{ row.key }}</td>
                <td class="px-4 py-3 border-b border-gray-100 align-top text-xs whitespace-pre-wrap break-all font-mono text-gray-600">{{ formatCell(row.left) }}</td>
                <td class="px-4 py-3 border-b border-gray-100 align-top text-xs whitespace-pre-wrap break-all font-mono text-gray-600">{{ formatCell(row.right) }}</td>
                <td class="px-4 py-3 border-b border-gray-100 align-top">
                  <span :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    row.status === 'same' ? 'bg-green-100 text-green-700' : '',
                    row.status === 'diff-value' ? 'bg-yellow-100 text-yellow-700' : '',
                    row.status === 'left-only' ? 'bg-red-100 text-red-700' : '',
                    row.status === 'right-only' ? 'bg-blue-100 text-blue-700' : ''
                  ]">
                    {{ statusText(row.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- 键名过滤弹窗 -->
    <div v-if="showKeyFilterModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" @click.self="closeKeyFilterModal">
      <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-slideUp">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 bg-white/20 rounded-xl backdrop-blur-sm">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-bold text-white">选择对比键名</h3>
                <p class="text-sm text-purple-100">从 {{ availableKeys.length }} 个可用键中选择</p>
              </div>
            </div>
            <button @click="closeKeyFilterModal" class="flex items-center justify-center w-8 h-8 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-6 space-y-4 flex-1 overflow-y-auto">
          <div class="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg">
                <span class="text-lg font-bold text-white">{{ filteredKeys.length }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-700">已选择键</p>
                <p class="text-xs text-gray-500">共 {{ availableKeys.length }} 个可选</p>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="selectAllKeys" class="px-4 py-2 bg-white hover:bg-blue-50 border-2 border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-all hover:border-blue-300">
                全选
              </button>
              <button @click="clearAllKeys" class="px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-all hover:border-gray-300">
                清空
              </button>
            </div>
          </div>
          
          <!-- 搜索框 -->
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              v-model="keySearchQuery"
              type="text"
              placeholder="搜索键名..."
              class="w-full pl-11 pr-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
            <div v-if="keySearchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button @click="keySearchQuery = ''" class="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div v-if="filteredAvailableKeys.length === 0" class="text-center py-8">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <p class="text-sm text-gray-500">未找到匹配的键名</p>
          </div>
          
          <div v-else class="border-2 border-gray-200 rounded-xl p-1 bg-gray-50 max-h-96 overflow-y-auto">
            <div class="space-y-1">
              <label v-for="key in filteredAvailableKeys" :key="key" class="flex items-center gap-3 px-4 py-3 hover:bg-white rounded-lg cursor-pointer transition-all group">
                <input 
                  type="checkbox" 
                  :checked="filteredKeys.includes(key)"
                  @change="toggleKeySelection(key)"
                  class="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span class="flex-1 font-mono text-sm text-gray-700 group-hover:text-gray-900">{{ key }}</span>
                <svg v-if="filteredKeys.includes(key)" class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
              </label>
            </div>
          </div>
        </div>
        
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-gray-100 bg-gray-50 rounded-b-2xl">
          <button @click="closeKeyFilterModal" class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-xl transition-all hover:border-gray-300">
            取消
          </button>
          <button @click="closeKeyFilterModal" class="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40">
            确定选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}
</style>
