<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import ChatInputBoxMobile from '@/components/chat/ChatInputBoxMobile.vue'
import { useChatService } from '@/composables/useChat'

// 使用聊天服务
const {
  selectedConversation,
  messages,
  loading,
  selectConversation,
  sendMessage,
  sendFileMessage,
  loadMessages,
} = useChatService()

// 本地消息输入
const messageInput = ref('')
const isSending = ref(false)
const pendingImages = ref<File[]>([])
const messagesContainer = ref<HTMLElement>()

// 模拟对话信息
const conversationInfo = {
  id: '2',
  title: '客服',
  avatar: 'CS',
  status: '在线',
}

// 初始化会话
const initConversation = async () => {
  await selectConversation(conversationInfo.id)
  await loadMessages(conversationInfo.id)
}

// 处理发送消息
const handleSendMessage = async () => {
  if (!messageInput.value.trim() && pendingImages.value.length === 0) {
    return
  }

  try {
    isSending.value = true
    
    // 发送待发送的图片
    if (pendingImages.value.length > 0) {
      for (const file of pendingImages.value) {
        const fileUrl = URL.createObjectURL(file)
        const isImage = file.type.startsWith('image/')

        await sendFileMessage(conversationInfo.id, {
          type: isImage ? 'image' : 'file',
          content: messageInput.value,
          fileUrl: fileUrl,
          fileName: file.name,
          fileSize: file.size,
        })
      }
      pendingImages.value = []
    }

    // 发送文本消息
    if (messageInput.value.trim()) {
      await sendMessage(conversationInfo.id, messageInput.value)
    }
    
    messageInput.value = ''
    
    // 自动滚动到底部
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isSending.value = false
  }
}

// 移除图片
const handleRemoveImage = (index: number) => {
  pendingImages.value.splice(index, 1)
}

// 添加图片
const handleAddImage = (file: File) => {
  pendingImages.value.push(file)
}

// 发送文件
const handleSendFile = async (file: File, content: string) => {
  if (!selectedConversation.value) {
    return
  }

  try {
    isSending.value = true
    const fileUrl = URL.createObjectURL(file)
    const isImage = file.type.startsWith('image/')

    await sendFileMessage(conversationInfo.id, {
      type: isImage ? 'image' : 'file',
      content: content,
      fileUrl: fileUrl,
      fileName: file.name,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('发送文件失败:', error)
  } finally {
    isSending.value = false
  }
}

onMounted(() => {
  initConversation()
})
</script>

<template>
  <div class="flex flex-col h-screen bg-white">
    <!-- 顶部导航栏 -->
    <div class="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div class="flex items-center gap-3 flex-1">
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
          <ArrowLeft class="h-5 w-5 text-gray-700" />
        </Button>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 text-sm">{{ conversationInfo.title }}</p>
          <p class="text-xs text-green-500">{{ conversationInfo.status }}</p>
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
    >
      <div v-if="loading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p class="text-gray-500 text-sm mt-2">加载消息中...</p>
        </div>
      </div>

      <template v-else>
        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />

        <div v-if="messages.length === 0" class="flex items-center justify-center h-full text-gray-400">
          <p class="text-sm">暂无消息，开始聊天吧</p>
        </div>
      </template>
    </div>

    <!-- 输入框 -->
    <ChatInputBoxMobile
      v-model="messageInput"
      :pending-images="pendingImages"
      :disabled="isSending"
      @send="handleSendMessage"
      @send-file="handleSendFile"
      @add-image="handleAddImage"
      @remove-image="handleRemoveImage"
    />
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
