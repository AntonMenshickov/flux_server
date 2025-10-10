import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ApplicationsList from '@/components/ApplicationsList.vue'
import UsersList from '@/components/UsersList.vue'
import LogsList from '@/components/logsList/LogsList.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: LoginView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'users',
        name: 'users',
        component: UsersList
      },
      {
        path: 'apps',
        name: 'apps',
        component: ApplicationsList
      },
      {
        path: 'logs/:applicationId?',
        name: 'logs',
        component: LogsList
      },
    ]
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useUserStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'home' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
