<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import mammoth from 'mammoth/mammoth.browser'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

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
  text: string
  color: string
  key?: string
}

const boxes = ref<Box[]>([])
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
  tempBox.value = { id: -1, x, y, w, h, text: '', color: 'rgba(255, 235, 59, 0.35)' }
}

function endDraw() {
  if (!drawing.value) return
  drawing.value = false
  if (tempBox.value && tempBox.value.w > 10 && tempBox.value.h > 10) {
    const id = nextId.value++
    boxes.value.push({ ...tempBox.value, id })
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
  tempBox.value = null
  previewReady.value = false
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
  } catch (err: any) {
    error.value = err?.message || '文档解析失败'
  } finally {
    uploading.value = false
  }
}

async function exportDocx() {
  // Export using DOCX template (docxtemplater), preserves Word layout
  if (!templateBuffer.value) {
    error.value = '请先上传 .docx 模板文件'
    return
  }
  try {
    const { default: PizZip } = await import('pizzip')
    const { default: Docxtemplater } = await import('docxtemplater')
    const zip = new PizZip(templateBuffer.value)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    })

    const data: Record<string, string> = {}
    boxes.value.forEach(b => {
      const key = (b.key && b.key.trim()) || `field${b.id}`
      data[key] = b.text || ''
    })

    // Use new API: pass data directly to render
    doc.render(data)

    const out = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    saveAs(out, `${fileName.value ? fileName.value.replace(/\.docx$/i, '') : 'document'}-filled.docx`)
  } catch (e: any) {
    console.error('DOCX 导出错误:', e)
    error.value = e?.message || 'DOCX 导出失败，请检查模板占位符是否与左侧键名一致'
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
  <div class="px-4 py-6">
    <Card>
      <CardHeader>
        <CardTitle>文档预览（DOCX）</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex items-center gap-3 mb-4">
          <input type="file" accept=".docx" @change="handleFileChange" />
          <Button variant="secondary" @click="reset">清空</Button>
        </div>

        <div v-if="fileName" class="text-sm text-gray-600 mb-2">已选择文件：{{ fileName }}</div>
        <div v-if="uploading" class="text-sm text-gray-600 mb-4">正在解析文档...</div>
        <div v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</div>

        <div v-if="messages.length" class="mb-4">
          <div class="text-sm font-medium mb-2">解析提示：</div>
          <ul class="list-disc pl-6 text-sm text-gray-700">
            <li v-for="m in messages" :key="m.message">{{ m.message }}</li>
          </ul>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- 左侧：字段编辑 -->
          <div class="md:col-span-1">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium">字段编辑</div>
              <div class="text-xs text-gray-500">在右侧框选区域</div>
            </div>
            <div v-if="boxes.length === 0" class="text-sm text-gray-500">暂无选区，先在右侧预览框中拖动框选。</div>
            <div v-for="b in boxes" :key="b.id" class="border rounded p-2 mb-2 bg-gray-50">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-gray-600">选区 #{{ b.id }}</span>
                <Button size="sm" variant="destructive" @click="removeBox(b.id)">删除</Button>
              </div>
              <input type="color" class="mb-2" v-model="b.color" title="背景色" />
              <input type="text" class="mb-2 w-full text-sm border rounded p-2" v-model="b.key" placeholder="占位键（与模板中的 {{key}} 对应），默认 field{{b.id}}" />
              <textarea v-model="b.text" class="w-full h-20 text-sm border rounded p-2" placeholder="在此填写内容，将实时显示到选区" />
            </div>
            <div class="mt-4">
              <Button :disabled="!html" @click="exportDocx">导出为 Word (DOCX)</Button>
            </div>
          </div>

          <!-- 右侧：文档预览与框选 -->
          <div class="md:col-span-2">
            <div id="doc-preview-wrapper" ref="wrapperRef" class="relative border rounded-md p-4 overflow-auto">
              <!-- 预览内容 -->
              <div class="prose max-w-none">
                <!-- eslint-disable vue/no-v-html -->
                <div v-if="html" v-html="html"></div>
                <div v-else class="text-sm text-gray-500">请选择 .docx 文档进行预览。</div>
              </div>

              <!-- 覆盖层：绘制与显示选区 -->
              <div class="absolute inset-0" @mousedown.prevent="startDraw" @mousemove.prevent="onMouseMove" @mouseup.prevent="endDraw">
                <!-- 当前绘制中的框 -->
                <div v-if="tempBox" class="absolute border border-yellow-500" :style="{ left: tempBox.x + 'px', top: tempBox.y + 'px', width: tempBox.w + 'px', height: tempBox.h + 'px', background: tempBox.color }"></div>
                <!-- 已完成的选区 -->
                <div v-for="b in boxes" :key="b.id" class="absolute border border-yellow-600 text-sm p-1" :style="{ left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px', background: b.color, overflow: 'hidden' }">
                  <div class="pointer-events-none whitespace-pre-wrap">{{ b.text }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
  
</template>

<style scoped>
.prose :deep(img) {
  max-width: 100%;
}
</style>