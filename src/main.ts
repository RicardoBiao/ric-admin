import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './routes/index'
import { initializeApp } from './core/init'

// 初始化应用（包括 DeepSeek API）
initializeApp()

createApp(App).use(router).mount('#app')

