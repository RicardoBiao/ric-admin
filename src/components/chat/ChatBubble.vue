<template>
  <div :class="['flex flex-col']">
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
