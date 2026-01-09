<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="right" class="w-full sm:w-[600px] sm:max-w-[90vw] p-0 flex flex-col">
      <SheetHeader class="px-6 py-4 border-b">
        <SheetTitle>{{ props.batchId ? `向批次"${props.batchName}"添加文件` : '导入文件' }}</SheetTitle>
        <SheetDescription>
          导入任意文件、图片、文档等，支持批量上传
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <!-- 批次名称 -->
        <div>
          <label class="text-sm font-medium mb-2 block">批次名称</label>
          <Input
            v-model="batchName"
            placeholder="例如：2026年第一季度财务数据"
            :disabled="!!props.batchId"
          />
          <p v-if="props.batchId" class="text-xs text-muted-foreground mt-1">
            文件将添加到已有批次
          </p>
        </div>

        <!-- 文件上传 -->
        <div>
          <label class="text-sm font-medium mb-2 block">选择文件</label>
          <div class="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref="fileInputRef"
              type="file"
              multiple
              class="hidden"
              @change="handleFileChange"
            />
            
            <div class="space-y-3">
              <div class="flex justify-center">
                <svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
              </div>
              
              <div>
                <Button @click="triggerFileInput" :disabled="loading">
                  选择文件
                </Button>
                <p class="text-xs text-muted-foreground mt-2">
                  支持 Excel、图片、PDF 等各种文件格式
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 已选文件列表 -->
        <div v-if="selectedFiles.length > 0">
          <label class="text-sm font-medium mb-2 block">
            已选择 {{ selectedFiles.length }} 个文件
          </label>
          <div class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="flex items-center gap-3 p-3 border rounded-lg"
            >
              <!-- 文件图标 -->
              <div class="flex-shrink-0">
                <div v-if="file.preview" class="w-12 h-12 rounded overflow-hidden">
                  <img :src="file.preview" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-12 h-12 rounded bg-muted flex items-center justify-center">
                  <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>

              <!-- 文件信息 -->
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ file.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ formatFileSize(file.size) }} · {{ file.type || '未知类型' }}
                </div>
              </div>

              <!-- 删除按钮 -->
              <Button
                variant="ghost"
                size="sm"
                @click="removeFile(index)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="border-t p-4 flex justify-end gap-2">
        <Button
          variant="outline"
          @click="$emit('update:open', false)"
        >
          取消
        </Button>
        <Button
          @click="handleSave"
          :disabled="!batchName.trim() || selectedFiles.length === 0 || loading"
        >
          <span v-if="loading">保存中...</span>
          <span v-else>保存 ({{ selectedFiles.length }})</span>
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSavedData } from '@/composables/useSavedData'
import { useTags } from '@/composables/useTags'
import { autoTagFiles } from '@/api/deepseek'
import { toast } from 'vue-sonner'
import * as XLSX from 'xlsx'

const props = defineProps<{
  open: boolean
  batchId?: string
  batchName?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const { addRecord, records, updateRecordTags } = useSavedData()
const { addTag } = useTags()

const batchName = ref('')

// 监听props变化，自动填充批次名
watch(() => props.batchName, (newName) => {
  if (newName) {
    batchName.value = newName
  }
}, { immediate: true })

const selectedFiles = ref<Array<{
  file: File
  name: string
  type: string
  size: number
  preview?: string
}>>([])
const fileInputRef = ref<HTMLInputElement>()
const loading = ref(false)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  
  for (const file of files) {
    const fileData = {
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: undefined as string | undefined
    }

    // 如果是图片，生成预览
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        fileData.preview = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }

    selectedFiles.value.push(fileData)
  }

  // 重置 input
  if (input) {
    input.value = ''
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 将Excel序列号转换为日期字符串
 */
const excelDateToJSDate = (serial: number): string => {
  // Excel日期从1900年1月1日开始计数（但有1900年闰年bug）
  const utcDays = Math.floor(serial - 25569)
  const utcValue = utcDays * 86400
  const dateInfo = new Date(utcValue * 1000)
  return dateInfo.toISOString().split('T')[0] // 返回 YYYY-MM-DD 格式
}

/**
 * 处理Excel数据，修复日期格式
 */
const processExcelData = (data: any[]): Record<string, any>[] => {
  return data.map(row => {
    const processed: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(row)) {
      // 检测是否可能是Excel日期序列号（大于1000且小于100000的数字通常是日期）
      if (typeof value === 'number' && value > 1000 && value < 100000 && Number.isInteger(value)) {
        // 尝试转换为日期
        try {
          const dateStr = excelDateToJSDate(value)
          processed[key] = dateStr
        } catch {
          processed[key] = value
        }
      } else {
        processed[key] = value
      }
    }
    
    return processed
  })
}

const handleSave = async () => {
  if (!batchName.value.trim()) {
    toast.error('请输入批次名称')
    return
  }

  if (selectedFiles.value.length === 0) {
    toast.error('请选择至少一个文件')
    return
  }

  loading.value = true

  try {
    // 使用传入的batchId或生成新的
    const batchId = props.batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const savedRecordIds: string[] = []

    for (const fileData of selectedFiles.value) {
      const file = fileData.file

      // 读取文件内容
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel') {
        // Excel 文件特殊处理
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawData = XLSX.utils.sheet_to_json(firstSheet)
        const data = processExcelData(rawData) // 处理日期格式

        const record = addRecord(
          batchId,
          batchName.value,
          file.name,
          file.type,
          file.size,
          undefined,
          data as Record<string, any>[],
          `Excel文件，共${data.length}行`
        )
        savedRecordIds.push(record.id)
      } else {
        // 其他文件存储为 base64
        const reader = new FileReader()
        const fileContent = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        const record = addRecord(
          batchId,
          batchName.value,
          file.name,
          file.type,
          file.size,
          fileContent,
          undefined,
          undefined
        )
        savedRecordIds.push(record.id)
      }
    }

    toast.success(`成功导入 ${selectedFiles.value.length} 个文件`)
    
    // AI自动打标 - 为每个文件单独打标
    try {
      toast.info('正在使用AI分析文件类型...')
      
      // 获取刚保存的记录
      const savedRecords = records.value.filter(r => savedRecordIds.includes(r.id))
      
      let taggedCount = 0
      
      // 逐个文件调用AI打标
      for (const record of savedRecords) {
        try {
          const fileInfo = [{
            fileName: record.fileName,
            fileType: record.fileType,
            description: record.description,
            data: record.data
          }]
          
          const tags = await autoTagFiles(fileInfo)
          
          if (tags && tags.length > 0) {
            // 将标签添加到标签库
            tags.forEach(tag => addTag(tag))
            
            // 为该文件添加标签
            updateRecordTags(record.id, tags)
            taggedCount++
          }
        } catch (error) {
          console.error(`为文件 ${record.fileName} 打标失败:`, error)
        }
      }
      
      if (taggedCount > 0) {
        toast.success(`AI已为 ${taggedCount} 个文件完成分类标注`)
      }
    } catch (error) {
      console.error('AI打标失败:', error)
      toast.warning('AI自动打标失败，您可以稍后手动打标')
    }
    
    // 重置状态
    batchName.value = ''
    selectedFiles.value = []
    
    emit('saved')
    emit('update:open', false)
  } catch (error) {
    console.error('保存文件失败:', error)
    toast.error('保存文件失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>
