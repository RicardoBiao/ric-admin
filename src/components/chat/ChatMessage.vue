<script setup lang="ts">
import { ref } from 'vue'
import { Download } from 'lucide-vue-next'
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
}

interface Props {
  message: Message
}

defineProps<Props>()

// 图片预览状态
const showImagePreview = ref(false)

</script>

<template>
  <div :class="['flex gap-1 group', message.role === 'user' ? 'flex-row-reverse' : '']">
    <!-- 消息主体 -->
    <div :class="['flex flex-col gap-1 max-w-sm', message.role === 'user' ? 'items-end' : 'items-start']">
      <!-- 消息气泡 -->
      <ChatBubble :message="message">
        <!-- 文本消息 -->
        <ChatTextContent
          v-if="!message.type || message.type === 'text'"
          :content="message.content"
          :role="message.role"
          :is-read="message.read"
        />

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

      <!-- 时间戳和已读状态行 -->
      <ChatTimestamp
        :timestamp="message.timestamp"
        :role="message.role"
        :is-read="message.read"
      />

      <!-- 文件下载按钮（仅在文件消息时显示）-->
      <template v-if="message.type === 'file' && message.fileUrl">
        <a
          :href="message.fileUrl"
          :download="message.fileName"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
          :title="`下载 ${message.fileName}`"
        >
          <Download class="h-4 w-4 text-gray-600" />
        </a>
      </template>
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
