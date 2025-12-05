import { ref, computed, reactive } from 'vue'
import { CustomerApi, type Customer, type CustomerQueryParams } from '@/api/customer'

// 客户管理组合式函数
export function useCustomers() {
  // 响应式状态
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  
  // 查询参数
  const queryParams = reactive<CustomerQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    type: '',
    status: ''
  })

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / (queryParams.pageSize || 10)))
  const hasNextPage = computed(() => (queryParams.page || 1) < totalPages.value)
  const hasPrevPage = computed(() => (queryParams.page || 1) > 1)

  // 获取客户列表
  const fetchCustomers = async (params?: Partial<CustomerQueryParams>) => {
    try {
      loading.value = true
      error.value = null
      
      // 合并查询参数
      const mergedParams = { ...queryParams, ...params }
      Object.assign(queryParams, mergedParams)
      
      const response = await CustomerApi.getCustomers(mergedParams)
      
      if (response.code === 200) {
        customers.value = response.data.list
        total.value = response.data.total
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取客户列表失败'
      console.error('Failed to fetch customers:', err)
    } finally {
      loading.value = false
    }
  }

  // 搜索客户
  const searchCustomers = async (search: string) => {
    queryParams.page = 1 // 重置到第一页
    await fetchCustomers({ search })
  }

  // 筛选客户
  const filterCustomers = async (filters: { type?: string; status?: string }) => {
    queryParams.page = 1 // 重置到第一页
    await fetchCustomers(filters)
  }

  // 分页
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      await fetchCustomers({ page })
    }
  }

  const nextPage = async () => {
    if (hasNextPage.value) {
      await goToPage((queryParams.page || 1) + 1)
    }
  }

  const prevPage = async () => {
    if (hasPrevPage.value) {
      await goToPage((queryParams.page || 1) - 1)
    }
  }

  // 创建客户
  const createCustomer = async (customerData: Omit<Customer, 'id' | 'createTime' | 'lastContact'>) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await CustomerApi.createCustomer(customerData)
      
      if (response.code === 200) {
        // 重新获取列表
        await fetchCustomers()
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建客户失败'
      console.error('Failed to create customer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新客户
  const updateCustomer = async (id: number, customerData: Partial<Customer>) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await CustomerApi.updateCustomer(id, customerData)
      
      if (response.code === 200) {
        // 更新本地数据
        const index = customers.value.findIndex(c => c.id === id)
        if (index !== -1) {
          customers.value[index] = response.data
        }
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新客户失败'
      console.error('Failed to update customer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除客户
  const deleteCustomer = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await CustomerApi.deleteCustomer(id)
      
      if (response.code === 200) {
        // 从本地数据中移除
        customers.value = customers.value.filter(c => c.id !== id)
        total.value -= 1
        
        // 如果当前页没有数据且不是第一页，回到上一页
        if (customers.value.length === 0 && (queryParams.page || 1) > 1) {
          await prevPage()
        }
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除客户失败'
      console.error('Failed to delete customer:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 批量删除客户
  const batchDeleteCustomers = async (ids: number[]) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await CustomerApi.batchDeleteCustomers(ids)
      
      if (response.code === 200) {
        // 重新获取列表
        await fetchCustomers()
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '批量删除客户失败'
      console.error('Failed to batch delete customers:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 重置查询参数
  const resetQuery = () => {
    Object.assign(queryParams, {
      page: 1,
      pageSize: 10,
      search: '',
      type: '',
      status: ''
    })
  }

  // 刷新数据
  const refresh = () => fetchCustomers()

  return {
    // 状态
    customers,
    loading,
    error,
    total,
    queryParams,
    
    // 计算属性
    totalPages,
    hasNextPage,
    hasPrevPage,
    
    // 方法
    fetchCustomers,
    searchCustomers,
    filterCustomers,
    goToPage,
    nextPage,
    prevPage,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    batchDeleteCustomers,
    resetQuery,
    refresh
  }
}