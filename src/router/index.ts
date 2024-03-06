import { createRouter, createWebHistory } from 'vue-router/auto'
// import defaultLayout from '@/layout/default.vue'

export const router = createRouter({
  history: createWebHistory(),
  // routes: [
  //   {
  //     path: '/',
  //     component: () => import('@/views/index.vue'),
  //   },
  //   {
  //     path: '/dashboard',
  //     component: defaultLayout,
  //     children: [
  //       {
  //         path: '',
  //         component: () => import('@/views/dashboard/index.vue'),
  //       },
  //     ],
  //   },
  // ],
  extendRoutes(routes) {
    return routes.map((route) => {
      return route
    })
  },
})
