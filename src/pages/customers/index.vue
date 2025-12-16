<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Search, Filter } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TheLayout from '@/components/ric-ui/TheLayout.vue'
import { useCustomers } from '@/composables/useCustomers'

import {
  Card,
  CardContent,
} from '@/components/ui/card'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import RicTable from '@/components/ric-ui/RicTable.vue'


// 使用客户管理组合式函数
const {
  customers,
  loading,
  error,
  fetchCustomers,
  searchCustomers,
  filterCustomers,
  batchDeleteCustomers
} = useCustomers()

// 本地搜索和筛选状态
const searchQuery = ref('')
const selectedType = ref('all')
const selectedStatus = ref('all')
const selectedCustomers = ref<Array<number>>()

// 处理搜索
const handleSearch = async () => {
  await searchCustomers(searchQuery.value)
}

// 处理类型筛选
const handleTypeFilter = async (value: any) => {
  const type = (value ?? '') as string
  selectedType.value = type
  await filterCustomers({
    type: type === 'all' ? '' : type,
    status: selectedStatus.value === 'all' ? '' : selectedStatus.value
  })
}

// 处理状态筛选
const handleStatusFilter = async (value: any) => {
  const status = (value ?? '') as string
  selectedStatus.value = status
  await filterCustomers({
    type: selectedType.value === 'all' ? '' : selectedType.value,
    status: status === 'all' ? '' : status
  })
}

// 处理选择变化
const handleSelectionChange = async (selectedItems: Array<number>) => {
  console.log('选中的客户ID:', Array.from(selectedItems))
  selectedCustomers.value = selectedItems
}

// 批量删除选中的客户
const handleBatchDelete = async () => {
  console.log('handleBatchDelete ==>', selectedCustomers.value)
  if (selectedCustomers.value?.length === 0) {
    alert('请先选择要删除的客户')
    return
  }

  if (confirm(`确定要删除选中的 ${selectedCustomers.value?.length} 个客户吗？`)) {
    try {
      await batchDeleteCustomers(selectedCustomers.value as number[])
      alert('批量删除成功')
    } catch (error) {
      alert('批量删除失败')
    }
  }
}

// 监听搜索输入变化（防抖）
let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (_newValue) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch()
  }, 500)
})

// 组件挂载时获取数据
onMounted(() => {
  fetchCustomers()
})


</script>

<template>
  <TheLayout>
    <div class="space-y-4">
      <!-- 页面标题 -->
      <!-- <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">客户列表</h1>
          <p class="text-muted-foreground">
            管理您的客户信息，包括联系方式、状态和历史记录
          </p>
        </div>
        <Button class="gap-2">
          <Plus class="h-4 w-4" />
          添加客户
        </Button>
      </div> -->

      <!-- 搜索和筛选 -->
      <Card v-if="false">
        <CardContent>
          <!-- 批量操作 -->
          <div class="flex items-center gap-2 mt-4">
            <span class="text-sm text-gray-600">已选择 {{ selectedCustomers?.length || 0 }} 个客户</span>
            <Button variant="destructive" size="sm" @click="handleBatchDelete">
              批量删除
            </Button>
          </div>
        </CardContent>
      </Card>
      <RicTable :filteredCustomers="customers" :enableSelection="true" :loading="loading"
        @selection-change="handleSelectionChange">
        <template #header>
          <div class="flex flex-col gap-4 md:flex-row md:items-center">
            <!-- 搜索框 -->
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input v-model="searchQuery" placeholder="搜索客户名称、公司名称或联系人..." class="pl-10" />
            </div>

            <!-- 客户类型筛选 -->
            <Select v-model="selectedType" @update:model-value="handleTypeFilter">
              <SelectTrigger class="w-full md:w-[180px]">
                <SelectValue placeholder="客户类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="企业客户">企业客户</SelectItem>
                <SelectItem value="个人客户">个人客户</SelectItem>
                <SelectItem value="合作伙伴">合作伙伴</SelectItem>
              </SelectContent>
            </Select>

            <!-- 状态筛选 -->
            <Select v-model="selectedStatus" @update:model-value="handleStatusFilter">
              <SelectTrigger class="w-full md:w-[180px]">
                <SelectValue placeholder="客户状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">活跃</SelectItem>
                <SelectItem value="inactive">非活跃</SelectItem>
                <SelectItem value="pending">待激活</SelectItem>
                <SelectItem value="suspended">已暂停</SelectItem>
              </SelectContent>
            </Select>

            <!-- 筛选按钮 -->
            <Button variant="outline" class="gap-2">
              <Filter class="h-4 w-4" />
              高级筛选
            </Button>
          </div>
        </template>

      </RicTable>

      <!-- 错误提示 -->
      <div v-if="error" class="text-red-500 text-center py-4">
        {{ error }}
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <div
          class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          加载中...
        </div>
      </div>


    </div>
  </TheLayout>

</template>