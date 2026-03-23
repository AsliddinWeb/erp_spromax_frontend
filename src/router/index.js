import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const roleRoutes = {
  superadmin:         ['*'],
  admin:              ['*'],
  director:           ['*'],
  hr_manager:         ['dashboard', 'hr', 'analytics', 'profile'],
  accountant:         ['dashboard', 'finance', 'analytics', 'profile'],
  warehouse_manager:  ['dashboard', 'warehouse', 'analytics', 'profile'],
  production_manager: ['dashboard', 'production', 'maintenance', 'analytics', 'profile'],
  sales_manager:      ['dashboard', 'sales', 'analytics', 'profile'],
  operator:           ['dashboard', 'production', 'maintenance', 'profile'],
  maintenance:        ['dashboard', 'maintenance', 'profile'],
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
  { path: '/403', name: '403', component: () => import('@/views/errors/403View.vue'), meta: { public: true } },
  { path: '/404', name: '404', component: () => import('@/views/errors/404View.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',         name: 'Dashboard',  component: () => import('@/views/dashboard/DashboardView.vue') },
      { path: 'warehouse',   name: 'Warehouse',   component: () => import('@/views/warehouse/WarehouseView.vue') },
      { path: 'production',  name: 'Production',  component: () => import('@/views/production/ProductionView.vue') },
      { path: 'sales',       name: 'Sales',       component: () => import('@/views/sales/SalesView.vue') },
      { path: 'finance',     name: 'Finance',     component: () => import('@/views/finance/FinanceView.vue') },
      { path: 'hr',          name: 'HR',          component: () => import('@/views/hr/HRView.vue') },
      { path: 'maintenance', name: 'Maintenance', component: () => import('@/views/maintenance/MaintenanceView.vue') },
      { path: 'users',       name: 'Users',       component: () => import('@/views/users/UsersView.vue') },
      { path: 'analytics',   name: 'Analytics',   component: () => import('@/views/analytics/AnalyticsView.vue') },
      { path: 'profile',          name: 'Profile',         component: () => import('@/views/profile/ProfileView.vue') },
      { path: 'system-settings', name: 'SystemSettings',  component: () => import('@/views/settings/SystemSettingsView.vue') },
      { path: 'audit-logs',      name: 'AuditLogs',       component: () => import('@/views/settings/AuditLogView.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.public) return true
  if (to.meta.guest) return authStore.isAuthenticated ? '/' : true
  if (!authStore.isAuthenticated) return '/login'

  if (!authStore.user) {
    await authStore.fetchMe()
  }

  if (to.name && to.name !== 'Dashboard') {
    const roleName = authStore.user?.role?.name
    if (roleName && !canAccess(roleName, to.name)) return '/403'
  }

  return true
})

export default router