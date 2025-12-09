# Chat 组件结构

本目录包含拆分后的聊天功能组件。

## 组件列表

### 消息相关组件

- **ChatMessage.vue** - 消息容器组件（主组件）
  - 整合所有消息相关组件
  - 处理不同消息类型的展示
  - 管理图片预览状态

- **ChatBubble.vue** - 消息气泡包装组件
  - 显示头像和气泡背景
  - 用户消息：蓝色渐变
  - 对方消息：白色边框

- **ChatTextContent.vue** - 文本消息内容组件
  - 显示文本内容
  - 包含已读状态（用户消息）

- **ChatImageContent.vue** - 图片消息内容组件
  - 显示图片预览
  - 图片右下角显示已读状态
  - 支持点击预览

- **ChatFileContent.vue** - 文件消息内容组件
  - 显示文件图标、名称、大小
  - 显示已读状态

- **ChatTimestamp.vue** - 消息时间戳和已读状态组件
  - 显示消息发送时间
  - 显示已读/未读状态
  - 根据消息方向调整对齐

- **ChatImagePreview.vue** - 图片预览模态框组件
  - 全屏图片预览
  - 毛玻璃背景
  - 支持点击关闭

### 会话列表相关组件

- **ChatConversationList.vue** - 会话列表容器组件
  - 搜索功能
  - 显示所有会话
  - 处理会话选择

- **ChatConversationItem.vue** - 会话列表项组件
  - 显示会话头像、名称、最后消息
  - 显示未读数
  - 显示选中状态

### 输入框组件

- **ChatInputBox.vue** - 聊天输入框组件（功能完整）
  - 多行文本输入（textarea）
  - 文件上传按钮
  - 图片上传按钮（支持粘贴）
  - 表情选择器（140+ emoji）
  - 图片预览
  - Enter 发送，Shift+Enter 换行
  - 自动高度调整

## 主要特性

### 消息功能
- ✅ 文本消息
- ✅ 图片消息（支持粘贴、上传）
- ✅ 文件消息
- ✅ 已读状态显示
- ✅ 时间戳显示
- ✅ 图片预览

### 输入功能
- ✅ 多行输入框
- ✅ 表情选择（140+ emoji）
- ✅ 图片上传
- ✅ 文件上传
- ✅ 图片粘贴
- ✅ 图片预览
- ✅ Enter 快速发送
- ✅ 自动高度调整

### UI/UX
- ✅ Telegram 风格设计
- ✅ 响应式布局
- ✅ 平滑过渡动画
- ✅ 悬停效果
- ✅ 现代化配色

## 使用示例

在 ChatLayout 中使用这些组件：

```vue
<ChatMessage
  v-for="message in messages"
  :key="message.id"
  :message="message"
/>

<ChatInputBox
  v-model="messageInput"
  :pending-images="pendingImages"
  :disabled="isSending"
  @send="handleSendMessage"
  @send-file="handleSendFile"
  @add-image="pendingImages.push($event)"
  @remove-image="pendingImages.splice($event, 1)"
/>

<ChatConversationList
  :conversations="conversations"
  :search-query="searchQuery"
  :selected-conversation-id="selectedConversation?.id"
  @update:search-query="searchQuery = $event"
  @select="handleSelectConversation"
/>
```

## 组件通信

所有组件都通过 Props 和 Emits 进行通信，确保清晰的数据流向。

- **Props** - 接收父组件传递的数据
- **Emits** - 向父组件发送事件和数据
