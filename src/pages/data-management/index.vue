<template>
  <div class="flex h-screen bg-background">
    <!-- 左侧侧边栏 - 按批次显示 -->
    <div class="w-64 border-r bg-card flex flex-col">
      <div class="p-4 border-b">
        <h2 class="text-lg font-semibold">数据管理</h2>
        <p class="text-xs text-muted-foreground mt-1">
          共 {{ stats.totalRecords }} 个文件，{{ stats.batchCount }} 个批次
        </p>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2">
        <div class="space-y-1">
          <!-- 全部数据 -->
          <button
            @click="selectBatch(null)"
            :class="[
              'w-full px-3 py-2 text-left rounded-md text-sm transition-colors',
              selectedBatchId === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            ]"
          >
            <div class="flex items-center justify-between">
              <span>📊 全部文件</span>
              <span class="text-xs">{{ stats.totalRecords }}</span>
            </div>
          </button>

          <!-- 按批次分类 -->
          <div
            v-for="batch in batches"
            :key="batch.id"
            class="group"
          >
            <button
              @click="selectBatch(batch.id)"
              :class="[
                'w-full px-3 py-2 text-left rounded-md text-sm transition-colors',
                selectedBatchId === batch.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="truncate flex-1">{{ batch.name }}</span>
                <div class="flex items-center gap-1">
                  <button
                    @click.stop="uploadToBatch(batch.id, batch.name)"
                    class="opacity-0 group-hover:opacity-100 p-1 hover:bg-background/20 rounded transition-opacity"
                    title="向该批次添加文件"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </button>
                  <span class="text-xs ml-1">
                    {{ batch.count }}
                  </span>
                </div>
              </div>
              <div class="text-xs opacity-75 mt-1">
                {{ formatDateTime(batch.savedAt) }}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 头部筛选 -->
      <div class="border-b bg-card p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold">
              {{ selectedBatchId ? batches.find(b => b.id === selectedBatchId)?.name : '全部文件' }}
            </h1>
            <p class="text-sm text-muted-foreground mt-1">
              共 {{ filteredRecords.length }} 个文件
              <span v-if="selectedRecords.length > 0" class="ml-2">· 已选中 {{ selectedRecords.length }} 个</span>
            </p>
          </div>
          <div class="flex gap-2">
            <Button
              v-if="selectedRecords.length > 0"
              variant="outline"
              size="sm"
              @click="handleAutoTag"
            >
              🏷️ AI打标 ({{ selectedRecords.length }})
            </Button>
            <Button
              v-if="selectedRecords.length > 0"
              variant="default"
              size="sm"
              @click="showAnalysisDialog = true"
            >
              📊 DeepSeek 分析 ({{ selectedRecords.length }})
            </Button>
            <Button
              v-if="selectedRecords.length > 0"
              variant="destructive"
              size="sm"
              @click="handleBatchDelete"
            >
              删除 ({{ selectedRecords.length }})
            </Button>
          </div>
        </div>

        <!-- 筛选器 -->
        <div class="flex gap-3 items-center">
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="handleSelectAllClick"
              id="select-all"
              class="w-4 h-4 cursor-pointer"
            />
            <label 
              for="select-all" 
              class="text-sm cursor-pointer"
              @click.prevent="handleSelectAllClick"
            >
              全选 ({{ selectedRecords.length }}/{{ paginatedRecords.length }})
            </label>
          </div>
          <Input
            v-model="searchQuery"
            placeholder="搜索文件名..."
            class="max-w-xs"
          />
          <Select v-model="sortBy">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">最新保存</SelectItem>
              <SelectItem value="oldest">最早保存</SelectItem>
              <SelectItem value="name">文件名</SelectItem>
              <SelectItem value="size">文件大小</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- 数据列表 - Mac风格列表布局 -->
      <div class="flex-1 overflow-y-auto flex flex-col">
        <div v-if="paginatedRecords.length === 0" class="text-center py-12">
          <div class="text-muted-foreground">
            <p class="text-lg">暂无数据</p>
            <p class="text-sm mt-2">
              在数据导入页面保存数据后会显示在这里
            </p>
          </div>
        </div>

        <!-- 表头 -->
        <div v-else class="sticky top-0 bg-muted/50 border-b z-10">
          <div class="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground">
            <div class="w-4 flex-shrink-0"><!-- 复选框占位 --></div>
            <div class="w-10 flex-shrink-0"><!-- 图标占位 --></div>
            <div class="w-80 flex-shrink-0">文件名称</div>
            <div class="w-80 flex-shrink-0">标签</div>
            <div class="flex-1">批次</div>
            <div class="flex-1">大小</div>
            <div class="flex-1 text-right">上传时间</div>
            <div class="w-32 flex-shrink-0"><!-- 操作按钮占位 --></div>
          </div>
        </div>

        <!-- 列表内容 -->
        <div v-if="paginatedRecords.length > 0" class="flex-1 divide-y">
          <div
            v-for="record in paginatedRecords"
            :key="record.id"
            class="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer group"
            :class="{ 'bg-primary/5': selectedRecords.includes(record.id) }"
            @click="viewDetails(record)"
          >
            <!-- 复选框 -->
            <div @click.stop class="flex items-center">
              <input
                type="checkbox"
                :checked="selectedRecords.includes(record.id)"
                @change="toggleSelection(record.id)"
                class="w-4 h-4 cursor-pointer"
              />
            </div>

            <!-- 文件图标/预览 -->
            <div class="flex-shrink-0">
              <!-- 图片缩略图 -->
              <div v-if="record.fileContent && record.fileType?.startsWith('image/')" 
                   class="w-10 h-10 rounded overflow-hidden border">
                <img :src="record.fileContent" class="w-full h-full object-cover" />
              </div>
              <!-- PDF图标 -->
              <div v-else-if="record.fileType?.includes('pdf')" 
                   class="w-10 h-10 rounded bg-red-50 flex items-center justify-center">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
              <!-- Excel图标 -->
              <div v-else-if="record.fileType?.includes('sheet') || record.fileType?.includes('excel')" 
                   class="w-10 h-10 rounded bg-green-50 flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <!-- 通用文件图标 -->
              <div v-else class="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
            </div>

            <!-- 文件信息 -->
            <div class="w-80 flex-shrink-0">
              <div class="flex items-center gap-2">
                <h3 class="font-medium text-sm truncate">
                  {{ record.fileName }}
                </h3>
              </div>
            </div>

            <!-- 标签 -->
            <div class="w-80 flex-shrink-0">
              <div v-if="record.tags && record.tags.length > 0" class="flex gap-1 flex-wrap">
                <span
                  v-for="tag in record.tags"
                  :key="tag"
                  class="inline-block px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                  @click.stop="editTags(record)"
                  title="点击编辑标签"
                >
                  {{ tag }}
                </span>
              </div>
              <button
                v-else
                @click.stop="editTags(record)"
                class="text-xs text-muted-foreground hover:text-primary transition-colors"
                title="添加标签"
              >
                + 添加
              </button>
            </div>

            <!-- 批次 -->
            <div class="flex-1">
              <div class="text-xs text-muted-foreground truncate" :title="record.batchName">
                {{ record.batchName }}
              </div>
            </div>

            <!-- 文件大小 -->
            <div class="flex-1">
              <div class="text-xs text-muted-foreground">
                {{ formatFileSize(record.fileSize) }}
                <span v-if="record.rowCount" class="block">
                  {{ record.rowCount }}行
                </span>
              </div>
            </div>

            <!-- 修改时间 -->
            <div class="text-xs text-muted-foreground flex-1 text-right">
              {{ formatDateTime(record.savedAt) }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-32 flex-shrink-0" @click.stop>
              <Button
                size="sm"
                variant="ghost"
                class="h-8 w-8 p-0"
                @click="viewDetails(record)"
                title="查看"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </Button>
              <Button
                v-if="record.data"
                size="sm"
                variant="ghost"
                class="h-8 w-8 p-0"
                @click="exportRecord(record)"
                title="导出"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                class="h-8 w-8 p-0 text-destructive hover:text-destructive"
                @click="confirmDelete(record.id)"
                title="删除"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="border-t bg-card p-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            显示 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredRecords.length) }} 
            / 共 {{ filteredRecords.length }} 条
          </div>
          <div class="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              上一页
            </Button>
            <div class="flex gap-1">
              <Button
                v-for="page in displayPages"
                :key="page"
                size="sm"
                :variant="page === currentPage ? 'default' : 'outline'"
                @click="currentPage = page"
              >
                {{ page }}
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <Dialog v-model:open="showDetails">
      <DialogContent class="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{{ selectedRecord?.fileName }}</DialogTitle>
        </DialogHeader>
        <div v-if="selectedRecord" class="overflow-y-auto">
          <div class="space-y-4">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">批次名称：</span>
                <span class="font-medium">{{ selectedRecord.batchName }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">保存时间：</span>
                <span class="font-medium">{{ formatDateTime(selectedRecord.savedAt) }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">文件大小：</span>
                <span class="font-medium">{{ formatFileSize(selectedRecord.fileSize) }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">文件类型：</span>
                <span class="font-medium">{{ selectedRecord.fileType || '未知' }}</span>
              </div>
              <div v-if="selectedRecord.rowCount">
                <span class="text-muted-foreground">数据行数：</span>
                <span class="font-medium">{{ selectedRecord.rowCount }} 行</span>
              </div>
              <div v-if="selectedRecord.description">
                <span class="text-muted-foreground">描述：</span>
                <span class="font-medium">{{ selectedRecord.description }}</span>
              </div>
            </div>

            <!-- 图片预览 -->
            <div v-if="selectedRecord.fileContent && selectedRecord.fileType?.startsWith('image/')">
              <h4 class="font-medium mb-2">图片预览</h4>
              <div class="border rounded-lg p-4 bg-muted/30">
                <img :src="selectedRecord.fileContent" class="max-w-full max-h-[400px] rounded" />
              </div>
            </div>

            <!-- 数据预览(仅Excel) -->
            <div v-if="selectedRecord.data && selectedRecord.data.length > 0">
              <h4 class="font-medium mb-2">数据预览（前10条）</h4>
              <div class="border rounded-lg overflow-hidden">
                <div class="max-h-[300px] overflow-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-muted sticky top-0">
                      <tr>
                        <th class="px-3 py-2 text-left font-medium">#</th>
                        <th
                          v-for="(key, index) in Object.keys(selectedRecord.data[0])"
                          :key="index"
                          class="px-3 py-2 text-left font-medium"
                        >
                          {{ key }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, index) in selectedRecord.data.slice(0, 10)"
                        :key="index"
                        class="border-t hover:bg-muted/50"
                      >
                        <td class="px-3 py-2 text-muted-foreground">{{ index + 1 }}</td>
                        <td
                          v-for="(key, keyIndex) in Object.keys(row)"
                          :key="keyIndex"
                          class="px-3 py-2"
                        >
                          {{ row[key] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 分析诉求对话框 -->
    <Dialog v-model:open="showAnalysisDialog">
      <DialogContent class="max-w-3xl">
        <DialogHeader>
          <DialogTitle>DeepSeek 数据分析</DialogTitle>
          <DialogDescription>
            已选择 {{ selectedDataForAnalysis.length }} 个文件
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <!-- 数据预览 -->
          <div>
            <h4 class="text-sm font-medium mb-2">选中的文件</h4>
            <div class="border rounded-lg p-3 bg-muted/30 max-h-32 overflow-y-auto">
              <div class="space-y-1 text-sm">
                <div
                  v-for="record in selectedDataForAnalysis"
                  :key="record.id"
                  class="flex items-center justify-between"
                >
                  <span>{{ record.fileName }}</span>
                  <span class="text-xs text-muted-foreground">
                    {{ record.batchName }} · {{ formatFileSize(record.fileSize) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 分析标题 -->
          <div>
            <label class="text-sm font-medium mb-2 block">分析标题</label>
            <Input
              v-model="analysisTitle"
              placeholder="例如：Q1季度销售趋势分析"
            />
          </div>

          <!-- 诉求模板选择 -->
          <div v-if="promptTemplates.length > 0">
            <label class="text-sm font-medium mb-2 block">使用已保存的诉求</label>
            <Select @update:model-value="applyPromptTemplate">
              <SelectTrigger>
                <SelectValue placeholder="选择分析诉求模板" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="template in promptTemplates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 分析诉求输入 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium">分析诉求</label>
              <Button
                v-if="analysisPrompt.trim()"
                variant="ghost"
                size="sm"
                @click="showSavePromptDialog = true"
              >
                💾 保存为模板
              </Button>
            </div>
            <Textarea
              v-model="analysisPrompt"
              placeholder="请描述您希望 DeepSeek 如何分析这些数据，例如：&#10;- 分析客户交易趋势&#10;- 找出异常数据点&#10;- 生成统计报告&#10;- 提供业务建议"
              rows="6"
              class="resize-none"
            />
          </div>

          <!-- 底部按钮 -->
          <div class="flex justify-between items-center pt-4">
            <div class="text-xs text-muted-foreground">
              分析结果将保存到"分析历史"页面
            </div>
            <div class="flex gap-2">
              <Button variant="outline" @click="showAnalysisDialog = false">
                取消
              </Button>
              <Button
                @click="handleSubmitAnalysis"
                :disabled="analyzing || !analysisPrompt.trim() || !analysisTitle.trim()"
              >
                <span v-if="analyzing">分析中...</span>
                <span v-else>开始分析</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 保存诉求模板对话框 -->
    <Dialog v-model:open="showSavePromptDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>保存分析诉求</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">模板名称</label>
            <Input
              v-model="promptTemplateName"
              placeholder="例如：销售趋势分析"
            />
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showSavePromptDialog = false">
              取消
            </Button>
            <Button
              @click="handleSavePromptTemplate"
              :disabled="!promptTemplateName.trim()"
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 浮动按钮组 -->
    <div class="fixed bottom-8 right-8 flex flex-col gap-3">
      <!-- 跳转到分析历史页面按钮 -->
      <button
        @click="router.push('/analysis-results')"
        class="w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        title="查看分析历史"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </button>
      
      <!-- 导入数据按钮 -->
      <button
        @click="showImportSheet = true"
        class="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        title="导入数据"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>

    <!-- 数据导入侧滑组件 -->
    <FileImportSheet
      v-model:open="showImportSheet"
      :batch-id="uploadBatchId"
      :batch-name="uploadBatchName"
      @saved="handleDataImported"
    />

    <!-- 标签编辑对话框 -->
    <Dialog v-model:open="showTagsDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑标签</DialogTitle>
          <DialogDescription>
            为文件添加分类标签，多个标签用空格或逗号分隔
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <!-- 当前标签 -->
          <div v-if="editingRecord">
            <label class="text-sm font-medium mb-2 block">当前标签</label>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(tag, index) in editingTags"
                :key="index"
                class="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full bg-primary/10 text-primary"
              >
                {{ tag }}
                <button
                  @click="removeTag(index)"
                  class="hover:text-destructive"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </span>
              <span v-if="editingTags.length === 0" class="text-sm text-muted-foreground">
                暂无标签
              </span>
            </div>
          </div>

          <!-- 添加新标签 -->
          <div>
            <label class="text-sm font-medium mb-2 block">添加标签</label>
            <div class="flex gap-2">
              <Input
                v-model="newTag"
                placeholder="输入标签名称"
                @keyup.enter="addNewTag"
              />
              <Button @click="addNewTag">添加</Button>
            </div>
          </div>

          <!-- 推荐标签 -->
          <div v-if="sortedTags.length > 0">
            <label class="text-sm font-medium mb-2 block">推荐标签（点击添加）</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tag in sortedTags.slice(0, 10)"
                :key="tag.name"
                @click="addExistingTag(tag.name)"
                :disabled="editingTags.includes(tag.name)"
                class="px-2 py-1 text-xs rounded-full border transition-colors"
                :class="editingTags.includes(tag.name) 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'hover:bg-primary/10 hover:border-primary'"
              >
                {{ tag.name }} ({{ tag.count }})
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="showTagsDialog = false">取消</Button>
          <Button @click="saveTags">保存</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- PDF 查看器 -->
    <PdfViewer
      v-model:open="showPdfViewer"
      :file-name="pdfViewerData.fileName"
      :file-content="pdfViewerData.fileContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSavedData } from '@/composables/useSavedData'
import { useTags } from '@/composables/useTags'
import { useAnalysisPrompts, useAnalysisRecords } from '@/composables/useAnalysis'
import type { SavedDataRecord } from '@/composables/useSavedData'
import FileImportSheet from '@/components/FileImportSheet.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import { toast } from 'vue-sonner'
import { getDeepSeekClient, autoTagFiles } from '@/api/deepseek'
import { parseChartsFromDeepSeek } from '@/utils/chartParser'

const router = useRouter()

const {
  records,
  getBatches,
  getStats,
  deleteRecord,
  deleteRecords,
  updateRecordTags,
  getStorageInfo
} = useSavedData()

const {
  tags,
  sortedTags,
  addTag,
  incrementTagCount
} = useTags()

const {
  templates: promptTemplates,
  createTemplate: createPromptTemplate,
  updateLastUsed
} = useAnalysisPrompts()

const {
  createRecord: createAnalysisRecord
} = useAnalysisRecords()

// 批次列表
const batches = computed(() => getBatches())

// 筛选和排序
const selectedBatchId = ref<string | null>(null)
const searchQuery = ref('')
const sortBy = ref('latest')
const selectedRecords = ref<string[]>([])

// 分页
const currentPage = ref(1)
const pageSize = ref(20) // 网格布局下增加每页数量

// 详情
const showDetails = ref(false)
const selectedRecord = ref<SavedDataRecord | null>(null)

// PDF 查看
const showPdfViewer = ref(false)
const pdfViewerData = ref<{ fileName: string; fileContent: string }>({ fileName: '', fileContent: '' })

// 标签编辑
const showTagsDialog = ref(false)
const editingRecord = ref<SavedDataRecord | null>(null)
const editingTags = ref<string[]>([])
const newTag = ref('')

// 导入侧滑
const showImportSheet = ref(false)
const uploadBatchId = ref<string | undefined>(undefined)
const uploadBatchName = ref<string | undefined>(undefined)

// 分析对话框
const showAnalysisDialog = ref(false)
const analysisTitle = ref('')
const analysisPrompt = ref('')
const analyzing = ref(false)
const showSavePromptDialog = ref(false)
const promptTemplateName = ref('')

// 自动打标
const autoTagging = ref(false)

// 统计信息
const stats = computed(() => getStats())

// 数据导入完成后刷新列表
const handleDataImported = () => {
  currentPage.value = 1
  selectedRecords.value = []
  // 重置上传批次参数
  uploadBatchId.value = undefined
  uploadBatchName.value = undefined
  toast.success('文件已导入并保存')
}

// 选择批次
const selectBatch = (batchId: string | null) => {
  selectedBatchId.value = batchId
  currentPage.value = 1
  selectedRecords.value = []
}

// 过滤后的记录
const filteredRecords = computed(() => {
  let filtered = records.value

  // 按批次筛选
  if (selectedBatchId.value) {
    filtered = filtered.filter(r => r.batchId === selectedBatchId.value)
  }

  // 按文件名搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r => 
      r.fileName.toLowerCase().includes(query)
    )
  }

  // 排序
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy.value) {
      case 'latest':
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      case 'oldest':
        return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
      case 'name':
        return a.fileName.localeCompare(b.fileName)
      case 'size':
        return b.fileSize - a.fileSize
      default:
        return 0
    }
  })

  return filtered
})

// 分页计算
const totalPages = computed(() => {
  return Math.ceil(filteredRecords.value.length / pageSize.value)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

const displayPages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
    } else if (current >= total - 3) {
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      for (let i = current - 2; i <= current + 2; i++) pages.push(i)
    }
  }
  
  return pages
})

// 格式化日期
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 选中用于分析的数据记录
const selectedDataForAnalysis = computed(() => {
  return records.value.filter(r => selectedRecords.value.includes(r.id))
})

// 选择/取消选择
const toggleSelection = (id: string) => {
  console.log('[toggleSelection 调用]', { 
    id, 
    当前数组: selectedRecords.value,
    数组长度: selectedRecords.value.length 
  })
  
  const index = selectedRecords.value.indexOf(id)
  console.log('[indexOf 结果]', { index })
  
  if (index >= 0) {
    selectedRecords.value.splice(index, 1)
    console.log('[取消选择完成]', { 
      id, 
      剩余数组: selectedRecords.value,
      剩余长度: selectedRecords.value.length 
    })
  } else {
    selectedRecords.value.push(id)
    console.log('[添加选择完成]', { 
      id, 
      新数组: selectedRecords.value,
      新长度: selectedRecords.value.length 
    })
  }
  
  // 强制触发响应式更新
  console.log('[强制检查] selectedRecords.value.length =', selectedRecords.value.length)
}

// 全选/取消全选 - 简化版本
const isAllSelected = computed(() => {
  if (paginatedRecords.value.length === 0) return false
  
  // 检查当前页的所有记录是否都被选中
  const currentPageIds = paginatedRecords.value.map(r => r.id)
  const allSelected = currentPageIds.every(id => selectedRecords.value.includes(id))
  
  console.log('[全选状态检查]', {
    当前页数量: paginatedRecords.value.length,
    总选中数量: selectedRecords.value.length,
    当前页ID: currentPageIds,
    是否全选: allSelected
  })
  
  return allSelected
})

const toggleSelectAll = (checked: boolean | string) => {
  console.log('[toggleSelectAll] 开始', { 
    checked, 
    type: typeof checked,
    转换为布尔: Boolean(checked)
  })
  
  const currentPageIds = paginatedRecords.value.map(r => r.id)
  
  if (checked) {
    // 全选：添加当前页所有ID到选中列表
    console.log('[执行全选] 当前页ID:', currentPageIds)
    currentPageIds.forEach(id => {
      if (!selectedRecords.value.includes(id)) {
        selectedRecords.value.push(id)
      }
    })
    console.log('[全选完成] 选中数量:', selectedRecords.value.length)
  } else {
    // 取消全选：从选中列表移除当前页所有ID
    console.log('[执行取消全选] 移除ID:', currentPageIds)
    selectedRecords.value = selectedRecords.value.filter(id => !currentPageIds.includes(id))
    console.log('[取消全选完成] 剩余数量:', selectedRecords.value.length)
  }
}

// 点击标签触发全选
const handleSelectAllClick = () => {
  console.log('[handleSelectAllClick] 点击全选标签')
  const shouldSelectAll = !isAllSelected.value
  console.log('[handleSelectAllClick] 应该全选?', shouldSelectAll)
  
  const currentPageIds = paginatedRecords.value.map(r => r.id)
  
  if (shouldSelectAll) {
    // 全选当前页
    currentPageIds.forEach(id => {
      if (!selectedRecords.value.includes(id)) {
        selectedRecords.value.push(id)
      }
    })
    console.log('[手动全选完成] 已选中:', selectedRecords.value.length)
  } else {
    // 取消全选当前页
    selectedRecords.value = selectedRecords.value.filter(id => !currentPageIds.includes(id))
    console.log('[手动取消全选完成] 剩余:', selectedRecords.value.length)
  }
}

// AI 自动打标
const handleAutoTag = async () => {
  if (selectedRecords.value.length === 0) {
    toast.error('请先选择文件')
    return
  }

  autoTagging.value = true

  try {
    const selectedFiles = records.value.filter(r => selectedRecords.value.includes(r.id))
    toast.info(`正在为 ${selectedFiles.length} 个文件进行AI分类标注...`)
    
    let successCount = 0
    
    // 逐个文件调用AI打标
    for (const file of selectedFiles) {
      try {
        const fileInfo = [{
          fileName: file.fileName,
          fileType: file.fileType,
          description: file.description,
          data: file.data
        }]
        
        const fileTags = await autoTagFiles(fileInfo)
        
        if (fileTags.length > 0) {
          // 添加标签到标签库
          fileTags.forEach(tag => {
            if (!tags.value.find(t => t.name === tag)) {
              addTag(tag)
            }
          })
          
          // 为该文件打标
          updateRecordTags(file.id, fileTags)
          successCount++
        }
      } catch (error) {
        console.error(`为文件 ${file.fileName} 打标失败:`, error)
      }
    }
    
    if (successCount > 0) {
      toast.success(`成功为 ${successCount} 个文件完成AI分类标注`)
      selectedRecords.value = []
    } else {
      toast.error('AI未能识别合适的标签')
    }
  } catch (error) {
    console.error('自动打标失败:', error)
    toast.error('自动打标失败，请检查DeepSeek配置')
  } finally {
    autoTagging.value = false
  }
}

// 编辑标签
const editTags = (record: SavedDataRecord) => {
  editingRecord.value = record
  editingTags.value = [...(record.tags || [])]
  newTag.value = ''
  showTagsDialog.value = true
}

// 添加新标签
const addNewTag = () => {
  const tag = newTag.value.trim()
  if (!tag) return
  
  if (editingTags.value.includes(tag)) {
    toast.error('标签已存在')
    return
  }
  
  editingTags.value.push(tag)
  newTag.value = ''
}

// 添加已有标签
const addExistingTag = (tag: string) => {
  if (!editingTags.value.includes(tag)) {
    editingTags.value.push(tag)
  }
}

// 移除标签
const removeTag = (index: number) => {
  editingTags.value.splice(index, 1)
}

// 保存标签
const saveTags = () => {
  if (!editingRecord.value) return
  
  // 更新记录标签
  updateRecordTags(editingRecord.value.id, editingTags.value)
  
  // 将新标签添加到标签库
  editingTags.value.forEach(tag => {
    if (!tags.value.find(t => t.name === tag)) {
      addTag(tag)
    } else {
      incrementTagCount(tag)
    }
  })
  
  toast.success('标签已更新')
  showTagsDialog.value = false
  editingRecord.value = null
  editingTags.value = []
}

// 向批次上传文件
const uploadToBatch = (batchId: string, batchName: string) => {
  uploadBatchId.value = batchId
  uploadBatchName.value = batchName
  showImportSheet.value = true
}

// 应用诉求模板
const applyPromptTemplate = (templateId: any) => {
  if (!templateId || typeof templateId !== 'string') return
  const template = promptTemplates.value.find(t => t.id === templateId)
  if (template) {
    analysisPrompt.value = template.content
    updateLastUsed(templateId)
  }
}

// 保存诉求模板
const handleSavePromptTemplate = () => {
  if (!promptTemplateName.value.trim()) return
  
  createPromptTemplate(promptTemplateName.value.trim(), analysisPrompt.value)
  
  promptTemplateName.value = ''
  showSavePromptDialog.value = false
  toast.success('诉求模板已保存')
}

// 提交给 DeepSeek 分析
const handleSubmitAnalysis = async () => {
  if (!analysisTitle.value.trim() || !analysisPrompt.value.trim()) {
    toast.error('请填写分析标题和诉求')
    return
  }

  if (selectedDataForAnalysis.value.length === 0) {
    toast.error('请选择要分析的数据')
    return
  }

  analyzing.value = true
  const startTime = Date.now()

  try {
    // 准备数据给 DeepSeek
    const dataContext = selectedDataForAnalysis.value.map(record => {
      let context = `
文件名：${record.fileName}
批次：${record.batchName}
文件类型：${record.fileType || '未知'}
文件大小：${formatFileSize(record.fileSize)}
`
      
      // 如果是 Excel 数据，添加数据预览
      if (record.data && record.data.length > 0) {
        const fields = Object.keys(record.data[0]).join('、')
        context += `
数据行数：${record.rowCount}
字段列表：${fields}

数据预览（前5条）：
${JSON.stringify(record.data.slice(0, 5), null, 2)}
`
      }

      return context
    }).join('\n---\n')

    const prompt = `你是一个专业的数据分析师。请根据以下文件和用户的分析诉求，提供详细的分析报告和可视化图表。

用户诉求：
${analysisPrompt.value}

文件信息：
${dataContext}

**请按以下格式输出：**

## 分析报告
（这里写详细的分析内容，使用 Markdown 格式）

1. 数据概况总结
2. 关键发现和洞察
3. 具体的数据分析结果
4. 实用的建议和结论

## 图表配置
（在代码块中输出 JSON 格式的图表配置数组）

\`\`\`json
[
  {
    "type": "line|bar|pie",
    "title": "图表标题",
    "description": "图表说明",
    "xAxis": ["项目1", "项目2", ...],
    "series": [
      {
        "name": "系列名称",
        "data": [数值1, 数值2, ...]
      }
    ]
  }
]
\`\`\`

**图表类型说明：**
- line: 折线图，适合展示趋势变化
- bar: 柱状图，适合展示对比数据
- pie: 饼图，适合展示占比分布

**重要提示：**
1. 必须输出至少2-4个有价值的图表配置
2. 图表数据必须基于提供的实际数据计算
3. JSON 格式必须严格正确，可以被解析
4. 确保图表配置在 \`\`\`json 代码块中

请用中文回复。`

    // 调用 DeepSeek API
    let result = ''
    const client = getDeepSeekClient()
    await client.getStreamingResponse(
      [{ role: 'user', content: prompt }],
      (chunk: string) => {
        result += chunk
      },
      () => {
          const duration = Date.now() - startTime

          // 尝试从 DeepSeek 响应中解析图表配置
          const charts = parseChartsFromDeepSeek(result)

          // 保存分析记录
          const analysisRecord = createAnalysisRecord(
            analysisTitle.value,
            selectedDataForAnalysis.value,
            analysisPrompt.value,
            result,
            duration,
            charts
          )

          const chartMsg = charts.length > 0 ? `，已生成 ${charts.length} 个图表` : ''
          toast.success(`分析完成${chartMsg}`)
          
          // 重置表单
          showAnalysisDialog.value = false
          analysisTitle.value = ''
          analysisPrompt.value = ''
          selectedRecords.value = []
          
          // 跳转到分析结果页面
          router.push(`/analysis-results/${analysisRecord.id}`)
      },
      (error: Error) => {
        console.error('分析失败:', error)
        toast.error('分析失败，请稍后重试')
      }
    )
  } catch (error) {
    console.error('分析失败:', error)
    toast.error('分析失败，请稍后重试')
  } finally {
    analyzing.value = false
  }
}

// 查看详情
const viewDetails = (record: SavedDataRecord) => {
  selectedRecord.value = record
  
  // 如果是PDF文件，使用PDF查看器
  if (record.fileType?.includes('pdf') && record.fileContent) {
    pdfViewerData.value = {
      fileName: record.fileName,
      fileContent: record.fileContent
    }
    showPdfViewer.value = true
  } else {
    showDetails.value = true
  }
}

// 导出记录
const exportRecord = (record: SavedDataRecord) => {
  if (!record.data || record.data.length === 0) {
    toast.error('该文件不包含表格数据，无法导出')
    return
  }

  const ws = XLSX.utils.json_to_sheet(record.data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  
  const fileName = `${(record.fileName || 'data').replace('.xlsx', '')}_exported_${Date.now()}.xlsx`
  XLSX.writeFile(wb, fileName)
  toast.success('数据已导出')
}

// 确认删除
const confirmDelete = (id: string) => {
  if (confirm('确定要删除这条记录吗？删除后无法恢复。')) {
    deleteRecord(id)
    toast.success('已删除')
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (confirm(`确定要删除选中的 ${selectedRecords.value.length} 条记录吗？删除后无法恢复。`)) {
    deleteRecords(selectedRecords.value)
    selectedRecords.value = []
    toast.success('已删除')
  }
}

onMounted(() => {
  // 数据已在 composable 中自动加载
  // 显示存储使用情况
  const storageInfo = getStorageInfo()
  if (storageInfo) {
    console.log('[存储使用情况]', storageInfo)
    console.log(`存储: ${storageInfo.sizeInMB} MB (${storageInfo.usagePercent}%)，共 ${storageInfo.records} 条记录`)
  }
})
</script>
