import { apiClient, type PaginationParams, type PaginationResponse } from './index'

// 客户数据类型
export interface Customer {
  id: number
  name: string
  type: string
  company: string
  contact: string
  phone: string
  email: string
  status: string
  createTime: string
  lastContact: string
  address?: string
  industry?: string
  revenue?: number
  description?: string
}

// 客户查询参数
export interface CustomerQueryParams extends PaginationParams {
  search?: string
  type?: string
  status?: string
}

// 客户统计信息
export interface CustomerStats {
  total: number
  active: number
  inactive: number
  enterprise: number
  individual: number
  growth: number
}

// 客户 API 服务
export class CustomerApi {
  // 获取客户列表
  static async getCustomers(params?: CustomerQueryParams) {
    return apiClient.get<PaginationResponse<Customer>>('/customers', params)
  }

  // 获取客户详情
  static async getCustomer(id: number) {
    return apiClient.get<Customer>(`/customers/${id}`)
  }

  // 创建客户
  static async createCustomer(customer: Omit<Customer, 'id' | 'createTime' | 'lastContact'>) {
    return apiClient.post<Customer>('/customers', customer)
  }

  // 更新客户
  static async updateCustomer(id: number, customer: Partial<Customer>) {
    return apiClient.put<Customer>(`/customers/${id}`, customer)
  }

  // 删除客户
  static async deleteCustomer(id: number) {
    return apiClient.delete(`/customers/${id}`)
  }

  // 批量删除客户
  static async batchDeleteCustomers(ids: number[]) {
    return apiClient.post('/customers/batch', { ids })
  }

  // 获取客户统计信息
  static async getCustomerStats() {
    return apiClient.get<CustomerStats>('/customers/stats')
  }
}

// 导出便捷方法
export const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  batchDeleteCustomers,
  getCustomerStats,
} = CustomerApi