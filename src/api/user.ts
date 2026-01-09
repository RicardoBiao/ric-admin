import { apiClient, type PaginationParams, type PaginationResponse } from './index'

// 用户数据类型（对应后端）
export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: string // admin, user, guest
  status: string // active, inactive
  department?: string
  position?: string
  avatar?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

// 登录参数
export interface LoginParams {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>
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
    return apiClient.get<PaginationResponse<User>>('/users/list', params)
  }

  // 获取单个用户详情
  static async getUser(id: number) {
    return apiClient.get<User>(`/users/detail/${id}`)
  }

  // 创建用户
  static async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return apiClient.post<User>('/users/create', user)
  }

  // 更新用户信息
  static async updateUser(id: number, user: Partial<User>) {
    return apiClient.post<User>('/users/update', { ...user, id })
  }

  // 删除用户
  static async deleteUser(id: number) {
    return apiClient.post<User>('/users/delete', { id })
  }

  // 批量删除用户
  static async batchDeleteUsers(ids: number[]) {
    return apiClient.post<{ deletedCount: number }>('/users/batch-delete', { ids })
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
  getUser,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  changePassword,
  getUserPermissions,
} = UserApi