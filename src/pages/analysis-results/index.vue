<template>
  <div class="flex h-screen bg-background">
    <!-- 左侧侧边栏 - 历史记录列表 -->
    <div class="w-80 border-r bg-card flex flex-col">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-semibold">分析历史</h2>
          <Button
            variant="ghost"
            size="sm"
            @click="$router.push('/data-management')"
          >
            ← 返回
          </Button>
        </div>
        <p class="text-xs text-muted-foreground">
          共 {{ records.length }} 条分析记录
        </p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <div class="space-y-2">
          <button
            v-for="record in records"
            :key="record.id"
            @click="selectRecord(record.id)"
            :class="[
              'w-full px-3 py-3 text-left rounded-lg transition-colors',
              selectedRecordId === record.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted border'
            ]"
          >
            <div class="font-medium text-sm line-clamp-1">
              {{ record.title }}
            </div>
            <div class="text-xs opacity-75 mt-1">
              {{ formatDateTime(record.analyzedAt) }}
            </div>
            <div class="text-xs opacity-60 mt-1">
              {{ record.dataSnapshot.length }} 个数据源
            </div>
          </button>

          <div
            v-if="records.length === 0"
            class="text-center py-12 text-sm text-muted-foreground"
          >
            暂无分析记录
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 - 分析详情 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <div v-if="currentRecord" class="flex-1 overflow-y-auto">
        <!-- 标题栏 -->
        <div class="border-b bg-card p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h1 class="text-2xl font-bold mb-2">{{ currentRecord.title }}</h1>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>📅 {{ formatDateTime(currentRecord.analyzedAt) }}</span>
                <span v-if="currentRecord.duration">
                  ⏱️ 耗时 {{ formatDuration(currentRecord.duration) }}
                </span>
                <span>📊 {{ currentRecord.dataSnapshot.length }} 个数据源</span>
                <span>
                  {{ currentRecord.dataSnapshot.reduce((sum, d) => sum + (d.rowCount || 0), 0) }} 行数据
                </span>
                <span v-if="currentRecord.hasCharts" class="text-green-600">
                  📈 {{ currentRecord.charts?.length || 0 }} 个图表
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                v-if="!currentRecord.hasCharts"
                variant="default"
                size="sm"
                @click="handleGenerateCharts"
                :disabled="generatingCharts"
              >
                <span v-if="generatingCharts">生成中...</span>
                <span v-else>📈 生成图表</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                @click="handleDelete(currentRecord.id)"
              >
                删除
              </Button>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- 数据图表 -->
          <div v-if="currentRecord.hasCharts && currentRecord.charts && currentRecord.charts.length > 0">
            <h3 class="text-lg font-semibold mb-3">数据可视化</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="chart in currentRecord.charts"
                :key="chart.id"
                class="border rounded-lg p-4 bg-card"
              >
                <VChart
                  :option="chart.option"
                  :style="{ height: '350px', width: '100%' }"
                  autoresize
                />
                <p v-if="chart.description" class="text-xs text-muted-foreground mt-2">
                  {{ chart.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- 分析诉求 -->
          <div>
            <h3 class="text-lg font-semibold mb-3">分析诉求</h3>
            <div class="border rounded-lg p-4 bg-muted/30 whitespace-pre-wrap text-sm">
              {{ currentRecord.prompt }}
            </div>
          </div>

          <!-- 使用的数据 -->
          <div>
            <h3 class="text-lg font-semibold mb-3">使用的数据</h3>
            <div class="space-y-3">
              <div
                v-for="(snapshot, index) in currentRecord.dataSnapshot"
                :key="index"
                class="border rounded-lg overflow-hidden"
              >
                <div class="bg-muted/50 px-4 py-2 border-b">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-medium">{{ snapshot.fileName }}</span>
                      <span class="text-xs text-muted-foreground ml-2">
                        {{ snapshot.batchName }}
                      </span>
                    </div>
                    <span class="text-xs text-muted-foreground">
                      {{ snapshot.rowCount || 0 }} 行
                    </span>
                  </div>
                </div>
                <div class="p-4">
                  <div v-if="snapshot.data && snapshot.data.length > 0" class="text-xs text-muted-foreground mb-2">
                    字段：{{ Object.keys(snapshot.data[0]).join('、') }}
                  </div>
                  <Button
                    v-if="snapshot.data && snapshot.data.length > 0"
                    variant="outline"
                    size="sm"
                    @click="toggleDataPreview(index)"
                  >
                    {{ expandedData[index] ? '收起' : '展开' }}数据预览
                  </Button>
                  <div v-if="expandedData[index] && snapshot.data && snapshot.data.length > 0" class="mt-3 border rounded-lg overflow-hidden">
                    <div class="max-h-60 overflow-auto">
                      <table class="w-full text-xs">
                        <thead class="bg-muted sticky top-0">
                          <tr>
                            <th class="px-2 py-1 text-left">#</th>
                            <th
                              v-for="field in Object.keys(snapshot.data[0])"
                              :key="field"
                              class="px-2 py-1 text-left"
                            >
                              {{ field }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(row, rowIndex) in snapshot.data.slice(0, 10)"
                            :key="rowIndex"
                            class="border-t hover:bg-muted/30"
                          >
                            <td class="px-2 py-1 text-muted-foreground">{{ rowIndex + 1 }}</td>
                            <td
                              v-for="field in Object.keys(snapshot.data[0])"
                              :key="field"
                              class="px-2 py-1"
                            >
                              {{ row[field] }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-else class="text-xs text-muted-foreground">
                    此文件不包含表格数据
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- DeepSeek 分析结果 -->
          <div>
            <h3 class="text-lg font-semibold mb-3">DeepSeek 分析结果</h3>
            <div class="border rounded-lg p-6 bg-card">
              <div
                class="prose prose-sm max-w-none dark:prose-invert"
                v-html="renderMarkdown(currentRecord.result)"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-else
        class="flex-1 flex items-center justify-center text-center p-6"
      >
        <div>
          <div class="text-6xl mb-4">📊</div>
          <h3 class="text-lg font-semibold mb-2">暂无分析记录</h3>
          <p class="text-sm text-muted-foreground mb-4">
            在数据管理页面选择数据后，发送给 DeepSeek 分析
          </p>
          <Button @click="$router.push('/data-management')">
            前往数据管理
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnalysisRecords } from '@/composables/useAnalysis'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { marked } from 'marked'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart, ScatterChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const route = useRoute()
const router = useRouter()

const { records, deleteRecord } = useAnalysisRecords()

const selectedRecordId = ref<string | null>(null)
const expandedData = ref<Record<number, boolean>>({})
const generatingCharts = ref(false)

// 当前选中的记录
const currentRecord = computed(() => {
  if (!selectedRecordId.value) return null
  return records.value.find(r => r.id === selectedRecordId.value)
})

// 选择记录
const selectRecord = (id: string) => {
  selectedRecordId.value = id
  expandedData.value = {}
  router.replace(`/analysis-results/${id}`)
}

// 切换数据预览展开状态
const toggleDataPreview = (index: number) => {
  expandedData.value[index] = !expandedData.value[index]
}

// 格式化日期时间
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化耗时
const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

// 渲染 Markdown
const renderMarkdown = (markdown: string) => {
  try {
    return marked.parse(markdown)
  } catch (error) {
    console.error('Markdown 渲染失败:', error)
    return markdown
  }
}

// 生成图表（已禁用 - 批次模式不支持自动图表生成）
const handleGenerateCharts = () => {
  if (!currentRecord.value) return
  toast.info('批次模式下，请在分析时直接让 DeepSeek 生成图表')
}

// 删除记录
const handleDelete = (id: string) => {
  if (confirm('确定要删除这条分析记录吗？删除后无法恢复。')) {
    deleteRecord(id)
    toast.success('已删除')
    
    // 如果删除的是当前选中的记录，选择第一条
    if (selectedRecordId.value === id) {
      if (records.value.length > 0) {
        selectRecord(records.value[0].id)
      } else {
        selectedRecordId.value = null
        router.replace('/analysis-results')
      }
    }
  }
}

onMounted(() => {
  // 从路由参数中获取记录 ID
  const idFromRoute = route.params.id as string
  
  if (idFromRoute && records.value.find(r => r.id === idFromRoute)) {
    selectedRecordId.value = idFromRoute
  } else if (records.value.length > 0) {
    // 默认选择最新的一条
    selectedRecordId.value = records.value[0].id
    router.replace(`/analysis-results/${records.value[0].id}`)
  }
})
</script>

<style scoped>
.prose {
  color: var(--foreground);
}

.prose h1,
.prose h2,
.prose h3,
.prose h4 {
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose h1 {
  font-size: 1.5rem;
}

.prose h2 {
  font-size: 1.25rem;
}

.prose h3 {
  font-size: 1.125rem;
}

.prose p {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.prose ul,
.prose ol {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.prose li {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.prose code {
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.prose pre {
  background-color: hsl(var(--muted));
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
}

.prose blockquote {
  border-left: 4px solid hsl(var(--primary));
  padding-left: 1rem;
  font-style: italic;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.prose table {
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-collapse: collapse;
}

.prose th,
.prose td {
  border: 1px solid hsl(var(--border));
  padding: 0.75rem;
  text-align: left;
}

.prose th {
  background-color: hsl(var(--muted));
  font-weight: 600;
}
</style>
