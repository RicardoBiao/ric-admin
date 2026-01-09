<template>
  <div class="flex h-screen bg-background">
    <!-- 左侧侧边栏 -->
    <div class="w-64 border-r bg-card flex flex-col">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold">数据管理</h2>
        <p class="text-xs text-muted-foreground mt-1">
          共 {{ stats.totalRecords }} 条记录
        </p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <div class="space-y-1">
          <!-- 全部数据 -->
          <button
            @click="selectScenario(null)"
            :class="[
              'w-full px-3 py-2 text-left rounded-md text-sm transition-colors',
              selectedScenarioKey === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            ]"
          >
            <div class="flex items-center justify-between">
              <span>📊 全部数据</span>
              <span class="text-xs">{{ stats.totalRecords }}</span>
            </div>
          </button>

          <!-- 按场景分类 -->
          <div
            v-for="scenario in scenarios"
            :key="scenario.key"
          >
            <button
              @click="selectScenario(scenario.key)"
              :class="[
                'w-full px-3 py-2 text-left rounded-md text-sm transition-colors',
                selectedScenarioKey === scenario.key
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              ]"
            >
              <div class="flex items-center justify-between">
                <span>{{ scenario.name }}</span>
                <span class="text-xs">
                  {{ stats.scenarioStats[scenario.key] || 0 }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 头部筛选 -->
      <div class="border-b bg-card p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold">
              {{ selectedScenarioKey ? scenarios.find(s => s.key === selectedScenarioKey)?.name : '全部数据' }}
            </h1>
            <p class="text-sm text-muted-foreground mt-1">
              共 {{ filteredRecords.length }} 条记录，{{ totalRows }} 行数据
            </p>
          </div>
          <div class="flex gap-2">
            <Button
              v-if="selectedRecords.length > 0"
              variant="default"
              size="sm"
              @click="showAnalysisDialog = true"
            >
              📊 发送给 DeepSeek 分析 ({{ selectedRecords.length }})
            </Button>
            <Button
              v-if="selectedRecords.length > 0"
              variant="destructive"
              size="sm"
              @click="handleBatchDelete"
            >
              删除选中 ({{ selectedRecords.length }})
            </Button>
          </div>
        </div>

        <!-- 筛选器 -->
        <div class="flex gap-3">
          <Input
            v-model="searchQuery"
            placeholder="搜索文件名..."
            class="max-w-xs"
          />
          <Select v-model="sortBy">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新保存</SelectItem>
              <SelectItem value="oldest">最早保存</SelectItem>
              <SelectItem value="name">文件名</SelectItem>
              <SelectItem value="rows">数据行数</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- 数据列表 -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="paginatedRecords.length === 0" class="text-center py-12">
          <div class="text-muted-foreground">
            <p class="text-lg">暂无数据</p>
            <p class="text-sm mt-2">
              在数据导入页面保存数据后会显示在这里
            </p>
          </div>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="record in paginatedRecords"
            :key="record.id"
            class="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-start gap-4">
              <!-- 复选框 -->
              <div class="pt-1">
                <input
                  type="checkbox"
                  :checked="selectedRecords.includes(record.id)"
                  @change="toggleSelection(record.id)"
                  class="w-4 h-4"
                />
              </div>

              <!-- 主要信息 -->
              <div class="flex-1">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-medium">{{ record.fileName }}</h3>
                    <div class="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{{ record.scenarioName }}</span>
                      <span>·</span>
                      <span>{{ record.rowCount }} 行数据</span>
                      <span>·</span>
                      <span>{{ record.mappings.length }} 个字段</span>
                      <span>·</span>
                      <span>{{ formatDateTime(record.savedAt) }}</span>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      @click="viewDetails(record)"
                    >
                      查看
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      @click="exportRecord(record)"
                    >
                      导出
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      @click="confirmDelete(record.id)"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="border-t bg-card p-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredRecords.length) }} 
            / 共 {{ filteredRecords.length }} 条
          </div>
          <div class="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              上一页
            </Button>
            <div class="flex gap-1">
              <Button
                v-for="page in displayPages"
                :key="page"
                size="sm"
                :variant="page === currentPage ? 'default' : 'outline'"
                @click="currentPage = page"
              >
                {{ page }}
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <Dialog v-model:open="showDetails">
      <DialogContent class="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{{ selectedRecord?.fileName }}</DialogTitle>
        </DialogHeader>
        <div v-if="selectedRecord" class="overflow-y-auto">
          <div class="space-y-4">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">场景类型：</span>
                <span class="font-medium">{{ selectedRecord.scenarioName }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">保存时间：</span>
                <span class="font-medium">{{ formatDateTime(selectedRecord.savedAt) }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">数据行数：</span>
                <span class="font-medium">{{ selectedRecord.rowCount }} 行</span>
              </div>
              <div>
                <span class="text-muted-foreground">字段数量：</span>
                <span class="font-medium">{{ selectedRecord.mappings.length }} 个</span>
              </div>
            </div>

            <!-- 字段映射 -->
            <div>
              <h4 class="font-medium mb-2">字段映射</h4>
              <div class="border rounded-lg p-3 bg-muted/30">
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div
                    v-for="mapping in selectedRecord.mappings"
                    :key="mapping.targetField"
                    class="flex items-center gap-2"
                  >
                    <span class="text-muted-foreground">{{ mapping.sourceField }}</span>
                    <span>→</span>
                    <span class="font-medium">{{ mapping.targetLabel || mapping.targetField }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 数据预览 -->
            <div>
              <h4 class="font-medium mb-2">数据预览（前10条）</h4>
              <div class="border rounded-lg overflow-hidden">
                <div class="max-h-[300px] overflow-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-muted sticky top-0">
                      <tr>
                        <th class="px-3 py-2 text-left font-medium">#</th>
                        <th
                          v-for="mapping in selectedRecord.mappings"
                          :key="mapping.targetField"
                          class="px-3 py-2 text-left font-medium"
                        >
                          {{ mapping.targetLabel || mapping.targetField }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, index) in selectedRecord.data.slice(0, 10)"
                        :key="index"
                        class="border-t hover:bg-muted/50"
                      >
                        <td class="px-3 py-2 text-muted-foreground">{{ index + 1 }}</td>
                        <td
                          v-for="mapping in selectedRecord.mappings"
                          :key="mapping.targetField"
                          class="px-3 py-2"
                        >
                          {{ row[mapping.targetField] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 分析诉求对话框 -->
    <Dialog v-model:open="showAnalysisDialog">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>DeepSeek 数据分析</DialogTitle>
          <DialogDescription>
            已选择 {{ selectedDataForAnalysis.length }} 条记录，共 {{ totalSelectedRows }} 行数据
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <!-- 数据预览 -->
          <div>
            <h4 class="text-sm font-medium mb-2">选中的数据</h4>
            <div class="border rounded-lg p-3 bg-muted/30 max-h-32 overflow-y-auto">
              <div class="space-y-1 text-sm">
                <div
                  v-for="record in selectedDataForAnalysis"
                  :key="record.id"
                  class="flex items-center justify-between"
                >
                  <span>{{ record.fileName }}</span>
                  <span class="text-xs text-muted-foreground">
                    {{ record.scenarioName }} · {{ record.rowCount }} 行
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 分析标题 -->
          <div>
            <label class="text-sm font-medium mb-2 block">分析标题</label>
            <Input
              v-model="analysisTitle"
              placeholder="例如：Q1季度销售趋势分析"
            />
          </div>

          <!-- 诉求模板选择 -->
          <div v-if="promptTemplates.length > 0">
            <label class="text-sm font-medium mb-2 block">使用已保存的诉求</label>
            <Select @update:model-value="applyPromptTemplate">
              <SelectTrigger>
                <SelectValue placeholder="选择分析诉求模板" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="template in promptTemplates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 分析诉求输入 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium">分析诉求</label>
              <Button
                v-if="analysisPrompt.trim()"
                variant="ghost"
                size="sm"
                @click="showSavePromptDialog = true"
              >
                💾 保存为模板
              </Button>
            </div>
            <Textarea
              v-model="analysisPrompt"
              placeholder="请描述您希望 DeepSeek 如何分析这些数据，例如：&#10;- 分析客户交易趋势&#10;- 找出异常数据点&#10;- 生成统计报告&#10;- 提供业务建议"
              rows="6"
              class="resize-none"
            />
          </div>

          <!-- 底部按钮 -->
          <div class="flex justify-between items-center pt-4">
            <div class="text-xs text-muted-foreground">
              分析结果将保存到"分析历史"页面
            </div>
            <div class="flex gap-2">
              <Button variant="outline" @click="showAnalysisDialog = false">
                取消
              </Button>
              <Button
                @click="handleSubmitAnalysis"
                :disabled="analyzing || !analysisPrompt.trim() || !analysisTitle.trim()"
              >
                <span v-if="analyzing">分析中...</span>
                <span v-else>开始分析</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 保存诉求模板对话框 -->
    <Dialog v-model:open="showSavePromptDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>保存分析诉求</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">模板名称</label>
            <Input
              v-model="promptTemplateName"
              placeholder="例如：销售趋势分析"
            />
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showSavePromptDialog = false">
              取消
            </Button>
            <Button
              @click="handleSavePromptTemplate"
              :disabled="!promptTemplateName.trim()"
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 浮动导入按钮 -->
    <button
      @click="showImportSheet = true"
      class="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 4v16m8-8H4"
        />
      </svg>
    </button>

    <!-- 数据导入侧滑组件 -->
    <DataImportSheet
      v-model:open="showImportSheet"
      @saved="handleDataImported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSavedData } from '@/composables/useSavedData'
import { useAnalysisPrompts, useAnalysisRecords } from '@/composables/useAnalysis'
import type { SavedDataRecord } from '@/composables/useSavedData'
import { DATA_IMPORT_SCENARIOS } from '@/types/system-fields'
import DataImportSheet from '@/components/DataImportSheet.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import { toast } from 'vue-sonner'
import { getDeepSeekClient } from '@/api/deepseek'

const router = useRouter()

const {
  records,
  getStats,
  deleteRecord,
  deleteRecords
} = useSavedData()

const {
  templates: promptTemplates,
  createTemplate: createPromptTemplate,
  updateLastUsed
} = useAnalysisPrompts()

const {
  createRecord: createAnalysisRecord
} = useAnalysisRecords()

const scenarios = DATA_IMPORT_SCENARIOS

// 筛选和排序
const selectedScenarioKey = ref<string | null>(null)
const searchQuery = ref('')
const sortBy = ref('latest')
const selectedRecords = ref<string[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 详情
const showDetails = ref(false)
const selectedRecord = ref<SavedDataRecord | null>(null)

// 导入侧滑
const showImportSheet = ref(false)

// 分析对话框
const showAnalysisDialog = ref(false)
const analysisTitle = ref('')
const analysisPrompt = ref('')
const analyzing = ref(false)
const showSavePromptDialog = ref(false)
const promptTemplateName = ref('')

// 统计信息
const stats = getStats()

// 数据导入完成后刷新列表
const handleDataImported = () => {
  // 数据会自动更新，因为 useSavedData 使用的是响应式数据
  toast.success('数据已导入并保存')
}

// 选择场景
const selectScenario = (scenarioKey: string | null) => {
  selectedScenarioKey.value = scenarioKey
  currentPage.value = 1
  selectedRecords.value = []
}

// 过滤后的记录
const filteredRecords = computed(() => {
  let filtered = records.value

  // 按场景筛选
  if (selectedScenarioKey.value) {
    filtered = filtered.filter(r => r.scenarioKey === selectedScenarioKey.value)
  }

  // 按文件名搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.fileName.toLowerCase().includes(query)
    )
  }

  // 排序
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'latest':
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      case 'oldest':
        return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
      case 'name':
        return a.fileName.localeCompare(b.fileName)
      case 'rows':
        return b.rowCount - a.rowCount
      default:
        return 0
    }
  })

  return filtered
})

// 总行数
const totalRows = computed(() => {
  return filteredRecords.value.reduce((sum, r) => sum + r.rowCount, 0)
})

// 分页计算
const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / pageSize.value)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const displayPages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
    } else if (current >= total - 3) {
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      for (let i = current - 2; i <= current + 2; i++) pages.push(i)
    }
  }
  
  return pages
})

// 格式化日期
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN')
}

// 选中用于分析的数据记录
const selectedDataForAnalysis = computed(() => {
  return records.value.filter(r => selectedRecords.value.includes(r.id))
})

// 选中数据的总行数
const totalSelectedRows = computed(() => {
  return selectedDataForAnalysis.value.reduce((sum, r) => sum + r.rowCount, 0)
})

// 选择/取消选择
const toggleSelection = (id: string) => {
  const index = selectedRecords.value.indexOf(id)
  if (index >= 0) {
    selectedRecords.value.splice(index, 1)
  } else {
    selectedRecords.value.push(id)
  }
}

// 应用诉求模板
const applyPromptTemplate = (templateId: any) => {
  if (!templateId || typeof templateId !== 'string') return
  const template = promptTemplates.value.find(t => t.id === templateId)
  if (template) {
    analysisPrompt.value = template.content
    updateLastUsed(templateId)
  }
}

// 保存诉求模板
const handleSavePromptTemplate = () => {
  if (!promptTemplateName.value.trim()) return
  
  createPromptTemplate(promptTemplateName.value.trim(), analysisPrompt.value)
  
  promptTemplateName.value = ''
  showSavePromptDialog.value = false
  toast.success('诉求模板已保存')
}

// 提交给 DeepSeek 分析
const handleSubmitAnalysis = async () => {
  if (!analysisTitle.value.trim() || !analysisPrompt.value.trim()) {
    toast.error('请填写分析标题和诉求')
    return
  }

  if (selectedDataForAnalysis.value.length === 0) {
    toast.error('请选择要分析的数据')
    return
  }

  analyzing.value = true
  const startTime = Date.now()

  try {
    // 准备数据给 DeepSeek
    const dataContext = selectedDataForAnalysis.value.map(record => {
      const fields = record.mappings.map(m => m.targetLabel || m.targetField).join('、')
      return `
数据文件：${record.fileName}
场景类型：${record.scenarioName}
数据行数：${record.rowCount}
字段列表：${fields}

数据预览（前5条）：
${JSON.stringify(record.data.slice(0, 5), null, 2)}
`
    }).join('\n---\n')

    const prompt = `你是一个专业的数据分析师。请根据以下数据和用户的分析诉求，提供详细的分析报告。

用户诉求：
${analysisPrompt.value}

数据信息：
${dataContext}

请提供：
1. 数据概况总结
2. 关键发现和洞察
3. 具体的数据分析结果
4. 实用的建议和结论

请用中文回复，使用 Markdown 格式组织内容。`

    // 调用 DeepSeek API
    let result = ''
    const client = getDeepSeekClient()
    await client.getStreamingResponse(
      [{ role: 'user', content: prompt }],
      (chunk: string) => {
        result += chunk
      },
      () => {
          const duration = Date.now() - startTime

          // 保存分析记录
          const analysisRecord = createAnalysisRecord(
            analysisTitle.value,
            selectedDataForAnalysis.value,
            analysisPrompt.value,
            result,
            duration
          )

          toast.success('分析完成')
          
          // 重置表单
          showAnalysisDialog.value = false
          analysisTitle.value = ''
          analysisPrompt.value = ''
          selectedRecords.value = []
          
          // 跳转到分析结果页面
          router.push(`/analysis-results/${analysisRecord.id}`)
      },
      (error: Error) => {
        console.error('分析失败:', error)
        toast.error('分析失败，请稍后重试')
      }
    )
  } catch (error) {
    console.error('分析失败:', error)
    toast.error('分析失败，请稍后重试')
  } finally {
    analyzing.value = false
  }
}

// 查看详情
const viewDetails = (record: SavedDataRecord) => {
  selectedRecord.value = record
  showDetails.value = true
}

// 导出记录
const exportRecord = (record: SavedDataRecord) => {
  const ws = XLSX.utils.json_to_sheet(record.data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  
  const fileName = `${record.fileName.replace('.xlsx', '')}_exported_${Date.now()}.xlsx`
  XLSX.writeFile(wb, fileName)
  toast.success('数据已导出')
}

// 确认删除
const confirmDelete = (id: string) => {
  if (confirm('确定要删除这条记录吗？删除后无法恢复。')) {
    deleteRecord(id)
    toast.success('已删除')
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (confirm(`确定要删除选中的 ${selectedRecords.value.length} 条记录吗？删除后无法恢复。`)) {
    deleteRecords(selectedRecords.value)
    selectedRecords.value = []
    toast.success('已删除')
  }
}

onMounted(() => {
  // 数据已在 composable 中自动加载
})
</script>
