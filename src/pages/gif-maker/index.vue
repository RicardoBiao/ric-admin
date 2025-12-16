<script setup lang="ts">
import { ref, onMounted } from 'vue'
// @ts-ignore
import GIF from 'gif.js'
import JSZip from 'jszip'

interface ImageItem {
  id: string
  file: File
  url: string
  name: string
  order: number
}

const images = ref<ImageItem[]>([])
const delay = ref(500) // 默认每帧延迟 500ms
const isGenerating = ref(false)
const generatedGifUrl = ref('')
const draggedIndex = ref<number | null>(null)
const previewImage = ref<ImageItem | null>(null)

// 页面加载时检查是否有截图数据
onMounted(() => {
  // 优先从 window 对象读取（避免 sessionStorage 容量限制）
  const windowScreenshots = (window as any).__gifScreenshots
  if (windowScreenshots && Array.isArray(windowScreenshots)) {
    windowScreenshots.forEach((url: string, index: number) => {
      const id = `screenshot_${Date.now()}_${index}`
      images.value.push({
        id,
        file: new File([], `screenshot-${index + 1}.png`, { type: 'image/png' }),
        url,
        name: `screenshot-${index + 1}.png`,
        order: images.value.length
      })
    })
    // 清除全局变量
    delete (window as any).__gifScreenshots
    return
  }

  // 向后兼容：尝试从 sessionStorage 读取
  const screenshotsData = sessionStorage.getItem('gifScreenshots')
  if (screenshotsData) {
    try {
      const screenshots = JSON.parse(screenshotsData)
      screenshots.forEach((url: string, index: number) => {
        const id = `screenshot_${Date.now()}_${index}`
        images.value.push({
          id,
          file: new File([], `screenshot-${index + 1}.png`, { type: 'image/png' }),
          url,
          name: `screenshot-${index + 1}.png`,
          order: images.value.length
        })
      })
      // 清除 sessionStorage
      sessionStorage.removeItem('gifScreenshots')
    } catch (error) {
      console.error('加载截图数据失败:', error)
    }
  }
})

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  Array.from(files).forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const id = `${Date.now()}_${index}`
        images.value.push({
          id,
          file,
          url: e.target?.result as string,
          name: file.name,
          order: images.value.length
        })
      }
      reader.readAsDataURL(file)
    }
  })

  // 重置 input
  target.value = ''
}

const removeImage = (id: string) => {
  images.value = images.value.filter(img => img.id !== id)
  reorderImages()
}

const reorderImages = () => {
  images.value.forEach((img, index) => {
    img.order = index
  })
}

const onDragStart = (index: number) => {
  draggedIndex.value = index
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const onDrop = (event: DragEvent, dropIndex: number) => {
  event.preventDefault()
  if (draggedIndex.value === null) return

  const draggedItem = images.value[draggedIndex.value]
  images.value.splice(draggedIndex.value, 1)
  images.value.splice(dropIndex, 0, draggedItem)
  
  reorderImages()
  draggedIndex.value = null
}

const generateGif = async () => {
  if (images.value.length === 0) {
    alert('请至少上传一张图片')
    return
  }

  isGenerating.value = true
  generatedGifUrl.value = ''

  try {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).href
    })

    // 加载所有图片
    for (const imgItem of images.value) {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imgItem.url
      })
      
      gif.addFrame(img, { delay: delay.value })
    }

    gif.on('finished', (blob: Blob) => {
      generatedGifUrl.value = URL.createObjectURL(blob)
      isGenerating.value = false
    })

    gif.render()
  } catch (error) {
    console.error('生成 GIF 失败:', error)
    alert('生成 GIF 失败，请重试')
    isGenerating.value = false
  }
}

const downloadGif = () => {
  if (!generatedGifUrl.value) return
  
  const a = document.createElement('a')
  a.href = generatedGifUrl.value
  a.download = `animated_${Date.now()}.gif`
  a.click()
}

const clearAll = () => {
  images.value = []
  generatedGifUrl.value = ''
}

const sortByFileName = () => {
  images.value.sort((a, b) => {
    // 提取文件名中的数字进行排序
    const getNumber = (name: string) => {
      // 匹配文件名中的数字部分，例如 "r-1.png" -> 1, "img-10.jpg" -> 10
      const match = name.match(/(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    }
    
    const numA = getNumber(a.name)
    const numB = getNumber(b.name)
    
    // 如果都有数字，按数字排序
    if (numA !== numB) {
      return numA - numB
    }
    
    // 否则按字母排序
    return a.name.localeCompare(b.name)
  })
  
  reorderImages()
}

const openPreview = (img: ImageItem) => {
  previewImage.value = img
}

const closePreview = () => {
  previewImage.value = null
}

// 一键下载所有图片
const downloadAllImages = async () => {
  if (images.value.length === 0) {
    alert('没有图片可下载')
    return
  }

  // 如果只有一张图片，直接下载
  if (images.value.length === 1) {
    const link = document.createElement('a')
    link.href = images.value[0].url
    link.download = images.value[0].name
    link.click()
    return
  }

  // 多张图片时，打包成zip下载
  try {
    const zip = new JSZip()
    const folder = zip.folder('images')
    
    // 将所有图片添加到zip
    for (let i = 0; i < images.value.length; i++) {
      const img = images.value[i]
      // 将base64转换为blob
      const base64Data = img.url.split(',')[1]
      folder?.file(img.name, base64Data, { base64: true })
    }
    
    // 生成zip文件
    const blob = await zip.generateAsync({ type: 'blob' })
    
    // 下载zip
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `images_${Date.now()}.zip`
    link.click()
    
    // 释放内存
    URL.revokeObjectURL(link.href)
  } catch (error) {
    console.error('打包失败:', error)
    alert('打包下载失败，请重试')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
    <div class="w-full">
      <!-- 标题 -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-3 shadow-lg">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
          </svg>
        </div>
        <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">GIF 制作工具</h1>
        <p class="text-gray-600">上传多张图片，拖拽排序，一键生成动态 GIF</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <!-- 左侧：图片列表 -->
        <div class="lg:col-span-3 space-y-4">
          <!-- 上传区域 -->
          <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
            <label class="cursor-pointer group block">
              <div class="border-2 border-dashed border-gray-300 group-hover:border-purple-500 rounded-xl p-6 transition-all duration-200 bg-gradient-to-br from-gray-50 to-white group-hover:from-purple-50 group-hover:to-pink-50">
                <div class="flex flex-col items-center gap-4">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <div class="text-center">
                    <p class="text-lg font-semibold text-gray-700 mb-1">点击上传图片</p>
                    <p class="text-sm text-gray-500">支持多选，可上传 PNG、JPG 等格式</p>
                  </div>
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                class="hidden" 
                @change="handleFileUpload"
              />
            </label>
          </div>

          <!-- 图片列表 -->
          <div v-if="images.length > 0" class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-800">图片列表（{{ images.length }} 张）</h2>
              <div class="flex gap-2">
                <button 
                  @click="sortByFileName"
                  class="px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                  </svg>
                  按名称排序
                </button>
                <button 
                  @click="downloadAllImages"
                  class="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                  </svg>
                  下载全部
                </button>
                <button 
                  @click="clearAll"
                  class="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                >
                  清空全部
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div
                v-for="(img, index) in images"
                :key="img.id"
                draggable="true"
                @dragstart="onDragStart(index)"
                @dragover="onDragOver"
                @drop="onDrop($event, index)"
                @dblclick="openPreview(img)"
                class="relative group cursor-move bg-gray-100 rounded-lg overflow-hidden aspect-square border-2 border-gray-200 hover:border-purple-500 transition-all"
              >
                <img 
                  :src="img.url" 
                  :alt="img.name" 
                  class="w-full h-full object-cover"
                />
                <div class="absolute top-2 left-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                  {{ index + 1 }}
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p class="text-white text-xs truncate font-medium">{{ img.name }}</p>
                </div>
                <button
                  @click.stop="removeImage(img.id)"
                  @mousedown.stop
                  draggable="false"
                  class="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center justify-center z-10"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            
            <p class="text-xs text-gray-500 mt-4 text-center">💡 提示：拖拽图片可以调整顺序，双击可以预览图片</p>
          </div>

          <!-- 空状态 -->
          <div v-else class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 text-center">
            <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p class="text-gray-600">暂无图片，请先上传图片</p>
          </div>
        </div>

        <!-- 右侧：设置和预览 -->
        <div class="lg:col-span-2 space-y-4">
          <!-- 设置 -->
          <div class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">GIF 设置</h2>
            
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">动画速度（每帧延迟）</label>
                <div class="flex items-center gap-4">
                  <input 
                    v-model.number="delay" 
                    type="range" 
                    min="100" 
                    max="2000" 
                    step="100"
                    class="flex-1 accent-purple-500"
                  />
                  <span class="text-sm font-semibold text-gray-700 min-w-16">{{ delay }}ms</span>
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>快</span>
                  <span>慢</span>
                </div>
              </div>

              <button
                @click="generateGif"
                :disabled="images.length === 0 || isGenerating"
                class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
              >
                <span v-if="isGenerating" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
                <span v-else>🎬 生成 GIF</span>
              </button>
            </div>
          </div>

          <!-- 预览 -->
          <div v-if="generatedGifUrl" class="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100">
            <h2 class="text-lg font-semibold text-gray-800 mb-4">预览效果</h2>
            
            <div class="bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img :src="generatedGifUrl" alt="Generated GIF" class="w-full max-h-[600px] object-contain" />
            </div>

            <button
              @click="downloadGif"
              class="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-green-500/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            >
              ⬇️ 下载 GIF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div 
      v-if="previewImage" 
      @click="closePreview"
      class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8 backdrop-blur-sm"
    >
      <div class="relative max-w-7xl max-h-full" @click.stop>
        <button
          @click="closePreview"
          class="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <img 
          :src="previewImage.url" 
          :alt="previewImage.name" 
          class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
        <div class="mt-4 text-center">
          <p class="text-white text-lg font-medium">{{ previewImage.name }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="range"] {
  height: 8px;
  background: linear-gradient(to right, #9333ea, #ec4899);
  border-radius: 4px;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid #9333ea;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.4);
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: white;
  border: 3px solid #9333ea;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(147, 51, 234, 0.4);
}
</style>
