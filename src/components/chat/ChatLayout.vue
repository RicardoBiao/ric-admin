<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Search, MoreVertical, Plus, Paperclip, Image as ImageIcon, Smile } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ChatMessage from './ChatMessage.vue'

interface Conversation {
  id: string
  title: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unread?: number
}

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
}

interface Props {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Message[]
  loading: boolean
  messageInput: string
  isSending: boolean
}

interface Emits {
  (e: 'select-conversation', id: string): void
  (e: 'update:message-input', value: string): void
  (e: 'send-message'): void
  (e: 'send-file', file: File, content: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const conversationSearchQuery = ref('')
const messagesContainer = ref<HTMLElement>()
const fileInputRef = ref<HTMLInputElement>()
const imageInputRef = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const pendingImages = ref<File[]>([])
const showEmojiPicker = ref(false)

// 常用 emoji 表情
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '😝', '😎', '🤓', '🧐', '😏', '😒', '😞', '😔',
  '😟', '😕', '🙁', '☹️', '😲', '😳', '🥺', '😦',
  '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
  '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡',
  '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡',
  '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸',
  '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️',
  '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
  '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
  '💟', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌',
  '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👍',
  '👎', '👊', '👏', '🙌', '👐', '🫶', '🤲', '🤝',
  '🤜', '🤛', '🦵', '🦶', '👂', '👃', '🧠', '🦷',
  '🦴', '🌟', '✨', '⭐', '🌠', '💫', '⚡', '🔥',
]

// 自动滚动到底部
watch(
  () => props.messages,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  },
  { deep: true }
)

const displayConversations = computed(() => {
  if (!conversationSearchQuery.value) {
    return props.conversations
  }
  return props.conversations.filter((conv: Conversation) =>
    conv.title.toLowerCase().includes(conversationSearchQuery.value.toLowerCase())
  )
})

// 处理文件选择
const handleFileSelect = (event: Event, type: 'image' | 'file') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && props.selectedConversation) {
    if (type === 'image') {
      pendingImages.value.push(file)
    } else {
      emit('send-file', file, `[文件]`)
    }
  }
  // 重置 input
  target.value = ''
}

// 处理粘贴事件
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      if (file) {
        pendingImages.value.push(file)
      }
    }
  }
}

// textarea 自动高度
const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 150) + 'px'
  }
}

// 发送消息和图片
const handleSendMessage = () => {
  const hasPendingImages = pendingImages.value.length > 0
  const hasMessageInput = props.messageInput.trim()
  
  if (!hasPendingImages && !hasMessageInput) {
    return
  }
  
  if (hasPendingImages) {
    // 先发送所有待发送的图片
    pendingImages.value.forEach(file => {
      emit('send-file', file, props.messageInput)
    })
    pendingImages.value = []
  }
  
  if (hasMessageInput) {
    // 发送文本消息
    emit('send-message')
  }
  
  // 重置 textarea 高度
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

// 处理 textarea 输入
const handleTextareaInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:message-input', target.value)
  adjustTextareaHeight()
}

// 处理 Enter 发送
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSendMessage()
  }
}

// 插入表情
const insertEmoji = (emoji: string) => {
  if (textareaRef.value) {
    const start = textareaRef.value.selectionStart || 0
    const end = textareaRef.value.selectionEnd || 0
    const text = props.messageInput
    const newText = text.slice(0, start) + emoji + text.slice(end)
    emit('update:message-input', newText)
    
    // 更新高度并恢复焦点
    nextTick(() => {
      if (textareaRef.value) {
        adjustTextareaHeight()
        textareaRef.value.focus()
        textareaRef.value.setSelectionRange(start + emoji.length, start + emoji.length)
      }
    })
  }
  showEmojiPicker.value = false
}

// 获取图片预览 URL
const getImagePreview = (file: File): string => {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file)
  }
  return ''
}
</script>

<template>
  <div class="flex h-full bg-gray-50 rounded-lg shadow-sm overflow-hidden">
    <!-- 左侧会话列表 -->
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
            v-model="conversationSearchQuery"
            placeholder="搜索或开始聊天"
            class="pl-10 h-9 bg-gray-100 border-0 rounded-full"
          />
        </div>
      </div>

      <!-- 会话列表 -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="conversation in displayConversations"
          :key="conversation.id"
          :class="[
            'px-2 py-2 mx-2 rounded-lg cursor-pointer transition-all duration-200',
            selectedConversation?.id === conversation.id
              ? 'bg-blue-100'
              : 'hover:bg-gray-100'
          ]"
          @click="$emit('select-conversation', conversation.id)"
        >
          <div class="flex items-center gap-3">
            <!-- 头像 -->
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
              {{ conversation.avatar || conversation.title.charAt(0) }}
            </div>
            <!-- 信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="font-medium text-gray-900 text-sm truncate">{{ conversation.title }}</p>
                <span class="text-xs text-gray-500 flex-shrink-0">{{ conversation.timestamp }}</span>
              </div>
              <p class="text-xs text-gray-500 truncate mt-1">{{ conversation.lastMessage }}</p>
            </div>
            <!-- 未读标志 -->
            <div v-if="conversation.unread" class="flex-shrink-0">
              <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-blue-500">
                {{ conversation.unread }}
              </span>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="conversations.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 p-4">
          <p class="text-sm text-center">暂无聊天记录<br>选择联系人开始对话</p>
        </div>
      </div>
    </div>

    <!-- 右侧聊天窗口 -->
    <div class="flex-1 flex flex-col bg-gray-50">
      <!-- 顶部信息栏 -->
      <div v-if="selectedConversation" class="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
            {{ selectedConversation.avatar || selectedConversation.title.charAt(0) }}
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ selectedConversation.title }}</p>
            <p class="text-xs text-gray-500">在线</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="h-8 w-8 p-0 hover:bg-gray-100">
              <MoreVertical class="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>查看信息</DropdownMenuItem>
            <DropdownMenuItem>静音</DropdownMenuItem>
            <DropdownMenuItem class="text-red-600">删除聊天</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- 空状态 -->
      <div v-if="!selectedConversation" class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <div class="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p class="text-lg font-semibold">选择一个聊天开始</p>
          <p class="text-sm mt-1">从左侧列表选择联系人进行对话</p>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        v-else
        ref="messagesContainer"
        class="overflow-y-auto p-4 space-y-2 h-[calc(100vh-334px)]"
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
            <p class="text-sm">暂无消息</p>
          </div>
        </template>
      </div>

      <!-- 输入框 -->
      <div v-if="selectedConversation" class="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
        <!-- 待发送图片预览 -->
        <div v-if="pendingImages.length > 0" class="flex gap-2 flex-wrap">
          <div v-for="(file, index) in pendingImages" :key="index" class="relative group">
            <img
              :src="getImagePreview(file)"
              :alt="file.name"
              class="h-16 w-16 object-cover rounded-lg border border-gray-200"
            />
            <button
              @click="pendingImages.splice(index, 1)"
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="移除图片"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- 隐藏的文件输入框 -->
        <input
          ref="fileInputRef"
          type="file"
          class="hidden"
          @change="(e) => handleFileSelect(e, 'file')"
        />
        <input
          ref="imageInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="(e) => handleFileSelect(e, 'image')"
        />

        <!-- 功能按钮行 -->
        <div class="flex gap-2">
          <!-- 表情按钮 -->
          <DropdownMenu v-model:open="showEmojiPicker">
            <DropdownMenuTrigger as-child>
              <Button
                :disabled="isSending"
                variant="ghost"
                size="sm"
                class="h-9 w-9 p-0 hover:bg-gray-100 flex-shrink-0"
                title="发送表情"
              >
                <Smile class="h-5 w-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-80 p-2" align="start">
              <div class="grid grid-cols-8 gap-2">
                <button
                  v-for="(emoji, idx) in emojis"
                  :key="idx"
                  @click="insertEmoji(emoji)"
                  class="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                >
                  {{ emoji }}
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <!-- 文件按钮 -->
          <Button
            @click="fileInputRef?.click()"
            :disabled="isSending"
            variant="ghost"
            size="sm"
            class="h-9 w-9 p-0 hover:bg-gray-100 flex-shrink-0"
            title="发送文件"
          >
            <Paperclip class="h-5 w-5 text-gray-600" />
          </Button>

          <!-- 图片按钮 -->
          <Button
            @click="imageInputRef?.click()"
            :disabled="isSending"
            variant="ghost"
            size="sm"
            class="h-9 w-9 p-0 hover:bg-gray-100 flex-shrink-0"
            title="发送图片"
          >
            <ImageIcon class="h-5 w-5 text-gray-600" />
          </Button>
          
        </div>

        <!-- textarea 输入框 -->
        <div class="relative">
          <textarea
            ref="textareaRef"
            :value="messageInput"
            @input="handleTextareaInput"
            @paste="handlePaste"
            @keydown="handleKeyDown"
            placeholder="消息...（支持粘贴图片，Enter 发送，Shift+Enter 换行）"
            :disabled="isSending"
            class="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style="min-height: 40px; max-height: 150px; line-height: 1.5"
          />
        </div>
      </div>
    </div>
  </div>
</template>
