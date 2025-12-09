<template>
  <!-- 半透明背景遮罩（在底部组件下层） -->
  <transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showActionMenu"
      @click="showActionMenu = false"
      class="fixed inset-0 bg-black/30"
      style="z-index: 48;"
    ></div>
  </transition>

  <!-- 整个输入组件 -->
  <div class="fixed bottom-0 left-0 right-0 z-50">
    <!-- 菜单上滑动画（在输入框下方） -->
    <transition
      enter-active-class="transition ease-out duration-250"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition ease-in duration-250"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <div v-if="showActionMenu" class="bg-white border-t border-gray-200 overflow-hidden">
        <!-- 菜单标题 -->
        <div class="px-4 pt-4 pb-3">
          <p class="text-sm text-gray-600 font-medium">选择要发送的内容</p>
        </div>

        <!-- 菜单项网格（4列） -->
        <div class="grid grid-cols-4 gap-4 px-4 pb-4">
          <!-- 图片库 -->
          <button
            @click="imageInputRef?.click(); showActionMenu = false"
            class="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div class="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center">
              <ImageIcon class="h-8 w-8 text-blue-500" />
            </div>
            <span class="text-xs text-gray-700 font-medium">图片库</span>
          </button>

          <!-- 拍照 -->
          <button
            @click="cameraInputRef?.click(); showActionMenu = false"
            class="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div class="w-16 h-16 bg-green-100 rounded-3xl flex items-center justify-center">
              <Camera class="h-8 w-8 text-green-500" />
            </div>
            <span class="text-xs text-gray-700 font-medium">拍照</span>
          </button>

          <!-- 文件 -->
          <button
            @click="fileInputRef?.click(); showActionMenu = false"
            class="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div class="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center">
              <Paperclip class="h-8 w-8 text-orange-500" />
            </div>
            <span class="text-xs text-gray-700 font-medium">文件</span>
          </button>

          <!-- 取消 -->
          <button
            @click="showActionMenu = false"
            class="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div class="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center">
              <X class="h-8 w-8 text-gray-500" />
            </div>
            <span class="text-xs text-gray-700 font-medium">取消</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- 输入区域 -->
    <div class="bg-white border-t border-gray-200">
      <div class="flex items-end gap-3 p-3">
        <!-- 左侧：表情按钮 -->
        <DropdownMenu v-model:open="showEmojiPicker">
          <DropdownMenuTrigger as-child>
            <Button
              :disabled="disabled"
              variant="ghost"
              size="sm"
              class="h-9 w-9 p-0 hover:bg-gray-100 flex-shrink-0 rounded-full flex items-center justify-center"
              title="表情"
            >
              <Smile class="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-72 p-2" align="start" side="top">
            <div class="grid grid-cols-8 gap-1">
              <button
                v-for="(emoji, idx) in emojis"
                :key="idx"
                @click="insertEmoji(emoji)"
                class="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
              >
                {{ emoji }}
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- 中间：输入框（iPhone 风格） -->
        <div class="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center">
          <textarea
            ref="textareaRef"
            :value="modelValue"
            @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
            @paste="handlePaste"
            @keydown="handleKeyDown"
            placeholder="iMessage"
            :disabled="disabled"
            class="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder-gray-400"
            style="min-height: 24px; max-height: 100px; line-height: 1.5; -webkit-appearance: none; appearance: none;"
            rows="1"
          />
        </div>

        <!-- 右侧：加号按钮 -->
        <Button
          @click="showActionMenu = !showActionMenu"
          :disabled="disabled"
          variant="ghost"
          size="sm"
          class="h-9 w-9 p-0 hover:bg-gray-100 flex-shrink-0 rounded-full flex items-center justify-center"
          title="添加"
        >
          <Plus class="h-6 w-6 text-blue-500" />
        </Button>
      </div>

      <!-- 待发送图片预览 -->
      <div v-if="pendingImages.length > 0" class="flex gap-2 flex-wrap px-3 pb-3 border-t border-gray-100 bg-gray-50">
        <div v-for="(file, index) in pendingImages" :key="index" class="relative group">
          <img
            :src="getImagePreview(file)"
            :alt="file.name"
            class="h-12 w-12 object-cover rounded-lg border border-gray-200"
          />
          <button
            @click="$emit('remove-image', index)"
            class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="移除图片"
          >
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
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
    <input
      ref="cameraInputRef"
      type="file"
      accept="image/*"
      capture="environment"
      class="hidden"
      @change="(e) => handleFileSelect(e, 'image')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Paperclip, Image as ImageIcon, Smile, Plus, Camera, X } from 'lucide-vue-next'
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
const cameraInputRef = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const showEmojiPicker = ref(false)
const showActionMenu = ref(false)

// 常用 emoji 表情（精简版）
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
    
    // 更新焦点和光标位置
    nextTick(() => {
      if (textareaRef.value) {
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
