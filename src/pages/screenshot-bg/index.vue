<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface ImageItem {
  id: string
  file: File
  url: string
  name: string
}

const router = useRouter()

// 图片列表
const pcImages = ref<ImageItem[]>([])
const mobileImages = ref<ImageItem[]>([])
const pcCurrentIndex = ref(0)
const mobileCurrentIndex = ref(0)

// 截图列表
const screenshots = ref<string[]>([])

// 边框设置
const pcBorderColor = ref('#85f9a8')
const mobileBorderColor = ref('#85f9a8')
const pcBorderWidth = ref(8)
const mobileBorderWidth = ref(8)
const pcUseDefaultColor = ref(true)
const mobileUseDefaultColor = ref(true)

// 区域大小比例设置 (PC端占比，移动端为 100 - PC端占比)
const pcWidthPercent = ref(80)

// 截图区域引用
const screenshotArea = ref<HTMLElement | null>(null)

const defaultBorderColor = '#85f9a8'
const bgColor = '#111828'

const actualPcBorderColor = computed(() => pcUseDefaultColor.value ? defaultBorderColor : bgColor)
const actualMobileBorderColor = computed(() => mobileUseDefaultColor.value ? defaultBorderColor : bgColor)
const mobileWidthPercent = computed(() => 100 - pcWidthPercent.value)

const currentPcImage = computed(() => pcImages.value[pcCurrentIndex.value])
const currentMobileImage = computed(() => mobileImages.value[mobileCurrentIndex.value])

// 按文件名排序
const sortImages = (images: ImageItem[]) => {
  return images.sort((a, b) => {
    const getNumber = (name: string) => {
      const match = name.match(/(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    }
    
    const numA = getNumber(a.name)
    const numB = getNumber(b.name)
    
    if (numA !== numB) {
      return numA - numB
    }
    
    return a.name.localeCompare(b.name)
  })
}

// PC 端批量上传
const handlePcUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  if (imageFiles.length === 0) return

  const newImages: ImageItem[] = []
  imageFiles.forEach((file, index) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const id = `${Date.now()}_${index}`
      newImages.push({
        id,
        file,
        url: e.target?.result as string,
        name: file.name
      })
      
      if (newImages.length === imageFiles.length) {
        pcImages.value = sortImages([...pcImages.value, ...newImages])
        if (pcImages.value.length > 0 && pcCurrentIndex.value >= pcImages.value.length) {
          pcCurrentIndex.value = 0
        }
      }
    }
    reader.readAsDataURL(file)
  })

  target.value = ''
}

// 移动端批量上传
const handleMobileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  if (imageFiles.length === 0) return

  const newImages: ImageItem[] = []
  imageFiles.forEach((file, index) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const id = `${Date.now()}_${index}`
      newImages.push({
        id,
        file,
        url: e.target?.result as string,
        name: file.name
      })
      
      if (newImages.length === imageFiles.length) {
        mobileImages.value = sortImages([...mobileImages.value, ...newImages])
        if (mobileImages.value.length > 0 && mobileCurrentIndex.value >= mobileImages.value.length) {
          mobileCurrentIndex.value = 0
        }
      }
    }
    reader.readAsDataURL(file)
  })

  target.value = ''
}

// 导航控制
const prevPc = () => {
  if (pcCurrentIndex.value > 0) {
    pcCurrentIndex.value--
  }
}

const nextPc = () => {
  if (pcCurrentIndex.value < pcImages.value.length - 1) {
    pcCurrentIndex.value++
  }
}

const prevMobile = () => {
  if (mobileCurrentIndex.value > 0) {
    mobileCurrentIndex.value--
  }
}

const nextMobile = () => {
  if (mobileCurrentIndex.value < mobileImages.value.length - 1) {
    mobileCurrentIndex.value++
  }
}

// 清空
const clearPcImages = () => {
  pcImages.value = []
  pcCurrentIndex.value = 0
}

const clearMobileImages = () => {
  mobileImages.value = []
  mobileCurrentIndex.value = 0
}

// 截图功能（不使用 html2canvas，手动绘制 canvas）
const isCapturing = ref(false)
const showToast = ref(false)
const toastMessage = ref('')

const showToastMsg = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

const captureScreenshot = async () => {
  if (!currentPcImage.value && !currentMobileImage.value) {
    showToastMsg('请先上传图片')
    return
  }

  isCapturing.value = true

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    // 获取实际显示区域的尺寸
    const areaWidth = screenshotArea.value?.offsetWidth || 1200
    const areaHeight = screenshotArea.value?.offsetHeight || 800
    
    canvas.width = areaWidth * 2 // 2倍分辨率
    canvas.height = areaHeight * 2
    
    // 背景色
    ctx.fillStyle = 'rgb(17, 24, 40)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // PC 端区域（使用用户设置的比例）
    const pcWidth = canvas.width * (pcWidthPercent.value / 100)
    const pcHeight = canvas.height
    const pcPadding = 40 // 减小padding，让图片更大
    
    if (currentPcImage.value) {
      const pcImg = new Image()
      pcImg.src = currentPcImage.value.url
      await new Promise((resolve) => {
        pcImg.onload = resolve
        pcImg.onerror = resolve
      })
      
      // 计算图片实际显示尺寸（保持比例，尽量铺满，不受边框影响）
      const maxWidth = pcWidth - pcPadding * 2
      const maxHeight = pcHeight - pcPadding * 2
      let imgWidth = pcImg.width
      let imgHeight = pcImg.height
      
      // 按比例缩放到尽可能大
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
      imgWidth *= ratio
      imgHeight *= ratio
      
      // 居中位置（图片位置固定，不受边框影响）
      const pcX = (pcWidth - imgWidth) / 2
      const pcY = (pcHeight - imgHeight) / 2
      
      // 绘制图片
      ctx.drawImage(pcImg, pcX, pcY, imgWidth, imgHeight)
      
      // 绘制边框（分别绘制四条边，确保完全在图片内部）
      if (pcBorderWidth.value > 0) {
        const bw = pcBorderWidth.value
        ctx.fillStyle = actualPcBorderColor.value
        // 上边框
        ctx.fillRect(pcX, pcY, imgWidth, bw)
        // 下边框
        ctx.fillRect(pcX, pcY + imgHeight - bw, imgWidth, bw)
        // 左边框
        ctx.fillRect(pcX, pcY, bw, imgHeight)
        // 右边框
        ctx.fillRect(pcX + imgWidth - bw, pcY, bw, imgHeight)
      }
    }
    
    // 移动端区域（使用用户设置的比例）
    const mobileX = pcWidth
    const mobileWidth = canvas.width - pcWidth
    const mobileHeight = canvas.height
    const mobilePadding = 40 // 减小padding
    
    // 绘制分隔线
    ctx.strokeStyle = 'rgb(55, 65, 81)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(mobileX, 0)
    ctx.lineTo(mobileX, canvas.height)
    ctx.stroke()
    
    if (currentMobileImage.value) {
      const mobileImg = new Image()
      mobileImg.src = currentMobileImage.value.url
      await new Promise((resolve) => {
        mobileImg.onload = resolve
        mobileImg.onerror = resolve
      })
      
      // 计算图片实际显示尺寸（尽量铺满，不受边框影响）
      const maxWidth = mobileWidth - mobilePadding * 2
      const maxHeight = mobileHeight - mobilePadding * 2
      let imgWidth = mobileImg.width
      let imgHeight = mobileImg.height
      
      // 按比例缩放到尽可能大
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
      imgWidth *= ratio
      imgHeight *= ratio
      
      // 居中位置（图片位置固定，不受边框影响）
      const mX = mobileX + (mobileWidth - imgWidth) / 2
      const mY = (mobileHeight - imgHeight) / 2
      
      // 绘制图片
      ctx.drawImage(mobileImg, mX, mY, imgWidth, imgHeight)
      
      // 绘制边框（分别绘制四条边，确保完全在图片内部）
      if (mobileBorderWidth.value > 0) {
        const bw = mobileBorderWidth.value
        ctx.fillStyle = actualMobileBorderColor.value
        // 上边框
        ctx.fillRect(mX, mY, imgWidth, bw)
        // 下边框
        ctx.fillRect(mX, mY + imgHeight - bw, imgWidth, bw)
        // 左边框
        ctx.fillRect(mX, mY, bw, imgHeight)
        // 右边框
        ctx.fillRect(mX + imgWidth - bw, mY, bw, imgHeight)
      }
    }
    
    const screenshotUrl = canvas.toDataURL('image/png')
    screenshots.value.push(screenshotUrl)
    
    showToastMsg(`截图成功！已保存 ${screenshots.value.length} 张`)
  } catch (error) {
    console.error('截图失败:', error)
    showToastMsg('截图失败，请重试')
  } finally {
    isCapturing.value = false
  }
}

// 制作 GIF
const makeGif = () => {
  if (screenshots.value.length === 0) {
    showToastMsg('请先截取一些图片')
    return
  }

  // 使用 window 对象传递数据，避免 sessionStorage 容量限制
  ;(window as any).__gifScreenshots = screenshots.value
  
  // 跳转到 GIF 制作页面
  router.push('/gif-maker')
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-gray-900">
    <!-- 工具栏 -->
    <div class="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 border-b border-gray-700/50 backdrop-blur-sm">
      <!-- 比例控制器 -->
      <div class="px-4 py-2 border-b border-gray-700/30 bg-gray-800/30">
        <div class="flex items-center justify-center gap-4">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span class="text-blue-300 text-xs font-medium min-w-[48px]">{{ pcWidthPercent }}%</span>
          </div>
          
          <input 
            type="range" 
            v-model.number="pcWidthPercent" 
            min="30" 
            max="90" 
            step="5"
            class="w-64 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
          
          <div class="flex items-center gap-2">
            <span class="text-green-300 text-xs font-medium min-w-[48px]">{{ mobileWidthPercent }}%</span>
            <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
          </div>
          
          <button 
            @click="pcWidthPercent = 80"
            class="px-2 py-1 bg-gray-700/50 hover:bg-gray-600 text-gray-300 hover:text-white rounded text-[10px] transition-all"
          >
            重置
          </button>
        </div>
      </div>
      
      <div class="flex">
        <!-- PC 端控制 (动态比例) -->
        <div class="border-r border-gray-700/50 px-3 py-2" :style="{ flex: pcWidthPercent }">
          <div class="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-700/30">
            <div class="flex items-center gap-1.5">
              <div class="w-0.5 h-4 bg-blue-500 rounded-full"></div>
              <span class="text-white text-xs font-semibold">PC</span>
            </div>
          
          <label class="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md cursor-pointer transition-all text-xs font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 active:scale-95">
            <svg class="w-3 h-3 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            批量上传
            <input type="file" multiple accept="image/*" @change="handlePcUpload" class="hidden" />
          </label>

          <div class="flex items-center gap-2 bg-gray-700/30 rounded-md px-2 py-1" v-if="pcImages.length > 0">
            <button 
              @click="prevPc" 
              :disabled="pcCurrentIndex === 0"
              class="p-1.5 bg-gray-600/50 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded text-xs transition-all disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            
            <span class="text-white text-xs font-medium">
              {{ pcCurrentIndex + 1 }}/{{ pcImages.length }}
            </span>
            
            <button 
              @click="nextPc"
              :disabled="pcCurrentIndex === pcImages.length - 1"
              class="p-1.5 bg-gray-600/50 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded text-xs transition-all disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <span class="text-gray-300 text-[10px] truncate max-w-[100px]" v-if="currentPcImage" :title="currentPcImage.name">
              {{ currentPcImage.name }}
            </span>

            <button 
              @click="clearPcImages" 
              class="px-2 py-0.5 bg-red-500/80 hover:bg-red-500 text-white rounded text-[10px] transition-all hover:scale-105"
            >
              清空
            </button>
          </div>

          <div class="flex items-center gap-2 ml-auto">
            <div class="flex items-center gap-2 bg-gray-700/30 rounded-md px-2 py-1">
              <input 
                type="color" 
                v-model="pcBorderColor" 
                :disabled="pcUseDefaultColor"
                class="w-6 h-6 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-gray-600"
              />
              
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="pcUseDefaultColor" class="sr-only peer" />
                <div class="w-8 h-4 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-500"></div>
                <span class="ml-1.5 text-[10px] text-gray-300">默认色</span>
              </label>
            </div>

            <div class="flex items-center gap-1.5 bg-gray-700/30 rounded-md px-2 py-1">
              <input 
                type="number" 
                v-model.number="pcBorderWidth" 
                min="0" 
                max="20"
                class="w-12 px-1.5 py-0.5 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-blue-500 focus:outline-none"
              />
              <span class="text-gray-400 text-[10px]">px</span>
            </div>
          </div>
          </div>
        </div>

        <!-- 移动端控制 (动态比例) -->
        <div class="px-3 py-2" :style="{ flex: mobileWidthPercent }">
          <div class="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-700/30">
            <div class="flex items-center gap-1.5">
              <div class="w-0.5 h-4 bg-green-500 rounded-full"></div>
              <span class="text-white text-xs font-semibold">移动端</span>
            </div>
            
            <label class="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-md cursor-pointer transition-all text-xs font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105 active:scale-95">
              <svg class="w-3.5 h-3.5 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              批量上传
              <input type="file" multiple accept="image/*" @change="handleMobileUpload" class="hidden" />
            </label>

            <div class="flex items-center gap-2 bg-gray-700/30 rounded-md px-2 py-1" v-if="mobileImages.length > 0">
              <button 
                @click="prevMobile" 
                :disabled="mobileCurrentIndex === 0"
                class="p-1.5 bg-gray-600/50 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded text-xs transition-all disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              
              <span class="text-white text-xs font-medium">
                {{ mobileCurrentIndex + 1 }}/{{ mobileImages.length }}
              </span>
              
              <button 
                @click="nextMobile"
                :disabled="mobileCurrentIndex === mobileImages.length - 1"
                class="p-1.5 bg-gray-600/50 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded text-xs transition-all disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>

              <span class="text-gray-300 text-[10px] truncate max-w-[80px]" v-if="currentMobileImage" :title="currentMobileImage.name">
                {{ currentMobileImage.name }}
              </span>

              <button 
                @click="clearMobileImages" 
                class="px-2 py-0.5 bg-red-500/80 hover:bg-red-500 text-white rounded text-[10px] transition-all hover:scale-105"
              >
                清空
              </button>
            </div>

            <div class="flex items-center gap-2 ml-auto">
              <div class="flex items-center gap-2 bg-gray-700/30 rounded-md px-2 py-1">
                <input 
                  type="color" 
                  v-model="mobileBorderColor" 
                  :disabled="mobileUseDefaultColor"
                  class="w-6 h-6 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-gray-600"
                />
                
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="mobileUseDefaultColor" class="sr-only peer" />
                  <div class="w-8 h-4 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-green-500"></div>
                  <span class="ml-1.5 text-[10px] text-gray-300">默认色</span>
                </label>
              </div>

              <div class="flex items-center gap-1.5 bg-gray-700/30 rounded-md px-2 py-1">
                <input 
                  type="number" 
                  v-model.number="mobileBorderWidth" 
                  min="0" 
                  max="20"
                  class="w-12 px-1.5 py-0.5 bg-gray-600 text-white rounded text-xs border border-gray-500 focus:border-green-500 focus:outline-none"
                />
                <span class="text-gray-400 text-[10px]">px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 截图区域 -->
    <div 
      ref="screenshotArea" 
      style="
        flex: 1;
        display: flex;
        overflow: hidden;
        background-color: rgb(17, 24, 40);
      "
    >
      <!-- PC 端区域 (动态比例) -->
      <div 
        :style="`
          flex: ${pcWidthPercent};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          overflow: auto;
        `"
      >
        <div 
          v-if="currentPcImage"
          style="position: relative; display: inline-block;"
          :style="{ 
            padding: `${pcBorderWidth}px`,
            backgroundColor: actualPcBorderColor 
          }"
        >
          <img 
            :src="currentPcImage.url" 
            :alt="currentPcImage.name"
            style="max-width: 100%; max-height: 100%; object-fit: contain;"
          />
        </div>
        <div v-else style="color: rgb(107, 114, 128); text-align: center;">
          <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">PC端截图区域</p>
          <p style="font-size: 0.875rem;">请上传 PC 端截图</p>
        </div>
      </div>

      <!-- 移动端区域 (动态比例) -->
      <div 
        :style="`
          flex: ${mobileWidthPercent};
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          border-left: 1px solid rgb(55, 65, 81);
          overflow: auto;
          min-width: 0;
        `"
      >
        <div 
          v-if="currentMobileImage"
          style="position: relative; display: inline-block;"
          :style="{ 
            padding: `${mobileBorderWidth}px`,
            backgroundColor: actualMobileBorderColor 
          }"
        >
          <img 
            :src="currentMobileImage.url" 
            :alt="currentMobileImage.name"
            style="max-width: 100%; max-height: 100%; object-fit: contain;"
          />
        </div>
        <div v-else style="color: rgb(107, 114, 128); text-align: center;">
          <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">移动端</p>
          <p style="font-size: 0.75rem;">请上传移动端截图</p>
        </div>
      </div>
    </div>

    <!-- 悬浮按钮 -->
    <div v-show="!isCapturing" class="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
      <!-- 截图按钮 -->
      <button
        @click="captureScreenshot"
        class="w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 relative"
        title="截图"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
        <!-- 角标 -->
        <span 
          v-if="screenshots.length > 0" 
          class="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
        >
          {{ screenshots.length }}
        </span>
      </button>

      <!-- 制作 GIF 按钮 -->
      <button
        @click="makeGif"
        :disabled="screenshots.length === 0"
        class="w-14 h-14 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 disabled:hover:scale-100"
        title="制作 GIF"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
          <path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </button>
    </div>

    <!-- Toast 提示 -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="showToast"
        class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-gray-800/95 text-white rounded-lg shadow-2xl border border-gray-700 backdrop-blur-sm"
      >
        <p class="text-sm font-medium">{{ toastMessage }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 自定义滑块样式 */
.slider-thumb::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  transition: all 0.2s;
}

.slider-thumb::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
}

.slider-thumb::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  transition: all 0.2s;
}

.slider-thumb::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
}
</style>