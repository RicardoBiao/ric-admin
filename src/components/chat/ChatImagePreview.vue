<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    @click="$emit('close')"
  >
    <div class="relative">
      <img
        :src="fileUrl"
        :alt="fileName"
        class="max-h-[80vh] max-w-[80vw] rounded-lg shadow-2xl object-contain"
        @click.stop
      />
      <button
        @click="$emit('close')"
        class="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
      >
        <X class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  show: boolean
  fileUrl: string
  fileName?: string
}

defineProps<Props>()
defineEmits<{
  close: []
}>()
</script>
