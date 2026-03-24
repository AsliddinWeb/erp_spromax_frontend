import api from './axios'

// ─── AUTH ─────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
}

// ─── USERS ────────────────────────────────────────────
export const usersApi = {
  getUsers:   (params)   => api.get('/users', { params }),
  getUser:    (id)       => api.get(`/users/${id}`),
  createUser: (data)     => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id)       => api.delete(`/users/${id}`),
  getRoles:   ()         => api.get('/users/roles/list'),
}

// ─── WAREHOUSE ────────────────────────────────────────
export const warehouseApi = {
  getSuppliers: (params) => api.get('/warehouse/suppliers', { params }),
  getSupplier: (id) => api.get(`/warehouse/suppliers/${id}`),
  createSupplier: (data) => api.post('/warehouse/suppliers', data),
  updateSupplier: (id, data) => api.put(`/warehouse/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/warehouse/suppliers/${id}`),

  getRawMaterials: (params) => api.get('/warehouse/raw-materials', { params }),
  getRawMaterial: (id) => api.get(`/warehouse/raw-materials/${id}`),
  createRawMaterial: (data) => api.post('/warehouse/raw-materials', data),
  updateRawMaterial: (id, data) => api.put(`/warehouse/raw-materials/${id}`, data),
  deleteRawMaterial: (id) => api.delete(`/warehouse/raw-materials/${id}`),

  getReceipts: (params) => api.get('/warehouse/receipts', { params }),
  getReceipt: (id) => api.get(`/warehouse/receipts/${id}`),
  createReceipt: (data) => api.post('/warehouse/receipts', data),

  getStock: (params) => api.get('/warehouse/stock', { params }),
  getStockByMaterial: (id) => api.get(`/warehouse/stock/${id}`),
  deleteStock: (id) => api.delete(`/warehouse/stock/${id}`),
  getLowStock: () => api.get('/warehouse/low-stock'),

  getMaterialRequests: (params) => api.get('/warehouse/requests', { params }),
  getMyRequests: (params) => api.get('/warehouse/requests/my', { params }),
  getMaterialRequest: (id) => api.get(`/warehouse/requests/${id}`),
  createMaterialRequest: (data) => api.post('/warehouse/requests', data),
  deleteReceipt: (id) => api.delete(`/warehouse/receipts/${id}`),
  deleteMaterialRequest: (id) => api.delete(`/warehouse/requests/${id}`),
  approveRequest: (id, data) => api.put(`/warehouse/requests/${id}/approve`, data),
  rejectRequest: (id, data) => api.put(`/warehouse/requests/${id}/reject`, data),

  getStatistics: () => api.get('/warehouse/statistics'),

  getProductionReceipts: (params) => api.get('/warehouse/production-receipts', { params }),
}

// ─── PRODUCTION ───────────────────────────────────────
export const productionApi = {
  getLines: (params) => api.get('/production/lines', { params }),
  getLine: (id) => api.get(`/production/lines/${id}`),
  createLine: (data) => api.post('/production/lines', data),
  updateLine: (id, data) => api.put(`/production/lines/${id}`, data),
  deleteLine: (id) => api.delete(`/production/lines/${id}`),

  getMachines: (params) => api.get('/production/machines', { params }),
  getMachine: (id) => api.get(`/production/machines/${id}`),
  createMachine: (data) => api.post('/production/machines', data),
  updateMachine: (id, data) => api.put(`/production/machines/${id}`, data),
  deleteMachine: (id) => api.delete(`/production/machines/${id}`),

  getFinishedProducts: (params) => api.get('/production/finished-products', { params }),
  getFinishedStock: () => api.get('/production/finished-stock'),
  getFinishedProduct: (id) => api.get(`/production/finished-products/${id}`),
  createFinishedProduct: (data) => api.post('/production/finished-products', data),
  updateFinishedProduct: (id, data) => api.put(`/production/finished-products/${id}`, data),
  deleteFinishedProduct: (id) => api.delete(`/production/finished-products/${id}`),

  getShifts: (params) => api.get('/production/shifts', { params }),
  getMyShifts: (params) => api.get('/production/shifts/my', { params }),
  getShift: (id) => api.get(`/production/shifts/${id}`),
  createShift: (data) => api.post('/production/shifts', data),
  deleteShift: (id) => api.delete(`/production/shifts/${id}`),
  completeShift: (id, data) => api.put(`/production/shifts/${id}/complete`, data),

  recordMaterialUsage: (shiftId, data) => api.post(`/production/shifts/${shiftId}/records/materials`, data),
  getShiftMaterialUsage: (shiftId) => api.get(`/production/shifts/${shiftId}/records/materials`),
  recordOutput: (shiftId, data) => api.post(`/production/shifts/${shiftId}/records/output`, data),
  getShiftOutput: (shiftId) => api.get(`/production/shifts/${shiftId}/records/output`),
  recordDefect: (shiftId, data) => api.post(`/production/shifts/${shiftId}/records/defects`, data),
  getShiftDefects: (shiftId) => api.get(`/production/shifts/${shiftId}/records/defects`),
  getShiftStatistics: (shiftId) => api.get(`/production/shifts/${shiftId}/statistics`),

  getDefectReasons: (params) => api.get('/production/defect-reasons', { params }),
  createDefectReason: (data) => api.post('/production/defect-reasons', data),
  deleteDefectReason: (id) => api.delete(`/production/defect-reasons/${id}`),

  getStatistics: () => api.get('/production/statistics'),

  // Pause
  pauseShift: (id, data) => api.post(`/production/shifts/${id}/pause`, data),
  resumeShift: (id) => api.post(`/production/shifts/${id}/resume`),
  getShiftPauses: (id) => api.get(`/production/shifts/${id}/pauses`),

  // Scrap usage
  useScrapInShift: (id, data) => api.post(`/production/shifts/${id}/scrap-usage`, data),
  getShiftScrapUsage: (id) => api.get(`/production/shifts/${id}/scrap-usage`),

  // Close shift (output + scrap birga)
  closeShift: (id, data) => api.post(`/production/shifts/${id}/close`, data),

  // Scrap stock
  getScrapStock: () => api.get('/production/scrap-stock'),
  getScrapTransactions: (params) => api.get('/production/scrap-stock/transactions', { params }),
  transferScrapToGrinder: (data) => api.post('/production/scrap-stock/transfer-to-grinder', data),
}

// ─── SALES ────────────────────────────────────────────
export const salesApi = {
  getCustomers: (params) => api.get('/sales/customers', { params }),
  getCustomer: (id) => api.get(`/sales/customers/${id}`),
  createCustomer: (data) => api.post('/sales/customers', data),
  updateCustomer: (id, data) => api.put(`/sales/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/sales/customers/${id}`),
  getCustomerStatistics: (id) => api.get(`/sales/customers/${id}/statistics`),
  getCustomerOrders: (id, params) => api.get(`/sales/customers/${id}/orders`, { params }),

  getOrders: (params) => api.get('/sales/orders', { params }),
  getOrder: (id) => api.get(`/sales/orders/${id}`),
  createOrder: (data) => api.post('/sales/orders', data),
  updateOrder: (id, data) => api.put(`/sales/orders/${id}`, data),
  deleteOrder: (id) => api.delete(`/sales/orders/${id}`),
  getOrderPayments: (id) => api.get(`/sales/orders/${id}/payments`),
  getAllPayments: (params) => api.get('/sales/payments', { params }),

  createPayment: (data) => api.post('/sales/payments', data),
  deletePayment: (id) => api.delete(`/sales/payments/${id}`),

  getStatistics: () => api.get('/sales/statistics'),
}

// ─── FINANCE ──────────────────────────────────────────
export const financeApi = {
  // Kategoriyalar
  getCategories:  (params) => api.get('/finance/categories', { params }),
  createCategory: (data)   => api.post('/finance/categories', data),
  updateCategory: (id, data) => api.put(`/finance/categories/${id}`, data),
  deleteCategory: (id)     => api.delete(`/finance/categories/${id}`),

  // Tranzaksiyalar
  getTransactions:  (params) => api.get('/finance/transactions', { params }),
  createTransaction: (data)  => api.post('/finance/transactions', data),
  updateTransaction: (id, data) => api.put(`/finance/transactions/${id}`, data),
  deleteTransaction: (id)    => api.delete(`/finance/transactions/${id}`),

  // Hisobotlar
  getPLReport:       (params) => api.get('/finance/reports/pl', { params }),
  getCashFlowReport: (params) => api.get('/finance/reports/cashflow', { params }),
  getBalanceReport:  (params) => api.get('/finance/reports/balance', { params }),

  // Statistika
  getStatistics: () => api.get('/finance/statistics'),
}

// ─── HR ───────────────────────────────────────────────
export const hrApi = {
  // Xodimlar
  getEmployees:   (params)     => api.get('/hr/employees', { params }),
  createEmployee: (data)       => api.post('/hr/employees', data),
  updateEmployee: (id, data)   => api.put(`/hr/employees/${id}`, data),
  deleteEmployee: (id)         => api.delete(`/hr/employees/${id}`),

  // Bo'limlar
  getDepartments:   (params)   => api.get('/hr/departments', { params }),
  createDepartment: (data)     => api.post('/hr/departments', data),
  updateDepartment: (id, data) => api.put(`/hr/departments/${id}`, data),
  deleteDepartment: (id)       => api.delete(`/hr/departments/${id}`),

  // Davomat
  getAttendances:    (params)  => api.get('/hr/attendances', { params }),
  getTodayAttendance: ()       => api.get('/hr/attendances/today'),
  createAttendance:  (data)    => api.post('/hr/attendances', data),
  updateAttendance:  (id, data) => api.put(`/hr/attendances/${id}`, data),
  deleteAttendance:  (id)      => api.delete(`/hr/attendances/${id}`),

  // Ish haqi
  getSalaryPayments:    (params) => api.get('/hr/salary-payments', { params }),
  createSalaryPayment:  (data)   => api.post('/hr/salary-payments', data),
  calculateSalaryPreview: (month) => api.get('/hr/salary-payments/calculate-preview', { params: { month } }),
  batchSalaryPayment:   (data)   => api.post('/hr/salary-payments/batch', data),
  deleteSalaryPayment:  (id)     => api.delete(`/hr/salary-payments/${id}`),

  // Ta'til so'rovlari
  getLeaveRequests:    (params) => api.get('/hr/leave-requests', { params }),
  createLeaveRequest:  (data)   => api.post('/hr/leave-requests', data),
  approveLeaveRequest: (id, data) => api.put(`/hr/leave-requests/${id}/approve`, data),
  deleteLeaveRequest:  (id)     => api.delete(`/hr/leave-requests/${id}`),

  // Statistika
  getStatistics: () => api.get('/hr/statistics'),
}

// ─── MAINTENANCE ──────────────────────────────────────
export const maintenanceApi = {
  // Ta'mir so'rovlari
  getRequests:    (params)     => api.get('/maintenance/requests', { params }),
  createRequest:  (data)       => api.post('/maintenance/requests', data),
  updateRequest:  (id, data)   => api.put(`/maintenance/requests/${id}`, data),
  deleteRequest:  (id)         => api.delete(`/maintenance/requests/${id}`),
  getRequestLogs: (id)         => api.get(`/maintenance/requests/${id}/logs`),
  getRequestSpareParts: (id)   => api.get(`/maintenance/requests/${id}/spare-parts`),

  // Ish jurnali
  createLog: (data) => api.post('/maintenance/logs', data),
  deleteLog: (id) => api.delete(`/maintenance/logs/${id}`),

  // Ehtiyot qismlar
  getSpareParts:    (params)   => api.get('/maintenance/spare-parts', { params }),
  getLowStockParts: ()         => api.get('/maintenance/spare-parts/low-stock'),
  createSparePart:  (data)     => api.post('/maintenance/spare-parts', data),
  updateSparePart:  (id, data) => api.put(`/maintenance/spare-parts/${id}`, data),
  deleteSparePart:  (id)       => api.delete(`/maintenance/spare-parts/${id}`),
  createSparePartUsage: (data) => api.post('/maintenance/spare-part-usage', data),
  deleteSparePartUsage: (id) => api.delete(`/maintenance/spare-part-usage/${id}`),

  // Jadval
  getSchedules:   (params)     => api.get('/maintenance/schedules', { params }),
  createSchedule: (data)       => api.post('/maintenance/schedules', data),
  updateSchedule: (id, data)   => api.put(`/maintenance/schedules/${id}`, data),
  deleteSchedule: (id)         => api.delete(`/maintenance/schedules/${id}`),

  // Statistika
  getStatistics: () => api.get('/maintenance/statistics'),
}

// ─── ANALYTICS ────────────────────────────────────────
export const analyticsApi = {
  getDashboard:   ()       => api.get('/analytics/dashboard'),
  getSales:       (params) => api.get('/analytics/sales', { params }),
  getProduction:  (params) => api.get('/analytics/production', { params }),
  getFinance:     (params) => api.get('/analytics/finance', { params }),
  getHR:          ()       => api.get('/analytics/hr'),
  getInventory:   ()       => api.get('/analytics/inventory'),
  getMaintenance: (params) => api.get('/analytics/maintenance', { params }),
  getKPI:         ()       => api.get('/analytics/kpi'),
  getToday:       ()       => api.get('/analytics/quick-stats/today'),
  getThisMonth:   ()       => api.get('/analytics/quick-stats/this-month'),
  getAlerts:      ()       => api.get('/analytics/quick-stats/alerts'),
}

// ─── SYSTEM SETTINGS ──────────────────────────────────
export const settingsApi = {
  getAll:           ()         => api.get('/settings'),
  getTimezone:      ()         => api.get('/settings/timezone'),
  updateTimezone:   (data)     => api.put('/settings/timezone', data),
  updateSetting:    (key, data) => api.put(`/settings/${key}`, data),
}

// ─── AUDIT LOGS ───────────────────────────────────────
export const auditApi = {
  getLogs: (params) => api.get('/audit-logs', { params }),
}

// ─── NOTIFICATIONS ────────────────────────────────────
export const notificationsApi = {
  getAll:        (params) => api.get('/notifications', { params }),
  getUnreadCount: ()      => api.get('/notifications/unread-count'),
  markRead:      (id)     => api.put(`/notifications/${id}/read`),
  markAllRead:   ()       => api.put('/notifications/read-all'),
}