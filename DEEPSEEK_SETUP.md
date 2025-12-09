# DeepSeek 客服集成指南

## 概述

本项目已集成 DeepSeek AI 客服功能，支持流式请求以实现实时回复效果。

## 功能特性

✨ **流式请求支持** - 实时接收和显示 AI 回复
🚀 **自动初始化** - 应用启动时自动配置
💬 **对话历史管理** - 维护完整的聊天记录
🔄 **错误处理** - 完善的异常捕获和回退机制

## 设置步骤

### 1. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册账户并登录
3. 进入 [API 密钥管理页面](https://api.deepseek.com)
4. 创建新的 API Key

### 2. 配置环境变量

在项目根目录创建或编辑 `.env.local` 文件：

```env
# 必须：设置你的 DeepSeek API Key
VITE_DEEPSEEK_API_KEY=sk_your_api_key_here

# 可选：自定义 API 基础 URL（默认为 https://api.deepseek.com）
# VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com

# 可选：选择模型（默认为 deepseek-chat）
# VITE_DEEPSEEK_MODEL=deepseek-chat
```

### 3. 重启开发服务器

```bash
# 停止当前的开发服务器
# 然后重新启动
pnpm dev
```

## 核心文件说明

### `/src/api/deepseek.ts`
DeepSeek API 客户端实现，包含：
- `DeepSeekClient` 类：处理 API 通信
- `getStreamingResponse()` 方法：流式请求处理
- `getResponse()` 方法：非流式请求处理

### `/src/composables/useChat.ts`
聊天服务组合式函数，集成 DeepSeek：
- 维护对话历史
- 流式接收和显示消息
- 错误处理和回退机制

### `/src/core/init.ts`
应用初始化文件，在应用启动时配置 DeepSeek

## 使用示例

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <div v-for="msg in messages" :key="msg.id" class="message">
      <span class="role">{{ msg.role }}:</span>
      <span class="content">{{ msg.content }}</span>
      <span v-if="msg.isStreaming" class="loading">●</span>
    </div>
    
    <input v-model="input" @keyup.enter="sendMessage" />
    <button @click="sendMessage">发送</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatService } from '@/composables/useChat'

const input = ref('')
const { messages, sendMessage, selectedConversation } = useChatService()

const handleSend = async () => {
  if (selectedConversation.value && input.value.trim()) {
    await sendMessage(selectedConversation.value.id, input.value)
    input.value = ''
  }
}
</script>
```

## API 接口说明

### 流式请求

```typescript
const client = getDeepSeekClient()

await client.getStreamingResponse(
  messages, // 消息数组
  (chunk) => {
    // 每个流块回调
    console.log('收到块:', chunk)
  },
  (fullContent) => {
    // 完成回调
    console.log('完整内容:', fullContent)
  },
  (error) => {
    // 错误回调
    console.error('发生错误:', error)
  }
)
```

### 非流式请求

```typescript
const client = getDeepSeekClient()

const response = await client.getResponse([
  { role: 'user', content: '你好' }
])
console.log('AI 回复:', response)
```

## 消息格式

### 用户消息
```typescript
{
  id: '1733747123456',
  conversationId: '1',
  role: 'user',
  content: '你好，请问产品怎么用？',
  timestamp: '2024-12-09T14:58:43.456Z',
  avatar: 'U'
}
```

### AI 回复消息（流式）
```typescript
{
  id: '1733747123457',
  conversationId: '1',
  role: 'assistant',
  content: '感谢您的咨询...', // 逐步更新
  timestamp: '2024-12-09T14:58:43.456Z',
  avatar: 'CS',
  isStreaming: true // 流式进行中
}
```

## 故障排除

### 问题：API Key 无效
**解决方案：**
1. 检查 `.env.local` 中的 API Key 格式
2. 确保 API Key 以 `sk_` 开头
3. 在 DeepSeek 官网验证 API Key 是否有效

### 问题：请求超时
**解决方案：**
1. 检查网络连接
2. 尝试增加超时时间
3. 检查 DeepSeek API 服务状态

### 问题：CORS 错误
**解决方案：**
1. 确保在浏览器环境运行（不是 Node.js）
2. 检查 DeepSeek API 是否支持 CORS
3. 考虑通过后端代理 API 请求

### 问题：消息不显示
**解决方案：**
1. 检查浏览器控制台是否有错误
2. 确认 `selectedConversation` 已设置
3. 验证 `isStreaming` 状态切换是否正确

## 性能优化建议

1. **消息滚动虚拟化** - 对于长对话列表使用虚拟滚动
2. **防抖发送** - 添加发送按钮防抖防止重复提交
3. **消息缓存** - 对常见问题进行缓存回复
4. **并发限制** - 限制同时进行的流式请求数量

## 安全建议

⚠️ **重要**：
- 永远不要在前端代码中硬编码 API Key
- 只在 `.env.local` 中设置 API Key
- 不要将 `.env.local` 提交到版本控制
- 生产环境建议通过后端代理 API 请求

## 相关文档

- [DeepSeek API 文档](https://api.deepseek.com/docs)
- [DeepSeek 模型说明](https://www.deepseek.com/docs)

## 支持

如遇到问题，请：
1. 检查本指南的故障排除部分
2. 查看浏览器控制台错误日志
3. 参考 DeepSeek 官方文档
