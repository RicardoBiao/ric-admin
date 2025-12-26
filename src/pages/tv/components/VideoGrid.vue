<template>
  <div class="video-grid">
    <VideoCard 
      v-for="video in videos" 
      :key="video.vod_id"
      :video="video"
      :progress="getVideoProgress(video.vod_id)"
      @click="onVideoClick(video)"
    />
  </div>
</template>

<script setup lang="ts">
import type { VideoDetail, WatchHistory } from '@/types';
import VideoCard from './VideoCard.vue';

interface Props {
  videos: VideoDetail[];
  watchHistory?: WatchHistory[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'video-click': [video: VideoDetail];
}>();

// 获取视频的播放进度
const getVideoProgress = (vodId: number) => {
  if (!props.watchHistory) return undefined;
  const history = props.watchHistory.find(h => h.vod_id === vodId);
  return history?.progressPercent;
};

const onVideoClick = (video: VideoDetail) => {
  emit('video-click', video);
};
</script>

<style scoped>
.video-grid {
  display: grid;
  gap: 1rem;
  /* Mobile: 2 columns */
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* Tablet: 3-4 columns */
@media (min-width: 640px) {
  .video-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Desktop: 4-6 columns */
@media (min-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .video-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .video-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>
