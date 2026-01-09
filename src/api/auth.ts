import { post } from './index'

export interface LoginRequest {
  username: string
  password: string
  captchaToken: string
}

export interface LoginResponse {
  accessToken: string
}

export interface UserInfo {
  id: string
  username: string
  nickName: string
  avatar?: string
  status: string
}

export interface CaptchaChallenge {
  challenge: any
  token?: string
  expires: number
}

export interface CaptchaRedeemRequest {
  token: string
  solutions: number[]
}

export interface CaptchaRedeemResponse {
  success: boolean
  token?: string
  expires?: number
}

/**
 * 管理端登录
 */
export async function login(data: LoginRequest) {
  const res = await post<LoginResponse>('/admin/auth/login', data)
  return res.data
}

/**
 * 刷新 Token
 */
export async function refreshToken() {
  const res = await post<LoginResponse>('/admin/auth/refresh', {})
  return res.data
}

/**
 * 登出
 */
export async function logout() {
  const res = await post('/admin/auth/logout', {})
  return res.data
}

/**
 * 获取当前用户信息
 */
export async function getUserInfo() {
  const res = await post<UserInfo>('/admin/auth/identity', {})
  return res.data
}

/**
 * 创建验证码挑战
 */
export async function createChallenge() {
  const res = await post<CaptchaChallenge>('/admin/auth/challenge', {})
  // 后端直接返回 challenge 对象，不是包装在 response 结构中
  return res as unknown as CaptchaChallenge
}

/**
 * 验证用户解答
 */
export async function redeemChallenge(data: CaptchaRedeemRequest) {
  const res = await post<CaptchaRedeemResponse>('/admin/auth/redeem', data)
  // 后端直接返回 result 对象
  return res as unknown as CaptchaRedeemResponse
}
