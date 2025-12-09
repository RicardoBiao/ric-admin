/**
 * 应用初始化配置
 */

import { initDeepSeek } from '@/api/deepseek'

export function initializeApp() {
  // 初始化 DeepSeek API
  try {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY
    if (apiKey && apiKey !== 'sk_your_deepseek_api_key_here') {
      initDeepSeek(apiKey)
      console.log('✓ DeepSeek API initialized successfully')
    } else {
      console.warn('⚠ DeepSeek API key not configured. Please set VITE_DEEPSEEK_API_KEY in .env.local')
    }
  } catch (error) {
    console.error('✗ Failed to initialize DeepSeek API:', error)
  }
}
