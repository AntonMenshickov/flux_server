import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { ROUTE_NAMES } from './routes'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ApplicationsList from '@/components/ApplicationsList.vue'
import UsersList from '@/components/UsersList.vue'
import ApplicationsListView from '@/views/ApplicationsListView.vue'
import EventLogsView from '@/views/EventLogsView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: ROUTE_NAMES.HOME,
    component: LoginView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: LoginView
  },
  {
    path: '/dashboard',
    name: ROUTE_NAMES.DASHBOARD,
    component: DashboardView,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'users',
        name: ROUTE_NAMES.USERS,
        component: UsersList
      },
      {
        path: 'applications',
        name: ROUTE_NAMES.APPLICATIONS,
        component: ApplicationsList
      },
      {
        path: 'logs',
        name: ROUTE_NAMES.LOGS,
        component: ApplicationsListView
      },
      {
        path: 'logs/:applicationId',
        name: ROUTE_NAMES.EVENT_LOGS,
        component: EventLogsView
      },
      {
        path: 'logs/online/:uuid',
        name: ROUTE_NAMES.ONLINE_LOG_STREAM,
        component: () => import('@/views/OnlineLogStream.vue'),
        props: true
      },
      {
        path: 'logs/message/:id',
        name: ROUTE_NAMES.EVENT_LOG_SINGLE,
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
    return { name: ROUTE_NAMES.LOGIN }
  }
  if (to.name === ROUTE_NAMES.HOME && auth.isAuthenticated) {
    return { name: ROUTE_NAMES.DASHBOARD }
  }
})

export default router
