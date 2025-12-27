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
  const activeSources = ref<VideoSource[]>([]);
  const categories = ref<VideoCategory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 当前 MacCMS 服务实例（主源）
  const macCMSService = computed(() => {
    return activeSource.value ? createMacCMSService(activeSource.value.url) : null;
  });

  // 所有激活源的服务实例
  const macCMSServices = computed(() => {
    return activeSources.value.map(source => ({
      source,
      service: createMacCMSService(source.url)
    }));
  });

  // 加载视频源
  const loadSources = async () => {
    try {
      sources.value = await videoSourceManager.getSources();
      activeSources.value = await videoSourceManager.getActiveSources();
      activeSource.value = activeSources.value[0] || null;
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

  // 加载分类（聚合所有激活源的分类）
  const loadCategories = async () => {
    if (macCMSServices.value.length === 0) return;
    
    try {
      loading.value = true;
      const allCategories: VideoCategory[] = [];
      
      // 并发请求所有激活源的分类
      const promises = macCMSServices.value.map(async ({ service }) => {
        try {
          return await service.getCategories();
        } catch (err) {
          console.error('获取分类失败:', err);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      
      // 合并所有分类
      results.forEach(cats => {
        allCategories.push(...cats);
      });
      
      // 只按分类名称去重（不同源的相同分类可能有不同 type_id）
      const uniqueCategories = allCategories.reduce((acc, category) => {
        const key = category.type_name;
        if (!acc.has(key)) {
          acc.set(key, category);
        }
        return acc;
      }, new Map<string, VideoCategory>());
      
      categories.value = Array.from(uniqueCategories.values());
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

  // 获取所有激活源的视频列表（聚合）
  const getAllVideos = async (params: { page?: number; typeName?: string; limit?: number } = {}) => {
    if (macCMSServices.value.length === 0) return null;
    
    try {
      loading.value = true;
      
      // 并发请求所有激活的源
      const promises = macCMSServices.value.map(async ({ source, service }) => {
        try {
          // 如果有 typeName，需要先获取该源的分类列表，找到对应的 type_id
          let typeId: number | undefined = undefined;
          if (params.typeName) {
            const cats = await service.getCategories();
            console.log(`Categories for source ${source.name}:`, cats);
            const matchedCat = cats.find(c => c.type_name === params.typeName);
            typeId = matchedCat?.type_id;
            // 如果该源没有这个分类，跳过
            if (!typeId) {
              return null;
            }
          }
          
          const result = await service.getVideoList({ 
            page: params.page, 
            typeId,
            limit: params.limit 
          });
          // 为每个视频添加来源信息
          if (result && result.list) {
            result.list = result.list.map(video => ({
              ...video,
              source_name: source.name,
              source_id: source.id,
            }));
          }
          return result;
        } catch (err) {
          console.error(`获取源 ${source.name} 的视频失败:`, err);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      
      // 合并所有视频结果
      const allVideos: VideoDetail[] = [];
      let maxPageCount = 1;
      
      results.forEach(result => {
        if (result && result.list) {
          allVideos.push(...result.list);
          maxPageCount = Math.max(maxPageCount, result.pagecount);
        }
      });
      
      // 返回聚合结果
      return {
        code: 1,
        msg: 'success',
        page: params.page || 1,
        pagecount: maxPageCount,
        limit: params.limit || 20,
        total: allVideos.length,
        list: allVideos,
      };
    } catch (err) {
      error.value = '获取视频列表失败';
      console.error(err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 搜索视频（聚合所有激活源的搜索结果）
  const searchVideos = async (keyword: string, page = 1) => {
    if (macCMSServices.value.length === 0) return null;
    
    try {
      loading.value = true;
      
      // 并发搜索所有激活的源
      const promises = macCMSServices.value.map(async ({ source, service }) => {
        try {
          const result = await service.searchVideos(keyword, page);
          // 为每个视频添加来源信息
          if (result && result.list) {
            result.list = result.list.map(video => ({
              ...video,
              source_name: source.name,
              source_id: source.id,
            }));
          }
          return result;
        } catch (err) {
          console.error(`搜索源 ${source.name} 失败:`, err);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      
      // 合并所有搜索结果
      const allVideos: VideoDetail[] = [];
      let totalCount = 0;
      
      results.forEach(result => {
        if (result && result.list) {
          allVideos.push(...result.list);
          totalCount += result.total;
        }
      });
      
      // 添加搜索历史
      if (allVideos.length > 0) {
        await searchHistoryManager.addHistory(keyword);
      }
      
      // 返回聚合结果
      return {
        code: 1,
        msg: 'success',
        page,
        pagecount: 1, // 聚合搜索只返回一页
        limit: '999',
        total: totalCount,
        list: allVideos,
      };
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
    activeSources,
    categories,
    loading,
    error,
    macCMSService,
    macCMSServices,
    loadSources,
    addSource,
    removeSource,
    setActiveSource,
    loadCategories,
    getVideoList,
    getAllVideos,
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
