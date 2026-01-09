<template>
  <div class="rich-text-input-container">
    <!-- 操作按钮区 -->
    <div class="editor-toolbar">
      <button @click="insertCustomFlex">插入自定义Flex元素</button>
      <button @click="getEditorContent">获取编辑器内容</button>
    </div>

    <!-- Tiptap 富文本编辑器核心 -->
    <div class="editor-content">
      <EditorContent :editor="editor" />
    </div>

    <!-- 展示获取到的内容（调试用） -->
    <div class="content-preview" v-if="content">
      <h4>编辑器内容（HTML）：</h4>
      <pre>{{ content }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { Node } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'

// 1. 定义自定义节点（对应截图里的 flex 元素）
const CustomFlex = Node.create({
  // 节点名称（唯一）
  name: 'customFlex',
  // 归类为块级元素（和段落同级）
  group: 'block',
  // 允许包含子节点（比如文字）
  content: 'inline*',
  // 渲染到页面的 HTML 结构
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 
        ...HTMLAttributes,
        class: 'custom-flex-element', // 自定义样式类
        'data-custom-node': 'flex' // 自定义属性（对应截图的 data-slate-node）
      },
      0 // 0 表示渲染子节点（文字内容）
    ]
  },
  // 解析 HTML 时识别该节点（保证内容回显正常）
  parseHTML() {
    return [{ tag: 'div[data-custom-node="flex"]' }]
  }
})

// 2. 初始化编辑器实例
const editor = ref<Editor | null>(null)
// 存储获取到的编辑器内容（调试用）
const content = ref('')

onMounted(() => {
  editor.value = new Editor({
    // 注册扩展（基础段落 + 文本 + 自定义Flex节点）
    extensions: [
      Document,  // 文档根节点（必需）
      Paragraph, // 基础段落节点
      Text,      // 文本节点
      CustomFlex // 自定义Flex节点
    ],
    // 初始内容（空段落）
    content: '<p>请输入内容...</p>',
    // 编辑器配置
    editorProps: {
      // 允许粘贴文本/HTML（如需图片可扩展）
      handlePaste: (props) => {
        console.log('粘贴内容：', props)
        // 可自定义粘贴逻辑，比如过滤格式、处理图片等
        return false
      }
    }
  })
})

// 组件卸载时销毁编辑器（防止内存泄漏）
onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy()
    editor.value = null
  }
})

// 3. 插入自定义Flex元素的方法
const insertCustomFlex = () => {
  if (!editor.value) return

  // 在光标位置插入自定义Flex节点
  editor.value.chain().focus().insertContent({
    type: 'customFlex',
    content: [{ type: 'text', text: '这是自定义Flex元素' }]
  }).run()
}

// 4. 获取编辑器内容（HTML格式，可提交到后端）
const getEditorContent = () => {
  if (!editor.value) return
  content.value = editor.value.getHTML()
  console.log('编辑器HTML内容：', content.value)
}
</script>

<style scoped>
.rich-text-input-container {
  width: 100%;
  max-width: 1200px;
  margin: 20px auto;
}

.editor-toolbar {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}

.editor-toolbar button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
  font-size: 14px;
}

.editor-toolbar button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.editor-content {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  min-height: 200px;
  background: white;
}

/* Tiptap 编辑器样式 */
.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 180px;
}

.editor-content :deep(.tiptap p) {
  margin: 8px 0;
}

.editor-content :deep(.tiptap p:first-child) {
  margin-top: 0;
}

.editor-content :deep(.tiptap p:last-child) {
  margin-bottom: 0;
}

/* 自定义Flex元素的样式（可根据需求调整） */
.editor-content :deep(.custom-flex-element) {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  padding: 12px;
  margin: 12px 0;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
  color: #1f2937;
}

.content-preview {
  margin-top: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.content-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.content-preview pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #1f2937;
  background: white;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}
</style>
