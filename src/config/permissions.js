export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  DIRECTOR: 'director',
  WAREHOUSE_MANAGER: 'warehouse_manager',
  PRODUCTION_MANAGER: 'production_manager',
  SALES_MANAGER: 'sales_manager',
  HR_MANAGER: 'hr_manager',
  ACCOUNTANT: 'accountant',
  OPERATOR: 'operator',
  MAINTENANCE: 'maintenance',
}

export const MODULE_PERMISSIONS = {
  dashboard:   ['superadmin', 'admin', 'director', 'warehouse_manager', 'production_manager', 'sales_manager', 'hr_manager', 'accountant', 'operator', 'maintenance'],
  warehouse:   ['superadmin', 'admin', 'director', 'warehouse_manager', 'operator'],
  production:  ['superadmin', 'admin', 'director', 'production_manager', 'operator'],
  sales:       ['superadmin', 'admin', 'director', 'sales_manager', 'accountant'],
  finance:     ['superadmin', 'admin', 'director', 'accountant'],
  hr:          ['superadmin', 'admin', 'director', 'hr_manager'],
  maintenance: ['superadmin', 'admin', 'director', 'maintenance', 'production_manager'],
  users:       ['superadmin', 'admin'],
  analytics:   ['superadmin', 'admin', 'director'],
}

export function hasAccess(userRole, module) {
  if (!userRole) return false
  if (userRole === 'superadmin') return true
  const allowed = MODULE_PERMISSIONS[module] || []
  return allowed.includes(userRole)
}

export const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',         icon: 'LayoutDashboard', path: '/' },
  { key: 'warehouse',   label: 'Ombor',              icon: 'Warehouse',       path: '/warehouse' },
  { key: 'production',  label: 'Ishlab chiqarish',   icon: 'Factory',         path: '/production' },
  { key: 'sales',       label: 'Sotuv',              icon: 'ShoppingCart',    path: '/sales' },
  { key: 'finance',     label: 'Moliya',             icon: 'Banknote',        path: '/finance' },
  { key: 'hr',          label: 'HR',                 icon: 'Users',           path: '/hr' },
  { key: 'maintenance', label: 'Texnik xizmat',      icon: 'Wrench',          path: '/maintenance' },
  { key: 'users',       label: 'Foydalanuvchilar',   icon: 'UserCog',         path: '/users' },
  { key: 'analytics',   label: 'Tahlil',             icon: 'BarChart3',       path: '/analytics' },
]