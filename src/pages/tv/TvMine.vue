<template>
  <div class="h-full overflow-y-auto bg-gray-900">
    <div class="max-w-4xl mx-auto">
      <!-- 视频源管理 -->
      <div class="p-4">
        <div class="flex items-center justify-between mb-4">
          <button
            class="flex items-center gap-2 hover:opacity-80 transition-opacity"
            @click="sourcesExpanded = !sourcesExpanded"
          >
            <h3 class="text-lg font-semibold text-white">
              视频源 ({{ sources.length }})
            </h3>
            <ChevronDown
              :class="['w-5 h-5 text-gray-400 transition-transform', sourcesExpanded ? 'rotate-180' : '']"
            />
          </button>
          <div class="flex items-center gap-2">
            <button
              v-if="sources.length > 0"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm hover:bg-red-500/20 transition-colors font-medium"
              @click="clearAllSources"
            >
              <Trash2 class="w-4 h-4" />
              <span>清空</span>
            </button>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-sm hover:bg-blue-500/20 transition-colors font-medium"
              @click="showImportModal = true"
            >
              <Download class="w-4 h-4" />
              <span>导入</span>
            </button>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-sm hover:bg-blue-500/20 transition-colors font-medium"
              @click="showAddSourceModal = true"
            >
              <Plus class="w-4 h-4" />
              <span>添加</span>
            </button>
          </div>
        </div>

        <div v-show="sourcesExpanded">
          <div v-if="sources.length > 0" class="space-y-2">
            <div
              v-for="source in sources"
              :key="source.id"
              class="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0">
                  <h4 class="text-white font-medium mb-1">{{ source.name }}</h4>
                  <p class="text-xs text-gray-400 truncate">{{ source.url }}</p>
                </div>
                <span
                  v-if="source.isActive"
                  class="ml-2 px-2.5 py-1 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1 font-medium"
                >
                  <Check class="w-3 h-3" />
                  使用中
                </span>
              </div>
              <div class="flex gap-2">
                <button
                  v-if="!source.isActive"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors font-medium"
                  @click="switchSource(source.id)"
                >
                  <RefreshCw class="w-4 h-4" />
                  <span>切换</span>
                </button>
                <button
                  v-else
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700 text-gray-400 text-sm rounded-lg cursor-not-allowed font-medium"
                  disabled
                >
                  <Check class="w-4 h-4" />
                  <span>当前源</span>
                </button>
                <button
                  class="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700 border border-gray-600 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                  @click="editSource(source)"
                  title="编辑"
                >
                  <Edit class="w-4 h-4" />
                  <span>编辑</span>
                </button>
                <button
                  class="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                  @click="deleteSource(source.id)"
                  title="删除"
                >
                  <Trash2 class="w-4 h-4" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>
          <div v-else class="py-8 text-center">
            <p class="text-gray-400 text-sm">暂无视频源，请点击右上角添加</p>
          </div>
        </div>
      </div>

      <!-- 观看历史 -->
      <div class="p-4 pt-0">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">观看历史</h3>
          <div class="flex items-center gap-3">
            <button
              v-if="history.length > 0"
              class="text-blue-500 text-sm hover:text-blue-400"
            >
              查看全部
            </button>
            <button
              v-if="history.length > 0"
              class="text-gray-400 text-sm hover:text-gray-300"
              @click="clearAllHistory"
            >
              清空
            </button>
          </div>
        </div>

        <div v-if="history.length > 0" class="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          <div
            v-for="item in history.slice(0, 10)"
            :key="item.vod_id"
            class="flex-shrink-0 w-28 cursor-pointer"
            @click="$emit('video-click', item)"
          >
            <div class="relative rounded-lg overflow-hidden bg-gray-800 aspect-[3/4]">
              <img
                :src="item.vod_pic"
                :alt="item.vod_name"
                class="w-full h-full object-cover"
              />
              <div
                v-if="item.progressPercent"
                class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700"
              >
                <div
                  class="h-full bg-blue-600"
                  :style="{ width: `${item.progressPercent}%` }"
                ></div>
              </div>
            </div>
            <div class="mt-2">
              <h4 class="text-white text-xs font-medium line-clamp-2 mb-1">
                {{ item.vod_name }}
              </h4>
              <p v-if="item.episodeName" class="text-xs text-gray-400 truncate">
                {{ item.episodeName }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatWatchTime(item.watchTime) }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="py-12 text-center">
          <Clock class="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p class="text-gray-400 text-sm">暂无观看历史</p>
        </div>
      </div>

      <!-- 设置 -->
      <div class="p-4 pt-0">
        <h3 class="text-lg font-semibold text-white mb-4">设置</h3>
        <button
          class="w-full flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          @click="clearCache"
        >
          <div class="flex items-center gap-3">
            <Trash2 class="w-5 h-5 text-gray-400" />
            <span class="text-white">清理缓存</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-400 text-sm">{{ formatFileSize(cacheSize) }}</span>
            <ChevronRight class="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>

      <!-- 关于 -->
      <div class="p-4 pt-0 pb-20">
        <h3 class="text-lg font-semibold text-white mb-4">关于</h3>
        <div class="bg-gray-800 rounded-lg p-6 text-center">
          <div class="text-4xl mb-3">📺</div>
          <h4 class="text-xl font-bold text-white mb-2">RicTV</h4>
          <p class="text-sm text-gray-400 mb-4">Version 1.0.0</p>
          <p class="text-xs text-gray-500">
            一个支持 MacCMS v10 API 的视频播放器
          </p>
        </div>
      </div>
    </div>

    <!-- 添加/编辑视频源弹窗 -->
    <div
      v-if="showAddSourceModal"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click.self="closeAddSourceModal"
    >
      <div class="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700">
        <h3 class="text-xl font-semibold text-white p-5 border-b border-gray-700">
          {{ editingSource ? '编辑视频源' : '添加视频源' }}
        </h3>
        <div class="p-5 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-gray-400">名称</label>
            <input
              v-model="sourceForm.name"
              type="text"
              class="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="例如: 资源站A"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm text-gray-400">API 地址</label>
            <input
              v-model="sourceForm.url"
              type="text"
              class="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              placeholder="https://example.com/api.php/provide/vod"
            />
          </div>
        </div>
        <div class="flex gap-3 p-5 border-t border-gray-700">
          <button
            class="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            @click="closeAddSourceModal"
          >
            取消
          </button>
          <button
            class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            @click="handleSaveSource"
          >
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 导入选项弹窗 -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click.self="showImportModal = false"
    >
      <div class="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700">
        <h3 class="text-xl font-semibold text-white p-5 border-b border-gray-700">
          导入视频源
        </h3>
        <div class="p-5 space-y-3">
          <button
            class="w-full flex items-center gap-3 p-4 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-lg transition-colors group"
            @click="showInviteCodeModal = true; showImportModal = false"
          >
            <Gift class="w-8 h-8 text-blue-500" />
            <div class="flex-1 text-left">
              <div class="text-white font-medium">使用邀请码</div>
              <div class="text-xs text-gray-400">输入邀请码快速导入</div>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            class="w-full flex items-center gap-3 p-4 bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-lg transition-colors group"
            @click="showJsonModal = true; showImportModal = false"
          >
            <Code class="w-8 h-8 text-blue-500" />
            <div class="flex-1 text-left">
              <div class="text-white font-medium">输入 JSON</div>
              <div class="text-xs text-gray-400">手动粘贴配置内容</div>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </button>
        </div>
        <div class="p-5 border-t border-gray-700">
          <button
            class="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            @click="showImportModal = false"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 邀请码弹窗 -->
    <div
      v-if="showInviteCodeModal"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click.self="showInviteCodeModal = false"
    >
      <div class="bg-gray-800 rounded-lg w-full max-w-md border border-gray-700">
        <div class="p-5 border-b border-gray-700 text-center">
          <Gift class="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 class="text-xl font-semibold text-white">使用邀请码</h3>
        </div>
        <div class="p-5">
          <p class="text-sm text-gray-400 mb-4 text-center">
            输入邀请码即可快速导入优质视频源
          </p>
          <input
            v-model="inviteCode"
            type="text"
            class="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none uppercase"
            placeholder="请输入邀请码"
          />
        </div>
        <div class="flex gap-3 p-5 border-t border-gray-700">
          <button
            class="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            @click="showInviteCodeModal = false; inviteCode = ''"
          >
            取消
          </button>
          <button
            class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            @click="handleImportInviteCode"
          >
            导入
          </button>
        </div>
      </div>
    </div>

    <!-- JSON 导入弹窗 -->
    <div
      v-if="showJsonModal"
      class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      @click.self="showJsonModal = false"
    >
      <div class="bg-gray-800 rounded-lg w-full max-w-2xl border border-gray-700">
        <h3 class="text-xl font-semibold text-white p-5 border-b border-gray-700">
          导入 JSON 配置
        </h3>
        <div class="p-5">
          <p class="text-sm text-gray-400 mb-3">请粘贴视频源 JSON 配置：</p>
          <textarea
            v-model="jsonText"
            class="w-full h-64 px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm"
            placeholder='{"api_site": {...}}'
          ></textarea>
        </div>
        <div class="flex gap-3 p-5 border-t border-gray-700">
          <button
            class="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            @click="showJsonModal = false; jsonText = ''"
          >
            取消
          </button>
          <button
            class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            @click="handleImportJson"
          >
            导入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { VideoDetail, VideoSource } from '@/types';
import { useTv, useWatchHistory } from '@/composables/useTv';
import { cacheManager, videoSourceManager } from '@/core/utils/storage';
import { formatFileSize } from '@/core/utils/helpers';
import { 
  ChevronDown, 
  Trash2, 
  Download, 
  Plus, 
  Check, 
  Edit, 
  RefreshCw,
  Gift,
  Code,
  ChevronRight,
  Clock
} from 'lucide-vue-next';

const emit = defineEmits<{
  'video-click': [video: VideoDetail | any];
}>();

const { sources, loadSources, addSource, removeSource, setActiveSource } = useTv();
const { history, loadHistory, clearHistory } = useWatchHistory();

const sourcesExpanded = ref(true);
const showAddSourceModal = ref(false);
const showImportModal = ref(false);
const showInviteCodeModal = ref(false);
const showJsonModal = ref(false);
const editingSource = ref<VideoSource | null>(null);
const cacheSize = ref(0);

const sourceForm = ref({
  name: '',
  url: '',
});

const inviteCode = ref('');
const jsonText = ref('');

// 邀请码配置
const INVITE_CODE_CONFIGS: Record<string, any> = {
  WEB2025: {
    cache_time: 7200,
    api_site: {
      'mtzy.me': {
        name: '🎬茅台资源',
        api: 'https://caiji.maotaizy.cc/api.php/provide/vod',
        detail: 'https://mtzy.me',
      },
      'ffzyapi.com': {
        name: '🎬非凡资源',
        api: 'https://api.ffzyapi.com/api.php/provide/vod',
        detail: 'https://cj.ffzyapi.com',
      },
      'bfzy.tv': {
        name: '🎬暴风资源',
        api: 'https://bfzyapi.com/api.php/provide/vod',
        detail: 'https://bfzy.tv',
      },
    },
  },
};

// 加载缓存大小
const loadCacheSize = async () => {
  cacheSize.value = await cacheManager.getCacheSize();
};

// 格式化观看时间
const formatWatchTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}-${date.getDate()}`;
};

// 切换视频源
const switchSource = async (id: string) => {
  await setActiveSource(id);
  await loadSources();
  alert(`已切换到 "${sources.value.find(s => s.id === id)?.name}"`);
};

// 删除视频源
const deleteSource = async (id: string) => {
  if (confirm('确定要删除这个视频源吗？')) {
    await removeSource(id);
    await loadSources();
  }
};

// 清空所有视频源
const clearAllSources = async () => {
  if (confirm(`确定要清空所有 ${sources.value.length} 个视频源吗？此操作不可恢复！`)) {
    await videoSourceManager.saveSources([]);
    await loadSources();
    alert('已清空所有视频源');
  }
};

// 编辑视频源
const editSource = (source: VideoSource) => {
  editingSource.value = source;
  sourceForm.value = {
    name: source.name,
    url: source.url,
  };
  showAddSourceModal.value = true;
};

// 关闭添加/编辑弹窗
const closeAddSourceModal = () => {
  showAddSourceModal.value = false;
  editingSource.value = null;
  sourceForm.value = { name: '', url: '' };
};

// 保存视频源
const handleSaveSource = async () => {
  if (!sourceForm.value.name || !sourceForm.value.url) {
    alert('请填写完整信息');
    return;
  }

  try {
    if (editingSource.value) {
      // 编辑
      await videoSourceManager.updateSource(editingSource.value.id, {
        name: sourceForm.value.name,
        url: sourceForm.value.url,
      });
      alert('编辑成功');
    } else {
      // 添加
      await addSource(sourceForm.value.name, sourceForm.value.url);
      alert('添加成功');
    }
    await loadSources();
    closeAddSourceModal();
  } catch (err) {
    alert('保存失败');
  }
};

// 导入邀请码
const handleImportInviteCode = async () => {
  if (!inviteCode.value.trim()) {
    alert('请输入邀请码');
    return;
  }

  const upperCode = inviteCode.value.trim().toUpperCase();
  const config = INVITE_CODE_CONFIGS[upperCode];

  if (!config) {
    alert('邀请码无效，请检查后重试');
    return;
  }

  try {
    const apiSite = config.api_site;
    const sourcesToImport = Object.entries(apiSite);

    if (sourcesToImport.length === 0) {
      alert('配置中没有找到视频源');
      return;
    }

    if (!confirm(`找到 ${sourcesToImport.length} 个视频源，是否导入？`)) {
      return;
    }

    let successCount = 0;
    for (const [, sourceData] of sourcesToImport) {
      const data: any = sourceData;
      const existingSource = sources.value.find(s => s.url === data.api);
      if (!existingSource) {
        await addSource(data.name, data.api);
        successCount++;
      }
    }

    await loadSources();
    alert(`成功导入 ${successCount} 个视频源`);
    showInviteCodeModal.value = false;
    inviteCode.value = '';
  } catch (error) {
    console.error('Import error:', error);
    alert('导入失败');
  }
};

// 导入 JSON
const handleImportJson = async () => {
  if (!jsonText.value.trim()) {
    alert('请输入 JSON 内容');
    return;
  }

  try {
    const jsonData = JSON.parse(jsonText.value);
    
    if (!jsonData.api_site || typeof jsonData.api_site !== 'object') {
      alert('JSON 格式不正确，缺少 api_site 字段');
      return;
    }

    const apiSite = jsonData.api_site;
    const sourcesToImport = Object.entries(apiSite);

    if (sourcesToImport.length === 0) {
      alert('JSON 文件中没有找到视频源');
      return;
    }

    if (!confirm(`找到 ${sourcesToImport.length} 个视频源，是否导入？`)) {
      return;
    }

    let successCount = 0;
    for (const [, sourceData] of sourcesToImport) {
      const data: any = sourceData;
      const existingSource = sources.value.find(s => s.url === data.api);
      if (!existingSource) {
        await addSource(data.name, data.api);
        successCount++;
      }
    }

    await loadSources();
    alert(`成功导入 ${successCount} 个视频源`);
    showJsonModal.value = false;
    jsonText.value = '';
  } catch (error) {
    console.error('Parse JSON error:', error);
    alert('JSON 格式不正确，请检查语法');
  }
};

// 清空观看历史
const clearAllHistory = async () => {
  if (confirm('确定要清空所有观看历史吗？')) {
    await clearHistory();
    alert('已清空观看历史');
  }
};

// 清理缓存
const clearCache = async () => {
  if (confirm('确定要清理所有缓存吗？')) {
    await cacheManager.clearAllCache();
    await loadCacheSize();
    alert('缓存已清理');
  }
};

onMounted(async () => {
  await loadSources();
  await loadHistory();
  await loadCacheSize();
});
</script>

<style scoped>
/* 主要使用 Tailwind 类 */
</style>
