import { apiClient, type PaginationParams, type PaginationResponse } from './index'

// 用户数据类型
export interface User {
  id: number
  username: string
  email: string
  name: string
  avatar: string
  role: string
  status: string
  phone: string
  department: string
  position: string
  createTime: string
  lastLoginTime: string
  permissions: string[]
}

// 登录参数
export interface LoginParams {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: Pick<User, 'id' | 'username' | 'email' | 'name' | 'avatar' | 'role' | 'permissions'>
}

// 用户查询参数
export interface UserQueryParams extends PaginationParams {
  search?: string
  role?: string
  status?: string
}

// 修改密码参数
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

// 用户 API 服务
export class UserApi {
  // 用户登录
  static async login(params: LoginParams) {
    return apiClient.post<LoginResponse>('/auth/login', params)
  }

  // 获取当前用户信息
  static async getCurrentUser() {
    return apiClient.get<User>('/auth/me')
  }

  // 用户登出
  static async logout() {
    return apiClient.post('/auth/logout')
  }

  // 获取用户列表
  static async getUsers(params?: UserQueryParams) {
    return apiClient.get<PaginationResponse<User>>('/users', params)
  }

  // 更新用户信息
  static async updateUser(id: number, user: Partial<User>) {
    return apiClient.put<User>(`/users/${id}`, user)
  }

  // 修改密码
  static async changePassword(params: ChangePasswordParams) {
    return apiClient.post('/auth/change-password', params)
  }

  // 获取用户权限
  static async getUserPermissions() {
    return apiClient.get<string[]>('/auth/permissions')
  }
}

// 导出便捷方法
export const {
  login,
  getCurrentUser,
  logout,
  getUsers,
  updateUser,
  changePassword,
  getUserPermissions,
} = UserApi