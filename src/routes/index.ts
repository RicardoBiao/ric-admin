import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    component: () => import('@/pages/login/index.vue'),
  },
  {
    path: '/',
    component: () => import('@/pages/toolbox/index.vue'),
  },
  // {
  //   path: '/toolbox',
  //   component: () => import('@/pages/toolbox/index.vue'),
  // },
  {
    path: '/customers',
    component: () => import('@/pages/customers/index.vue'),
  },
  {
    path: '/users',
    component: () => import('@/pages/users/index.vue'),
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
    path: '/data-import',
    component: () => import('@/pages/data-import/index.vue'),
  },
  {
    path: '/data-management',
    component: () => import('@/pages/data-management/index.vue'),
  },
  {
    path: '/analysis-results/:id?',
    name: 'AnalysisResults',
    component: () => import('@/pages/analysis-results/index.vue'),
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
  },
  {
    path: '/invoice-demo',
    component: () => import('@/pages/vat-invoice/index.vue'),
  },
  {
    path: '/vat-invoice',
    component: () => import('@/pages/vat-invoice/index.vue'),
  },
  {
    path: '/tv',
    component: () => import('@/pages/tv/index.vue'),
    redirect: '/tv/home',
    children: [
      {
        path: 'home',
        name: 'TvHome',
        component: () => import('@/pages/tv/TvHome.vue'),
      },
      {
        path: 'search',
        name: 'TvSearch',
        component: () => import('@/pages/tv/TvSearch.vue'),
      },
      {
        path: 'favorites',
        name: 'TvFavorites',
        component: () => import('@/pages/tv/TvFavorites.vue'),
      },
      {
        path: 'mine',
        name: 'TvMine',
        component: () => import('@/pages/tv/TvMine.vue'),
      },
    ]
  },
  {
    path: '/rich-text-editor',
    component: () => import('@/pages/rich-text-editor/index.vue'),
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫：未登录跳转到登录页
// router.beforeEach((to, _from, next) => {
  // const token = localStorage.getItem('accessToken')
  
  // // 如果访问登录页，直接放行
  // if (to.path === '/login') {
  //   // 已登录用户访问登录页，跳转到首页
  //   if (token) {
  //     next('/')
  //   } else {
  //     next()
  //   }
  //   return
  // }
  
  // // 其他页面需要登录
  // if (!token) {
  //   next('/login')
  // } else {
  //   next()
  // }
// })