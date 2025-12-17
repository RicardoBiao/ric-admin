<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
    <div class="w-full">
      <!-- 页面标题 -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-3 shadow-lg">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">Excel 文件合并工具</h1>
        <p class="text-gray-600">上传两个 Excel 文件，按 ID 列进行合并（类似 SQL JOIN）</p>
      </div>

      <!-- 文件上传区域 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <!-- 第一个文件上传 -->
        <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">第一个 Excel 文件</h2>
          <div class="space-y-4">
            <label class="cursor-pointer group block">
              <div class="border-2 border-dashed border-gray-300 group-hover:border-green-500 rounded-xl p-6 transition-all duration-200 bg-gradient-to-br from-gray-50 to-white group-hover:from-green-50 group-hover:to-emerald-50">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <div class="text-center">
                    <p class="text-sm font-semibold text-gray-700">点击上传 Excel 文件</p>
                    <p class="text-xs text-gray-500 mt-1">支持 .xlsx, .xls 格式</p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                @change="handleFile1Upload"
                class="hidden"
              />
            </label>
            <div v-if="file1Info" class="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{{ file1Info.name }} ({{ file1Info.sheets.length }} 个工作表)</span>
            </div>
            <div v-if="file1Columns.length" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">选择 ID 列</label>
              <select v-model="file1IdColumn" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white">
                <option value="">请选择 ID 列</option>
                <option v-for="col in file1Columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 第二个文件上传 -->
        <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">第二个 Excel 文件</h2>
          <div class="space-y-4">
            <label class="cursor-pointer group block">
              <div class="border-2 border-dashed border-gray-300 group-hover:border-blue-500 rounded-xl p-6 transition-all duration-200 bg-gradient-to-br from-gray-50 to-white group-hover:from-blue-50 group-hover:to-indigo-50">
                <div class="flex flex-col items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <div class="text-center">
                    <p class="text-sm font-semibold text-gray-700">点击上传 Excel 文件</p>
                    <p class="text-xs text-gray-500 mt-1">支持 .xlsx, .xls 格式</p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                @change="handleFile2Upload"
                class="hidden"
              />
            </label>
            <div v-if="file2Info" class="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{{ file2Info.name }} ({{ file2Info.sheets.length }} 个工作表)</span>
            </div>
            <div v-if="file2Columns.length" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">选择 ID 列</label>
              <select v-model="file2IdColumn" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white">
                <option value="">请选择 ID 列</option>
                <option v-for="col in file2Columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 合并选项 -->
      <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">合并选项</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">合并方式</label>
            <select v-model="joinType" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white">
              <option value="inner">内连接 (INNER JOIN)</option>
              <option value="left">左连接 (LEFT JOIN)</option>
              <option value="right">右连接 (RIGHT JOIN)</option>
              <option value="full">全连接 (FULL JOIN)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">工作表</label>
            <select v-model="selectedSheet" class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white">
              <option value="">请选择工作表</option>
              <option v-for="sheet in availableSheets" :key="sheet" :value="sheet">{{ sheet }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              :disabled="!canMerge" 
              @click="mergeFiles"
              class="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              合并并下载
            </button>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div v-if="mergedData.length" class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800">合并预览（前10行）</h2>
          <span class="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            📊 总共 {{ mergedData.length }} 行数据
          </span>
        </div>
        <div class="overflow-x-auto rounded-lg border border-gray-200">
          <table class="min-w-full table-auto border-collapse">
            <thead>
              <tr class="bg-gradient-to-r from-purple-50 to-pink-50">
                <th v-for="column in previewColumns" :key="column" class="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">
                  {{ column }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in previewData" :key="index" class="hover:bg-gray-50 transition-colors">
                <td v-for="column in previewColumns" :key="column" class="px-4 py-3 text-sm text-gray-900 border-b border-gray-100">
                  {{ row[column] ?? '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 状态信息 -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          处理中，请稍候...
        </div>
      </div>

      <div v-if="error" class="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-lg">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="text-red-800 text-sm font-medium">{{ error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface FileInfo {
  name: string
  sheets: string[]
  data: Record<string, any[]>
  columns: Record<string, string[]>
}

const file1Info = ref<FileInfo | null>(null)
const file2Info = ref<FileInfo | null>(null)
const file1IdColumn = ref('')
const file2IdColumn = ref('')
const joinType = ref('inner')
const selectedSheet = ref('')
const loading = ref(false)
const error = ref('')
const mergedData = ref<any[]>([])

// 计算属性
const file1Columns = computed(() => {
  if (!file1Info.value || !selectedSheet.value) return []
  return file1Info.value.columns[selectedSheet.value] || []
})

const file2Columns = computed(() => {
  if (!file2Info.value || !selectedSheet.value) return []
  return file2Info.value.columns[selectedSheet.value] || []
})

const availableSheets = computed(() => {
  const sheets = new Set<string>()
  if (file1Info.value?.sheets) file1Info.value.sheets.forEach(s => sheets.add(s))
  if (file2Info.value?.sheets) file2Info.value.sheets.forEach(s => sheets.add(s))
  return Array.from(sheets)
})

const canMerge = computed(() => 
  file1Info.value && 
  file2Info.value && 
  file1IdColumn.value && 
  file2IdColumn.value && 
  selectedSheet.value &&
  file1Columns.value.length > 0 &&
  file2Columns.value.length > 0
)

const previewColumns = computed(() => {
  if (mergedData.value.length === 0) return []
  return Object.keys(mergedData.value[0])
})

const previewData = computed(() => {
  return mergedData.value.slice(0, 10)
})

// 读取 Excel 文件
async function readExcelFile(file: File): Promise<FileInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        const sheets: string[] = []
        const fileData: Record<string, any[]> = {}
        const columns: Record<string, string[]> = {}
        
        workbook.SheetNames.forEach(sheetName => {
          sheets.push(sheetName)
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown as any[][]
          
          if (jsonData.length > 0) {
            // 第一行作为表头
            const headers = jsonData[0] as string[]
            columns[sheetName] = headers
            
            // 转换为对象数组
            const rows: any[] = []
            for (let i = 1; i < jsonData.length; i++) {
              const row: any = {}
              headers.forEach((header, index) => {
                row[header] = (jsonData[i] && jsonData[i][index] !== undefined) ? jsonData[i][index] : ''
              })
              rows.push(row)
            }
            fileData[sheetName] = rows
          }
        })
        
        resolve({
          name: file.name,
          sheets,
          data: fileData,
          columns
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 处理第一个文件上传
async function handleFile1Upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  loading.value = true
  error.value = ''
  
  try {
    file1Info.value = await readExcelFile(file)
    if (file1Info.value.sheets.length > 0 && !selectedSheet.value) {
      selectedSheet.value = file1Info.value.sheets[0]
    }
    mergedData.value = []
  } catch (err: any) {
    error.value = `读取第一个文件失败: ${err.message}`
    file1Info.value = null
  } finally {
    loading.value = false
  }
}

// 处理第二个文件上传
async function handleFile2Upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  loading.value = true
  error.value = ''
  
  try {
    file2Info.value = await readExcelFile(file)
    if (file2Info.value.sheets.length > 0 && !selectedSheet.value) {
      selectedSheet.value = file2Info.value.sheets[0]
    }
    mergedData.value = []
  } catch (err: any) {
    error.value = `读取第二个文件失败: ${err.message}`
    file2Info.value = null
  } finally {
    loading.value = false
  }
}

// 合并文件
function mergeFiles() {
  if (!file1Info.value || !file2Info.value || !selectedSheet.value) {
    error.value = '请先上传两个文件并选择工作表'
    return
  }
  
  if (!file1IdColumn.value || !file2IdColumn.value) {
    error.value = '请选择两个文件的 ID 列'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const sheet1Data = file1Info.value.data[selectedSheet.value] || []
    const sheet2Data = file2Info.value.data[selectedSheet.value] || []
    
    if (sheet1Data.length === 0 || sheet2Data.length === 0) {
      error.value = '选定的工作表中没有数据'
      loading.value = false
      return
    }
    
    // 创建索引映射
    const index1 = new Map<any, any[]>()
    sheet1Data.forEach(row => {
      const id = row[file1IdColumn.value]
      if (id !== undefined && id !== null && id !== '') {
        if (!index1.has(id)) {
          index1.set(id, [])
        }
        index1.get(id)!.push(row)
      }
    })
    
    const index2 = new Map<any, any[]>()
    sheet2Data.forEach(row => {
      const id = row[file2IdColumn.value]
      if (id !== undefined && id !== null && id !== '') {
        if (!index2.has(id)) {
          index2.set(id, [])
        }
        index2.get(id)!.push(row)
      }
    })
    
    const merged: any[] = []
    const processedIds = new Set<any>()
    
    // 根据合并类型执行不同的合并逻辑
    if (joinType.value === 'inner') {
      // 内连接：只保留两个文件中都存在的 ID
      index1.forEach((rows1, id) => {
        if (index2.has(id)) {
          const rows2 = index2.get(id)!
          rows1.forEach(row1 => {
            rows2.forEach(row2 => {
              merged.push({ ...row1, ...row2 })
            })
          })
        }
      })
    } else if (joinType.value === 'left') {
      // 左连接：保留第一个文件的所有记录
      index1.forEach((rows1, id) => {
        const rows2 = index2.get(id) || [{}]
        rows1.forEach(row1 => {
          rows2.forEach(row2 => {
            merged.push({ ...row1, ...row2 })
          })
        })
      })
    } else if (joinType.value === 'right') {
      // 右连接：保留第二个文件的所有记录
      index2.forEach((rows2, id) => {
        const rows1 = index1.get(id) || [{}]
        rows1.forEach(row1 => {
          rows2.forEach(row2 => {
            merged.push({ ...row1, ...row2 })
          })
        })
      })
    } else if (joinType.value === 'full') {
      // 全连接：保留两个文件的所有记录
      index1.forEach((rows1, id) => {
        processedIds.add(id)
        const rows2 = index2.get(id) || [{}]
        rows1.forEach(row1 => {
          rows2.forEach(row2 => {
            merged.push({ ...row1, ...row2 })
          })
        })
      })
      
      index2.forEach((rows2, id) => {
        if (!processedIds.has(id)) {
          const rows1 = [{}]
          rows1.forEach(row1 => {
            rows2.forEach(row2 => {
              merged.push({ ...row1, ...row2 })
            })
          })
        }
      })
    }
    
    mergedData.value = merged
    
    // 导出 Excel
    exportToExcel(merged)
    
  } catch (err: any) {
    error.value = `合并失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

// 导出为 Excel
function exportToExcel(data: any[]) {
  if (data.length === 0) {
    error.value = '没有数据可导出'
    return
  }
  
  try {
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '合并结果')
    
    // 生成 Excel 文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 下载文件
    const fileName = `合并结果_${new Date().getTime()}.xlsx`
    saveAs(blob, fileName)
  } catch (err: any) {
    error.value = `导出失败: ${err.message}`
  }
}
</script>

