<template>
  <div class="video-player-container">
    <!-- ArtPlayer 容器 -->
    <div ref="artRef" class="w-full aspect-video bg-black"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface Props {
  url: string;
  title?: string;
  poster?: string;
  currentTime?: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'time-update': [currentTime: number, duration: number];
  'ended': [];
}>();

const artRef = ref<HTMLDivElement>();
let art: Artplayer | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  if (!artRef.value) return;

  // 初始化 ArtPlayer
  art = new Artplayer({
    container: artRef.value,
    url: props.url,
    title: props.title,
    poster: props.poster,
    volume: 0.5,
    autoplay: false,
    pip: true,
    setting: true,
    flip: true,
    playbackRate: true,
    aspectRatio: true,
    fullscreen: true,
    fullscreenWeb: true,
    miniProgressBar: true,
    mutex: true,
    backdrop: true,
    playsInline: true,
    autoPlayback: true,
    theme: '#3b82f6',
    lang: 'zh-cn',
    customType: {
      m3u8: function (video: HTMLVideoElement, url: string) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        }
      },
    },
    moreVideoAttr: {
      crossOrigin: 'anonymous',
    },
  });

  // 设置初始播放时间
  if (props.currentTime) {
    art.once('ready', () => {
      art!.currentTime = props.currentTime || 0;
    });
  }

  // 监听播放进度 (每5秒发送一次)
  progressInterval = setInterval(() => {
    if (art && !art.paused) {
      emit('time-update', art.currentTime, art.duration);
    }
  }, 5000);

  // 监听播放结束
  art.on('video:ended', () => {
    emit('ended');
  });
});

onUnmounted(() => {
  if (progressInterval) {
    clearInterval(progressInterval);
  }
  if (art) {
    art.destroy();
    art = null;
  }
});

// 监听 URL 变化
watch(() => props.url, (newUrl) => {
  if (art && newUrl) {
    art.url = newUrl;
  }
});
</script>

<style scoped>
.video-player-container {
  width: 100%;
}

:deep(.art-video-player) {
  overflow: hidden;
}
</style>
