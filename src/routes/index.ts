import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/pages/home/index.vue'),
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
    path: '/example',
    children: [
      {
        path: 'demo',
        component: () => import('@/pages/example/demo1.vue'),
      },
    ]
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})