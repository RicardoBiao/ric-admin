<template>
  <div class="h-screen flex flex-col bg-gray-900">
    <!-- 返回按钮 -->
    <button
      class="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm text-white rounded-lg hover:bg-black/80 transition-colors shadow-lg"
      @click="$emit('back')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spinner"></div>
    </div>

    <div v-else-if="video" class="flex flex-col h-full">
      <!-- 播放器区域 -->
      <div class="relative bg-black flex-shrink-0">
        <VideoPlayer
          v-if="currentPlayUrl"
          :url="currentPlayUrl"
          :title="video.vod_name"
          :poster="video.vod_pic"
          :current-time="watchProgress?.progress"
          @time-update="onTimeUpdate"
          @ended="onPlayEnded"
          @connection-failed="onConnectionFailed"
        />

        <!-- 连接失败提示 -->
        <div v-if="showConnectionError" class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div class="bg-gray-800 text-white px-6 py-4 rounded-lg shadow-xl border border-gray-700 pointer-events-auto">
            <p class="text-sm">该视频源无法连接，请切换源尝试</p>
          </div>
        </div>

        <!-- 继续观看提示 -->
        <div v-if="showContinuePrompt" class="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div class="text-center px-4">
            <p class="text-white mb-4">
              检测到上次观看进度: {{ watchProgress?.progressPercent }}%
            </p>
            <div class="flex gap-3 justify-center">
              <button class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" @click="continueWatch">
                继续观看
              </button>
              <button class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors" @click="startFromBeginning">
                从头开始
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容区域（可滚动） -->
      <div class="flex-1 overflow-y-auto">
        <!-- 视频标题和收藏 -->
        <div class="bg-gray-900 px-4 py-4 flex items-start justify-between border-b border-gray-800">
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-white mb-1 truncate">
              {{ video.vod_name }}
            </h1>
            <div class="flex flex-wrap gap-2 text-xs text-gray-400">
              <span>{{ video.type_name }}</span>
              <span v-if="video.vod_year">{{ video.vod_year }}</span>
              <span v-if="video.vod_remarks" class="text-blue-500">{{ video.vod_remarks }}</span>
            </div>
          </div>

          <!-- 收藏按钮 -->
          <button
            :class="['ml-3 p-2 rounded-full transition-colors flex-shrink-0', isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500']"
            @click="toggleFavorite"
          >
            <svg class="w-6 h-6" :fill="isFavorited ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <!-- 详情面板（可折叠） -->
        <div class="border-b border-gray-800">
          <button
            class="w-full px-4 py-3 flex items-center justify-between text-white hover:bg-gray-800/50 transition-colors"
            @click="showDetailPanel = !showDetailPanel"
          >
            <span class="font-medium">详情</span>
            <svg 
              :class="['w-5 h-5 transition-transform', showDetailPanel ? 'rotate-180' : '']" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div v-show="showDetailPanel" class="px-4 pb-4">
            <!-- 详细信息 -->
            <div class="space-y-2 text-sm mb-4">
              <div v-if="video.vod_area || video.vod_lang" class="flex gap-4 text-gray-400">
                <span v-if="video.vod_area">{{ video.vod_area }}</span>
                <span v-if="video.vod_lang">{{ video.vod_lang }}</span>
              </div>
              <div v-if="video.vod_director" class="flex">
                <span class="text-gray-500 w-12 flex-shrink-0">导演:</span>
                <span class="text-gray-300">{{ video.vod_director }}</span>
              </div>
              <div v-if="video.vod_actor" class="flex">
                <span class="text-gray-500 w-12 flex-shrink-0">主演:</span>
                <span class="text-gray-300">{{ video.vod_actor }}</span>
              </div>
            </div>

            <!-- 简介 -->
            <div v-if="video.vod_content">
              <h4 class="text-white font-medium mb-2">简介</h4>
              <p class="text-gray-400 text-sm leading-relaxed" v-html="video.vod_content"></p>
            </div>
          </div>
        </div>

        <!-- 换源 -->
        <div v-if="playSources.length > 1" class="border-b border-gray-800 pb-4">
          <div class="px-4 py-3">
            <h3 class="text-white font-medium mb-3">换源</h3>
            <div class="space-y-2">
              <button
                v-for="(source, index) in playSources"
                :key="index"
                :class="[
                  'w-full px-4 py-3 rounded-lg text-left transition-all flex items-center justify-between',
                  currentSourceIndex === index 
                    ? 'bg-blue-600/20 border-2 border-blue-600 text-white' 
                    : 'bg-gray-800 border-2 border-transparent text-gray-300 hover:bg-gray-700'
                ]"
                @click="selectSource(index)"
              >
                <span class="font-medium">{{ source.source }}</span>
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-gray-400">{{ source.episodes.length }}集</span>
                  <svg v-if="currentSourceIndex === index" class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- 选集 -->
        <div v-if="currentSource" class="pb-4">
          <div class="px-4 py-3 flex items-center justify-between">
            <h3 class="text-white font-medium">
              选集 
              <span class="text-sm text-gray-400 ml-2">共{{ currentSource.episodes.length }}集</span>
            </h3>
          </div>
          <div class="px-4">
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="(episode, index) in currentSource.episodes"
                :key="index"
                :class="[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  currentEpisodeIndex === index 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                ]"
                @click="selectEpisode(index)"
              >
                {{ episode.name }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex items-center justify-center h-full">
      <div class="text-center px-4">
        <svg class="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-400 text-lg mb-2">视频不存在</p>
        <p class="text-gray-500 text-sm mb-4">无法加载视频详情，请稍后重试</p>
        <button 
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          @click="$emit('back')"
        >
          返回
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { VideoDetail, PlaySource, WatchHistory } from '@/types';
import VideoPlayer from './VideoPlayer.vue';
import { useTv, useFavorites, useWatchHistory } from '@/composables/useTv';

interface Props {
  vodId: number;
}

const props = defineProps<Props>();
defineEmits<{
  back: [];
}>();

const { getVideoDetail, parsePlaySources, loadSources, activeSource } = useTv();
const { isFavorite, addFavorite, removeFavorite } = useFavorites();
const { addHistory, updateProgress, getProgress } = useWatchHistory();

const loading = ref(true);
const video = ref<VideoDetail | null>(null);
const playSources = ref<PlaySource[]>([]);
const currentSourceIndex = ref(0);
const currentEpisodeIndex = ref(0);
const isFavorited = ref(false);
const watchProgress = ref<WatchHistory | null>(null);
const showContinuePrompt = ref(false);
const showDetailPanel = ref(false);
const showConnectionError = ref(false);

const currentSource = computed(() => playSources.value[currentSourceIndex.value]);
const currentPlayUrl = computed(() => {
  const episode = currentSource.value?.episodes[currentEpisodeIndex.value];
  return episode?.url || '';
});

// 加载视频详情
const loadVideoDetail = async () => {
  loading.value = true;
  try {
    // 先确保视频源已加载
    await loadSources();
    console.log('当前活跃视频源:', activeSource.value);
    
    if (!activeSource.value) {
      console.error('没有活跃的视频源');
      return;
    }
    
    console.log('开始加载视频详情，ID:', props.vodId);
    const detail = await getVideoDetail(props.vodId);
    console.log('获取到的视频详情:', detail);
    
    if (detail) {
      video.value = detail;
      playSources.value = parsePlaySources(detail);
      console.log('解析后的播放源:', playSources.value);
      
      // 检查收藏状态
      isFavorited.value = await isFavorite(props.vodId);
      
      // 检查观看历史
      watchProgress.value = await getProgress(props.vodId);
      if (watchProgress.value && watchProgress.value.progress && watchProgress.value.progress > 10) {
        showContinuePrompt.value = true;
        // 恢复之前的播放源和集数
        if (watchProgress.value.sourceIndex !== undefined) {
          currentSourceIndex.value = watchProgress.value.sourceIndex;
        }
        if (watchProgress.value.episodeIndex !== undefined) {
          currentEpisodeIndex.value = watchProgress.value.episodeIndex;
        }
      }
    } else {
      console.error('视频详情为空，vodId:', props.vodId);
    }
  } catch (err) {
    console.error('加载视频详情出错:', err);
  } finally {
    loading.value = false;
  }
};

// 切换收藏
const toggleFavorite = async () => {
  if (!video.value) return;
  
  if (isFavorited.value) {
    await removeFavorite(props.vodId);
  } else {
    await addFavorite({
      vod_id: video.value.vod_id,
      vod_name: video.value.vod_name,
      vod_pic: video.value.vod_pic,
      vod_remarks: video.value.vod_remarks,
      type_name: video.value.type_name,
    });
  }
  isFavorited.value = !isFavorited.value;
};

// 选择播放源
const selectSource = (index: number) => {
  currentSourceIndex.value = index;
  currentEpisodeIndex.value = 0;
  showContinuePrompt.value = false;
};

// 选择集数
const selectEpisode = (index: number) => {
  currentEpisodeIndex.value = index;
  showContinuePrompt.value = false;
  saveWatchHistory();
};

// 保存观看历史
const saveWatchHistory = async () => {
  if (!video.value || !currentSource.value) return;
  
  const episode = currentSource.value.episodes[currentEpisodeIndex.value];
  await addHistory({
    vod_id: video.value.vod_id,
    vod_name: video.value.vod_name,
    vod_pic: video.value.vod_pic,
    vod_remarks: video.value.vod_remarks,
    type_name: video.value.type_name,
    episodeName: episode?.name,
    episodeIndex: currentEpisodeIndex.value,
    sourceIndex: currentSourceIndex.value,
  });
};

// 更新播放进度
const onTimeUpdate = async (currentTime: number, duration: number) => {
  if (!video.value) return;
  await updateProgress(props.vodId, currentTime, duration);
};

// 播放结束
const onPlayEnded = () => {
  // 自动播放下一集
  if (currentSource.value && currentEpisodeIndex.value < currentSource.value.episodes.length - 1) {
    currentEpisodeIndex.value++;
    saveWatchHistory();
  }
};

// 继续观看
const continueWatch = () => {
  showContinuePrompt.value = false;
};

// 从头开始
const startFromBeginning = () => {
  watchProgress.value = null;
  showContinuePrompt.value = false;
};

// 处理连接失败
const onConnectionFailed = () => {
  showConnectionError.value = true;
  // 3秒后自动隐藏
  setTimeout(() => {
    showConnectionError.value = false;
  }, 3000);
};

onMounted(() => {
  loadVideoDetail();
});
</script>

<style scoped>
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
