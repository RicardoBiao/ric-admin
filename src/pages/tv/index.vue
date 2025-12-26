<template>
  <div class="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
    <!-- 顶部导航 (仅PC端) -->
    <div class="hidden md:block">
      <TvTabs 
        :tabs="tabs"
        :active-tab="activeTab"
        @update:active-tab="activeTab = $event"
      />
    </div>

    <!-- 页面内容 (可滚动) -->
    <div class="flex-1 overflow-hidden">
      <!-- 首页 -->
      <div v-show="activeTab === 'home'" class="h-full">
        <TvHome @video-click="showVideoDetail" />
      </div>

      <!-- 搜索 -->
      <div v-show="activeTab === 'search'" class="h-full">
        <TvSearch @video-click="showVideoDetail" />
      </div>

      <!-- 我的 -->
      <div v-show="activeTab === 'mine'" class="h-full">
        <TvMine @video-click="showVideoDetail" />
      </div>
    </div>

    <!-- 底部导航 (仅移动端) -->
    <div class="md:hidden">
      <TvTabs 
        :tabs="tabs"
        :active-tab="activeTab"
        @update:active-tab="activeTab = $event"
      />
    </div>

    <!-- 视频详情弹窗/页面 -->
    <transition name="slide-up">
      <div v-if="selectedVideo" class="fixed inset-0 z-50 bg-gray-900 overflow-y-auto">
        <TvVideoDetail 
          :vod-id="selectedVideo.vod_id"
          @back="selectedVideo = null"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import type { VideoDetail } from '@/types';
import TvTabs from './components/TvTabs.vue';
import TvVideoDetail from './components/VideoDetail.vue';
import TvHome from './TvHome.vue';
import TvSearch from './TvSearch.vue';
import TvMine from './TvMine.vue';

// 图标组件 (使用简单的 SVG)
const HomeIcon = () => h('svg', { class: 'w-6 h-6', fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { d: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' })
]);

const SearchIcon = () => h('svg', { class: 'w-6 h-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
  h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' })
]);

const UserIcon = () => h('svg', { class: 'w-6 h-6', fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z', 'clip-rule': 'evenodd' })
]);

const tabs = [
  { value: 'home', label: '首页', icon: HomeIcon },
  { value: 'search', label: '搜索', icon: SearchIcon },
  { value: 'mine', label: '我的', icon: UserIcon },
];

const activeTab = ref('home');
const selectedVideo = ref<VideoDetail | null>(null);

const showVideoDetail = (video: VideoDetail) => {
  console.log('显示视频详情:', video);
  console.log('视频ID:', video.vod_id);
  selectedVideo.value = video;
};

onMounted(() => {
  // 初始化时可以做一些操作，比如检查视频源等
});
</script>

<style scoped>
/* 过渡动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s;
}

.slide-up-enter-from {
  transform: translateY(100%);
}

.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
