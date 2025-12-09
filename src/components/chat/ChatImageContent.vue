<template>
  <div class="relative">
    <img
      :src="fileUrl"
      :alt="fileName"
      class="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
      @click="$emit('preview')"
    />
    <!-- 已读图标在图片右下角 -->
    <div v-if="role === 'user'" class="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/30 rounded-full p-1">
      <CheckCheck v-if="isRead" class="h-3 w-3 text-white" />
      <Check v-else class="h-3 w-3 text-white" />
    </div>
  </div>
  <p v-if="caption" class="text-sm mt-2 px-4 pb-2">{{ caption }}</p>
</template>

<script setup lang="ts">
import { Check, CheckCheck } from 'lucide-vue-next'

interface Props {
  fileUrl: string
  fileName?: string
  caption?: string
  role: 'user' | 'assistant' | 'system'
  isRead?: boolean
}

defineProps<Props>()
defineEmits<{
  preview: []
}>()
</script>
