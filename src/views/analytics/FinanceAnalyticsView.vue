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
      <!-- Asosiy ko'rsatkichlar -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Jami daromad" :value="formatMoney(data.total_income)" color="success" :icon="TrendingUp" />
        <StatCard label="Jami xarajat" :value="formatMoney(data.total_expense)" color="danger" :icon="TrendingDown" />
        <StatCard label="Sof foyda" :value="formatMoney(data.net_profit)" :color="Number(data.net_profit) >= 0 ? 'success' : 'danger'" :icon="Wallet" />
        <StatCard label="Foyda marjasi" :value="pct(data.profit_margin)" :color="Number(data.profit_margin) >= 0 ? 'info' : 'danger'" :icon="Percent" />
      </div>

      <!-- Kategoriya bo'yicha -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Income by category -->
        <div class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-success"></div>
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Daromad kategoriyalari</h4>
          </div>
          <div v-if="data.income_by_category?.length" class="divide-y divide-gray-100 dark:divide-dark-border">
            <div v-for="(c, i) in data.income_by_category" :key="i" class="px-4 py-2.5 flex justify-between text-sm">
              <span class="text-gray-700 dark:text-gray-300">{{ c.category_name || c.name || c.category }}</span>
              <span class="font-semibold text-success">{{ formatMoney(c.total || c.amount) }}</span>
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
              <span class="text-gray-700 dark:text-gray-300">{{ c.category_name || c.name || c.category }}</span>
              <span class="font-semibold text-danger">{{ formatMoney(c.total || c.amount) }}</span>
            </div>
          </div>
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">Ma'lumot yo'q</div>
        </div>
      </div>

      <!-- ===== MANBA BO'YICHA TAHLIL (yangi) ===== -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Daromad manbasi -->
        <div class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-yellow-400"></div>
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Daromad manbasi</h4>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-dark-border">
            <div class="px-4 py-2.5 flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
                <span class="text-gray-700 dark:text-gray-300">Sotuv to'lovlari</span>
              </div>
              <div class="text-right">
                <span class="font-semibold text-success">{{ formatMoney(sourceStats.income.sales) }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ incomeSourcePct('sales') }}</span>
              </div>
            </div>
            <div class="px-4 py-2.5 flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                <span class="text-gray-700 dark:text-gray-300">Qo'lda kiritilgan</span>
              </div>
              <div class="text-right">
                <span class="font-semibold text-success">{{ formatMoney(sourceStats.income.manual) }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ incomeSourcePct('manual') }}</span>
              </div>
            </div>
            <!-- Progress bar -->
            <div class="px-4 py-3">
              <div class="h-2 rounded-full bg-gray-100 dark:bg-dark-border overflow-hidden">
                <div
                  class="h-full rounded-full bg-yellow-400 transition-all"
                  :style="{ width: rawIncomeSourcePct('sales') }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Xarajat manbasi -->
        <div class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-400"></div>
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Xarajat manbasi</h4>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-dark-border">
            <div class="px-4 py-2.5 flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
                <span class="text-gray-700 dark:text-gray-300">HR (ish haqi)</span>
              </div>
              <div class="text-right">
                <span class="font-semibold text-danger">{{ formatMoney(sourceStats.expense.hr) }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ expenseSourcePct('hr') }}</span>
              </div>
            </div>
            <div class="px-4 py-2.5 flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
                <span class="text-gray-700 dark:text-gray-300">Ombor (xom-ashyo)</span>
              </div>
              <div class="text-right">
                <span class="font-semibold text-danger">{{ formatMoney(sourceStats.expense.warehouse) }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ expenseSourcePct('warehouse') }}</span>
              </div>
            </div>
            <div class="px-4 py-2.5 flex justify-between items-center text-sm">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                <span class="text-gray-700 dark:text-gray-300">Qo'lda kiritilgan</span>
              </div>
              <div class="text-right">
                <span class="font-semibold text-danger">{{ formatMoney(sourceStats.expense.manual) }}</span>
                <span class="text-xs text-gray-400 ml-2">{{ expenseSourcePct('manual') }}</span>
              </div>
            </div>
            <!-- Stacked progress bar -->
            <div class="px-4 py-3">
              <div class="h-2 rounded-full bg-gray-100 dark:bg-dark-border overflow-hidden flex">
                <div class="h-full bg-blue-400 transition-all" :style="{ width: rawExpenseSourcePct('hr') }"></div>
                <div class="h-full bg-green-400 transition-all" :style="{ width: rawExpenseSourcePct('warehouse') }"></div>
                <div class="h-full bg-gray-400 transition-all flex-1"></div>
              </div>
              <div class="flex justify-between text-xs text-gray-400 mt-1">
                <span>HR</span><span>Ombor</span><span>Qo'lda</span>
              </div>
            </div>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { TrendingUp, TrendingDown, Wallet, Percent } from 'lucide-vue-next'
import { analyticsApi, financeApi } from '@/api'
import { useToast } from '@/composables/useToast'
import { useAnalyticsFilter } from '@/composables/useAnalyticsFilter'
import AnalyticsFilter from './AnalyticsFilter.vue'
import StatCard from './StatCard.vue'
import AppTable from '@/components/ui/AppTable.vue'

const toast = useToast()
const { activePreset, customStart, customEnd, presets, apiParams } = useAnalyticsFilter()
const data = ref(null)
const loading = ref(false)

// Manba statistikasi uchun tranzaksiyalar
const allTransactions = ref([])

const trendColumns = [
  { key: 'month', label: 'Oy' },
  { key: 'income', label: 'Daromad' },
  { key: 'expense', label: 'Xarajat' },
  { key: 'net_profit', label: 'Foyda' },
]

// Manba bo'yicha statistika hisoblash
const sourceStats = computed(() => {
  const txs = allTransactions.value
  const stats = {
    income: { sales: 0, manual: 0 },
    expense: { hr: 0, warehouse: 0, manual: 0 }
  }
  for (const tx of txs) {
    const amt = Number(tx.amount || 0)
    if (tx.transaction_type === 'income') {
      if (tx.reference_type === 'sales_payment') stats.income.sales += amt
      else stats.income.manual += amt
    } else if (tx.transaction_type === 'expense') {
      if (tx.reference_type === 'salary_payment') stats.expense.hr += amt
      else if (tx.reference_type === 'warehouse_receipt') stats.expense.warehouse += amt
      else stats.expense.manual += amt
    }
  }
  return stats
})

const totalIncome = computed(() => sourceStats.value.income.sales + sourceStats.value.income.manual)
const totalExpense = computed(() => sourceStats.value.expense.hr + sourceStats.value.expense.warehouse + sourceStats.value.expense.manual)

function incomeSourcePct(key) {
  if (!totalIncome.value) return '0%'
  const val = sourceStats.value.income[key]
  return ((val / totalIncome.value) * 100).toFixed(1) + '%'
}
function rawIncomeSourcePct(key) {
  if (!totalIncome.value) return '0%'
  const val = sourceStats.value.income[key]
  return ((val / totalIncome.value) * 100).toFixed(1) + '%'
}

function expenseSourcePct(key) {
  if (!totalExpense.value) return '0%'
  const val = sourceStats.value.expense[key]
  return ((val / totalExpense.value) * 100).toFixed(1) + '%'
}
function rawExpenseSourcePct(key) {
  if (!totalExpense.value) return '0%'
  const val = sourceStats.value.expense[key]
  return ((val / totalExpense.value) * 100).toFixed(1) + '%'
}

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + " so'm"
}
const pct = v => `${Number(v || 0).toFixed(1)}%`

async function load() {
  loading.value = true
  try {
    const [analyticsRes, txRes] = await Promise.all([
      analyticsApi.getFinance(apiParams.value),
      financeApi.getTransactions({ limit: 1000 }),
    ])
    data.value = analyticsRes.data
    allTransactions.value = txRes.data?.items || txRes.data || []
  } catch {
    toast.error('Moliya tahlilini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>