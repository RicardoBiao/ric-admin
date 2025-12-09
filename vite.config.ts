import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { viteMockServe } from 'vite-plugin-mock'
import components from 'unplugin-vue-components/vite';
import { AntDesignXVueResolver } from 'ant-design-x-vue/resolver';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    viteMockServe({
      mockPath: 'mock',
      enable: true,
    }),
    components({
      resolvers: [AntDesignXVueResolver()],
    }),
  ],
  optimizeDeps: {
    exclude: ['html-docx-js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})