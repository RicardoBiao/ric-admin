<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-6">
    <div class="text-center max-w-md">
      <div class="mb-6">
        <svg
          class="w-16 h-16 mx-auto text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>
      <h1 class="text-2xl font-bold mb-4">页面已迁移</h1>
      <p class="text-muted-foreground mb-6">
        数据导入功能已集成到数据管理页面，3秒后自动跳转...
      </p>
      <Button @click="$router.push('/data-management')">
        立即前往数据管理
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()

onMounted(() => {
  setTimeout(() => {
    router.push('/data-management')
  }, 3000)
})
</script>
