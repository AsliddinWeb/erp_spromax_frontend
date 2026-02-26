import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Rol → ruxsat etilgan routelar
const roleRoutes = {
  superadmin:         ['*'],
  admin:              ['*'],
  director:           ['*'],
  hr_manager:         ['dashboard', 'hr', 'analytics'],
  accountant:         ['dashboard', 'finance', 'analytics'],
  warehouse_manager:  ['dashboard', 'warehouse', 'analytics'],
  production_manager: ['dashboard', 'production', 'maintenance', 'analytics'],
  sales_manager:      ['dashboard', 'sales', 'analytics'],
  operator:           ['dashboard', 'production', 'maintenance'],
  maintenance:        ['dashboard', 'maintenance'],
}

function canAccess(roleName, routeName) {
  if (!roleName) return false
  const allowed = roleRoutes[roleName] || []
  if (allowed.includes('*')) return true
  return allowed.includes(routeName?.toLowerCase())
}

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/errors/403View.vue'),
    meta: { public: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/errors/404View.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue')
      },
      {
        path: 'warehouse',
        name: 'Warehouse',
        component: () => import('@/views/warehouse/WarehouseView.vue')
      },
      {
        path: 'production',
        name: 'Production',
        component: () => import('@/views/production/ProductionView.vue')
      },
      {
        path: 'sales',
        name: 'Sales',
        component: () => import('@/views/sales/SalesView.vue')
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/finance/FinanceView.vue')
      },
      {
        path: 'hr',
        name: 'HR',
        component: () => import('@/views/hr/HRView.vue')
      },
      {
        path: 'maintenance',
        name: 'Maintenance',
        component: () => import('@/views/maintenance/MaintenanceView.vue')
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UsersView.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/AnalyticsView.vue')
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Public route
  if (to.meta.public) return next()

  // 2. Guest route
  if (to.meta.guest) {
    return authStore.isAuthenticated ? next('/') : next()
  }

  // 3. Token yo'q → login
  if (!authStore.isAuthenticated) {
    return next('/login')
  }

  // 4. User yuklanmagan bo'lsa — fetch qil
  if (!authStore.user) {
    await authStore.fetchMe()
  }

  // 5. Rol tekshiruvi
  if (to.name && to.name !== 'Dashboard') {
    const roleName = authStore.user?.role?.name
    if (roleName && !canAccess(roleName, to.name)) {
      return next('/403')
    }
  }

  next()
})

export default router