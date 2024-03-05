import { createRouter, createWebHistory } from 'vue-router'
import defaultLayout from '@/layouts/default.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/views/index.vue'),
    },
    {
      path: '/dashboard',
      component: defaultLayout,
      children: [
        {
          path: '',
          component: () => import('@/views/dashboard/index.vue'),
        },
      ],
    },
  ],
})
