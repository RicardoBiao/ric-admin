<template>
  <div class="flex items-end gap-2 px-4 py-2">
    <p class="text-sm leading-relaxed flex-1">{{ content }}</p>
  </div>
</template>

<script setup lang="ts">

interface Props {
  content: string
  role: 'user' | 'assistant' | 'system'
}

defineProps<Props>()
</script>
