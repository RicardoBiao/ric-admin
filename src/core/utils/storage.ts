import type { CacheData, VideoSource, FavoriteVideo, SearchHistory, WatchHistory } from '@/types';

// Storage keys 常量
export const STORAGE_KEYS = {
  VIDEO_SOURCES: 'tv_video_sources',
  FAVORITES: 'tv_favorites',
  SEARCH_HISTORY: 'tv_search_history',
  WATCH_HISTORY: 'tv_watch_history',
  CACHE_PREFIX: 'tv_cache_',
  CACHE_SIZE: 'tv_cache_size',
  CACHE_INDEX: 'tv_cache_index',
} as const;

// Cache 配置常量
export const CACHE_CONFIG = {
  MAX_SIZE: 20 * 1024 * 1024, // 20MB
  CACHE_EXPIRE_TIME: 24 * 60 * 60 * 1000, // 24小时
} as const;

// 通用存储操作
export const storage = {
  // 保存数据
  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  },

  // 读取数据
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = localStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  // 删除数据
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  },

  // 清空所有数据
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  },

  // 获取所有键
  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },
};

// 缓存管理
export const cacheManager = {
  // 获取缓存大小信息
  async getCacheSize(): Promise<number> {
    const size = await storage.get<number>(STORAGE_KEYS.CACHE_SIZE);
    return size || 0;
  },

  // 更新缓存大小
  async updateCacheSize(size: number): Promise<void> {
    await storage.set(STORAGE_KEYS.CACHE_SIZE, size);
  },

  // 获取缓存索引
  async getCacheIndex(): Promise<string[]> {
    const index = await storage.get<string[]>(STORAGE_KEYS.CACHE_INDEX);
    return index || [];
  },

  // 更新缓存索引
  async updateCacheIndex(index: string[]): Promise<void> {
    await storage.set(STORAGE_KEYS.CACHE_INDEX, index);
  },

  // 设置缓存
  async setCache<T>(key: string, data: T): Promise<void> {
    try {
      const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
      const dataStr = JSON.stringify(data);
      const size = new Blob([dataStr]).size;

      const cacheData: CacheData<T> = {
        data,
        timestamp: Date.now(),
        size,
      };

      // 检查缓存大小
      const currentSize = await this.getCacheSize();
      const newSize = currentSize + size;

      // 如果超过最大缓存大小,清理旧缓存
      if (newSize > CACHE_CONFIG.MAX_SIZE) {
        await this.clearOldCache(size);
      }

      // 保存缓存数据
      await storage.set(cacheKey, cacheData);

      // 更新缓存索引
      const index = await this.getCacheIndex();
      if (!index.includes(cacheKey)) {
        index.push(cacheKey);
        await this.updateCacheIndex(index);
      }

      // 更新缓存大小
      const finalSize = await this.getCacheSize();
      await this.updateCacheSize(finalSize + size);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  // 获取缓存
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
      const cacheData = await storage.get<CacheData<T>>(cacheKey);

      if (!cacheData) {
        return null;
      }

      // 检查缓存是否过期
      const isExpired = Date.now() - cacheData.timestamp > CACHE_CONFIG.CACHE_EXPIRE_TIME;
      if (isExpired) {
        await this.removeCache(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // 删除缓存
  async removeCache(key: string): Promise<void> {
    try {
      const cacheKey = STORAGE_KEYS.CACHE_PREFIX + key;
      const cacheData = await storage.get<CacheData>(cacheKey);

      if (cacheData) {
        await storage.remove(cacheKey);

        // 更新索引
        const index = await this.getCacheIndex();
        const newIndex = index.filter(k => k !== cacheKey);
        await this.updateCacheIndex(newIndex);

        // 更新大小
        const currentSize = await this.getCacheSize();
        await this.updateCacheSize(Math.max(0, currentSize - cacheData.size));
      }
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  // 清理旧缓存
  async clearOldCache(requiredSize: number): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      let currentSize = await this.getCacheSize();

      // 按时间排序,删除最旧的缓存
      const cacheItems: Array<{ key: string; timestamp: number; size: number }> = [];

      for (const key of index) {
        const cacheData = await storage.get<CacheData>(key);
        if (cacheData) {
          cacheItems.push({
            key,
            timestamp: cacheData.timestamp,
            size: cacheData.size,
          });
        }
      }

      // 按时间戳升序排序
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);

      // 删除旧缓存直到有足够空间
      for (const item of cacheItems) {
        if (currentSize + requiredSize <= CACHE_CONFIG.MAX_SIZE) {
          break;
        }

        await storage.remove(item.key);
        currentSize -= item.size;
      }

      // 更新索引和大小
      const remainingKeys = cacheItems
        .filter(item => currentSize + requiredSize > CACHE_CONFIG.MAX_SIZE || item.timestamp > Date.now() - CACHE_CONFIG.CACHE_EXPIRE_TIME)
        .map(item => item.key);

      await this.updateCacheIndex(remainingKeys);
      await this.updateCacheSize(currentSize);
    } catch (error) {
      console.error('Clear old cache error:', error);
    }
  },

  // 清空所有缓存
  async clearAllCache(): Promise<void> {
    try {
      const index = await this.getCacheIndex();
      for (const key of index) {
        await storage.remove(key);
      }
      await this.updateCacheIndex([]);
      await this.updateCacheSize(0);
    } catch (error) {
      console.error('Clear all cache error:', error);
    }
  },
};

// 视频源管理
export const videoSourceManager = {
  // 获取所有视频源
  async getSources(): Promise<VideoSource[]> {
    const sources = await storage.get<VideoSource[]>(STORAGE_KEYS.VIDEO_SOURCES);
    return sources || [];
  },

  // 保存视频源
  async saveSources(sources: VideoSource[]): Promise<void> {
    await storage.set(STORAGE_KEYS.VIDEO_SOURCES, sources);
  },

  // 添加视频源
  async addSource(source: Omit<VideoSource, 'id'>): Promise<VideoSource> {
    const sources = await this.getSources();
    // 使用时间戳 + 随机数确保唯一性，避免批量添加时 ID 重复
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSource: VideoSource = {
      ...source,
      id: uniqueId,
    };
    sources.push(newSource);
    await this.saveSources(sources);
    return newSource;
  },

  // 删除视频源
  async removeSource(id: string): Promise<void> {
    const sources = await this.getSources();
    const newSources = sources.filter(s => s.id !== id);
    await this.saveSources(newSources);
  },

  // 更新视频源
  async updateSource(id: string, updates: Partial<VideoSource>): Promise<void> {
    const sources = await this.getSources();
    const index = sources.findIndex(s => s.id === id);
    if (index !== -1) {
      sources[index] = { ...sources[index], ...updates };
      await this.saveSources(sources);
    }
  },

  // 获取活跃的视频源
  async getActiveSource(): Promise<VideoSource | null> {
    const sources = await this.getSources();
    return sources.find(s => s.isActive) || sources[0] || null;
  },

  // 设置活跃视频源
  async setActiveSource(id: string): Promise<void> {
    const sources = await this.getSources();
    const newSources = sources.map(s => ({
      ...s,
      isActive: s.id === id,
    }));
    await this.saveSources(newSources);
  },
};

// 收藏管理
export const favoritesManager = {
  // 获取收藏列表
  async getFavorites(): Promise<FavoriteVideo[]> {
    const favorites = await storage.get<FavoriteVideo[]>(STORAGE_KEYS.FAVORITES);
    return favorites || [];
  },

  // 保存收藏列表
  async saveFavorites(favorites: FavoriteVideo[]): Promise<void> {
    await storage.set(STORAGE_KEYS.FAVORITES, favorites);
  },

  // 添加收藏
  async addFavorite(video: Omit<FavoriteVideo, 'addTime'>): Promise<void> {
    const favorites = await this.getFavorites();
    
    // 检查是否已收藏
    if (favorites.some(f => f.vod_id === video.vod_id)) {
      return;
    }

    const newFavorite: FavoriteVideo = {
      ...video,
      addTime: Date.now(),
    };

    favorites.unshift(newFavorite);
    await this.saveFavorites(favorites);
  },

  // 删除收藏
  async removeFavorite(vodId: number): Promise<void> {
    const favorites = await this.getFavorites();
    const newFavorites = favorites.filter(f => f.vod_id !== vodId);
    await this.saveFavorites(newFavorites);
  },

  // 检查是否已收藏
  async isFavorite(vodId: number): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(f => f.vod_id === vodId);
  },

  // 清空收藏
  async clearFavorites(): Promise<void> {
    await storage.set(STORAGE_KEYS.FAVORITES, []);
  },
};

// 搜索历史管理
export const searchHistoryManager = {
  // 获取搜索历史
  async getHistory(): Promise<SearchHistory[]> {
    const history = await storage.get<SearchHistory[]>(STORAGE_KEYS.SEARCH_HISTORY);
    return history || [];
  },

  // 保存搜索历史
  async saveHistory(history: SearchHistory[]): Promise<void> {
    await storage.set(STORAGE_KEYS.SEARCH_HISTORY, history);
  },

  // 添加搜索记录
  async addHistory(keyword: string): Promise<void> {
    if (!keyword.trim()) return;

    const history = await this.getHistory();
    
    // 删除重复项
    const newHistory = history.filter(h => h.keyword !== keyword);
    
    // 添加新记录
    newHistory.unshift({
      keyword,
      timestamp: Date.now(),
    });

    // 只保留最近20条
    const limitedHistory = newHistory.slice(0, 20);
    await this.saveHistory(limitedHistory);
  },

  // 删除搜索记录
  async removeHistory(keyword: string): Promise<void> {
    const history = await this.getHistory();
    const newHistory = history.filter(h => h.keyword !== keyword);
    await this.saveHistory(newHistory);
  },

  // 清空搜索历史
  async clearHistory(): Promise<void> {
    await storage.set(STORAGE_KEYS.SEARCH_HISTORY, []);
  },
};

// 观看历史管理
export const watchHistoryManager = {
  // 获取观看历史
  async getHistory(): Promise<WatchHistory[]> {
    const history = await storage.get<WatchHistory[]>(STORAGE_KEYS.WATCH_HISTORY);
    return history || [];
  },

  // 保存观看历史
  async saveHistory(history: WatchHistory[]): Promise<void> {
    await storage.set(STORAGE_KEYS.WATCH_HISTORY, history);
  },

  // 添加观看记录
  async addHistory(item: Omit<WatchHistory, 'watchTime'>): Promise<void> {
    const history = await this.getHistory();
    
    // 删除相同视频的旧记录
    const newHistory = history.filter(h => h.vod_id !== item.vod_id);
    
    // 添加新记录到开头
    newHistory.unshift({
      ...item,
      watchTime: Date.now(),
    });

    // 只保留最近50条
    const limitedHistory = newHistory.slice(0, 50);
    await this.saveHistory(limitedHistory);
  },

  // 删除观看记录
  async removeHistory(vodId: number): Promise<void> {
    const history = await this.getHistory();
    const newHistory = history.filter(h => h.vod_id !== vodId);
    await this.saveHistory(newHistory);
  },

  // 清空观看历史
  async clearHistory(): Promise<void> {
    await storage.set(STORAGE_KEYS.WATCH_HISTORY, []);
  },

  // 更新观看进度
  async updateProgress(vodId: number, progress: number, duration: number): Promise<void> {
    const history = await this.getHistory();
    const index = history.findIndex(h => h.vod_id === vodId);
    
    if (index !== -1) {
      const progressPercent = duration > 0 ? Math.round((progress / duration) * 100) : 0;
      history[index] = {
        ...history[index],
        progress,
        duration,
        progressPercent,
        watchTime: Date.now(), // 更新观看时间
      };
      await this.saveHistory(history);
    }
  },

  // 获取某个视频的观看进度
  async getProgress(vodId: number): Promise<WatchHistory | null> {
    const history = await this.getHistory();
    return history.find(h => h.vod_id === vodId) || null;
  },
};

