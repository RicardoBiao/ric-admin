import { ref, computed } from 'vue'
import { getDeepSeekClient, type Message as DeepSeekMessage } from '@/api/deepseek'

interface Conversation {
  id: string
  title: string
  avatar?: string
  lastMessage?: string
  timestamp?: string
  unread?: number
}

interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  avatar?: string
  type?: 'text' | 'image' | 'file'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  read?: boolean
  isStreaming?: boolean
}

// 模拟数据
const mockConversations: Conversation[] = [
  {
    id: '1',
    title: '张三',
    avatar: 'Z',
    lastMessage: '请问这个产品如何使用？',
    timestamp: '14:30',
    unread: 2
  },
  {
    id: '2',
    title: '李四',
    avatar: 'L',
    lastMessage: '感谢您的帮助',
    timestamp: '12:15',
    unread: 0
  },
  {
    id: '3',
    title: '王五',
    avatar: 'W',
    lastMessage: '确认收货',
    timestamp: '10:45',
    unread: 1
  },
  {
    id: '4',
    title: '赵六',
    avatar: 'Z',
    lastMessage: '询问退货流程',
    timestamp: '昨天',
    unread: 0
  },
  {
    id: '5',
    title: '孙七',
    avatar: 'S',
    lastMessage: '申请发票',
    timestamp: '3天前',
    unread: 0
  },
]

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      conversationId: '1',
      role: 'user',
      content: '你好，请问这个产品如何使用？',
      timestamp: '2024-12-09 14:00:00',
      avatar: 'Z',
      read: true
    },
    {
      id: '2',
      conversationId: '1',
      role: 'assistant',
      content: '您好！感谢您的咨询。我可以为您详细介绍产品的使用方法...',
      timestamp: '2024-12-09 14:05:00',
      avatar: 'CS'
    },
    {
      id: '3',
      conversationId: '1',
      role: 'user',
      content: '那快速开始怎么操作呢？',
      timestamp: '2024-12-09 14:10:00',
      avatar: 'Z',
      read: true
    },
    {
      id: '4',
      conversationId: '1',
      role: 'assistant',
      content: '快速开始的步骤如下：\n1. 首先安装软件\n2. 然后打开应用\n3. 按照引导完成初始化\n如有问题随时咨询',
      timestamp: '2024-12-09 14:15:00',
      avatar: 'CS'
    },
    {
      id: '5',
      conversationId: '1',
      role: 'user',
      content: '请问还有其他问题吗？',
      timestamp: '2024-12-09 14:30:00',
      avatar: 'Z',
      read: true
    },
  ],
  '2': [
    {
      id: '1',
      conversationId: '2',
      role: 'user',
      content: '感谢您的帮助',
      timestamp: '2024-12-09 12:15:00',
      avatar: 'L',
      read: true
    },
    {
      id: '2',
      conversationId: '2',
      role: 'assistant',
      content: '不客气！如有其他问题欢迎随时联系我们',
      timestamp: '2024-12-09 12:16:00',
      avatar: 'CS'
    }
  ],
  '3': [
    {
      id: '1',
      conversationId: '3',
      role: 'user',
      content: '确认收货',
      timestamp: '2024-12-09 10:45:00',
      avatar: 'W',
      read: true
    },
    {
      id: '2',
      conversationId: '3',
      role: 'assistant',
      content: '非常感谢您的支持，希望您使用愉快！',
      timestamp: '2024-12-09 10:46:00',
      avatar: 'CS'
    }
  ]
}

export function useChatService() {
  const conversations = ref<Conversation[]>(mockConversations)
  const selectedConversation = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isSending = ref(false)

  // 构建对话历史用于 DeepSeek
  const conversationHistory = computed(() => {
    return messages.value
      .filter(m => m.conversationId === selectedConversation.value?.id)
      .map(m => ({
        role: m.role,
        content: m.content
      })) as DeepSeekMessage[]
  })

  const fetchConversations = async () => {
    try {
      loading.value = true
      error.value = null
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      conversations.value = mockConversations
    } catch (err) {
      error.value = '获取聊天列表失败'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const selectConversation = async (conversationId: string) => {
    try {
      loading.value = true
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (conversation) {
        selectedConversation.value = conversation
        // 清除未读数
        conversation.unread = 0
      }
    } catch (err) {
      error.value = '选择聊天失败'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      loading.value = true
      error.value = null
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      messages.value = mockMessages[conversationId] || []
    } catch (err) {
      error.value = '加载消息失败'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const sendMessage = async (conversationId: string, content: string) => {
    if (!content.trim()) return

    try {
      error.value = null
      isSending.value = true

      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        conversationId,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        avatar: 'U'
      }
      messages.value.push(userMessage)

      // 创建助手消息占位符（用于流式响应）
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        avatar: 'CS',
        isStreaming: true
      }
      messages.value.push(assistantMessage)

      // 调用 DeepSeek API 获取流式响应
      try {
        const client = getDeepSeekClient()
        const deepseekMessages: DeepSeekMessage[] = [
          ...conversationHistory.value,
          { role: 'user', content }
        ]

        await client.getStreamingResponse(
          deepseekMessages,
          (chunk: string) => {
            // 每个流块到达时更新消息内容
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId)
            if (msgIndex !== -1) {
              messages.value[msgIndex].content += chunk
            }
          },
          (fullContent: string) => {
            // 流式响应完成
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId)
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false
              messages.value[msgIndex].content = fullContent
            }
          },
          (err: Error) => {
            // 处理错误
            const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId)
            if (msgIndex !== -1) {
              messages.value[msgIndex].isStreaming = false
              messages.value[msgIndex].content = `错误: ${err.message}`
            }
            error.value = `发送消息失败: ${err.message}`
          }
        )
      } catch (apiError) {
        console.error('DeepSeek API error:', apiError)
        // 如果 DeepSeek 不可用，使用默认回复
        const msgIndex = messages.value.findIndex(m => m.id === assistantMessageId)
        if (msgIndex !== -1) {
          messages.value[msgIndex].isStreaming = false
          messages.value[msgIndex].content = '感谢您的消息，我正在处理您的请求...'
        }
        error.value = '调用 DeepSeek API 失败，请检查配置'
      }

      // 更新会话列表
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (conversation) {
        conversation.lastMessage = content
        conversation.timestamp = new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch (err) {
      error.value = '发送消息失败'
      console.error(err)
    } finally {
      isSending.value = false
    }
  }

  const sendFileMessage = async (conversationId: string, fileData: any) => {
    try {
      error.value = null
      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId,
        role: 'user',
        content: fileData.content,
        timestamp: new Date().toISOString(),
        avatar: 'U',
        type: fileData.type,
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
      }

      // 添加用户消息
      messages.value.push(newMessage)

      // 模拟AI回复
      await new Promise(resolve => setTimeout(resolve, 1000))

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        conversationId,
        role: 'assistant',
        content: '已收到您的文件，感谢分享！',
        timestamp: new Date().toISOString(),
        avatar: 'CS'
      }

      messages.value.push(assistantMessage)

      // 更新会话列表
      const conversation = conversations.value.find(c => c.id === conversationId)
      if (conversation) {
        conversation.lastMessage = fileData.type === 'image' ? '[图片]' : '[文件]'
        conversation.timestamp = new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    } catch (err) {
      error.value = '发送文件失败'
      console.error(err)
    }
  }

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    error,
    isSending,
    fetchConversations,
    selectConversation,
    loadMessages,
    sendMessage,
    sendFileMessage,
  }
}
