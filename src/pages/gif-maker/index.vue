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
const scale = ref(100) // 图片缩放比例，50-100%
const isGenerating = ref(false)
const generatedGifUrl = ref('')
const gifFileSize = ref(0) // GIF文件大小（字节）
const draggedIndex = ref<number | null>(null)
const previewImage = ref<ImageItem | null>(null)

// 批量重命名相关
const showRenameDialog = ref(false)
const renamePrefix = ref('image')
const renameStartNumber = ref(1)

// 单张图片重命名相关
const showSingleRenameDialog = ref(false)
const renamingImage = ref<ImageItem | null>(null)
const newImageName = ref('')

// 右键菜单相关
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuImage = ref<ImageItem | null>(null)

// Toast 提示相关
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

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
      quality: 10, // 固定使用默认质量
      width: undefined, // 将在添加第一帧时设置
      height: undefined,
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
      
      // 根据缩放比例创建 canvas
      const canvas = document.createElement('canvas')
      const scaleRatio = scale.value / 100
      canvas.width = Math.floor(img.width * scaleRatio)
      canvas.height = Math.floor(img.height * scaleRatio)
      
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      gif.addFrame(canvas, { 
        delay: delay.value,
        copy: true // 确保每帧都是独立的
      })
    }

    gif.on('finished', (blob: Blob) => {
      generatedGifUrl.value = URL.createObjectURL(blob)
      gifFileSize.value = blob.size
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
  gifFileSize.value = 0
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
  // 监听键盘事件
  window.addEventListener('keydown', handlePreviewKeydown)
}

const closePreview = () => {
  previewImage.value = null
  // 移除键盘事件监听
  window.removeEventListener('keydown', handlePreviewKeydown)
}

// 获取当前预览图片的索引
const getCurrentPreviewIndex = () => {
  if (!previewImage.value) return -1
  return images.value.findIndex(img => img.id === previewImage.value?.id)
}

// 切换到上一张
const previewPrev = () => {
  const currentIndex = getCurrentPreviewIndex()
  if (currentIndex > 0) {
    previewImage.value = images.value[currentIndex - 1]
  }
}

// 切换到下一张
const previewNext = () => {
  const currentIndex = getCurrentPreviewIndex()
  if (currentIndex < images.value.length - 1) {
    previewImage.value = images.value[currentIndex + 1]
  }
}

// 处理键盘事件
const handlePreviewKeydown = (e: KeyboardEvent) => {
  if (!previewImage.value) return
  
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    previewPrev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    previewNext()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closePreview()
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 打开重命名弹窗
const openRenameDialog = () => {
  showRenameDialog.value = true
}

// 执行重命名
const applyRename = () => {
  if (!renamePrefix.value.trim()) {
    alert('请输入文件名前缀')
    return
  }
  
  images.value.forEach((img, index) => {
    const ext = img.name.substring(img.name.lastIndexOf('.'))
    const newNumber = renameStartNumber.value + index
    img.name = `${renamePrefix.value}-${newNumber}${ext}`
  })
  
  showRenameDialog.value = false
}

// 取消重命名
const cancelRename = () => {
  showRenameDialog.value = false
  renamePrefix.value = 'image'
  renameStartNumber.value = 1
}

// 打开单张图片重命名弹窗
const openSingleRename = (img: ImageItem) => {
  renamingImage.value = img
  // 获取不带扩展名的文件名
  const lastDotIndex = img.name.lastIndexOf('.')
  newImageName.value = lastDotIndex > 0 ? img.name.substring(0, lastDotIndex) : img.name
  showSingleRenameDialog.value = true
}

// 应用单张图片重命名
const applySingleRename = () => {
  if (!renamingImage.value || !newImageName.value.trim()) {
    alert('请输入文件名')
    return
  }
  
  // 获取原文件扩展名
  const ext = renamingImage.value.name.substring(renamingImage.value.name.lastIndexOf('.'))
  // 更新文件名
  renamingImage.value.name = newImageName.value.trim() + ext
  
  // 关闭弹窗
  cancelSingleRename()
}

// 取消单张图片重命名
const cancelSingleRename = () => {
  showSingleRenameDialog.value = false
  renamingImage.value = null
  newImageName.value = ''
}

// 显示 Toast 提示
const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// 处理右键菜单
const handleContextMenu = (event: MouseEvent, img: ImageItem) => {
  event.preventDefault()
  contextMenuImage.value = img
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
  
  // 点击其他地方关闭菜单
  const closeMenu = () => {
    showContextMenu.value = false
    document.removeEventListener('click', closeMenu)
  }
  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 0)
}

// 下载单张图片
const downloadSingleImage = () => {
  if (!contextMenuImage.value) return
  
  const link = document.createElement('a')
  link.href = contextMenuImage.value.url
  link.download = contextMenuImage.value.name
  link.click()
  
  showContextMenu.value = false
}

// 复制单张图片
const copySingleImage = async () => {
  if (!contextMenuImage.value) return
  
  try {
    // 将 base64 转换为 blob
    const response = await fetch(contextMenuImage.value.url)
    const blob = await response.blob()
    
    // 使用 Clipboard API 复制图片
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob
      })
    ])
    
    showToastMessage('图片已复制到剪贴板 ✓', 'success')
  } catch (error) {
    console.error('复制失败:', error)
    showToastMessage('复制失败，请重试', 'error')
  }
  
  showContextMenu.value = false
}

// 从右键菜单打开重命名
const renameFromContextMenu = () => {
  if (!contextMenuImage.value) return
  openSingleRename(contextMenuImage.value)
  showContextMenu.value = false
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
                  @click="openRenameDialog"
                  class="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  重命名
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
                @contextmenu="handleContextMenu($event, img)"
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
            
            <p class="text-xs text-gray-500 mt-4 text-center">💡 提示：拖拽图片可以调整顺序，双击预览图片，右键重命名</p>
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

              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">图片缩放（最有效）</label>
                <div class="flex items-center gap-4">
                  <input 
                    v-model.number="scale" 
                    type="range" 
                    min="25" 
                    max="100" 
                    step="5"
                    class="flex-1 accent-green-500"
                  />
                  <span class="text-sm font-semibold text-gray-700 min-w-16">{{ scale }}%</span>
                </div>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>小尺寸</span>
                  <span>原始尺寸</span>
                </div>
                <p class="text-xs text-gray-500 mt-2">🔥 重点：缩小图片是减小文件的最好方法</p>
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
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-800">预览效果</h2>
              <span class="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                📦 {{ formatFileSize(gifFileSize) }}
              </span>
            </div>
            
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

    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      class="fixed z-[60] bg-white rounded-lg shadow-2xl border border-gray-200 py-1 min-w-[180px] animate-fadeIn"
      @click.stop
    >
      <button
        @click="renameFromContextMenu"
        class="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors flex items-center gap-3"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        <span>修改名称</span>
      </button>
      
      <button
        @click="downloadSingleImage"
        class="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-3"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
        </svg>
        <span>下载图片</span>
      </button>
      
      <button
        @click="copySingleImage"
        class="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center gap-3"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <span>复制图片</span>
      </button>
    </div>

    <!-- 图片预览模态框 -->
    <div 
      v-if="previewImage" 
      @click="closePreview"
      class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm"
    >
      <div class="relative w-full h-full max-w-6xl flex flex-col items-center justify-center" @click.stop>
        <!-- 关闭按钮 -->
        <button
          @click="closePreview"
          class="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          title="关闭 (Esc)"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        
        <!-- 上一张按钮 -->
        <button
          v-if="getCurrentPreviewIndex() > 0"
          @click="previewPrev"
          class="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-10"
          title="上一张 (←)"
        >
          <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <!-- 下一张按钮 -->
        <button
          v-if="getCurrentPreviewIndex() < images.length - 1"
          @click="previewNext"
          class="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-10"
          title="下一张 (→)"
        >
          <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
        
        <!-- 图片容器 -->
        <div class="flex-1 flex items-center justify-center w-full mb-4 overflow-hidden">
          <img 
            :src="previewImage.url" 
            :alt="previewImage.name" 
            class="max-w-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl"
          />
        </div>
        
        <!-- 底部信息 -->
        <div class="w-full text-center space-y-2 px-4">
          <p class="text-white text-base md:text-lg font-medium truncate">{{ previewImage.name }}</p>
          <div class="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-400 flex-wrap">
            <span class="whitespace-nowrap">{{ getCurrentPreviewIndex() + 1 }} / {{ images.length }}</span>
            <span class="text-gray-600 hidden md:inline">•</span>
            <span class="items-center gap-1 hidden md:flex">
              <kbd class="px-2 py-0.5 bg-white/10 rounded text-xs">←</kbd>
              <kbd class="px-2 py-0.5 bg-white/10 rounded text-xs">→</kbd>
              切换
            </span>
            <span class="text-gray-600 hidden md:inline">•</span>
            <span class="items-center gap-1 hidden md:flex">
              <kbd class="px-2 py-0.5 bg-white/10 rounded text-xs">Esc</kbd>
              关闭
            </span>
          </div>
        </div>
      </div>
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
        class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-2xl border backdrop-blur-sm"
        :class="[
          toastType === 'success' 
            ? 'bg-green-500/95 text-white border-green-600' 
            : 'bg-red-500/95 text-white border-red-600'
        ]"
      >
        <p class="text-sm font-medium flex items-center gap-2">
          <svg v-if="toastType === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          {{ toastMessage }}
        </p>
      </div>
    </Transition>

    <!-- 批量重命名弹窗 -->
    <div 
      v-if="showRenameDialog" 
      @click="cancelRename"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div 
        @click.stop
        class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all"
      >
        <h3 class="text-xl font-bold text-gray-800 mb-4">📝 批量重命名</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">文件名前缀</label>
            <input 
              v-model="renamePrefix"
              type="text"
              placeholder="例如：image"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">起始数字</label>
            <input 
              v-model.number="renameStartNumber"
              type="number"
              min="0"
              placeholder="例如：1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div class="bg-gray-50 rounded-lg p-3">
            <p class="text-sm text-gray-600 mb-1">预览示例：</p>
            <p class="text-sm font-mono text-gray-800">
              {{ renamePrefix }}-{{ renameStartNumber }}.png<br>
              {{ renamePrefix }}-{{ renameStartNumber + 1 }}.png<br>
              {{ renamePrefix }}-{{ renameStartNumber + 2 }}.png
            </p>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            @click="cancelRename"
            class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button
            @click="applyRename"
            class="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            确认重命名
          </button>
        </div>
      </div>
    </div>

    <!-- 单张图片重命名弹窗 -->
    <div 
      v-if="showSingleRenameDialog" 
      @click="cancelSingleRename"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div 
        @click.stop
        class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all"
      >
        <h3 class="text-xl font-bold text-gray-800 mb-4">✏️ 重命名图片</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">原文件名</label>
            <div class="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm">
              {{ renamingImage?.name }}
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">新文件名</label>
            <input 
              v-model="newImageName"
              type="text"
              placeholder="请输入新文件名"
              @keyup.enter="applySingleRename"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              autofocus
            />
            <p class="text-xs text-gray-500 mt-1">扩展名将自动保留</p>
          </div>
          
          <div class="bg-purple-50 rounded-lg p-3">
            <p class="text-sm text-gray-600 mb-1">预览：</p>
            <p class="text-sm font-mono text-purple-700 font-medium">
              {{ newImageName || '(请输入文件名)' }}{{ renamingImage?.name.substring(renamingImage.name.lastIndexOf('.')) }}
            </p>
          </div>
        </div>
        
        <div class="flex gap-3 mt-6">
          <button
            @click="cancelSingleRename"
            class="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button
            @click="applySingleRename"
            class="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
          >
            确认
          </button>
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.15s ease-out;
}
</style>
