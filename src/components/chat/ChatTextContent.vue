<template>
  <div class="flex items-end gap-2 px-4 py-2">
    <p class="text-sm leading-relaxed flex-1">{{ content }}</p>
    <!-- 已读状态（用户消息显示在气泡内） -->
    <div v-if="role === 'user'" class="flex-shrink-0 inline-flex items-center gap-0.5">
      <CheckCheck v-if="isRead" class="h-3 w-3 text-white" />
      <Check v-else class="h-3 w-3 text-blue-300" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, CheckCheck } from 'lucide-vue-next'

interface Props {
  content: string
  role: 'user' | 'assistant' | 'system'
  isRead?: boolean
}

defineProps<Props>()
</script>
