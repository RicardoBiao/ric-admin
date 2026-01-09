/**
 * 标签管理 Composable
 */

import { ref, computed } from 'vue'

export interface Tag {
  /** 标签名称 */
  name: string
  /** 标签颜色 */
  color: string
  /** 创建时间 */
  createdAt: string
  /** 使用次数 */
  count: number
}

const TAGS_KEY = 'file_tags'

/**
 * 标签管理
 */
export function useTags() {
  const tags = ref<Tag[]>([])

  /**
   * 从 localStorage 加载标签
   */
  const loadTags = () => {
    try {
      const stored = localStorage.getItem(TAGS_KEY)
      if (stored) {
        tags.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载标签失败:', error)
    }
  }

  /**
   * 保存标签到 localStorage
   */
  const saveToStorage = () => {
    try {
      localStorage.setItem(TAGS_KEY, JSON.stringify(tags.value))
    } catch (error) {
      console.error('保存标签失败:', error)
    }
  }

  /**
   * 添加标签（如果已存在则增加计数）
   */
  const addTag = (name: string, color?: string): Tag => {
    const existingTag = tags.value.find(t => t.name === name)
    
    if (existingTag) {
      existingTag.count++
      saveToStorage()
      return existingTag
    }

    const newTag: Tag = {
      name,
      color: color || generateRandomColor(),
      createdAt: new Date().toISOString(),
      count: 1
    }

    tags.value.push(newTag)
    saveToStorage()
    return newTag
  }

  /**
   * 批量添加标签
   */
  const addTags = (names: string[]) => {
    names.forEach(name => addTag(name))
  }

  /**
   * 删除标签
   */
  const deleteTag = (name: string) => {
    const index = tags.value.findIndex(t => t.name === name)
    if (index !== -1) {
      tags.value.splice(index, 1)
      saveToStorage()
    }
  }

  /**
   * 更新标签颜色
   */
  const updateTagColor = (name: string, color: string) => {
    const tag = tags.value.find(t => t.name === name)
    if (tag) {
      tag.color = color
      saveToStorage()
    }
  }

  /**
   * 增加标签使用计数
   */
  const incrementTagCount = (name: string) => {
    const tag = tags.value.find(t => t.name === name)
    if (tag) {
      tag.count++
      saveToStorage()
    }
  }

  /**
   * 生成随机颜色
   */
  const generateRandomColor = () => {
    const colors = [
      '#ef4444', // red
      '#f97316', // orange
      '#f59e0b', // amber
      '#eab308', // yellow
      '#84cc16', // lime
      '#22c55e', // green
      '#10b981', // emerald
      '#14b8a6', // teal
      '#06b6d4', // cyan
      '#0ea5e9', // sky
      '#3b82f6', // blue
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#a855f7', // purple
      '#d946ef', // fuchsia
      '#ec4899', // pink
      '#f43f5e', // rose
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * 按使用次数排序的标签
   */
  const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => b.count - a.count)
  })

  // 初始加载
  loadTags()

  return {
    tags,
    sortedTags,
    addTag,
    addTags,
    deleteTag,
    updateTagColor,
    incrementTagCount,
    loadTags
  }
}
