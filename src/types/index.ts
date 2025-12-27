// 视频源类型
export interface VideoSource {
  id: string;
  name: string;
  url: string;
}

// MacCMS API 响应类型
export interface MacCMSResponse<T> {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: string;
  total: number;
  list: T[];
  class?: VideoCategory[]; // ?ac=list 接口返回的分类列表
}

// 视频分类类型
export interface VideoCategory {
  type_id: number;
  type_name: string;
  type_pid: number;
}

// 视频详情类型
export interface VideoDetail {
  vod_id: number;
  vod_name: string;
  type_id: number;
  type_name: string;
  vod_en: string;
  vod_time: string;
  vod_remarks: string;
  vod_play_from: string;
  vod_play_server: string;
  vod_play_note: string;
  vod_play_url: string;
  vod_pic: string;
  // 聚合搜索时的来源信息（可选）
  source_name?: string;
  source_id?: string;
  vod_pic_thumb: string;
  vod_pic_slide: string;
  vod_pic_screenshot: string;
  vod_actor: string;
  vod_director: string;
  vod_writer: string;
  vod_behind: string;
  vod_blurb: string;
  vod_remarks_more?: string;
  vod_pubdate: string;
  vod_total: number;
  vod_serial: string;
  vod_tv: string;
  vod_weekday: string;
  vod_area: string;
  vod_lang: string;
  vod_year: string;
  vod_version: string;
  vod_state: string;
  vod_author: string;
  vod_jumpurl: string;
  vod_tpl: string;
  vod_tpl_play: string;
  vod_tpl_down: string;
  vod_isend: number;
  vod_lock: number;
  vod_level: number;
  vod_copyright: number;
  vod_points: number;
  vod_points_play: number;
  vod_points_down: number;
  vod_hits: number;
  vod_hits_day: number;
  vod_hits_week: number;
  vod_hits_month: number;
  vod_duration: string;
  vod_up: number;
  vod_down: number;
  vod_score: string;
  vod_score_all: number;
  vod_score_num: number;
  vod_time_add: number;
  vod_time_hits: number;
  vod_time_make: number;
  vod_trysee: number;
  vod_douban_id: number;
  vod_douban_score: string;
  vod_reurl: string;
  vod_rel_vod: string;
  vod_rel_art: string;
  vod_pwd: string;
  vod_pwd_url: string;
  vod_pwd_play: string;
  vod_pwd_play_url: string;
  vod_pwd_down: string;
  vod_pwd_down_url: string;
  vod_content: string;
  vod_status: number;
  vod_class: string;
  vod_tag: string;
  vod_letter: string;
  vod_color: string;
  vod_notify: string;
  vod_notify_mtime: string;
}

// 播放集数类型
export interface PlayEpisode {
  name: string;
  url: string;
}

// 播放源类型
export interface PlaySource {
  source: string;
  episodes: PlayEpisode[];
}

// 收藏视频类型
export interface FavoriteVideo {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  type_name: string;
  addTime: number;
}

// 缓存数据类型
export interface CacheData<T = any> {
  data: T;
  timestamp: number;
  size: number;
}

// 搜索历史类型
export interface SearchHistory {
  keyword: string;
  timestamp: number;
}

// 观看历史类型
export interface WatchHistory {
  vod_id: number;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  type_name: string;
  watchTime: number;
  episodeName?: string;
  episodeIndex?: number;
  sourceIndex?: number;
  progress?: number; // 播放进度（秒）
  duration?: number; // 视频总时长（秒）
  progressPercent?: number; // 播放进度百分比
}

// 导入的视频源 JSON 格式
export interface ImportedSourceConfig {
  cache_time?: number;
  api_site: {
    [key: string]: {
      name: string;
      api: string;
      detail: string;
    };
  };
}

