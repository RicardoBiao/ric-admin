<template>
  <div class="flex flex-col h-full">
    <!-- 顶部分类导航 -->
    <div class="flex-shrink-0 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 px-4 py-3">
      <div class="category-scroll">
        <button
          :class="['px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors', !selectedCategory ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white']"
          @click="selectedCategory = null"
        >
          全部
        </button>
        <button
          v-for="category in categories"
          :key="category.type_id"
          :class="['px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors', selectedCategory?.type_id === category.type_id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white']"
          @click="selectedCategory = category"
        >
          {{ category.type_name }}
        </button>
      </div>
    </div>

    <!-- 内容区域 (可滚动) -->
    <div class="flex-1 overflow-y-auto">
      <!-- 加载状态 -->
      <div v-if="loading && videos.length === 0" class="flex items-center justify-center min-h-full">
        <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- 视频列表 -->
      <div v-else-if="videos.length > 0" class="p-4">
        <VideoGrid 
          :videos="videos"
          :watch-history="watchHistory"
          @video-click="$emit('video-click', $event)"
        />

        <!-- 加载更多 -->
        <div class="flex justify-center py-8">
          <button
            v-if="hasMore"
            :disabled="loading"
            class="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="loadMore"
          >
            {{ loading ? '加载中...' : '加载更多' }}
          </button>
          <p v-else class="text-gray-500 text-sm">没有更多了</p>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex items-center justify-center min-h-full">
        <div class="text-center">
          <svg class="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p class="text-gray-400 mb-4">暂无视频</p>
          <button class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" @click="checkSource">
            检查视频源
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { VideoDetail, VideoCategory } from '@/types';
import { useTv, useWatchHistory } from '@/composables/useTv';
import VideoGrid from './components/VideoGrid.vue';
import { useRouter } from 'vue-router';

const emit = defineEmits<{
  'video-click': [video: VideoDetail];
}>();

const router = useRouter();
const { sources, loadSources, activeSource, loadCategories, categories, getVideoList, loading } = useTv();
const { history: watchHistory, loadHistory } = useWatchHistory();

const videos = ref<VideoDetail[]>([]);
const selectedCategory = ref<VideoCategory | null>(null);
const currentPage = ref(1);
const hasMore = ref(true);

// 加载视频列表
const loadVideos = async (append = false) => {
  if (!activeSource.value) {
    return;
  }

  const response = await getVideoList({
    page: currentPage.value,
    typeId: selectedCategory.value?.type_id,
    limit: 20,
  });

  if (response && response.list) {
    if (append) {
      videos.value = [...videos.value, ...response.list];
    } else {
      videos.value = response.list;
    }
    hasMore.value = currentPage.value < response.pagecount;
  }
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    currentPage.value++;
    loadVideos(true);
  }
};

// 检查视频源
const checkSource = () => {
  router.push('/tv/settings');
};

// 监听分类变化
watch(selectedCategory, () => {
  currentPage.value = 1;
  hasMore.value = true;
  loadVideos(false);
});

onMounted(async () => {
  // 加载视频源
  await loadSources();
  
  console.log('当前视频源:', sources.value);
  console.log('活跃视频源:', activeSource.value);
  
  if (activeSource.value) {
    // 加载分类
    await loadCategories();
    console.log('加载的分类:', categories.value);
    
    // 加载视频列表
    await loadVideos();
    console.log('加载的视频:', videos.value);
    
    // 加载观看历史
    await loadHistory();
  } else {
    console.warn('没有活跃的视频源，请先添加视频源');
  }
});
</script>

<style scoped>
.category-scroll {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}
</style>
