# Copilot 使用说明（项目专用）

目的：让 AI 编码助手快速了解本仓库的架构、常用命令、约定和典型代码示例，便于安全、准确地修改或新增代码。

- **技术栈**: Vue 3 + TypeScript, Vite, Tailwind CSS, Vue Router 4, TanStack Table
- **包管理器**: pnpm（见 package.json.packageManager）

核心概念
- 源码入口与别名：所有源码放在 `src/`，路径别名 `@` 指向 `src`（见 `vite.config.ts`）。
- 路由：路由配置位于 `src/routes/index.ts`，页面采用按需懒加载：
  - 例：`component: () => import('@/pages/customers/index.vue')`
- API 层：基础 HTTP 封装在 `src/api/index.ts`，导出 `apiClient` 和快捷方法 `get/post/put/del`，请使用这些方法而非直接调用 axios。
  - 例：`const res = await get<PaginationResponse<Customer>>('/customers', { page: 1 })`
- 初始化：应用级初始化位于 `src/core/init.ts`，例如 DeepSeek 的初始化会读取 `VITE_DEEPSEEK_API_KEY`。
- Mock：开发环境启用了 `vite-plugin-mock`，mock 文件位于仓库根的 `mock/` 目录（见 `vite.config.ts`）。

运行与构建（必须使用 pnpm）
- 安装依赖：`pnpm install`
- 开发：`pnpm dev`（等同于 `vite`）
- 构建：`pnpm build`（会先运行 `vue-tsc -b`）
- 预览构建：`pnpm preview`

项目约定（必须遵守的可发现规则）
- 组件/页面：每个页面目录下使用 `index.vue` 作为入口（见 `src/pages/*`），组件放在 `src/components/` 下，`ric-ui/` 存放项目自定义高层组件。
- 组合式 API：优先使用 Composition API + `composables/` 存放可复用 hooks（例如 `src/composables/useChat.ts`）。
- 样式：使用 Tailwind CSS；不要引入全局样式而绕过 Tailwind 体系。
- 自动导入：项目使用 `unplugin-vue-components` 与 AntDesignX 解析器，新增第三方组件时可配置 resolver。

添加或修改 API
- 使用 `src/api/index.ts` 中的封装方法：`get('/path', params)`、`post('/path', body)`。
- 请求会自动在 headers 中附带 localStorage 的 `token`（见实现），因此认证流程应使用该字段。

编辑路由
- 在 `src/routes/index.ts` 添加新路由，保持懒加载写法并在 `src/pages/` 添加相应 `index.vue`。

环境变量
- 放置在 `.env` 或 `.env.local`，敏感 key（例如 DeepSeek）用 `VITE_` 前缀：
  - `VITE_DEEPSEEK_API_KEY=sk_xxx`（`src/core/init.ts` 会读取并初始化）

注意事项与限制
- 仓库没有测试脚本；不要假设存在自动化测试。
- Mock 服务在 dev 环境默认开启，提交 PR 前请确认生产代码已移除或条件禁用 mock。
- 遵循现有类型定义：项目在 `src/api` 和 `src/types` 有自定义类型，请尽量扩充而非引入新的 ad-hoc 类型。

示例片段（添加客户列表 API 的正确用法）
```ts
// 在某个 composable 或 page 中
import { get } from '@/api'

async function loadCustomers(page = 1) {
  const res = await get('/customers', { page, pageSize: 20 })
  return res.data
}
```

如果需要修改本文件或补充信息，请在 PR 中说明：你修改的是“架构/运行命令/约定/示例”中的哪一项，以及修改理由。

—— 结束 ——
