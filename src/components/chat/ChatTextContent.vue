<template>
  <div class="flex items-end gap-2 px-4 py-2">
    <template v-if="role === 'assistant'">
      <MdPreview
        :model-value="content"
        preview-only
        class="flex-1 text-sm leading-relaxed md-preview-reset"
      />
    </template>
    <template v-else>
      <p class="text-sm leading-relaxed flex-1 whitespace-pre-wrap">{{ content }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

interface Props {
  content: string
  role: 'user' | 'assistant' | 'system'
}

defineProps<Props>()
</script>

<style scoped>
/* Keep markdown preview visually lightweight for chat bubble */
:deep(.md-editor-preview) {
  background-color: transparent;
  font-size: 14px;
}

:deep(.md-editor-preview .md-editor-preview-wrapper) {
  padding: 0;
}

:deep(.md-editor-preview .default-theme) {
  background-color: transparent;
}

:deep(.md-editor-preview pre) {
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
}
</style>
