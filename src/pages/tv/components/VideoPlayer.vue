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
let hls: Hls | null = null;

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
          hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        }
      },
    },
    moreVideoAttr: {
      crossOrigin: 'anonymous',
      'x-webkit-airplay': 'allow',
      'webkit-playsinline': '',
    },
  });

  // 添加投屏按钮
  (art as any).controls.add({
    position: 'right',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-airplay-icon lucide-airplay"><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><path d="m12 15 5 6H7Z"/></svg>`,
    tooltip: '投屏',
    click: function () {
      const video = (art as any)?.video;
      if (!video) return;

      // 检查是否支持 Remote Playback API
      if ('remote' in video) {
        const remote = (video as any).remote;
        if (remote.state === 'disconnected') {
          remote.prompt().catch((err: Error) => {
            console.error('投屏失败:', err);
            if (art && (art as any).notice) {
              (art as any).notice.show = '投屏失败: ' + err.message;
            }
          });
        } else {
          remote.prompt();
        }
      } else if ((window as any).WebKitPlaybackTargetAvailabilityEvent) {
        // Safari AirPlay 支持
        if ((video as any).webkitShowPlaybackTargetPicker) {
          (video as any).webkitShowPlaybackTargetPicker();
        } else {
          if (art && (art as any).notice) {
            (art as any).notice.show = '您的设备不支持 AirPlay';
          }
        }
      } else {
        if (art && (art as any).notice) {
          (art as any).notice.show = '您的设备不支持投屏功能';
        }
      }
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
  if (hls) {
    hls.destroy();
    hls = null;
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

/* 投屏按钮 SVG 样式 */
:deep(.art-control .lucide-airplay path) {
  fill: none !important;
}
</style>
