<script setup lang="ts">
import { ref, computed } from 'vue'

const pcImage = ref<string>('')
const mobileImage = ref<string>('')
const pcBorderColor = ref('#85f9a8')
const mobileBorderColor = ref('#85f9a8')
const pcBorderWidth = ref(4)
const mobileBorderWidth = ref(4)
const pcUseDefaultColor = ref(true)
const mobileUseDefaultColor = ref(true)

const defaultBorderColor = '#85f9a8'
const bgColor = '#111828'

const actualPcBorderColor = computed(() => pcUseDefaultColor.value ? defaultBorderColor : bgColor)
const actualMobileBorderColor = computed(() => mobileUseDefaultColor.value ? defaultBorderColor : bgColor)

const handlePcUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      pcImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleMobileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      mobileImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const clearPcImage = () => {
  pcImage.value = ''
}

const clearMobileImage = () => {
  mobileImage.value = ''
}
</script>

<template>
  <div class="h-screen bg-black flex" style="padding: 8px;">
    <!-- 主内容区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-[80%_1fr] gap-3 items-stretch flex-1">
        <!-- 左侧：PC 端 -->
        <div class="flex flex-col gap-1.5 h-full">
          <!-- 边框颜色和宽度控制 -->
          <div class="bg-gray-900 rounded-lg p-1.5 space-y-1.5 flex-shrink-0">
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-gray-300 min-w-16">边框颜色</label>
              <div class="flex items-center gap-2">
                <input 
                  v-model="pcUseDefaultColor"
                  type="checkbox" 
                  class="w-3 h-3 rounded cursor-pointer accent-green-500"
                />
                <span class="text-xs text-gray-400">默认色</span>
              </div>
              <input 
                v-model="pcBorderColor" 
                type="color" 
                :disabled="pcUseDefaultColor"
                class="w-10 h-7 rounded cursor-pointer border-2 border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <input 
                v-model="pcBorderColor" 
                type="text" 
                :disabled="pcUseDefaultColor"
                class="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                v-if="pcImage"
                @click="clearPcImage"
                class="w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-gray-300 min-w-16">边框宽度</label>
              <input 
                v-model.number="pcBorderWidth" 
                type="range" 
                min="1" 
                max="20" 
                class="flex-1 accent-blue-500"
              />
              <span class="text-white text-xs min-w-10">{{ pcBorderWidth }}px</span>
            </div>
          </div>

          <!-- 上传区域 -->
          <div class="relative bg-gray-900 rounded-lg overflow-hidden flex-1 flex items-center justify-center">
            <div v-if="!pcImage" class="text-center p-6">
              <label class="cursor-pointer group">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                    <svg class="w-10 h-10 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-white font-medium mb-1">点击上传 PC 端截图</p>
                    <p class="text-sm text-gray-400">支持 PNG、JPG 格式</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handlePcUpload"
                />
              </label>
            </div>
            
            <div v-else class="relative w-full h-full p-3 flex items-center justify-center">
              <div 
                class="relative w-full h-full"
                :style="{
                  border: `${pcBorderWidth}px solid ${actualPcBorderColor}`,
                  borderRadius: '8px',
                  boxShadow: `0 0 40px ${actualPcBorderColor}40`
                }"
              >
                <img 
                  :src="pcImage" 
                  alt="PC Screenshot" 
                  class="w-full h-full object-contain rounded"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：移动端 -->
        <div class="flex flex-col gap-1.5 h-full">
          <!-- 边框颜色和宽度控制 -->
          <div class="bg-gray-900 rounded-lg p-1.5 space-y-1.5 flex-shrink-0">
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-gray-300 min-w-16">边框颜色</label>
              <div class="flex items-center gap-2">
                <input 
                  v-model="mobileUseDefaultColor"
                  type="checkbox" 
                  class="w-3 h-3 rounded cursor-pointer accent-green-500"
                />
                <span class="text-xs text-gray-400">默认色</span>
              </div>
              <input 
                v-model="mobileBorderColor" 
                type="color" 
                :disabled="mobileUseDefaultColor"
                class="w-10 h-7 rounded cursor-pointer border-2 border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <input 
                v-model="mobileBorderColor" 
                type="text" 
                :disabled="mobileUseDefaultColor"
                class="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                v-if="mobileImage"
                @click="clearMobileImage"
                class="w-7 h-7 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-gray-300 min-w-16">边框宽度</label>
              <input 
                v-model.number="mobileBorderWidth" 
                type="range" 
                min="1" 
                max="20" 
                class="flex-1 accent-purple-500"
              />
              <span class="text-white text-xs min-w-10">{{ mobileBorderWidth }}px</span>
            </div>
          </div>

          <!-- 上传区域 -->
          <div class="relative bg-gray-900 rounded-lg overflow-hidden flex-1 flex items-center justify-center">
            <div v-if="!mobileImage" class="text-center p-6">
              <label class="cursor-pointer group">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                    <svg class="w-10 h-10 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-white font-medium mb-1">点击上传移动端截图</p>
                    <p class="text-sm text-gray-400">支持 PNG、JPG 格式</p>
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  class="hidden" 
                  @change="handleMobileUpload"
                />
              </label>
            </div>
            
            <div v-else class="relative w-full h-full p-3 flex items-center justify-center">
              <div 
                class="relative w-full h-full"
                :style="{
                  border: `${mobileBorderWidth}px solid ${actualMobileBorderColor}`,
                  borderRadius: '8px',
                  boxShadow: `0 0 40px ${actualMobileBorderColor}40`
                }"
              >
                <img 
                  :src="mobileImage" 
                  alt="Mobile Screenshot" 
                  class="w-full h-full object-contain rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  
</template>
