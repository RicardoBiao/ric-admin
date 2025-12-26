<template>
  <nav class="tv-tabs">
    <!-- PC 端顶部导航 -->
    <div class="hidden md:flex items-center justify-center border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div class="flex items-center space-x-1 p-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="[
            'tab-button',
            activeTab === tab.value ? 'tab-button-active' : 'tab-button-inactive'
          ]"
          @click="$emit('update:activeTab', tab.value)"
        >
          <component :is="tab.icon" class="w-5 h-5" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- 移动端底部导航 -->
    <div class="md:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800">
      <div class="flex items-center justify-around py-2 px-4">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="[
            'tab-button-mobile',
            activeTab === tab.value ? 'tab-button-mobile-active' : 'tab-button-mobile-inactive'
          ]"
          @click="$emit('update:activeTab', tab.value)"
        >
          <component :is="tab.icon" class="w-6 h-6" />
          <span class="text-xs mt-1">{{ tab.label }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
interface Tab {
  value: string;
  label: string;
  icon: any;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
}

defineProps<Props>();
defineEmits<{
  'update:activeTab': [value: string];
}>();
</script>

<style scoped>
/* PC 端标签按钮 */
.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-button-active {
  background-color: rgb(37 99 235);
  color: white;
  box-shadow: 0 10px 15px -3px rgb(59 130 246 / 0.5);
}

.tab-button-inactive {
  color: rgb(156 163 175);
}

.tab-button-inactive:hover {
  color: white;
  background-color: rgb(31 41 55);
}

/* 移动端标签按钮 */
.tab-button-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  transition: color 0.2s;
}

.tab-button-mobile-active {
  color: rgb(59 130 246);
}

.tab-button-mobile-inactive {
  color: rgb(107 114 128);
}
</style>
