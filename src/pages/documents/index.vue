<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import mammoth from 'mammoth/mammoth.browser'
import { saveAs } from 'file-saver'

const uploading = ref(false)
const html = ref<string>('')
const templateBuffer = ref<ArrayBuffer | null>(null)
const fileName = ref<string>('')
const messages = ref<Array<{ message: string; type?: string }>>([])
const error = ref<string>('')

// Selection boxes and overlay
type Box = {
  id: number
  x: number
  y: number
  w: number
  h: number
  fieldName: string  // 字段名称
  color: string
}

type ExistingField = {
  name: string
  count: number
}

const boxes = ref<Box[]>([])
const existingFields = ref<ExistingField[]>([])  // 文档中已存在的占位符
const nextId = ref(1)
const drawing = ref(false)
const startPoint = ref<{ x: number; y: number } | null>(null)
const wrapperRef = ref<HTMLDivElement | null>(null)
const previewReady = ref(false)
const tempBox = ref<Box | null>(null)

function getRelativePoint(e: MouseEvent) {
  const el = wrapperRef.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function startDraw(e: MouseEvent) {
  if (!previewReady.value) return
  drawing.value = true
  startPoint.value = getRelativePoint(e)
}

function onMouseMove(e: MouseEvent) {
  if (!drawing.value || !startPoint.value) return
  const current = getRelativePoint(e)
  const x = Math.min(startPoint.value.x, current.x)
  const y = Math.min(startPoint.value.y, current.y)
  const w = Math.abs(current.x - startPoint.value.x)
  const h = Math.abs(current.y - startPoint.value.y)
  tempBox.value = { id: -1, x, y, w, h, fieldName: '', color: 'rgba(255, 235, 59, 0.35)' }
}

function endDraw() {
  if (!drawing.value) return
  drawing.value = false
  if (tempBox.value && tempBox.value.w > 10 && tempBox.value.h > 10) {
    const id = nextId.value++
    boxes.value.push({ ...tempBox.value, id, fieldName: `field${id}` })
  }
  tempBox.value = null
  startPoint.value = null
}

function removeBox(id: number) {
  boxes.value = boxes.value.filter(b => b.id !== id)
}

function reset() {
  uploading.value = false
  html.value = ''
  fileName.value = ''
  messages.value = []
  error.value = ''
  boxes.value = []
  existingFields.value = []
  tempBox.value = null
  previewReady.value = false
}

// 解析文档中已存在的占位符
function extractExistingFields(htmlContent: string) {
  // 匹配 {{字段名}} 格式
  const regex = /\{\{([^}]+)\}\}/g
  const fieldsMap = new Map<string, number>()
  
  let match
  while ((match = regex.exec(htmlContent)) !== null) {
    const fieldName = match[1].trim()
    fieldsMap.set(fieldName, (fieldsMap.get(fieldName) || 0) + 1)
  }
  
  existingFields.value = Array.from(fieldsMap.entries()).map(([name, count]) => ({
    name,
    count
  }))
}

async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  reset()
  uploading.value = true
  fileName.value = file.name

  try {
    const arrayBuffer = await file.arrayBuffer()
    templateBuffer.value = arrayBuffer
    const result = await mammoth.convertToHtml({ arrayBuffer })
    html.value = result.value
    messages.value = result.messages || []
    previewReady.value = true
    
    // 解析已存在的占位符
    extractExistingFields(result.value)
  } catch (err: any) {
    error.value = err?.message || '文档解析失败'
  } finally {
    uploading.value = false
  }
}

async function exportDocx() {
  if (!templateBuffer.value) {
    error.value = '请先上传 .docx 文档'
    return
  }
  
  if (boxes.value.length === 0) {
    error.value = '请至少添加一个标记区域'
    return
  }
  
  try {
    const { default: PizZip } = await import('pizzip')
    const { default: Docxtemplater } = await import('docxtemplater')
    const zip = new PizZip(templateBuffer.value)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' }
    })

    // 准备数据：为每个框的位置设置占位符
    const data: Record<string, string> = {}
    boxes.value.forEach(b => {
      const fieldName = b.fieldName.trim() || `field${b.id}`
      // 这里我们直接保留占位符，不填充实际内容
      data[fieldName] = `{{${fieldName}}}`
    })

    console.log('导出占位符映射:', data)

    doc.render(data)

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    
    const outputFileName = fileName.value 
      ? fileName.value.replace(/\.docx$/i, '') + '-模板.docx'
      : 'document-模板.docx'
    
    saveAs(out, outputFileName)
    error.value = ''
    
  } catch (e: any) {
    console.error('DOCX 导出错误:', e)
    console.error('错误详情:', JSON.stringify(e.properties, null, 2))
    
    let errorMsg = '⚠️ 导出失败\n\n'
    
    if (e.properties && e.properties.errors) {
      const errors = e.properties.errors
      errors.forEach((err: any) => {
        errorMsg += `❌ ${err.message || '未知错误'}\n`
      })
      errorMsg += '\n💡 提示：当前功能是在文档中标记位置并添加占位符'
    } else {
      errorMsg = '❌ ' + (e?.message || '导出失败，请重试')
    }
    
    error.value = errorMsg
  }
}

onMounted(() => {
  const handlerUp = () => endDraw()
  window.addEventListener('mouseup', handlerUp)
  onBeforeUnmount(() => {
    window.removeEventListener('mouseup', handlerUp)
  })
})
</script>

<template>
<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
  <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-3 shadow-lg shadow-blue-500/30">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">Word 模板编辑器</h1>
        <p class="text-gray-600">上传 DOCX 文档，在文档中画框标记字段位置，生成带占位符的模板文档</p>
      </div>

      <!-- 上传区域 -->
      <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100 mb-5">
        <div class="flex flex-wrap items-center gap-3">
          <label class="cursor-pointer group">
            <div class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              选择 DOCX 文件
            </div>
            <input type="file" accept=".docx" @change="handleFileChange" class="hidden" />
          </label>
          
          <button 
            v-if="html"
            @click="reset" 
            class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            清空
          </button>

          <div v-if="fileName" class="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm font-medium text-green-700">{{ fileName }}</span>
          </div>
        </div>

        <div v-if="uploading" class="flex items-center gap-2 text-sm text-blue-600 mt-3">
          <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          正在解析文档...
        </div>

        <div v-if="error" class="flex items-center gap-2 text-sm text-red-600 mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ error }}
        </div>

        <div v-if="messages.length" class="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div class="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            解析提示
          </div>
          <ul class="list-disc pl-6 text-sm text-yellow-700 space-y-1">
            <li v-for="m in messages" :key="m.message">{{ m.message }}</li>
          </ul>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- 左侧：字段管理 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100 sticky top-4">
            <!-- 已存在的占位符 -->
            <div v-if="existingFields.length > 0" class="mb-5">
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h2 class="text-lg font-semibold text-gray-800">已识别字段</h2>
                <div class="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">{{ existingFields.length }} 个</div>
              </div>
              <div class="space-y-2 max-h-48 overflow-y-auto bg-green-50 rounded-lg p-3 border border-green-200">
                <div v-for="field in existingFields" :key="field.name" class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-200">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div class="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <code class="text-sm font-mono text-gray-700 truncate" v-text="`{{${field.name}}}`"></code>
                  </div>
                  <span class="text-xs text-gray-500 ml-2 flex-shrink-0">×{{ field.count }}</span>
                </div>
              </div>
            </div>

            <!-- 新增标记区域 -->
            <div class="border-t border-gray-200 pt-4">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <h2 class="text-lg font-semibold text-gray-800">新增标记</h2>
                </div>
                <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{{ boxes.length }} 个</div>
              </div>

              <div v-if="boxes.length === 0" class="text-center py-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
                  </svg>
                </div>
                <p class="text-sm text-gray-500">暂无标记区域</p>
                <p class="text-xs text-gray-400 mt-1">在右侧文档中拖动鼠标框选</p>
              </div>

              <div class="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto">
                <div v-for="b in boxes" :key="b.id" class="border-2 border-gray-200 rounded-xl p-3 bg-gradient-to-br from-gray-50 to-white hover:border-blue-300 transition-all">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-white bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center">{{ b.id }}</span>
                      <span class="text-xs text-gray-600">标记 #{{ b.id }}</span>
                    </div>
                    <button 
                      @click="removeBox(b.id)"
                      class="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div class="space-y-2">
                    <div>
                      <label class="text-xs text-gray-600 mb-1 block">字段名称</label>
                      <input 
                        type="text" 
                        v-model="b.fieldName" 
                        :placeholder="`field${b.id}`"
                        class="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                      <p class="text-xs text-gray-400 mt-1">导出后将在此位置插入占位符</p>
                    </div>
                    
                    <div>
                      <label class="text-xs text-gray-600 mb-1 block">标记颜色</label>
                      <input type="color" v-model="b.color" class="w-full h-8 rounded cursor-pointer border border-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200">
              <button
                :disabled="!html || boxes.length === 0"
                @click="exportDocx"
                class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                导出模板文档
              </button>
              <p class="text-xs text-center text-gray-500 mt-2">将在标记位置插入占位符</p>
            </div>
          </div>
        </div>

        <!-- 右侧：文档预览与框选 -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
            <div class="flex items-center gap-2 mb-4">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <h2 class="text-lg font-semibold text-gray-800">文档预览</h2>
              <div v-if="html" class="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">拖动鼠标框选区域</div>
            </div>

            <div 
              id="doc-preview-wrapper" 
              ref="wrapperRef" 
              class="relative border-2 border-dashed border-gray-300 rounded-xl p-6 overflow-auto min-h-[600px] bg-white"
              :class="{ 'cursor-crosshair': previewReady }"
            >
              <!-- 预览内容 -->
              <div class="prose max-w-none">
                <!-- eslint-disable vue/no-v-html -->
                <div v-if="html" v-html="html"></div>
                <div v-else class="flex flex-col items-center justify-center py-20">
                  <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <p class="text-gray-600 font-medium">请选择 DOCX 文档进行预览</p>
                  <p class="text-sm text-gray-400 mt-2">支持上传 .docx 格式的 Word 文档</p>
                </div>
              </div>

              <!-- 覆盖层：绘制与显示选区 -->
              <div 
                v-if="previewReady"
                class="absolute inset-0 pointer-events-auto" 
                @mousedown.prevent="startDraw" 
                @mousemove.prevent="onMouseMove" 
                @mouseup.prevent="endDraw"
              >
                <!-- 当前绘制中的框 -->
                <div 
                  v-if="tempBox" 
                  class="absolute border-2 border-yellow-500 rounded" 
                  :style="{ 
                    left: tempBox.x + 'px', 
                    top: tempBox.y + 'px', 
                    width: tempBox.w + 'px', 
                    height: tempBox.h + 'px', 
                    background: tempBox.color 
                  }"
                ></div>
                
                <!-- 已完成的选区 -->
                <div 
                  v-for="b in boxes" 
                  :key="b.id" 
                  class="absolute border-2 border-blue-500 rounded text-sm p-2 shadow-lg transition-all hover:shadow-xl" 
                  :style="{ 
                    left: b.x + 'px', 
                    top: b.y + 'px', 
                    width: b.w + 'px', 
                    height: b.h + 'px', 
                    background: b.color, 
                    overflow: 'hidden' 
                  }"
                >
                  <div class="absolute top-0 left-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-br font-bold">
                    #{{ b.id }}: {{ b.fieldName || `field${b.id}` }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose :deep(img) {
  max-width: 100%;
}
</style>