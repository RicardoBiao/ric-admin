<template>
  <div
    :class="[
      'px-2 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-200',
      isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-center gap-3">
      <!-- 头像 -->
      <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
        {{ avatar || title.charAt(0) }}
      </div>
      <!-- 信息 -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="font-medium text-gray-900 text-sm truncate">{{ title }}</p>
          <span class="text-xs text-gray-500 flex-shrink-0">{{ timestamp }}</span>
        </div>
        <p class="text-xs text-gray-500 truncate mt-1">{{ lastMessage }}</p>
      </div>
      <!-- 未读标志 -->
      <div v-if="unread" class="flex-shrink-0">
        <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-blue-500">
          {{ unread }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unread?: number
  isSelected?: boolean
}

defineProps<Props>()
defineEmits<{
  click: []
}>()
</script>
