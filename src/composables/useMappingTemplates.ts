import { ref, computed } from 'vue'
import type { MappingTemplate, FieldMapping } from '@/types/system-fields'
import { toast } from 'vue-sonner'

const TEMPLATES_STORAGE_KEY = 'mapping_templates'

/**
 * 映射模板管理 composable
 */
export function useMappingTemplates() {
  const templates = ref<MappingTemplate[]>([])

  /**
   * 从 localStorage 加载所有模板
   */
  const loadTemplates = () => {
    try {
      const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
      if (stored) {
        templates.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载映射模板失败:', error)
    }
  }

  /**
   * 保存模板到 localStorage
   */
  const saveToStorage = () => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates.value))
    } catch (error) {
      console.error('保存映射模板失败:', error)
    }
  }

  /**
   * 获取指定场景的所有模板
   */
  const getTemplatesByScenario = (scenarioKey: string) => {
    return computed(() => 
      templates.value.filter(t => t.scenarioKey === scenarioKey)
    )
  }

  /**
   * 创建新的映射模板
   */
  const createTemplate = (
    name: string,
    scenarioKey: string,
    mappings: FieldMapping[],
    description?: string
  ): MappingTemplate => {
    const now = new Date().toISOString()
    const template: MappingTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      scenarioKey,
      mappings: JSON.parse(JSON.stringify(mappings)), // 深拷贝
      createdAt: now,
      updatedAt: now
    }

    templates.value.push(template)
    saveToStorage()
    toast.success(`映射规则"${name}"已保存`)
    
    return template
  }

  /**
   * 更新现有模板
   */
  const updateTemplate = (
    id: string,
    updates: {
      name?: string
      description?: string
      mappings?: FieldMapping[]
    }
  ) => {
    const index = templates.value.findIndex(t => t.id === id)
    if (index >= 0) {
      templates.value[index] = {
        ...templates.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveToStorage()
      toast.success('映射规则已更新')
      return true
    }
    return false
  }

  /**
   * 删除模板
   */
  const deleteTemplate = (id: string) => {
    const index = templates.value.findIndex(t => t.id === id)
    if (index >= 0) {
      const name = templates.value[index].name
      templates.value.splice(index, 1)
      saveToStorage()
      toast.success(`已删除映射规则"${name}"`)
      return true
    }
    return false
  }

  /**
   * 根据 ID 获取模板
   */
  const getTemplateById = (id: string) => {
    return templates.value.find(t => t.id === id)
  }

  /**
   * 应用模板（返回映射配置的副本）
   */
  const applyTemplate = (id: string): FieldMapping[] | null => {
    const template = getTemplateById(id)
    if (template) {
      toast.success(`已应用映射规则"${template.name}"`)
      return JSON.parse(JSON.stringify(template.mappings))
    }
    return null
  }

  // 初始加载
  loadTemplates()

  return {
    templates,
    getTemplatesByScenario,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
    applyTemplate,
    loadTemplates
  }
}
