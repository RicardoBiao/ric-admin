import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as authApi from '@/api/auth'

export function useAuth() {
  const router = useRouter()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 从 localStorage 获取 token
  const getToken = () => {
    return localStorage.getItem('accessToken')
  }

  // 保存 token 到 localStorage
  const setToken = (token: string) => {
    localStorage.setItem('accessToken', token)
  }

  // 清除 token
  const clearToken = () => {
    localStorage.removeItem('accessToken')
  }

  // 登录
  const loginUser = async (username: string, password: string, captchaToken = 'dev-bypass-token') => {
    loading.value = true
    error.value = null

    try {
      const data = await authApi.login({
        username,
        password,
        captchaToken: captchaToken || 'dev-bypass-token',
      })

      if (data.accessToken) {
        setToken(data.accessToken)
        return true
      }
      return false
    } catch (err: any) {
      error.value = err?.message || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logoutUser = async () => {
    loading.value = true
    error.value = null

    try {
      await authApi.logout()
      clearToken()
      router.push('/login')
    } catch (err: any) {
      error.value = err?.message || '登出失败'
      // 即使接口失败也清除本地token
      clearToken()
      router.push('/login')
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await authApi.getUserInfo()
      return data
    } catch (err: any) {
      error.value = err?.message || '获取用户信息失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 检查是否已登录
  const isAuthenticated = () => {
    return !!getToken()
  }

  return {
    loading,
    error,
    loginUser,
    logoutUser,
    fetchUserInfo,
    isAuthenticated,
    getToken,
    setToken,
    clearToken,
  }
}
