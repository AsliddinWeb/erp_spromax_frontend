import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { MODULE_PERMISSIONS } from '@/config/permissions'

export function usePermission() {
  const authStore = useAuthStore()

  const userRole = computed(() => authStore.userRole)

  // Rol tekshirish
  function hasRole(roles) {
    if (!userRole.value) return false
    if (userRole.value === 'superadmin') return true
    if (Array.isArray(roles)) return roles.includes(userRole.value)
    return userRole.value === roles
  }

  // Modul/routega kirish huquqi
  function canAccessRoute(module) {
    if (!userRole.value) return false
    if (userRole.value === 'superadmin') return true
    const allowed = MODULE_PERMISSIONS[module] || []
    return allowed.includes(userRole.value)
  }

  // Dashboard widget ko'rish huquqi
  function canSeeWidget(widget) {
    const widgetPermissions = {
      finance_card:    ['superadmin', 'admin', 'accountant', 'director'],
      warehouse_card:  ['superadmin', 'admin', 'warehouse_manager', 'operator'],
      production_card: ['superadmin', 'admin', 'operator', 'warehouse_manager', 'production_manager'],
      hr_card:         ['superadmin', 'admin', 'hr_manager', 'director'],
      maintenance_card:['superadmin', 'admin', 'maintenance', 'director'],
      sales_card:      ['superadmin', 'admin', 'sales_manager', 'accountant', 'director'],
    }
    if (userRole.value === 'superadmin') return true
    const allowed = widgetPermissions[widget] || []
    return allowed.includes(userRole.value)
  }

  return {
    userRole,
    hasRole,
    canAccessRoute,
    canSeeWidget,
  }
}