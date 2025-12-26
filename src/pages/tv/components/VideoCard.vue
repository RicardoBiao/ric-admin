<template>
  <div 
    class="video-card group cursor-pointer"
    @click="$emit('click')"
  >
    <!-- 封面图片 -->
    <div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800">
      <img 
        :src="video.vod_pic" 
        :alt="video.vod_name"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
        @error="onImageError"
      />
      
      <!-- 更新状态标签 -->
      <div 
        v-if="video.vod_remarks" 
        class="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white font-medium"
      >
        {{ video.vod_remarks }}
      </div>

      <!-- 播放进度条 (如果有观看历史) -->
      <div 
        v-if="progress !== undefined && progress > 0" 
        class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50"
      >
        <div 
          class="h-full bg-blue-500 transition-all"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- 视频信息 -->
    <div class="mt-2 space-y-1">
      <h3 class="text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
        {{ video.vod_name }}
      </h3>
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>{{ video.type_name }}</span>
        <span v-if="video.vod_year">{{ video.vod_year }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VideoDetail } from '@/types';

interface Props {
  video: VideoDetail;
  progress?: number; // 播放进度百分比
}

defineProps<Props>();
defineEmits<{
  click: [];
}>();

const onImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23374151" width="100" height="100"/%3E%3Ctext fill="%23fff" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E暂无图片%3C/text%3E%3C/svg%3E';
};
</script>

<style scoped>
.video-card {
  transition: all 0.3s;
}

.video-card:hover {
  transform: translateY(-0.25rem);
}
</style>
