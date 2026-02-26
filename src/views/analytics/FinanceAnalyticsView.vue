<template>
  <div class="space-y-5">
    <AnalyticsFilter
      :presets="presets"
      v-model:activePreset="activePreset"
      v-model:customStart="customStart"
      v-model:customEnd="customEnd"
      :loading="loading"
      @apply="load"
    />

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Jami daromad" :value="formatMoney(data.total_income)" color="success" :icon="TrendingUp" />
        <StatCard label="Jami xarajat" :value="formatMoney(data.total_expense)" color="danger" :icon="TrendingDown" />
        <StatCard label="Sof foyda" :value="formatMoney(data.net_profit)" :color="Number(data.net_profit) >= 0 ? 'success' : 'danger'" :icon="Wallet" />
        <StatCard label="Foyda marjasi" :value="pct(data.profit_margin)" :color="Number(data.profit_margin) >= 0 ? 'info' : 'danger'" :icon="Percent" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Income by category -->
        <div class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-success"></div>
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Daromad kategoriyalari</h4>
          </div>
          <div v-if="data.income_by_category?.length" class="divide-y divide-gray-100 dark:divide-dark-border">
            <div v-for="(c, i) in data.income_by_category" :key="i" class="px-4 py-2.5 flex justify-between text-sm">
              <span class="text-gray-700 dark:text-gray-300">{{ c.category_name || c.name }}</span>
              <span class="font-semibold text-success">{{ formatMoney(c.total) }}</span>
            </div>
          </div>
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">Ma'lumot yo'q</div>
        </div>

        <!-- Expense by category -->
        <div class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-danger"></div>
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Xarajat kategoriyalari</h4>
          </div>
          <div v-if="data.expense_by_category?.length" class="divide-y divide-gray-100 dark:divide-dark-border">
            <div v-for="(c, i) in data.expense_by_category" :key="i" class="px-4 py-2.5 flex justify-between text-sm">
              <span class="text-gray-700 dark:text-gray-300">{{ c.category_name || c.name }}</span>
              <span class="font-semibold text-danger">{{ formatMoney(c.total) }}</span>
            </div>
          </div>
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">Ma'lumot yo'q</div>
        </div>
      </div>

      <!-- Monthly trend -->
      <div v-if="data.monthly_trend?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Oylik tendensiya</h4>
        </div>
        <AppTable :columns="trendColumns" :data="data.monthly_trend">
          <template #income="{ value }">
            <span class="text-success font-medium">{{ formatMoney(value) }}</span>
          </template>
          <template #expense="{ value }">
            <span class="text-danger font-medium">{{ formatMoney(value) }}</span>
          </template>
          <template #net_profit="{ value }">
            <span :class="Number(value) >= 0 ? 'text-success' : 'text-danger'" class="font-semibold">
              {{ formatMoney(value) }}
            </span>
          </template>
        </AppTable>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-vue-next'
import { analyticsApi } from '@/api'
import { useToast } from '@/composables/useToast'
import { useAnalyticsFilter } from '@/composables/useAnalyticsFilter'
import AnalyticsFilter from './AnalyticsFilter.vue'
import StatCard from './StatCard.vue'
import AppTable from '@/components/ui/AppTable.vue'

const toast = useToast()
const { activePreset, customStart, customEnd, presets, apiParams } = useAnalyticsFilter()
const data = ref(null)
const loading = ref(false)

const trendColumns = [
  { key: 'month', label: 'Oy' },
  { key: 'income', label: 'Daromad' },
  { key: 'expense', label: 'Xarajat' },
  { key: 'net_profit', label: 'Foyda' },
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
    const res = await analyticsApi.getFinance(apiParams.value)
    data.value = res.data
  } catch {
    toast.error('Moliya tahlilini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>