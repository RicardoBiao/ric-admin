<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TheLayout from '@/components/ric-ui/TheLayout.vue'
import { useUsers } from '@/composables/useUsers'
import type { User } from '@/api/user'

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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  Label,
} from '@/components/ui/label'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Checkbox,
} from '@/components/ui/checkbox'

// 使用用户管理组合式函数
const {
  users,
  loading,
  fetchUsers,
  searchUsers,
  filterUsers,
  batchDeleteUsers,
  createUser,
  updateUser,
  deleteUser,
} = useUsers()

// 本地搜索和筛选状态
const searchQuery = ref('')
const selectedRole = ref('all')
const selectedStatus = ref('all')

// 选择相关状态
const selectedItems = ref<Set<number>>(new Set())
const isAllSelected = ref(false)

// 表单对话框
const isDialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const formData = ref<Partial<User>>({
  name: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  department: '',
  position: '',
})

// 处理角色筛选
const handleRoleFilter = async (value: any) => {
  const role = (value ?? '') as string
  selectedRole.value = role
  await filterUsers({
    role: role === 'all' ? '' : role,
    status: selectedStatus.value === 'all' ? '' : selectedStatus.value
  })
}

// 处理状态筛选
const handleStatusFilter = async (value: any) => {
  const status = (value ?? '') as string
  selectedStatus.value = status
  await filterUsers({
    role: selectedRole.value === 'all' ? '' : selectedRole.value,
    status: status === 'all' ? '' : status
  })
}

// 切换全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedItems.value.clear()
  } else {
    users.value.forEach(user => selectedItems.value.add(user.id))
  }
  isAllSelected.value = !isAllSelected.value
}

// 切换单个项选择
const toggleItemSelection = (userId: number) => {
  if (selectedItems.value.has(userId)) {
    selectedItems.value.delete(userId)
  } else {
    selectedItems.value.add(userId)
  }
  isAllSelected.value = users.value.length > 0 && users.value.every(user => selectedItems.value.has(user.id))
}

// 打开创建对话框
const openCreateDialog = () => {
  dialogMode.value = 'create'
  formData.value = {
    name: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    department: '',
    position: '',
  }
  isDialogOpen.value = true
}

// 打开编辑对话框
const openEditDialog = (user: User) => {
  dialogMode.value = 'edit'
  formData.value = { ...user }
  isDialogOpen.value = true
}

// 保存用户
const handleSaveUser = async () => {
  try {
    if (dialogMode.value === 'create') {
      await createUser(formData.value as Omit<User, 'id' | 'createdAt' | 'updatedAt'>)
      alert('创建成功')
    } else {
      await updateUser(formData.value.id!, formData.value)
      alert('更新成功')
    }
    isDialogOpen.value = false
  } catch (err) {
    alert(dialogMode.value === 'create' ? '创建失败' : '更新失败')
  }
}

// 删除单个用户
const handleDeleteUser = async (user: User) => {
  if (confirm(`确定要删除用户 ${user.name} 吗？`)) {
    try {
      await deleteUser(user.id)
      alert('删除成功')
    } catch (err) {
      alert('删除失败')
    }
  }
}

// 批量删除选中的用户
const handleBatchDelete = async () => {
  if (selectedItems.value.size === 0) {
    alert('请先选择要删除的用户')
    return
  }

  if (confirm(`确定要删除选中的 ${selectedItems.value.size} 个用户吗？`)) {
    try {
      await batchDeleteUsers(Array.from(selectedItems.value))
      selectedItems.value.clear()
      isAllSelected.value = false
      alert('批量删除成功')
    } catch (err) {
      alert('批量删除失败')
    }
  }
}

// 监听搜索输入变化（防抖）
let searchTimeout: ReturnType<typeof setTimeout>
const handleSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    await searchUsers(searchQuery.value)
  }, 500)
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <TheLayout>
    <div class="h-full flex flex-col">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold">用户管理</h1>
        <p class="text-muted-foreground mt-2">管理系统用户信息</p>
      </div>

      <!-- 搜索和筛选区域 -->
      <Card class="mb-6">
        <CardContent class="pt-6">
          <div class="flex flex-wrap items-center gap-4">
            <!-- 搜索框 -->
            <div class="flex-1 min-w-[200px]">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  @input="handleSearchInput"
                  placeholder="搜索用户姓名或邮箱..."
                  class="pl-9"
                />
              </div>
            </div>

            <!-- 角色筛选 -->
            <div class="w-[180px]">
              <Select :model-value="selectedRole" @update:model-value="handleRoleFilter">
                <SelectTrigger>
                  <SelectValue placeholder="所有角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有角色</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="guest">访客</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- 状态筛选 -->
            <div class="w-[180px]">
              <Select :model-value="selectedStatus" @update:model-value="handleStatusFilter">
                <SelectTrigger>
                  <SelectValue placeholder="所有状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-2">
              <Button @click="openCreateDialog">
                <Plus class="mr-2 h-4 w-4" />
                新建用户
              </Button>
              <Button
                variant="destructive"
                @click="handleBatchDelete"
                :disabled="selectedItems.size === 0"
              >
                <Trash2 class="mr-2 h-4 w-4" />
                批量删除
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 数据表格 -->
      <Card class="flex-1 flex flex-col">
        <CardContent class="pt-6 flex-1 flex flex-col">
          <div v-if="loading" class="text-center py-8 text-muted-foreground">
            加载中...
          </div>

          <div v-else-if="users.length === 0" class="text-center py-8 text-muted-foreground">
            暂无数据
          </div>
          
          <div v-else class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-12">
                    <Checkbox
                      :checked="isAllSelected"
                      @update:checked="toggleSelectAll"
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>职位</TableHead>
                  <TableHead class="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="user in users" :key="user.id">
                  <TableCell class="w-12">
                    <Checkbox
                      :checked="selectedItems.has(user.id)"
                      @update:checked="() => toggleItemSelection(user.id)"
                    />
                  </TableCell>
                  <TableCell>{{ user.id }}</TableCell>
                  <TableCell class="font-medium">{{ user.name }}</TableCell>
                  <TableCell>{{ user.email }}</TableCell>
                  <TableCell>{{ user.phone || '-' }}</TableCell>
                  <TableCell>
                    <span
                      :class="{
                        'px-2 py-1 rounded text-xs font-medium': true,
                        'bg-red-100 text-red-700': user.role === 'admin',
                        'bg-blue-100 text-blue-700': user.role === 'user',
                        'bg-gray-100 text-gray-700': user.role === 'guest',
                      }"
                    >
                      {{ user.role === 'admin' ? '管理员' : user.role === 'user' ? '普通用户' : '访客' }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      :class="{
                        'px-2 py-1 rounded text-xs font-medium': true,
                        'bg-green-100 text-green-700': user.status === 'active',
                        'bg-gray-100 text-gray-700': user.status === 'inactive',
                      }"
                    >
                      {{ user.status === 'active' ? '激活' : '未激活' }}
                    </span>
                  </TableCell>
                  <TableCell>{{ user.department || '-' }}</TableCell>
                  <TableCell>{{ user.position || '-' }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" @click="openEditDialog(user)">
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm" @click="handleDeleteUser(user)">
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <!-- 创建/编辑对话框 -->
      <Dialog v-model:open="isDialogOpen">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{{ dialogMode === 'create' ? '新建用户' : '编辑用户' }}</DialogTitle>
            <DialogDescription>
              {{ dialogMode === 'create' ? '填写用户信息以创建新用户' : '修改用户信息' }}
            </DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label for="name">姓名 *</Label>
              <Input id="name" v-model="formData.name" placeholder="请输入姓名" />
            </div>

            <div class="grid gap-2">
              <Label for="email">邮箱 *</Label>
              <Input id="email" v-model="formData.email" type="email" placeholder="请输入邮箱" />
            </div>

            <div class="grid gap-2">
              <Label for="phone">电话</Label>
              <Input id="phone" v-model="formData.phone" placeholder="请输入电话" />
            </div>

            <div class="grid gap-2">
              <Label for="role">角色</Label>
              <Select v-model="formData.role">
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="guest">访客</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <Label for="status">状态</Label>
              <Select v-model="formData.status">
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <Label for="department">部门</Label>
              <Input id="department" v-model="formData.department" placeholder="请输入部门" />
            </div>

            <div class="grid gap-2">
              <Label for="position">职位</Label>
              <Input id="position" v-model="formData.position" placeholder="请输入职位" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="isDialogOpen = false">取消</Button>
            <Button @click="handleSaveUser">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </TheLayout>
</template>
