<template>
  <div :class="['flex items-end gap-2', message.role === 'user' ? 'flex-row-reverse' : 'flex-row']">
    <!-- 头像 -->
    <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" :class="message.role === 'user' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gray-300'">
      {{ message.avatar || (message.role === 'user' ? '我' : 'AI') }}
    </div>

    <!-- 消息气泡 -->
    <div
      :class="[
        'rounded-2xl break-words transition-all duration-200 shadow-sm hover:shadow-md',
        message.role === 'user'
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm'
          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  avatar?: string
  type?: 'text' | 'image' | 'file'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  read?: boolean
}

interface Props {
  message: Message
}

defineProps<Props>()
</script>
