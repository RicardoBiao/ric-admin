<script setup lang="ts">
import { ref } from 'vue'
import ChatBubble from './ChatBubble.vue'
import ChatTextContent from './ChatTextContent.vue'
import ChatImageContent from './ChatImageContent.vue'
import ChatFileContent from './ChatFileContent.vue'
import ChatTimestamp from './ChatTimestamp.vue'
import ChatImagePreview from './ChatImagePreview.vue'

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
  isStreaming?: boolean
}

interface Props {
  message: Message
}

defineProps<Props>()

// 图片预览状态
const showImagePreview = ref(false)

</script>

<template>
  <div class="flex flex-col group w-full">
    <!-- 顶部时间戳行 -->
    <div class="flex w-full mb-1" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
      <ChatTimestamp
        :timestamp="message.timestamp"
        :role="message.role"
        :is-read="message.read"
      />
    </div>
    <!-- 头像和气泡并排 -->
    <div :class="['flex items-start gap-1', message.role === 'user' ? 'flex-row-reverse' : '']">
      <!-- 头像 -->
      <!-- <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" :class="message.role === 'user' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gray-300'">
        {{ message.avatar || (message.role === 'user' ? '我' : 'AI') }}
      </div> -->
      <!-- 消息气泡主体 -->
      <div :class="['max-w-2xl', message.role === 'user' ? 'items-end' : 'items-start']">
        <template v-if="message.isStreaming && !message.content">
          <span class="inline-block w-4 h-4 rounded-full bg-blue-500 animate-pulse align-middle"></span>
        </template>
        <template v-else>
          <ChatBubble :message="message">
            <!-- 文本消息 -->
            <template v-if="!message.type || message.type === 'text'">
              <ChatTextContent
                :content="message.content"
                :role="message.role"
              />
            </template>
            <!-- 图片消息 -->
            <ChatImageContent
              v-else-if="message.type === 'image'"
              :file-url="message.fileUrl || ''"
              :file-name="message.fileName"
              :caption="message.content"
              :role="message.role"
              :is-read="message.read"
              @preview="showImagePreview = true"
            />

            <!-- 文件消息 -->
            <ChatFileContent
              v-else-if="message.type === 'file'"
              :file-name="message.fileName"
              :file-size="message.fileSize"
              :caption="message.content"
              :role="message.role"
              :is-read="message.read"
            />
          </ChatBubble>
        </template>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <ChatImagePreview
      :show="showImagePreview && message.type === 'image'"
      :file-url="message.fileUrl || ''"
      :file-name="message.fileName"
      @close="showImagePreview = false"
    />
  </div>
</template>
