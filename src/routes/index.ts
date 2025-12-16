import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/pages/home/index.vue'),
  },
  {
    path: '/toolbox',
    component: () => import('@/pages/toolbox/index.vue'),
  },
  {
    path: '/customers',
    component: () => import('@/pages/customers/index.vue'),
  },
  {
    path: '/documents',
    component: () => import('@/pages/documents/index.vue'),
  },
  {
    path: '/excel-merge',
    component: () => import('@/pages/excel-merge/index.vue'),
  },
  {
    path: '/example',
    children: [
      {
        path: 'demo',
        component: () => import('@/pages/example/demo2.vue'),
      },
    ]
  },
  {
    path: '/chat',
    component: () => import('@/pages/chat/index.vue'),
  },
  {
    path: '/chat-mobile',
    component: () => import('@/pages/chat-mobile/index.vue'),
  },
  {
    path: '/json-compare',
    component: () => import('@/pages/json-compare/index.vue'),
  },
  {
    path: '/screenshot-bg',
    component: () => import('@/pages/screenshot-bg/index.vue'),
  },
  {
    path: '/gif-maker',
    component: () => import('@/pages/gif-maker/index.vue'),
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})