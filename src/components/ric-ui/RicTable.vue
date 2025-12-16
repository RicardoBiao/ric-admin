<template>
    <!-- 客户列表 -->
    <Card>
        <CardHeader>
            <slot name="header">
            </slot>
        </CardHeader>
        <CardContent>
            <div class="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead v-if="enableSelection" class="w-12">
                                <Label class="flex items-center justify-center">
                                    <Checkbox
                                        :modelValue="isAllSelected"
                                        :indeterminate="isIndeterminate"
                                        @update:modelValue="toggleSelectAll"
                                    />
                                </Label>
                            </TableHead>
                            <TableHead>客户名称</TableHead>
                            <TableHead>客户类型</TableHead>
                            <TableHead>公司名称</TableHead>
                            <TableHead>联系人</TableHead>
                            <TableHead>联系电话</TableHead>
                            <TableHead>客户状态</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead class="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow v-for="customer in paginatedCustomers" :key="customer.id">
                            <TableCell v-if="enableSelection" class="w-12">
                                <Label class="flex items-center justify-center">
                                    <Checkbox
                                        :modelValue="selectedItems.has(customer.id)"
                                        @update:modelValue="() => toggleItemSelection(customer.id)"
                                    />
                                </Label>
                            </TableCell>
                            <TableCell class="font-medium">
                                {{ customer.name }}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {{ customer.type }}
                                </Badge>
                            </TableCell>
                            <TableCell>{{ customer.company }}</TableCell>
                            <TableCell>{{ customer.contact }}</TableCell>
                            <TableCell>{{ customer.phone }}</TableCell>
                            <TableCell>
                                <Badge :variant="getStatusBadge(customer.status)">
                                    {{ getStatusText(customer.status) }}
                                </Badge>
                            </TableCell>
                            <TableCell>{{ customer.createTime }}</TableCell>
                            <TableCell class="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger as-child>
                                        <Button variant="ghost" class="h-8 w-8 p-0">
                                            <span class="sr-only">打开菜单</span>
                                            <MoreHorizontal class="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                                        <DropdownMenuItem class="gap-2">
                                            <Eye class="h-4 w-4" />
                                            查看详情
                                        </DropdownMenuItem>
                                        <DropdownMenuItem class="gap-2">
                                            <Edit class="h-4 w-4" />
                                            编辑客户
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem class="gap-2 text-destructive">
                                            <Trash2 class="h-4 w-4" />
                                            删除客户
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <!-- 分页 -->
            <div class="mt-4 flex items-center justify-between">
                <div class="flex items-center justify-between">

                    <div class="flex items-center gap-2">
                        <span class="text-sm text-muted-foreground">每页显示</span>
                        <Select v-model="pageSize">
                            <SelectTrigger class="w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem :value="5">5</SelectItem>
                                <SelectItem :value="10">10</SelectItem>
                                <SelectItem :value="20">20</SelectItem>
                                <SelectItem :value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                        <span class="text-sm text-muted-foreground">条</span>
                    </div>
                    <div class="text-sm text-muted-foreground ml-8">
                        显示第 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize,
                            filteredCustomers.length)
                        }} 条，
                        共 {{ filteredCustomers.length }} 条记录
                    </div>
                </div>
                <div>
                    <Pagination v-slot="{ page }" :items-per-page="10" :total="30" :default-page="1">
                        <PaginationContent v-slot="{ items }">
                            <PaginationPrevious />

                            <template v-for="(item, index) in items" :key="index">
                                <PaginationItem v-if="item.type === 'page'" :value="item.value"
                                    :is-active="item.value === page">
                                    {{ item.value }}
                                </PaginationItem>
                            </template>

                            <PaginationEllipsis :index="4" />

                            <PaginationNext />
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

import { Button } from '@/components/ui/button'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'

interface Customer {
    id: string | number
  name: string
  type: string
  company: string
  contact: string
  phone: string
  status: string
  createTime: string
}

const props = defineProps<{
  customers?: Customer[]
  filteredCustomers: Customer[]
  enableSelection?: boolean
}>()

const emit = defineEmits(['selection-change'])

// 选择相关状态
const selectedItems = ref<Set<string | number>>(new Set())
const isAllSelected = computed(() => {
  return paginatedCustomers.value.length > 0 && 
         paginatedCustomers.value.every((item: Customer) => selectedItems.value.has(item.id))
})
const isIndeterminate = computed(() => {
  const selectedCount = paginatedCustomers.value.filter((item: Customer) => selectedItems.value.has(item.id)).length
  return selectedCount > 0 && selectedCount < paginatedCustomers.value.length
})

// 全选/取消全选
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消选择当前页所有项
    paginatedCustomers.value.forEach((item: Customer) => {
      selectedItems.value.delete(item.id)
    })
  } else {
    // 选择当前页所有项
    paginatedCustomers.value.forEach((item: Customer) => {
      selectedItems.value.add(item.id)
    })
  }
  emit('selection-change', selectedItems.value)
  console.log(isAllSelected.value, selectedItems.value)
}

// 切换单个项选择
const toggleItemSelection = (itemId: string | number) => {
  if (selectedItems.value.has(itemId)) {
    selectedItems.value.delete(itemId)
  } else {
    selectedItems.value.add(itemId)
  }
  emit('selection-change', Array.from(selectedItems.value))
}


const currentPage = ref(1)
const pageSize = ref(10)



// 分页数据
const paginatedCustomers = computed<Customer[]>(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return (props.filteredCustomers || []).slice(start, end)
})

const getStatusBadge = (status: string) => {
  return status === 'active' ? 'default' : 'secondary'
}

const getStatusText = (status: string) => {
  return status === 'active' ? '活跃' : '非活跃'
}

</script>