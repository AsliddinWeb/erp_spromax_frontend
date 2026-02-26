<template>
  <div class="space-y-5">
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Jami xodimlar" :value="data.total_employees" unit="nafar" color="primary" :icon="Users" />
        <StatCard label="Faol xodimlar" :value="data.active_employees" unit="nafar" color="success" :icon="UserCheck" />
        <StatCard label="Ta'tilda" :value="data.on_leave" unit="nafar" color="warning" :icon="Umbrella" />
        <StatCard label="Davomat darajasi" :value="pct(data.attendance_rate)" color="info" :icon="CalendarCheck" />
        <StatCard label="O'rtacha ish haqi" :value="formatMoney(data.average_salary)" color="primary" :icon="Wallet" />
        <StatCard label="Bu oy to'langan" :value="formatMoney(data.total_salary_paid_this_month)" color="success" :icon="CreditCard" />
      </div>

      <!-- Departments -->
      <div v-if="data.departments?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Bo'limlar bo'yicha</h4>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-dark-border">
          <div
            v-for="dept in data.departments"
            :key="dept.department_id || dept.name"
            class="px-4 py-3 flex items-center gap-3"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ dept.department_name || dept.name }}</p>
              <div class="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-dark-700">
                <div
                  class="h-1.5 rounded-full bg-primary transition-all"
                  :style="`width: ${data.total_employees ? (dept.employee_count / data.total_employees * 100) : 0}%`"
                ></div>
              </div>
            </div>
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 w-16 text-right">
              {{ dept.employee_count }} nafar
            </span>
          </div>
        </div>
      </div>

      <!-- Leave by type -->
      <div v-if="data.leave_requests_by_type?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Ta'til so'rovlari turi bo'yicha</h4>
        </div>
        <AppTable :columns="leaveColumns" :data="data.leave_requests_by_type" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Users, UserCheck, Umbrella, CalendarCheck, Wallet, CreditCard } from 'lucide-vue-next'
import { analyticsApi } from '@/api'
import { useToast } from '@/composables/useToast'
import StatCard from './StatCard.vue'
import AppTable from '@/components/ui/AppTable.vue'

const toast = useToast()
const data = ref(null)
const loading = ref(false)

const leaveColumns = [
  { key: 'leave_type', label: 'Tur' },
  { key: 'count', label: 'So\'rovlar' },
  { key: 'total_days', label: 'Jami kunlar' },
]

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}
const pct = v => `${Number(v || 0).toFixed(1)}%`

async function load() {
  loading.value = true
  try {
    const res = await analyticsApi.getHR()
    data.value = res.data
  } catch {
    toast.error('HR tahlilini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>