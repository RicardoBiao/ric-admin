<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl max-h-[90vh] p-0 flex flex-col">
      <DialogHeader class="px-6 py-4 border-b">
        <DialogTitle>{{ fileName }}</DialogTitle>
      </DialogHeader>
      
      <div class="flex-1 overflow-auto p-6">
        <iframe 
          v-if="pdfUrl"
          :src="pdfUrl" 
          class="w-full h-[70vh] border rounded"
          frameborder="0"
        />
        <div v-else class="flex items-center justify-center h-[70vh]">
          <p class="text-muted-foreground">加载PDF中...</p>
        </div>
      </div>
      
      <div class="px-6 py-4 border-t flex justify-end gap-2">
        <Button 
          variant="outline" 
          @click="downloadPdf"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          下载
        </Button>
        <Button @click="$emit('update:open', false)">关闭</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  fileName: string
  fileContent: string // base64 data URL
}>()

defineEmits<{
  'update:open': [value: boolean]
}>()

const pdfUrl = ref<string>('')

watch(() => props.fileContent, (content) => {
  if (content) {
    pdfUrl.value = content
  }
}, { immediate: true })

const downloadPdf = () => {
  const link = document.createElement('a')
  link.href = props.fileContent
  link.download = props.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
