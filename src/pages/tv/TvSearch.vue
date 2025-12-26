<template>
  <div class="h-full overflow-y-auto p-4">
    <!-- 搜索框 -->
    <div class="flex gap-2 mb-6">
      <div class="flex-1 relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索视频..."
          class="w-full pl-10 pr-10 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          @keyup.enter="startSearch"
        />
        <button
          v-if="keyword"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
          @click="keyword = ''"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      <button
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        :disabled="!keyword.trim() || loading"
        @click="startSearch"
      >
        搜索
      </button>
    </div>

    <!-- 搜索历史 -->
    <div v-if="!hasSearched && searchHistory.length > 0" class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-white font-medium">搜索历史</h3>
        <button class="text-gray-400 text-sm hover:text-white" @click="clearHistory">
          清空
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in searchHistory"
          :key="item.keyword"
          class="px-4 py-2 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors"
          @click="selectHistory(item.keyword)"
        >
          {{ item.keyword }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="hasSearched" class="min-h-screen">
      <div v-if="videos.length > 0" class="space-y-4">
        <p class="text-gray-400 text-sm mb-4">
          找到 {{ totalCount }} 个结果
        </p>
        <VideoGrid 
          :videos="videos"
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

      <!-- 无结果 -->
      <div v-else class="flex flex-col items-center justify-center py-20">
        <Frown class="w-16 h-16 text-gray-600 mb-4" />
        <p class="text-gray-400">未找到相关视频</p>
      </div>
    </div>

    <!-- 默认状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <Search class="w-20 h-20 text-gray-600 mb-4" />
      <p class="text-gray-400">输入关键词搜索视频</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { VideoDetail, SearchHistory } from '@/types';
import { useTv } from '@/composables/useTv';
import { searchHistoryManager } from '@/core/utils/storage';
import VideoGrid from './components/VideoGrid.vue';
import { Search, X, Frown } from 'lucide-vue-next';

const emit = defineEmits<{
  'video-click': [video: VideoDetail];
}>();

const { searchVideos, loading, loadSources, activeSource } = useTv();

const keyword = ref('');
const videos = ref<VideoDetail[]>([]);
const searchHistory = ref<SearchHistory[]>([]);
const hasSearched = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);
const totalCount = ref(0);

// 开始新搜索
const startSearch = async () => {
  if (!keyword.value.trim()) return;
  
  // 检查是否有活跃的视频源
  if (!activeSource.value) {
    console.warn('没有活跃的视频源，请先添加视频源');
    return;
  }
  
  console.log('开始搜索:', keyword.value);
  currentPage.value = 1;
  videos.value = [];
  hasSearched.value = true;
  
  await handleSearch();
};

// 执行搜索
const handleSearch = async (append = false): Promise<void> => {
  if (!keyword.value.trim()) return;

  console.log('调用 searchVideos API, 关键词:', keyword.value, '页码:', currentPage.value);
  
  try {
    const response = await searchVideos(keyword.value, currentPage.value);
    console.log('搜索结果:', response);
    
    if (response) {
      if (append) {
        videos.value = [...videos.value, ...response.list];
      } else {
        videos.value = response.list;
      }
      totalCount.value = response.total;
      hasMore.value = currentPage.value < response.pagecount;
      
      // 刷新搜索历史
      await loadSearchHistory();
    }
  } catch (err) {
    console.error('搜索失败:', err);
  }
};

// 加载更多
const loadMore = async () => {
  if (hasMore.value && !loading.value) {
    currentPage.value++;
    await handleSearch(true);
  }
};

// 选择历史记录
const selectHistory = (historyKeyword: string) => {
  keyword.value = historyKeyword;
  startSearch();
};

// 加载搜索历史
const loadSearchHistory = async () => {
  searchHistory.value = await searchHistoryManager.getHistory();
};

// 清空搜索历史
const clearHistory = async () => {
  await searchHistoryManager.clearHistory();
  searchHistory.value = [];
};

onMounted(async () => {
  // 加载视频源
  await loadSources();
  console.log('TvSearch - 活跃视频源:', activeSource.value);
  
  // 加载搜索历史
  await loadSearchHistory();
});
</script>

<style scoped>
/* 无需额外样式，使用 Tailwind 类 */
</style>
