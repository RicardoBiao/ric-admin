<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-12">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <div class="text-center mb-12">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/40 mb-6">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
          </svg>
        </div>
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">工具箱</h1>
        <p class="text-gray-600 text-lg max-w-2xl mx-auto">精选实用工具，提升工作效率</p>
      </div>

      <!-- 工具卡片网格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- JSON 对比工具 -->
        <div 
          @click="navigateTo('/json-compare')"
          class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-blue-500 transform hover:-translate-y-2"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">JSON 对比</h3>
              <p class="text-sm text-gray-600 leading-relaxed">支持 Excel 上传和直接输入，智能识别 JSON 差异，生成详细对比报告</p>
            </div>
          </div>
          <div class="mt-4 flex items-center text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>立即使用</span>
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>

        <!-- 截图背景工具 -->
        <div 
          @click="navigateTo('/screenshot-bg')"
          class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-green-500 transform hover:-translate-y-2"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">截图背景</h3>
              <p class="text-sm text-gray-600 leading-relaxed">为 PC 和移动端截图添加专业边框，支持自定义颜色和宽度</p>
            </div>
          </div>
          <div class="mt-4 flex items-center text-sm text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>立即使用</span>
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>

        <!-- GIF 制作工具 -->
        <div 
          @click="navigateTo('/gif-maker')"
          class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-purple-500 transform hover:-translate-y-2"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">GIF 制作</h3>
              <p class="text-sm text-gray-600 leading-relaxed">多图合成动态 GIF，支持拖拽排序、速度调节和实时预览</p>
            </div>
          </div>
          <div class="mt-4 flex items-center text-sm text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>立即使用</span>
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>

        <!-- Excel 合并工具 -->
        <div 
          @click="navigateTo('/excel-merge')"
          class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-orange-500 transform hover:-translate-y-2"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">Excel 合并</h3>
              <p class="text-sm text-gray-600 leading-relaxed">快速合并多个 Excel 文件，保持格式和数据完整性</p>
            </div>
          </div>
          <div class="mt-4 flex items-center text-sm text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>立即使用</span>
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>

        <!-- 文档处理工具 -->
        <!-- <div 
          @click="navigateTo('/documents')"
          class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-red-500 transform hover:-translate-y-2"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors">文档处理</h3>
              <p class="text-sm text-gray-600 leading-relaxed">文档格式转换、批量处理等文档相关工具</p>
            </div>
          </div>
          <div class="mt-4 flex items-center text-sm text-red-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>立即使用</span>
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div> -->

        <!-- 客户管理工具 -->
        <!-- <div 
          @click="navigateTo('/customers')"
          class="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-indigo-500 transform hover:-translate-y-2"
        >
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">客户管理</h3>
              <p class="text-sm text-gray-600 leading-relaxed">客户信息管理、数据分析和可视化展示</p>
            </div>
          </div>
          <div class="mt-4 flex items-center text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>立即使用</span>
            <svg class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div> -->
      </div>

      <!-- 底部提示 -->
      <div class="mt-12 text-center">
        <p class="text-sm text-gray-500">更多工具正在开发中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateTo = (path: string) => {
  router.push(path)
}
</script>
