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

export type { Message, DeepSeekRequest, DeepSeekResponse, DeepSeekConfig }
export { DeepSeekClient }
