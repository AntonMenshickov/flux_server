import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ApplicationsList from '@/components/ApplicationsList.vue'
import UsersList from '@/components/UsersList.vue'
import ApplicationsListView from '@/views/ApplicationsListView.vue'
import EventLogsView from '@/views/EventLogsView.vue'

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
        path: 'applications',
        name: 'applications',
        component: ApplicationsList
      },
      {
        path: 'logs',
        name: 'logs',
        component: ApplicationsListView
      },
      {
        path: 'logs/:applicationId',
        name: 'event-logs',
        component: EventLogsView
      },
      {
        path: 'logs/online/:uuid',
        name: 'online-log-stream',
        component: () => import('@/views/OnlineLogStream.vue'),
        props: true
      },
      {
        path: 'logs/message/:id',
        name: 'event-log-single',
        component: () => import('@/views/EventLogSingleView.vue'),
        props: true
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
