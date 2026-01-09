/**
 * DeepSeek API 客户端
 * 支持流式请求用于实时回复
 */

interface DeepSeekConfig {
  apiKey: string
  baseURL?: string
  model?: string
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface DeepSeekRequest {
  model: string
  messages: Message[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  stream?: boolean
}

interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message?: {
      role: string
      content: string
    }
    delta?: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

class DeepSeekClient {
  private apiKey: string
  private baseURL: string
  private model: string

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey
    this.baseURL = config.baseURL || 'https://api.deepseek.com'
    this.model = config.model || 'deepseek-chat'
  }

  /**
   * 获取流式回复
   * @param messages 消息列表
   * @param onChunk 每个流块到达时的回调
   * @param onDone 完成时的回调
   */
  async getStreamingResponse(
    messages: Message[],
    onChunk: (chunk: string) => void,
    onDone?: (fullContent: string) => void,
    onError?: (error: Error) => void
  ): Promise<string> {
    const payload: DeepSeekRequest = {
      model: this.model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }

    let fullContent = ''

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // 保留最后一行（可能不完整）
        buffer = lines[lines.length - 1]

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim()

          if (!line || line === ':') continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              break
            }

            try {
              const parsed: DeepSeekResponse = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content || ''

              if (content) {
                fullContent += content
                onChunk(content)
              }
            } catch (e) {
              console.error('Failed to parse stream data:', e)
            }
          }
        }
      }

      // 处理剩余的 buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6)
        if (data !== '[DONE]') {
          try {
            const parsed: DeepSeekResponse = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ''
            if (content) {
              fullContent += content
              onChunk(content)
            }
          } catch (e) {
            console.error('Failed to parse final stream data:', e)
          }
        }
      }

      onDone?.(fullContent)
      return fullContent
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      throw err
    }
  }

  /**
   * 非流式请求（用于简单的 API 调用）
   */
  async getResponse(messages: Message[]): Promise<string> {
    const payload: DeepSeekRequest = {
      model: this.model,
      messages,
      stream: false,
      temperature: 0.7,
      max_tokens: 2048,
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data: DeepSeekResponse = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('DeepSeek API request failed:', error)
      throw error
    }
  }
}

// 创建全局实例
let deepSeekClient: DeepSeekClient | null = null

export function initDeepSeek(apiKey: string): DeepSeekClient {
  if (!apiKey) {
    throw new Error('DeepSeek API key is required')
  }
  deepSeekClient = new DeepSeekClient({ apiKey })
  return deepSeekClient
}

export function getDeepSeekClient(): DeepSeekClient {
  if (!deepSeekClient) {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DeepSeek API key not configured. Please set VITE_DEEPSEEK_API_KEY environment variable.')
    }
    deepSeekClient = new DeepSeekClient({ apiKey })
  }
  return deepSeekClient
}

/**
 * 使用AI自动为文件打标签
 */
export async function autoTagFiles(files: Array<{
  fileName: string
  fileType: string
  description?: string
  data?: Record<string, any>[]
}>): Promise<string[]> {
  const client = getDeepSeekClient()
  
  const prompt = `请分析以下文件信息，为每个文件打上合适的分类标签（如：发票、流水、合同、报表、凭证等）。
要求：
1. 每个文件返回1-3个最合适的标签
2. 标签要简洁明确，2-4个汉字
3. 只返回JSON数组格式，不要其他说明文字

文件信息：
${files.map((f, i) => `${i + 1}. 文件名：${f.fileName}
   文件类型：${f.fileType}
   ${f.description ? `描述：${f.description}` : ''}
   ${f.data && f.data.length > 0 ? `数据列：${Object.keys(f.data[0]).join('、')}` : ''}`).join('\n\n')}

请返回格式：
[
  ["标签1", "标签2"],  // 第1个文件的标签
  ["标签1"],          // 第2个文件的标签
  ...
]`

  const response = await client.getResponse([
    { role: 'system', content: '你是一个专业的文件分类助手，擅长根据文件名和内容特征进行准确分类。' },
    { role: 'user', content: prompt }
  ])

  try {
    // 提取JSON数组
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const tags = JSON.parse(jsonMatch[0]) as string[][]
      // 扁平化并去重
      return [...new Set(tags.flat())]
    }
  } catch (error) {
    console.error('解析AI返回的标签失败:', error)
  }

  return []
}

export type { Message, DeepSeekRequest, DeepSeekResponse, DeepSeekConfig }
export { DeepSeekClient }
