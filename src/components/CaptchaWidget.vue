<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import * as authApi from '@/api/auth'

const props = defineProps<{
  onSuccess?: (token: string) => void
}>()

const challenge = ref<any>(null)
const challengeToken = ref<string>('')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const selectedPoints = ref<Array<{x: number, y: number}>>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 加载验证码
const loadChallenge = async () => {
  loading.value = true
  error.value = null
  selectedPoints.value = []
  
  try {
    const data = await authApi.createChallenge()
    console.log('验证码数据:', data)
    challenge.value = data.challenge
    challengeToken.value = data.token || ''
    
    // 渲染验证码到 canvas
    if (canvasRef.value) {
      renderChallenge()
    }
  } catch (err: any) {
    error.value = '加载验证码失败'
    console.error('加载验证码失败:', err)
  } finally {
    loading.value = false
  }
}

// 渲染验证码（基于 cap.js 的 challenge 格式）
const renderChallenge = () => {
  if (!canvasRef.value || !challenge.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const { c, s, d } = challenge.value
  
  // 设置 canvas 尺寸
  canvas.width = s * 10
  canvas.height = s * 3
  
  // 绘制背景
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 绘制验证码文本（基于 c 值生成）
  ctx.fillStyle = '#333'
  ctx.font = `${s}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(`请点击 ${d} 次`, canvas.width / 2, canvas.height / 2)
  
  // 绘制已选择的点
  selectedPoints.value.forEach((point, index) => {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'
    ctx.beginPath()
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#fff'
    ctx.font = '12px Arial'
    ctx.fillText(`${index + 1}`, point.x, point.y)
  })
}

// 处理 canvas 点击
const handleCanvasClick = (e: MouseEvent) => {
  if (!canvasRef.value || !challenge.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  selectedPoints.value.push({ x, y })
  renderChallenge()
  
  // 如果已选择足够的点，自动验证
  if (selectedPoints.value.length >= challenge.value.d) {
    setTimeout(() => verifyChallenge(), 300)
  }
}

// 验证答案
const verifyChallenge = async () => {
  if (selectedPoints.value.length === 0) {
    error.value = '请点击验证码'
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    // cap.js 期望的解决方案格式
    const solutions = selectedPoints.value.map((p, i) => i)
    
    const result = await authApi.redeemChallenge({
      token: challengeToken.value,
      solutions,
    })
    
    if (result.success && result.token) {
      props.onSuccess?.(result.token)
    } else {
      error.value = '验证失败，请重试'
      await loadChallenge()
    }
  } catch (err: any) {
    error.value = '验证失败，请重试'
    console.error('验证失败:', err)
    await loadChallenge()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadChallenge()
})
</script>

<template>
  <div class="w-full">
    <div v-if="loading && !challenge" class="flex items-center justify-center h-48">
      <div class="text-sm text-muted-foreground">加载中...</div>
    </div>
    
    <div v-else-if="challenge" class="space-y-4">
      <div class="text-sm font-medium text-center">
        {{ challenge.d ? `请依次点击 ${challenge.d} 次` : '请按照提示点击' }}
      </div>
      
      <div class="flex justify-center">
        <canvas
          ref="canvasRef"
          @click="handleCanvasClick"
          class="border-2 border-gray-200 rounded-md cursor-pointer hover:border-gray-300 transition-all"
        />
      </div>
      
      <div v-if="error" class="text-sm text-red-600 text-center">
        {{ error }}
      </div>
      
      <div class="flex gap-2">
        <Button
          type="button"
          variant="outline"
          @click="loadChallenge"
          :disabled="loading"
          class="flex-1"
        >
          刷新
        </Button>
        <Button
          type="button"
          @click="verifyChallenge"
          :disabled="loading || selectedPoints.length === 0"
          class="flex-1"
        >
          {{ loading ? '验证中...' : `验证 (${selectedPoints.length}/${challenge.d || 0})` }}
        </Button>
      </div>
    </div>
  </div>
</template>
