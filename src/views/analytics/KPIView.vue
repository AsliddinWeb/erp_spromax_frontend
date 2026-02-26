<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">KPI Ko'rsatkichlari</h3>
      <button
        @click="load"
        :disabled="loading"
        class="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
      >
        <RefreshCw class="w-3 h-3" :class="loading ? 'animate-spin' : ''" />
        Yangilash
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else-if="data">
      <!-- Sales KPIs -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Sotuv</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KPICard label="Sotuv o'sishi" :value="pct(data.sales_growth_rate)" :icon="TrendingUp"
            :positive="Number(data.sales_growth_rate) >= 0" />
          <KPICard label="Mijoz saqlab qolish" :value="pct(data.customer_retention_rate)" :icon="Users" positive />
          <KPICard label="O'rtacha buyurtma" :value="formatMoney(data.average_order_value)" :icon="ShoppingCart" positive />
        </div>
      </div>

      <!-- Production KPIs -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Ishlab chiqarish</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KPICard label="Ishlab chiqarish samaradorligi" :value="pct(data.production_efficiency)" :icon="Factory"
            :positive="Number(data.production_efficiency) >= 70" />
          <KPICard label="Nuqson darajasi" :value="pct(data.defect_rate)" :icon="AlertTriangle"
            :positive="Number(data.defect_rate) <= 5" :inverse="true" />
          <KPICard label="Mashina ishlash vaqti" :value="pct(data.machine_uptime)" :icon="Cpu"
            :positive="Number(data.machine_uptime) >= 80" />
        </div>
      </div>

      <!-- Finance KPIs -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Moliya</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KPICard label="Foyda marjasi" :value="pct(data.profit_margin)" :icon="Percent"
            :positive="Number(data.profit_margin) >= 0" />
          <KPICard label="Daromad o'sishi" :value="pct(data.revenue_growth_rate)" :icon="TrendingUp"
            :positive="Number(data.revenue_growth_rate) >= 0" />
          <KPICard label="Xarajat ulushi" :value="pct(data.expense_ratio)" :icon="TrendingDown"
            :positive="Number(data.expense_ratio) <= 70" :inverse="true" />
        </div>
      </div>

      <!-- HR KPIs -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Kadrlar</h4>
        <div class="grid grid-cols-2 md:grid-cols-2 gap-3">
          <KPICard label="Xodim saqlab qolish" :value="pct(data.employee_retention_rate)" :icon="UserCheck" positive />
          <KPICard label="Davomat darajasi" :value="pct(data.attendance_rate)" :icon="CalendarCheck" positive />
        </div>
      </div>

      <!-- Inventory KPIs -->
      <div>
        <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Inventar</h4>
        <div class="grid grid-cols-2 gap-3">
          <KPICard label="Tovar aylanmasi" :value="data.inventory_turnover + 'x'" :icon="Package" positive />
          <KPICard label="Tugash darajasi" :value="pct(data.stockout_rate)" :icon="AlertTriangle"
            :positive="Number(data.stockout_rate) <= 5" :inverse="true" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  TrendingUp, TrendingDown, Users, ShoppingCart,
  Factory, AlertTriangle, Cpu, Percent,
  UserCheck, CalendarCheck, Package, RefreshCw
} from 'lucide-vue-next'
import { analyticsApi } from '@/api'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const data = ref(null)
const loading = ref(false)

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}
const pct = v => `${Number(v || 0).toFixed(1)}%`

// Inline KPI card component
const KPICard = {
  props: ['label', 'value', 'icon', 'positive', 'inverse'],
  template: `
    <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ label }}</p>
          <p class="text-xl font-bold mt-1"
            :class="positive ? 'text-success' : 'text-danger'">
            {{ value }}
          </p>
        </div>
        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
          :class="positive ? 'bg-success/10' : 'bg-danger/10'">
          <component :is="icon" class="w-4 h-4" :class="positive ? 'text-success' : 'text-danger'" />
        </div>
      </div>
      <div class="mt-2 flex items-center gap-1">
        <div class="w-2 h-2 rounded-full" :class="positive ? 'bg-success' : 'bg-danger'"></div>
        <span class="text-xs" :class="positive ? 'text-success' : 'text-danger'">
          {{ positive ? 'Maqsadga erishilmoqda' : 'Diqqat talab qiladi' }}
        </span>
      </div>
    </div>
  `
}

async function load() {
  loading.value = true
  try {
    const res = await analyticsApi.getKPI()
    data.value = res.data
  } catch {
    toast.error('KPI ma\'lumotlarini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>