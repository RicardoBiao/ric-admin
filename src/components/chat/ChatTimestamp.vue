<template>
  <div :class="['flex items-center gap-2', role === 'user' ? 'flex-row-reverse' : 'flex-row']">
    <span class="text-xs opacity-60">{{ formatTime(timestamp) }}</span>
    <!-- 已读状态（两边都显示） -->
    <div class="flex items-center gap-0.5">
      <CheckCheck v-if="isRead" class="h-5 w-5" :class="role === 'user' ? 'text-blue-500' : 'text-gray-400'" />
      <Check v-else class="h-5 w-5" :class="role === 'user' ? 'text-gray-400' : 'text-gray-300'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, CheckCheck } from 'lucide-vue-next'

interface Props {
  timestamp: string
  role: 'user' | 'assistant' | 'system'
  isRead?: boolean
}

const props = defineProps<Props>()

const formatTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return timestamp
  }
}
</script>
