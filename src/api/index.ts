// API 基础配置
export const API_BASE_URL = '/api'
import axios from 'axios';

// 响应数据类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页参数类型
export interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页响应类型
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// HTTP 请求封装
class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(
    url: string,
    method: string = 'GET',
    data?: any,
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const fullUrl = `${this.baseURL}${url}`
    
    // 添加认证 token（如果存在）
    const token = localStorage.getItem('accessToken')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await axios({
        url: fullUrl,
        method,
        headers,
        data,
        params,
      })

      return response.data
    } catch (error: any) {
      console.error('API request failed:', error)
      // 返回错误响应格式
      if (error.response?.data) {
        throw error.response.data
      }
      throw {
        code: error.response?.status || 500,
        message: error.message || 'Request failed',
        data: null
      }
    }
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'GET', undefined, params)
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'POST', data)
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'PUT', data)
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, 'DELETE')
  }
}

// 导出 API 客户端实例
export const apiClient = new ApiClient()

// 导出便捷方法（绑定 this）
export const get = apiClient.get.bind(apiClient)
export const post = apiClient.post.bind(apiClient)
export const put = apiClient.put.bind(apiClient)
export const del = apiClient.delete.bind(apiClient)