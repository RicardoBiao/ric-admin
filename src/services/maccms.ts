import type { MacCMSResponse, VideoDetail, VideoCategory, PlaySource, PlayEpisode } from '../types';
import { cacheManager } from '../core/utils/storage';
import axios from 'axios';

export class MacCMSService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  // 通用请求方法
  private async request<T>(endpoint: string, useCache = true, silent = false): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `api_${url}`;

    // 尝试从缓存获取
    if (useCache) {
      const cachedData = await cacheManager.getCache<T>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const response = await axios.get<T>(url, {
        timeout: 10000, // 10秒超时
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('MacCMS API response:', response);

      const data = response.data;

      // 保存到缓存
      if (useCache) {
        await cacheManager.setCache(cacheKey, data);
      }

      return data;
    } catch (error) {
      // 静默模式下不打印错误（用于并发搜索场景）
      if (!silent) {
        console.error('MacCMS API request error:', error);
      }
      throw error;
    }
  }

  // 获取分类列表
  async getCategories(): Promise<VideoCategory[]> {
    try {
      const response = await this.request<MacCMSResponse<VideoDetail>>(
        '?ac=list',
        true,
        false // 静默模式，不打印错误
      );
      // 从 class 字段获取分类列表
      console.log('Categories response:', response);
      return response.class || [];
    } catch (error) {
      // 静默失败，返回空数组，不抛出错误
      return [];
    }
  }

  // 获取视频列表
  async getVideoList(params: {
    page?: number;
    typeId?: number;
    limit?: number;
  } = {}): Promise<MacCMSResponse<VideoDetail>> {
    const { page = 1, typeId } = params;
    let endpoint = `?ac=detail&pg=${page}`;
    
    if (typeId) {
      endpoint += `&t=${typeId}`;
    }

    try {
      const response = await this.request<MacCMSResponse<VideoDetail>>(
        endpoint,
        true,
        true // 静默模式
      );
      return response;
    } catch (error) {
      // 静默失败
      return {
        code: -1,
        msg: 'Error',
        page: 1,
        pagecount: 0,
        limit: '20',
        total: 0,
        list: [],
      };
    }
  }

  // 搜索视频
  async searchVideos(keyword: string, page = 1, silent = false): Promise<MacCMSResponse<VideoDetail>> {
    if (!keyword.trim()) {
      return {
        code: -1,
        msg: 'Empty keyword',
        page: 1,
        pagecount: 0,
        limit: '20',
        total: 0,
        list: [],
      };
    }

    const endpoint = `?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`;

    try {
      const response = await this.request<MacCMSResponse<VideoDetail>>(endpoint, false, true);
      // 确保 list 存在
      if (!response.list) {
        response.list = [];
      }
      return response;
    } catch (error) {
      // 静默失败
      return {
        code: -1,
        msg: 'Error',
        page: 1,
        pagecount: 0,
        limit: '20',
        total: 0,
        list: [],
      };
    }
  }

  // 获取视频详情
  async getVideoDetail(vodId: number): Promise<VideoDetail | null> {
    const endpoint = `?ac=detail&ids=${vodId}`;

    try {
      const response = await this.request<MacCMSResponse<VideoDetail>>(endpoint);
      return response.list[0] || null;
    } catch (error) {
      console.error('Get video detail error:', error);
      return null;
    }
  }

  // 解析播放源
  static parsePlaySources(video: VideoDetail): PlaySource[] {
    try {
      const playFromArr = video.vod_play_from.split('$$$');
      const playUrlArr = video.vod_play_url.split('$$$');

      const sources: PlaySource[] = [];

      for (let i = 0; i < playFromArr.length; i++) {
        const source = playFromArr[i];
        const urlStr = playUrlArr[i] || '';
        
        if (!urlStr) continue;

        const episodes: PlayEpisode[] = [];
        const episodeArr = urlStr.split('#');

        for (const episode of episodeArr) {
          const [name, url] = episode.split('$');
          if (name && url) {
            episodes.push({ name, url });
          }
        }

        if (episodes.length > 0) {
          sources.push({
            source,
            episodes,
          });
        }
      }

      return sources;
    } catch (error) {
      console.error('Parse play sources error:', error);
      return [];
    }
  }

  // 获取最新更新
  async getLatestVideos(page = 1): Promise<MacCMSResponse<VideoDetail>> {
    return this.getVideoList({ page });
  }

  // 获取推荐视频
  async getRecommendedVideos(): Promise<VideoDetail[]> {
    try {
      const response = await this.getVideoList({ page: 1, limit: 10 });
      return response.list;
    } catch (error) {
      console.error('Get recommended videos error:', error);
      return [];
    }
  }

  // 按分类获取视频
  async getVideosByCategory(typeId: number, page = 1): Promise<MacCMSResponse<VideoDetail>> {
    return this.getVideoList({ typeId, page });
  }

  // 检查视频源是否可用
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await axios.head(this.baseUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error('Check availability error:', error);
      return false;
    }
  }
}

// 创建 MacCMS 服务实例
export const createMacCMSService = (baseUrl: string): MacCMSService => {
  return new MacCMSService(baseUrl);
};

