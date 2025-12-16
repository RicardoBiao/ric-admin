<template>
  <TheLayout>
    <div class="p-6 space-y-6">
      <!-- 页面标题 -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900">Excel 文件合并工具</h1>
        <p class="text-gray-600 mt-2">上传两个 Excel 文件，按 ID 列进行合并（类似 SQL JOIN）</p>
      </div>

      <!-- 文件上传区域 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 第一个文件上传 -->
        <Card>
          <CardHeader>
            <CardTitle>第一个 Excel 文件</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              @change="handleFile1Upload"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div v-if="file1Info" class="text-sm text-green-600">
              ✓ 已上传: {{ file1Info.name }} ({{ file1Info.sheets.length }} 个工作表)
            </div>
            <div v-if="file1Columns.length" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">选择 ID 列</label>
              <select v-model="file1IdColumn" class="w-full p-2 border rounded-md">
                <option value="">请选择 ID 列</option>
                <option v-for="col in file1Columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <!-- 第二个文件上传 -->
        <Card>
          <CardHeader>
            <CardTitle>第二个 Excel 文件</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              @change="handleFile2Upload"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <div v-if="file2Info" class="text-sm text-green-600">
              ✓ 已上传: {{ file2Info.name }} ({{ file2Info.sheets.length }} 个工作表)
            </div>
            <div v-if="file2Columns.length" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">选择 ID 列</label>
              <select v-model="file2IdColumn" class="w-full p-2 border rounded-md">
                <option value="">请选择 ID 列</option>
                <option v-for="col in file2Columns" :key="col" :value="col">{{ col }}</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 合并选项 -->
      <Card>
        <CardHeader>
          <CardTitle>合并选项</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">合并方式</label>
              <select v-model="joinType" class="w-full p-2 border rounded-md">
                <option value="inner">内连接 (INNER JOIN)</option>
                <option value="left">左连接 (LEFT JOIN)</option>
                <option value="right">右连接 (RIGHT JOIN)</option>
                <option value="full">全连接 (FULL JOIN)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">工作表</label>
              <select v-model="selectedSheet" class="w-full p-2 border rounded-md">
                <option value="">请选择工作表</option>
                <option v-for="sheet in availableSheets" :key="sheet" :value="sheet">{{ sheet }}</option>
              </select>
            </div>
            <div class="flex items-end">
              <Button 
                :disabled="!canMerge" 
                @click="mergeFiles"
                class="w-full"
              >
                <Download class="w-4 h-4 mr-2" />
                合并并下载
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 预览区域 -->
      <Card v-if="mergedData.length">
        <CardHeader>
          <CardTitle>合并预览 (前10行)</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-50">
                  <th v-for="column in previewColumns" :key="column" class="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-300">
                    {{ column }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData" :key="index" class="hover:bg-gray-50">
                  <td v-for="column in previewColumns" :key="column" class="px-4 py-2 text-sm text-gray-900 border border-gray-300">
                    {{ row[column] ?? '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-sm text-gray-500 mt-4">
            总共 {{ mergedData.length }} 行数据
          </p>
        </CardContent>
      </Card>

      <!-- 状态信息 -->
      <div v-if="loading" class="text-center py-4">
        <div class="inline-flex items-center px-4 py-2 text-sm font-medium leading-6 text-white bg-blue-500 rounded-md">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          处理中...
        </div>
      </div>

      <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="text-red-800 text-sm">{{ error }}</div>
      </div>
    </div>
  </TheLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import TheLayout from '@/components/ric-ui/TheLayout.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-vue-next'

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

