# RicTV - 快速开始指南

## 📦 已完成的工作

✅ 所有 TV 页面组件已创建
✅ 已安装必要的依赖（artplayer, hls.js）
✅ 已配置路由 `/tv`
✅ 已更新 storage.ts 使用 localStorage（适配 Vue 项目）
✅ 创建了完整的响应式布局（PC + 移动端）

## 🚀 启动项目

```bash
cd /Users/ricardo/DevProject/ric-admin
pnpm dev
```

然后访问：`http://localhost:5173/tv`

## 📱 使用流程

### 第一次使用

1. **访问 TV 页面**
   - 打开浏览器访问 `http://localhost:5173/tv`
   - 首次使用会显示"暂无视频"

2. **添加视频源**
   - 点击底部/顶部导航的"我的"标签
   - 在"视频源管理"区域点击"添加视频源"
   - 输入以下测试源（示例）：
     ```
     名称: 测试源
     API: https://api.example.com/api.php/provide/vod/
     ```
   - 点击"确定"

3. **浏览视频**
   - 返回"首页"标签
   - 如果视频源有效，会自动加载视频列表
   - 点击顶部分类进行筛选
   - 向下滚动加载更多

4. **搜索视频**
   - 点击"搜索"标签
   - 输入关键词（如"战狼"）
   - 点击搜索或按回车

5. **观看视频**
   - 点击任意视频卡片
   - 选择播放源
   - 选择集数
   - 播放器会自动加载并播放

## 📐 响应式设计说明

### PC 端 (>768px)
- 顶部横向导航
- 视频网格：4-6列（根据屏幕宽度）
- 侧边详情展示

### 移动端 (<768px)
- 底部固定导航栏
- 视频网格：2-3列
- 全屏详情页面

## 🎨 主要功能

### 1. 视频源管理
- ✅ 添加多个视频源
- ✅ 切换活跃视频源
- ✅ 删除视频源
- ✅ 视频源状态显示

### 2. 视频浏览
- ✅ 分类筛选
- ✅ 分页加载
- ✅ 响应式网格布局
- ✅ 封面图片加载
- ✅ 更新状态显示

### 3. 视频搜索
- ✅ 关键词搜索
- ✅ 搜索历史记录
- ✅ 快速选择历史
- ✅ 清空历史

### 4. 视频播放
- ✅ ArtPlayer 播放器
- ✅ HLS.js 支持 M3U8
- ✅ 多播放源切换
- ✅ 集数选择
- ✅ 播放控制

### 5. 观看历史
- ✅ 自动记录观看
- ✅ 播放进度保存（每5秒）
- ✅ 断点续播提示
- ✅ 进度百分比显示
- ✅ 历史记录管理

### 6. 收藏功能
- ✅ 添加/删除收藏
- ✅ 收藏列表展示
- ✅ 收藏状态同步

## 🔧 技术栈

- **框架**: Vue 3 + TypeScript
- **构建**: Vite
- **路由**: Vue Router 4
- **样式**: Tailwind CSS
- **状态**: VueUse + Composables
- **播放器**: ArtPlayer 5.3.0
- **流媒体**: HLS.js 1.6.15
- **存储**: localStorage

## 📂 文件结构

```
src/
├── components/tv/
│   ├── TvTabs.vue          # 标签导航
│   ├── VideoCard.vue        # 视频卡片
│   ├── VideoGrid.vue        # 视频网格
│   ├── VideoPlayer.vue      # 播放器
│   └── VideoDetail.vue      # 详情页
├── composables/
│   └── useTv.ts             # TV Composable
├── pages/tv/
│   ├── index.vue            # 主页面
│   ├── TvHome.vue           # 首页
│   ├── TvSearch.vue         # 搜索
│   └── TvMine.vue           # 我的
├── services/
│   └── maccms.ts            # API服务
├── core/utils/
│   └── storage.ts           # 存储工具
└── types/
    ├── index.ts             # 类型定义
    └── artplayer.d.ts       # 播放器类型
```

## 🐛 常见问题

### 1. 视频源无法加载
- 检查 API 地址是否正确
- 确保 API 支持 CORS
- 检查网络连接

### 2. 视频无法播放
- 确保视频 URL 有效
- 检查视频格式（支持 MP4, M3U8）
- 查看浏览器控制台错误信息

### 3. 样式显示异常
- 确保 Tailwind CSS 正常工作
- 检查 CSS 文件加载

### 4. 类型错误
- TypeScript 版本: 5.8.3
- 已创建必要的类型声明文件

## 📝 测试用例

### 测试视频源
如果需要测试，可以使用以下免费测试 API（需要自己寻找）：

```
名称: 测试源1
API: https://[你的MacCMS API地址]/api.php/provide/vod/
```

### 功能测试清单

- [ ] 添加视频源
- [ ] 切换视频源
- [ ] 浏览视频列表
- [ ] 分类筛选
- [ ] 搜索视频
- [ ] 查看视频详情
- [ ] 播放视频
- [ ] 切换集数
- [ ] 收藏视频
- [ ] 查看观看历史
- [ ] 断点续播

## 🎯 下一步建议

1. **性能优化**
   - 实现虚拟滚动（大列表）
   - 图片懒加载优化
   - 添加骨架屏

2. **功能增强**
   - 播放列表功能
   - 下载功能
   - 分享功能
   - 倍速播放

3. **用户体验**
   - 添加加载动画
   - 优化错误提示
   - 添加引导页

4. **数据管理**
   - 考虑使用 Pinia
   - 实现数据同步
   - 添加数据备份

## 📚 相关文档

- [ArtPlayer 文档](https://artplayer.org/)
- [HLS.js 文档](https://github.com/video-dev/hls.js/)
- [MacCMS 文档](https://www.maccms.la/)
- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)

---

**祝你使用愉快！🎉**
