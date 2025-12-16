<template>
  <div class="px-4 py-2">
    <div class="flex items-center gap-3">
      <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
        <FileIcon class="h-5 w-5 text-white" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ getFileName(fileName) }}</p>
        <p class="text-xs opacity-75 mt-0.5">{{ formatFileSize(fileSize) }}</p>
      </div>
      <!-- 已读状态（用户消息显示） -->
      <div v-if="role === 'user'" class="flex-shrink-0 inline-flex items-center gap-0.5">
        <CheckCheck v-if="isRead" class="h-3 w-3 text-white" />
        <Check v-else class="h-3 w-3 text-blue-300" />
      </div>
    </div>
    <p v-if="caption" class="text-sm mt-2">{{ caption }}</p>
  </div>
</template>

<script setup lang="ts">
import { FileIcon, Check, CheckCheck } from 'lucide-vue-next'

interface Props {
  fileName?: string
  fileSize?: number
  caption?: string
  role: 'user' | 'assistant' | 'system'
  isRead?: boolean
}

defineProps<Props>()

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const getFileName = (fileName?: string) => {
  if (!fileName) return '未知文件'
  return fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName
}
</script>
