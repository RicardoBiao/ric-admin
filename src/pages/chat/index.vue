<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TheLayout from '@/components/ric-ui/TheLayout.vue'
import ChatLayout from '@/components/chat/ChatLayout.vue'
import { useChatService } from '@/composables/useChat'

// 使用聊天服务
const {
  conversations,
  selectedConversation,
  messages,
  loading,
  fetchConversations,
  selectConversation,
  sendMessage,
  sendFileMessage,
  loadMessages,
} = useChatService()

// 本地消息输入
const messageInput = ref('')
const isSending = ref(false)

// 处理发送消息
const handleSendMessage = async () => {
  if (!messageInput.value.trim() && !selectedConversation.value) {
    return
  }

  try {
    isSending.value = true
    if (messageInput.value.trim()) {
      await sendMessage(selectedConversation.value!.id, messageInput.value)
      // 消息发送成功后再清空
      messageInput.value = ''
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isSending.value = false
  }
}

// 处理发送文件
const handleSendFile = async (file: File, content: string) => {
  if (!selectedConversation.value) {
    return
  }

  try {
    isSending.value = true
    const fileUrl = URL.createObjectURL(file)
    const isImage = file.type.startsWith('image/')

    // 调用发送文件接口
    await sendFileMessage(
      selectedConversation.value.id,
      {
        type: isImage ? 'image' : 'file',
        content: content,
        fileUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size,
      }
    )
  } catch (error) {
    console.error('发送文件失败:', error)
  } finally {
    isSending.value = false
  }
}

// 处理选择会话
const handleSelectConversation = async (conversationId: string) => {
  await selectConversation(conversationId)
  await loadMessages(conversationId)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchConversations()
})
</script>

<template>
  <TheLayout>
    <ChatLayout
      :conversations="conversations"
      :selected-conversation="selectedConversation"
      :messages="messages"
      :loading="loading"
      :message-input="messageInput"
      :is-sending="isSending"
      @select-conversation="handleSelectConversation"
      @update:message-input="(val: string) => messageInput = val"
      @send-message="handleSendMessage"
      @send-file="handleSendFile"
    />
  </TheLayout>
</template>
