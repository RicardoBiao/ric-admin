<template>
  <div class="w-72 border-r border-gray-200 bg-white flex flex-col">
    <!-- 顶部操作栏 -->
    <div class="p-4 border-b border-gray-100 space-y-3">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold text-gray-900 flex-1">消息</h2>
        <Button size="sm" variant="ghost" class="h-8 w-8 p-0 hover:bg-gray-100">
          <Plus class="h-5 w-5" />
        </Button>
      </div>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          :model-value="searchQuery"
          @update:model-value="$emit('update:searchQuery', String($event))"
          placeholder="搜索或开始聊天"
          class="pl-10 h-9 bg-gray-100 border-0 rounded-full"
        />
      </div>
    </div>

    <!-- 会话列表 -->
    <div class="flex-1 overflow-y-auto">
      <ChatConversationItem
        v-for="conversation in conversations"
        :key="conversation.id"
        :title="conversation.title"
        :avatar="conversation.avatar"
        :last-message="conversation.lastMessage"
        :timestamp="conversation.timestamp"
        :unread="conversation.unread"
        :is-selected="selectedConversationId === conversation.id"
        @click="$emit('select', conversation.id)"
      />

      <!-- 空状态 -->
      <div v-if="conversations.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <p class="text-sm text-center">暂无聊天记录<br>选择联系人开始对话</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ChatConversationItem from './ChatConversationItem.vue'

interface Conversation {
  id: string
  title: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unread?: number
}

interface Props {
  conversations: Conversation[]
  searchQuery: string
  selectedConversationId: string | null
}

defineProps<Props>()
defineEmits<{
  'update:searchQuery': [value: string]
  select: [id: string]
}>()
</script>
