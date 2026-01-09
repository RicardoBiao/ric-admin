<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="right" class="w-full sm:w-[800px] sm:max-w-[90vw] p-0 flex flex-col">
      <SheetHeader class="px-6 py-4 border-b">
        <SheetTitle>数据导入与映射</SheetTitle>
        <SheetDescription>
          选择数据类型，导入 Excel 文件，配置字段映射规则
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <!-- 场景选择 -->
        <div>
          <h3 class="text-sm font-medium mb-3">选择数据类型</h3>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="scenario in scenarios"
              :key="scenario.key"
              @click="selectScenario(scenario.key)"
              :class="[
                'p-3 border rounded-lg text-left transition-all',
                selectedScenario === scenario.key
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              ]"
            >
              <div class="font-medium text-sm">{{ scenario.name }}</div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ scenario.fields.length }} 个字段
              </div>
            </button>
          </div>
        </div>

        <!-- 导入 Excel -->
        <div v-if="selectedScenario">
          <h3 class="text-sm font-medium mb-3">导入 Excel 文件</h3>
          <div class="border rounded-lg p-4">
            <input
              ref="fileInputRef"
              type="file"
              accept=".xlsx,.xls"
              class="hidden"
              @change="handleFileChange"
            />
            
            <div class="flex gap-3">
              <Button @click="triggerFileInput" :disabled="loading">
                <span v-if="loading">导入中...</span>
                <span v-else>选择 Excel 文件</span>
              </Button>

              <Button
                v-if="rawData.length > 0"
                variant="outline"
                @click="clearData"
              >
                清除数据
              </Button>
            </div>

            <div v-if="fileName" class="mt-3 text-sm">
              <span class="text-muted-foreground">已导入：</span>
              <span class="font-medium">{{ fileName }}</span>
              <span class="text-muted-foreground ml-2">({{ rawData.length }} 条)</span>
            </div>
          </div>
        </div>

        <!-- 配置字段映射 -->
        <div v-if="importedFields.length > 0">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium">配置字段映射</h3>
            <div class="flex gap-2">
              <Button 
                @click="handleSaveTemplate" 
                variant="outline" 
                size="sm"
                :disabled="validMappings.length === 0"
              >
                💾 保存规则
              </Button>
              <Button @click="addMapping" size="sm">
                + 添加映射
              </Button>
            </div>
          </div>

          <!-- 映射模板选择 -->
          <div v-if="currentScenarioTemplates.length > 0" class="mb-3">
            <Select @update:model-value="applySelectedTemplate">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择已保存的映射规则" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="template in currentScenarioTemplates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }} ({{ template.mappings.length }} 条映射)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 映射列表 -->
          <div class="space-y-2">
            <div
              v-for="(mapping, index) in fieldMappings"
              :key="index"
              class="flex items-center gap-2 p-3 border rounded-lg bg-card"
            >
              <Select
                :model-value="mapping.sourceField"
                @update:model-value="(value: any) => value && updateMappingSource(index, String(value))"
              >
                <SelectTrigger class="flex-1">
                  <SelectValue placeholder="导入字段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="field in importedFields"
                    :key="field"
                    :value="field"
                  >
                    {{ field }}
                  </SelectItem>
                </SelectContent>
              </Select>

              <span class="text-muted-foreground">→</span>

              <Select
                :model-value="mapping.targetField"
                @update:model-value="(value: any) => value && updateMappingTarget(index, String(value))"
              >
                <SelectTrigger class="flex-1">
                  <SelectValue placeholder="系统字段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="sysField in systemFields"
                    :key="sysField.key"
                    :value="sysField.key"
                  >
                    {{ sysField.label }}
                    <span v-if="sysField.required" class="text-red-500 ml-1">*</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                @click="removeMapping(index)"
              >
                ✕
              </Button>
            </div>

            <div
              v-if="fieldMappings.length === 0"
              class="text-center py-6 text-sm text-muted-foreground border rounded-lg"
            >
              点击"添加映射"开始配置
            </div>
          </div>

          <!-- 必填字段提示 -->
          <div
            v-if="getRequiredFieldsCount() > 0 && getMappedRequiredFieldsCount() < getRequiredFieldsCount()"
            class="mt-3 p-3 border border-yellow-500/50 bg-yellow-500/5 rounded-lg text-sm"
          >
            <div class="font-medium text-yellow-600">未映射的必填字段：</div>
            <div class="text-xs text-muted-foreground mt-1">
              {{ getUnmappedRequiredFields().join('、') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="border-t p-4 bg-card">
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            <span v-if="validMappings.length > 0">
              已配置 {{ validMappings.length }} 条映射
              <span v-if="getMappedData.length > 0">
                ，将保存 {{ getMappedData.length }} 行数据
              </span>
            </span>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" @click="$emit('update:open', false)">
              取消
            </Button>
            <Button
              @click="handleSaveMappedData"
              :disabled="loading || !canSave()"
            >
              <span v-if="loading">保存中...</span>
              <span v-else>保存数据</span>
            </Button>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>

  <!-- 保存模板对话框 -->
  <Dialog v-model:open="showSaveTemplateDialog">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>保存映射规则</DialogTitle>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">规则名称</label>
          <Input
            v-model="templateName"
            placeholder="例如：2026年销售数据映射"
          />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">规则描述（可选）</label>
          <Textarea
            v-model="templateDescription"
            placeholder="描述这个映射规则的用途..."
            rows="3"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showSaveTemplateDialog = false">
          取消
        </Button>
        <Button @click="saveAsTemplate" :disabled="!templateName.trim()">
          保存
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDataImport } from '@/composables/useDataImport'
import { useMappingTemplates } from '@/composables/useMappingTemplates'
import { useSavedData } from '@/composables/useSavedData'
import { DATA_IMPORT_SCENARIOS } from '@/types/system-fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Props {
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'saved'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  selectedScenario,
  rawData,
  importedFields,
  fieldMappings,
  fileName,
  loading,
  getMappedData,
  importFromExcel,
  addMapping,
  updateMappingSource,
  updateMappingTarget,
  removeMapping,
  clearData,
  saveMappedData
} = useDataImport()

const {
  getTemplatesByScenario,
  createTemplate,
  applyTemplate
} = useMappingTemplates()

const { addRecord } = useSavedData()

const scenarios = DATA_IMPORT_SCENARIOS
const fileInputRef = ref<HTMLInputElement>()
const showSaveTemplateDialog = ref(false)
const templateName = ref('')
const templateDescription = ref('')

const currentScenario = computed(() => {
  return scenarios.find(s => s.key === selectedScenario.value)
})

const systemFields = computed(() => {
  return currentScenario.value?.fields || []
})

const currentScenarioTemplates = computed(() => {
  if (!selectedScenario.value) return []
  return getTemplatesByScenario(selectedScenario.value).value
})

const validMappings = computed(() => {
  return fieldMappings.value.filter(m => m.sourceField && m.targetField)
})

const selectScenario = (scenarioKey: string) => {
  selectedScenario.value = scenarioKey
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    importFromExcel(file)
    target.value = ''
  }
}

const getRequiredFieldsCount = () => {
  return systemFields.value.filter(f => f.required).length
}

const getMappedRequiredFieldsCount = () => {
  const mappedKeys = validMappings.value.map(m => m.targetField)
  return systemFields.value.filter(f => f.required && mappedKeys.includes(f.key)).length
}

const canSave = () => {
  const mappedKeys = validMappings.value.map(m => m.targetField)
  const requiredFields = systemFields.value.filter(f => f.required)
  return requiredFields.every(f => mappedKeys.includes(f.key))
}

const getUnmappedRequiredFields = () => {
  const mappedKeys = validMappings.value.map(m => m.targetField)
  const requiredFields = systemFields.value.filter(f => f.required)
  return requiredFields
    .filter(f => !mappedKeys.includes(f.key))
    .map(f => f.label)
}

const handleSaveTemplate = () => {
  if (validMappings.value.length === 0) {
    alert('请先配置至少一条有效的映射规则')
    return
  }
  showSaveTemplateDialog.value = true
}

const saveAsTemplate = () => {
  if (!templateName.value.trim()) return
  
  createTemplate(
    templateName.value.trim(),
    selectedScenario.value,
    validMappings.value,
    templateDescription.value.trim() || undefined
  )

  templateName.value = ''
  templateDescription.value = ''
  showSaveTemplateDialog.value = false
}

const applySelectedTemplate = (templateId: any) => {
  if (!templateId || typeof templateId !== 'string') return
  const mappings = applyTemplate(templateId)
  if (mappings) {
    fieldMappings.value = mappings
  }
}

const handleSaveMappedData = async () => {
  const result = await saveMappedData()
  
  if (result.success && result.data.length > 0 && result.mappings && result.fileName) {
    // 为映射添加 targetLabel
    const mappingsWithLabels = result.mappings.map(m => ({
      ...m,
      targetLabel: systemFields.value.find(f => f.key === m.targetField)?.label || m.targetField
    }))
    
    addRecord(
      selectedScenario.value,
      currentScenario.value?.name || '未知场景',
      result.fileName,
      mappingsWithLabels,
      result.data
    )
    
    emit('saved')
    emit('update:open', false)
  }
}

// 监听打开状态，重置时选择默认场景
watch(() => selectedScenario.value, () => {
  if (!selectedScenario.value && scenarios.length > 0) {
    selectedScenario.value = scenarios[0].key
  }
}, { immediate: true })
</script>
