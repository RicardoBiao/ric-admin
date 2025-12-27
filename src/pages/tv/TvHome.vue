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
          :key="category.type_name"
          :class="['px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors', selectedCategory?.type_name === category.type_name ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white']"
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
          <svg class="w-16 h-16 text-gray-600 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

defineEmits<{
  'video-click': [video: VideoDetail];
}>();

const router = useRouter();
const { sources, loadSources, activeSource, loadCategories, categories, getAllVideos, loading } = useTv();
const { history: watchHistory, loadHistory } = useWatchHistory();

const videos = ref<VideoDetail[]>([]);
const selectedCategory = ref<VideoCategory | null>(null);
const currentPage = ref(1);
const hasMore = ref(true);

// 加载视频列表（聚合所有激活源）
const loadVideos = async (append = false) => {
  const response = await getAllVideos({
    page: currentPage.value,
    typeName: selectedCategory.value?.type_name,
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

// 刷新首页（供父组件调用）
const refreshHome = async () => {
  console.log('刷新首页...');
  currentPage.value = 1;
  hasMore.value = true;
  videos.value = [];
  selectedCategory.value = null;
  
  // 重新加载数据
  await loadSources();
  if (activeSource.value) {
    await loadCategories();
    await loadVideos();
    await loadHistory();
  }
};

defineExpose({
  refreshHome
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
