# TV 功能安装指南

## 需要安装的依赖

```bash
pnpm add artplayer hls.js
```

或者

```bash
npm install artplayer hls.js
```

## 文件结构

```
src/
├── components/
│   └── tv/
│       ├── TvTabs.vue          # 标签导航组件
│       ├── VideoCard.vue        # 视频卡片组件
│       ├── VideoGrid.vue        # 视频网格组件
│       ├── VideoPlayer.vue      # 视频播放器组件
│       └── VideoDetail.vue      # 视频详情组件
├── composables/
│   └── useTv.ts                 # TV相关的组合式函数
├── core/
│   └── utils/
│       └── storage.ts           # 存储工具（已更新为使用 localStorage）
├── pages/
│   └── tv/
│       ├── index.vue            # TV主页面
│       ├── TvHome.vue           # 首页标签
│       ├── TvSearch.vue         # 搜索标签
│       └── TvMine.vue           # 我的标签
├── services/
│   └── maccms.ts                # MacCMS API服务
└── types/
    └── index.ts                 # 类型定义
```

## 功能特性

### 已实现功能

✅ 视频源管理
- 添加/删除视频源
- 切换活跃视频源
- 视频源状态显示

✅ 视频浏览
- 分类导航
- 视频列表展示
- 分页加载
- 响应式网格布局（移动端2列，PC端6列）

✅ 搜索功能
- 关键词搜索
- 搜索历史记录
- 搜索结果展示

✅ 视频详情
- 视频信息展示
- 多播放源支持
- 集数选择
- 视频播放（ArtPlayer + HLS.js）

✅ 收藏功能
- 添加/删除收藏
- 收藏列表展示
- 收藏状态同步

✅ 观看历史
- 自动记录观看历史
- 播放进度保存
- 断点续播
- 播放进度百分比显示
- 历史记录管理

✅ 响应式设计
- PC端：顶部导航 + 6列网格
- 移动端：底部导航 + 2-3列网格
- 自适应布局

### 样式特性

- 深色主题
- 渐变背景
- 玻璃态效果
- 流畅动画
- 卡片悬停效果

## 路由配置

访问路径：`/tv`

已添加到路由配置中：
```typescript
{
  path: '/tv',
  component: () => import('@/pages/tv/index.vue'),
}
```

## 使用说明

### 1. 添加视频源

1. 访问 `/tv` 页面
2. 点击"我的"标签
3. 点击"添加视频源"按钮
4. 输入视频源名称和 MacCMS v10 API 地址
5. 点击确定

### 2. 浏览视频

1. 在"首页"标签浏览视频
2. 点击顶部分类进行筛选
3. 向下滚动加载更多

### 3. 搜索视频

1. 点击"搜索"标签
2. 输入关键词
3. 点击搜索按钮或按回车

### 4. 观看视频

1. 点击任意视频卡片
2. 选择播放源和集数
3. 视频自动播放
4. 支持断点续播

## 注意事项

1. **视频源格式**：必须是 MacCMS v10 标准 API 格式
2. **跨域问题**：如果遇到跨域问题，需要视频源支持 CORS
3. **播放格式**：支持 MP4、M3U8 等常见格式
4. **浏览器兼容性**：建议使用现代浏览器（Chrome、Firefox、Safari、Edge）
5. **移动端体验**：在移动设备上使用底部导航更方便

## MacCMS v10 API 示例

```
# 分类列表
GET /api.php/provide/vod/?ac=list

# 视频列表
GET /api.php/provide/vod/?ac=detail&pg=1

# 按分类获取
GET /api.php/provide/vod/?ac=detail&t=1&pg=1

# 搜索视频
GET /api.php/provide/vod/?ac=detail&wd=关键词

# 视频详情
GET /api.php/provide/vod/?ac=detail&ids=123
```

## 开发说明

### 存储方案

- 使用 `localStorage` 存储数据
- 支持数据缓存（20MB限制）
- 自动清理过期缓存

### 组件通信

- 使用 `composables` 管理状态
- 事件传递使用 `emit`
- 响应式数据使用 `ref` 和 `computed`

### 样式方案

- Tailwind CSS
- 响应式断点：sm(640px)、md(768px)、lg(1024px)、xl(1280px)
- 自定义动画和过渡

## 后续优化建议

1. 添加 Pinia 状态管理（如果需要更复杂的状态管理）
2. 实现视频下载功能
3. 添加播放列表功能
4. 支持多语言
5. 添加主题切换（浅色/深色）
6. 优化图片懒加载
7. 添加骨架屏加载效果
8. 实现虚拟滚动（大列表优化）
