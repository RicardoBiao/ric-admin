<template>
  <div class="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
    <!-- 待发送图片预览 -->
    <div v-if="pendingImages.length > 0" class="flex gap-2 flex-wrap">
      <div v-for="(file, index) in pendingImages" :key="index" class="relative group">
        <img
          :src="getImagePreview(file)"
          :alt="file.name"
          class="h-16 w-16 object-cover rounded-lg border border-gray-200"
        />
        <button
          @click="$emit('remove-image', index)"
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
            :disabled="disabled"
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
        :disabled="disabled"
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
        :disabled="disabled"
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
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value); adjustTextareaHeight()"
        @paste="handlePaste"
        @keydown="handleKeyDown"
        placeholder=""
        :disabled="disabled"
        class="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style="min-height: 40px; max-height: 150px; line-height: 1.5"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Paperclip, Image as ImageIcon, Smile } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  modelValue: string
  pendingImages: File[]
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'add-image': [file: File]
  'remove-image': [index: number]
  'send-file': [file: File, content: string]
  'send': []
}>()

const fileInputRef = ref<HTMLInputElement>()
const imageInputRef = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
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

// 处理文件选择
const handleFileSelect = (event: Event, type: 'image' | 'file') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (type === 'image') {
      emit('add-image', file)
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
        emit('add-image', file)
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

// 处理 Enter 发送
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('send')
  }
}

// 插入表情
const insertEmoji = (emoji: string) => {
  if (textareaRef.value) {
    const start = textareaRef.value.selectionStart || 0
    const end = textareaRef.value.selectionEnd || 0
    const text = props.modelValue
    const newText = text.slice(0, start) + emoji + text.slice(end)
    emit('update:modelValue', newText)
    
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
