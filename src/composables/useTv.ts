import { ref, computed } from 'vue';
import type { VideoSource, VideoDetail, VideoCategory, PlaySource, WatchHistory } from '@/types';
import { 
  videoSourceManager, 
  favoritesManager, 
  searchHistoryManager,
  watchHistoryManager 
} from '@/core/utils/storage';
import { createMacCMSService, MacCMSService } from '@/services/maccms';

export function useTv() {
  const sources = ref<VideoSource[]>([]);
  const activeSource = ref<VideoSource | null>(null);
  const categories = ref<VideoCategory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 当前 MacCMS 服务实例
  const macCMSService = computed(() => {
    return activeSource.value ? createMacCMSService(activeSource.value.url) : null;
  });

  // 加载视频源
  const loadSources = async () => {
    try {
      sources.value = await videoSourceManager.getSources();
      activeSource.value = await videoSourceManager.getActiveSource();
    } catch (err) {
      error.value = '加载视频源失败';
      console.error(err);
    }
  };

  // 添加视频源
  const addSource = async (name: string, url: string) => {
    try {
      const newSource = await videoSourceManager.addSource({
        name,
        url,
        isActive: sources.value.length === 0,
      });
      await loadSources();
      return newSource;
    } catch (err) {
      error.value = '添加视频源失败';
      console.error(err);
      throw err;
    }
  };

  // 删除视频源
  const removeSource = async (id: string) => {
    try {
      await videoSourceManager.removeSource(id);
      await loadSources();
    } catch (err) {
      error.value = '删除视频源失败';
      console.error(err);
    }
  };

  // 设置活跃视频源
  const setActiveSource = async (id: string) => {
    try {
      await videoSourceManager.setActiveSource(id);
      await loadSources();
    } catch (err) {
      error.value = '切换视频源失败';
      console.error(err);
    }
  };

  // 加载分类
  const loadCategories = async () => {
    if (!macCMSService.value) return;
    
    try {
      loading.value = true;
      const allCategories = await macCMSService.value.getCategories();
      
      // 根据 type_id 去重
      const uniqueCategories = allCategories.filter((category, index, self) => 
        index === self.findIndex(c => c.type_id === category.type_id)
      );
      
      categories.value = uniqueCategories;
    } catch (err) {
      error.value = '加载分类失败';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // 获取视频列表
  const getVideoList = async (params: { page?: number; typeId?: number; limit?: number } = {}) => {
    if (!macCMSService.value) return null;
    
    try {
      loading.value = true;
      return await macCMSService.value.getVideoList(params);
    } catch (err) {
      error.value = '获取视频列表失败';
      console.error(err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 搜索视频
  const searchVideos = async (keyword: string, page = 1) => {
    if (!macCMSService.value) return null;
    
    try {
      loading.value = true;
      const result = await macCMSService.value.searchVideos(keyword, page);
      if (result && result.list.length > 0) {
        await searchHistoryManager.addHistory(keyword);
      }
      return result;
    } catch (err) {
      error.value = '搜索视频失败';
      console.error(err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 获取视频详情
  const getVideoDetail = async (vodId: number) => {
    if (!macCMSService.value) {
      console.error('没有活跃的视频源');
      error.value = '请先添加视频源';
      return null;
    }
    
    try {
      loading.value = true;
      console.log('调用 MacCMS API 获取视频详情，vodId:', vodId);
      const result = await macCMSService.value.getVideoDetail(vodId);
      console.log('MacCMS API 返回结果:', result);
      return result;
    } catch (err) {
      error.value = '获取视频详情失败';
      console.error('获取视频详情错误:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 解析播放源
  const parsePlaySources = (video: VideoDetail): PlaySource[] => {
    return MacCMSService.parsePlaySources(video);
  };

  return {
    sources,
    activeSource,
    categories,
    loading,
    error,
    macCMSService,
    loadSources,
    addSource,
    removeSource,
    setActiveSource,
    loadCategories,
    getVideoList,
    searchVideos,
    getVideoDetail,
    parsePlaySources,
  };
}

// 收藏相关
export function useFavorites() {
  const favorites = ref<any[]>([]);
  const loading = ref(false);

  const loadFavorites = async () => {
    try {
      loading.value = true;
      favorites.value = await favoritesManager.getFavorites();
    } catch (err) {
      console.error('加载收藏失败:', err);
    } finally {
      loading.value = false;
    }
  };

  const addFavorite = async (video: any) => {
    try {
      await favoritesManager.addFavorite(video);
      await loadFavorites();
    } catch (err) {
      console.error('添加收藏失败:', err);
    }
  };

  const removeFavorite = async (vodId: number) => {
    try {
      await favoritesManager.removeFavorite(vodId);
      await loadFavorites();
    } catch (err) {
      console.error('删除收藏失败:', err);
    }
  };

  const isFavorite = async (vodId: number) => {
    return await favoritesManager.isFavorite(vodId);
  };

  return {
    favorites,
    loading,
    loadFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}

// 观看历史相关
export function useWatchHistory() {
  const history = ref<WatchHistory[]>([]);
  const loading = ref(false);

  const loadHistory = async () => {
    try {
      loading.value = true;
      history.value = await watchHistoryManager.getHistory();
    } catch (err) {
      console.error('加载观看历史失败:', err);
    } finally {
      loading.value = false;
    }
  };

  const addHistory = async (item: Omit<WatchHistory, 'watchTime'>) => {
    try {
      await watchHistoryManager.addHistory(item);
      await loadHistory();
    } catch (err) {
      console.error('添加观看历史失败:', err);
    }
  };

  const removeHistory = async (vodId: number) => {
    try {
      await watchHistoryManager.removeHistory(vodId);
      await loadHistory();
    } catch (err) {
      console.error('删除观看历史失败:', err);
    }
  };

  const clearHistory = async () => {
    try {
      await watchHistoryManager.clearHistory();
      await loadHistory();
    } catch (err) {
      console.error('清空观看历史失败:', err);
    }
  };

  const updateProgress = async (vodId: number, progress: number, duration: number) => {
    try {
      await watchHistoryManager.updateProgress(vodId, progress, duration);
      await loadHistory();
    } catch (err) {
      console.error('更新播放进度失败:', err);
    }
  };

  const getProgress = async (vodId: number) => {
    return await watchHistoryManager.getProgress(vodId);
  };

  return {
    history,
    loading,
    loadHistory,
    addHistory,
    removeHistory,
    clearHistory,
    updateProgress,
    getProgress,
  };
}
