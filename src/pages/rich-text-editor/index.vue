<template>
  <div class="rich-text-editor-page">
    <div class="page-header">
      <h1>富文本编辑器</h1>
      <p class="page-description">基于 Tiptap 实现的富文本编辑器，支持自定义元素</p>
    </div>
    
    <RichTextInput />
  </div>
</template>

<script setup lang="ts">
import RichTextInput from './RichTextInput.vue'
</script>

<style scoped>
.rich-text-editor-page {
  padding: 24px;
  min-height: 100vh;
  background: #f9fafb;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
</style>
