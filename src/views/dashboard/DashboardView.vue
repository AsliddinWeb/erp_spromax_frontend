<template>
  <Suspense>
    <component :is="dashboardComponent" />
    <template #fallback>
      <div class="flex items-center justify-center h-64">
        <AppSpinner size="lg" />
      </div>
    </template>
  </Suspense>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const authStore = useAuthStore()

const roleComponentMap = {
  superadmin: () => import('./AdminDashboard.vue'),
  admin:      () => import('./AdminDashboard.vue'),
  director:   () => import('./AdminDashboard.vue'),
  accountant: () => import('./FinanceDashboard.vue'),
  warehouse_manager: () => import('./WarehouseDashboard.vue'),
  operator:          () => import('./ProductionDashboard.vue'),
  sales_manager:     () => import('./SalesDashboard.vue'),
  hr_manager:        () => import('./HRDashboard.vue'),
  maintenance:       () => import('./MaintenanceDashboard.vue'),
}

const dashboardComponent = computed(() => {
  const role = authStore.userRole
  const loader = roleComponentMap[role] || roleComponentMap['admin']
  return defineAsyncComponent(loader)
})
</script>