<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Kadrlar bo'limi</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Xodimlar, davomat, ish haqi va ta'tillar</p>
    </div>

    <div class="border-b border-gray-200 dark:border-dark-border">
      <nav class="-mb-px flex space-x-6 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
          :class="activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <EmployeesView     v-if="activeTab === 'employees'" />
    <DepartmentsView   v-else-if="activeTab === 'departments'" />
    <AttendanceView    v-else-if="activeTab === 'attendance'" />
    <SalaryView        v-else-if="activeTab === 'salary'" />
    <LeaveRequestsView v-else-if="activeTab === 'leaves'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Users, Building2, CalendarCheck, Wallet, Umbrella } from 'lucide-vue-next'
import EmployeesView     from './EmployeesView.vue'
import DepartmentsView   from './DepartmentsView.vue'
import AttendanceView    from './AttendanceView.vue'
import SalaryView        from './SalaryView.vue'
import LeaveRequestsView from './LeaveRequestsView.vue'

const activeTab = ref('employees')

const tabs = [
  { key: 'employees',   label: 'Xodimlar',          icon: Users },
  { key: 'departments', label: "Bo'limlar",           icon: Building2 },
  { key: 'attendance',  label: 'Davomat',             icon: CalendarCheck },
  { key: 'salary',      label: 'Ish haqi',            icon: Wallet },
  { key: 'leaves',      label: "Ta'til so'rovlari",   icon: Umbrella },
]
</script>