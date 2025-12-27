<template>
  <div class="h-full overflow-y-auto bg-gray-900">
    <div class="max-w-7xl mx-auto p-4">
      <!-- 标题 -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-white mb-2">我的收藏</h2>
        <p class="text-gray-400 text-sm">共 {{ favorites.length }} 个收藏</p>
      </div>

      <!-- 收藏列表 -->
      <div v-if="favorites.length > 0">
        <VideoGrid 
          :videos="favorites"
          @video-click="$emit('video-click', $event)"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-20">
        <Heart class="w-16 h-16 text-gray-600 mb-4" />
        <p class="text-gray-400 text-lg mb-2">还没有收藏</p>
        <p class="text-gray-500 text-sm mb-6">快去收藏喜欢的视频吧</p>
        <button
          class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          @click="$emit('go-home')"
        >
          去首页看看
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import type { VideoDetail } from '@/types';
import { useFavorites } from '@/composables/useTv';
import VideoGrid from './components/VideoGrid.vue';
import { Heart } from 'lucide-vue-next';

defineEmits<{
  'video-click': [video: VideoDetail];
  'go-home': [];
}>();

const { favorites, loadFavorites } = useFavorites();

onMounted(async () => {
  await loadFavorites();
});
</script>

<style scoped>
/* 使用 Tailwind CSS */
</style>
