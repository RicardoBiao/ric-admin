import { ref, computed, reactive } from 'vue'
import { UserApi, type User, type UserQueryParams } from '@/api/user'

// 用户管理组合式函数
export function useUsers() {
  // 响应式状态
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  
  // 查询参数
  const queryParams = reactive<UserQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    role: '',
    status: ''
  })

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / (queryParams.pageSize || 10)))
  const hasNextPage = computed(() => (queryParams.page || 1) < totalPages.value)
  const hasPrevPage = computed(() => (queryParams.page || 1) > 1)

  // 获取用户列表
  const fetchUsers = async (params?: Partial<UserQueryParams>) => {
    try {
      loading.value = true
      error.value = null
      
      // 合并查询参数
      const mergedParams = { ...queryParams, ...params }
      Object.assign(queryParams, mergedParams)
      
      const response = await UserApi.getUsers(mergedParams)
      
      if (response.code === 200) {
        users.value = response.data.list
        total.value = response.data.total
      } else {
        throw new Error(response.message)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取用户列表失败'
      console.error('Failed to fetch users:', err)
    } finally {
      loading.value = false
    }
  }

  // 搜索用户
  const searchUsers = async (search: string) => {
    queryParams.page = 1 // 重置到第一页
    await fetchUsers({ search })
  }

  // 筛选用户
  const filterUsers = async (filters: { role?: string; status?: string }) => {
    queryParams.page = 1 // 重置到第一页
    await fetchUsers(filters)
  }

  // 分页
  const goToPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      await fetchUsers({ page })
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

  // 创建用户
  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await UserApi.createUser(userData)
      
      if (response.code === 200) {
        // 重新获取列表
        await fetchUsers()
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err: any) {
      const message = err?.message || '创建用户失败'
      error.value = message
      console.error('Failed to create user:', err)
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 更新用户
  const updateUser = async (id: number, userData: Partial<User>) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await UserApi.updateUser(id, userData)
      
      if (response.code === 200) {
        // 重新获取列表
        await fetchUsers()
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err: any) {
      const message = err?.message || '更新用户失败'
      error.value = message
      console.error('Failed to update user:', err)
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 删除用户
  const deleteUser = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await UserApi.deleteUser(id)
      
      if (response.code === 200) {
        // 重新获取列表
        await fetchUsers()
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err: any) {
      const message = err?.message || '删除用户失败'
      error.value = message
      console.error('Failed to delete user:', err)
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 批量删除用户
  const batchDeleteUsers = async (ids: number[]) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await UserApi.batchDeleteUsers(ids)
      
      if (response.code === 200) {
        // 重新获取列表
        await fetchUsers()
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err: any) {
      const message = err?.message || '批量删除用户失败'
      error.value = message
      console.error('Failed to batch delete users:', err)
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  // 获取单个用户详情
  const getUser = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      
      const response = await UserApi.getUser(id)
      
      if (response.code === 200) {
        return response.data
      } else {
        throw new Error(response.message)
      }
    } catch (err: any) {
      const message = err?.message || '获取用户详情失败'
      error.value = message
      console.error('Failed to fetch user:', err)
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    error,
    total,
    queryParams,
    totalPages,
    hasNextPage,
    hasPrevPage,
    fetchUsers,
    searchUsers,
    filterUsers,
    goToPage,
    nextPage,
    prevPage,
    createUser,
    updateUser,
    deleteUser,
    batchDeleteUsers,
    getUser,
  }
}
