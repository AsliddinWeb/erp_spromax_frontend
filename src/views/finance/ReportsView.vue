<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Moliyaviy hisobotlar</h3>

    <!-- Report tabs -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="tab in reportTabs"
        :key="tab.key"
        @click="activeReport = tab.key"
        class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeReport === tab.key
          ? 'bg-primary text-white'
          : 'bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- P&L Report -->
    <div v-if="activeReport === 'pl'" class="space-y-4">
      <!-- Date filter -->
      <div class="flex gap-3 items-end flex-wrap">
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">Boshlanish</label>
          <AppInput v-model="plFilter.start_date" type="date" class="w-40" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">Tugash</label>
          <AppInput v-model="plFilter.end_date" type="date" class="w-40" />
        </div>
        <AppButton :loading="plLoading" :icon="RefreshCw" @click="loadPL">Hisoblash</AppButton>
      </div>

      <div v-if="plLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="plReport" class="space-y-4">
        <!-- Summary -->
        <div class="grid grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-success/10 dark:bg-success/5 border border-success/20">
            <p class="text-xs text-success font-medium">Jami kirim</p>
            <p class="text-2xl font-bold text-success mt-1">{{ formatMoney(plReport.total_income) }}</p>
          </div>
          <div class="p-4 rounded-xl bg-danger/10 dark:bg-danger/5 border border-danger/20">
            <p class="text-xs text-danger font-medium">Jami chiqim</p>
            <p class="text-2xl font-bold text-danger mt-1">{{ formatMoney(plReport.total_expense) }}</p>
          </div>
          <div class="p-4 rounded-xl border"
            :class="Number(plReport.net_profit) >= 0
              ? 'bg-primary/10 dark:bg-primary/5 border-primary/20'
              : 'bg-danger/10 dark:bg-danger/5 border-danger/20'"
          >
            <p class="text-xs font-medium" :class="Number(plReport.net_profit) >= 0 ? 'text-primary' : 'text-danger'">Sof foyda</p>
            <p class="text-2xl font-bold mt-1" :class="Number(plReport.net_profit) >= 0 ? 'text-primary' : 'text-danger'">
              {{ formatMoney(plReport.net_profit) }}
            </p>
          </div>
        </div>

        <!-- Period -->
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Davr: {{ formatDate(plReport.period_start) }} — {{ formatDate(plReport.period_end) }}
        </p>

        <!-- Income by category -->
        <div class="grid grid-cols-2 gap-4">
          <div class="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
            <div class="px-4 py-3 bg-success/10 dark:bg-success/5 border-b border-gray-200 dark:border-dark-border">
              <h4 class="text-sm font-semibold text-success">Kirim kategoriyalari</h4>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-dark-border">
              <div
                v-for="item in plReport.income_by_category"
                :key="item.category_id"
                class="px-4 py-3 flex justify-between items-center"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.category_name }}</span>
                <span class="text-sm font-semibold text-success">{{ formatMoney(item.total_amount) }}</span>
              </div>
              <div v-if="!plReport.income_by_category?.length" class="px-4 py-6 text-center text-sm text-gray-400">
                Ma'lumot yo'q
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
            <div class="px-4 py-3 bg-danger/10 dark:bg-danger/5 border-b border-gray-200 dark:border-dark-border">
              <h4 class="text-sm font-semibold text-danger">Chiqim kategoriyalari</h4>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-dark-border">
              <div
                v-for="item in plReport.expense_by_category"
                :key="item.category_id"
                class="px-4 py-3 flex justify-between items-center"
              >
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.category_name }}</span>
                <span class="text-sm font-semibold text-danger">{{ formatMoney(item.total_amount) }}</span>
              </div>
              <div v-if="!plReport.expense_by_category?.length" class="px-4 py-6 text-center text-sm text-gray-400">
                Ma'lumot yo'q
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400">
        <BarChart2 class="w-12 h-12 mb-3 opacity-30" />
        <p class="text-sm">Sana tanlang va "Hisoblash" bosing</p>
      </div>
    </div>

    <!-- Cash Flow Report -->
    <div v-else-if="activeReport === 'cashflow'" class="space-y-4">
      <div class="flex gap-3 items-end flex-wrap">
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">Boshlanish</label>
          <AppInput v-model="cfFilter.start_date" type="date" class="w-40" />
        </div>
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">Tugash</label>
          <AppInput v-model="cfFilter.end_date" type="date" class="w-40" />
        </div>
        <AppButton :loading="cfLoading" :icon="RefreshCw" @click="loadCashFlow">Hisoblash</AppButton>
      </div>

      <div v-if="cfLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="cfReport" class="space-y-4">
        <!-- Summary cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
            <p class="text-xs text-gray-500 dark:text-gray-400">Boshlang'ich balans</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">{{ formatMoney(cfReport.opening_balance) }}</p>
          </div>
          <div class="p-4 rounded-xl bg-success/10 border border-success/20">
            <p class="text-xs text-success font-medium">Kirim oqimi</p>
            <p class="text-xl font-bold text-success mt-1">{{ formatMoney(cfReport.total_inflow) }}</p>
          </div>
          <div class="p-4 rounded-xl bg-danger/10 border border-danger/20">
            <p class="text-xs text-danger font-medium">Chiqim oqimi</p>
            <p class="text-xl font-bold text-danger mt-1">{{ formatMoney(cfReport.total_outflow) }}</p>
          </div>
          <div class="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p class="text-xs text-primary font-medium">Yakuniy balans</p>
            <p class="text-xl font-bold text-primary mt-1">{{ formatMoney(cfReport.closing_balance) }}</p>
          </div>
        </div>

        <!-- Monthly breakdown -->
        <div v-if="cfReport.cash_flow_by_month?.length" class="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 bg-gray-50 dark:bg-dark-700 border-b border-gray-200 dark:border-dark-border">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Oylik tahlil</h4>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th class="px-4 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Oy</th>
                <th class="px-4 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">Kirim</th>
                <th class="px-4 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">Chiqim</th>
                <th class="px-4 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">Sof</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-dark-border">
              <tr v-for="month in cfReport.cash_flow_by_month" :key="month.month">
                <td class="px-4 py-3 text-gray-900 dark:text-white">{{ month.month }}</td>
                <td class="px-4 py-3 text-right text-success font-medium">{{ formatMoney(month.inflow) }}</td>
                <td class="px-4 py-3 text-right text-danger font-medium">{{ formatMoney(month.outflow) }}</td>
                <td class="px-4 py-3 text-right font-semibold"
                  :class="Number(month.inflow) - Number(month.outflow) >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatMoney(Number(month.inflow) - Number(month.outflow)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400">
        <BarChart2 class="w-12 h-12 mb-3 opacity-30" />
        <p class="text-sm">Sana tanlang va "Hisoblash" bosing</p>
      </div>
    </div>

    <!-- Balance Sheet -->
    <div v-else-if="activeReport === 'balance'" class="space-y-4">
      <div class="flex gap-3 items-end flex-wrap">
        <div class="space-y-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">Sana</label>
          <AppInput v-model="balanceFilter.report_date" type="date" class="w-40" />
        </div>
        <AppButton :loading="balLoading" :icon="RefreshCw" @click="loadBalance">Hisoblash</AppButton>
      </div>

      <div v-if="balLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <div v-else-if="balReport" class="space-y-4">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Hisobot sanasi: {{ formatDate(balReport.report_date) }}
        </p>

        <div class="grid grid-cols-3 gap-4">
          <div class="p-5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Jami aktivlar</p>
            <p class="text-2xl font-bold text-primary mt-2">{{ formatMoney(balReport.total_assets) }}</p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Jami majburiyatlar</p>
            <p class="text-2xl font-bold text-danger mt-2">{{ formatMoney(balReport.total_liabilities) }}</p>
          </div>
          <div class="p-5 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border text-center">
            <p class="text-sm text-gray-500 dark:text-gray-400">Kapital</p>
            <p class="text-2xl font-bold mt-2"
              :class="Number(balReport.total_equity) >= 0 ? 'text-success' : 'text-danger'"
            >
              {{ formatMoney(balReport.total_equity) }}
            </p>
          </div>
        </div>

        <!-- Formula -->
        <div class="p-4 rounded-xl bg-gray-50 dark:bg-dark-700 text-sm text-center text-gray-600 dark:text-gray-400">
          Aktivlar = Majburiyatlar + Kapital &nbsp;|&nbsp;
          <span class="font-mono">{{ formatMoney(balReport.total_assets) }} = {{ formatMoney(balReport.total_liabilities) }} + {{ formatMoney(balReport.total_equity) }}</span>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400">
        <BarChart2 class="w-12 h-12 mb-3 opacity-30" />
        <p class="text-sm">Sana tanlang va "Hisoblash" bosing</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { todayISO, nowLocalISO, startOfMonthISO, startOfYearISO, formatDate, formatDateTime } from '@/composables/useDate'
import { ref } from 'vue'
import { RefreshCw, BarChart2 } from 'lucide-vue-next'
import { financeApi } from '@/api'
import { useToast } from '@/composables/useToast'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const toast = useToast()

const activeReport = ref('pl')

const reportTabs = [
  { key: 'pl',        label: 'Foyda va Zarar (P&L)' },
  { key: 'cashflow',  label: 'Pul Oqimi (Cash Flow)' },
  { key: 'balance',   label: 'Balans Varaqasi' },
]

// P&L
const plReport = ref(null)
const plLoading = ref(false)
const plFilter = ref({
  start_date: startOfMonthISO(),
  end_date: todayISO(),
})

// Cash Flow
const cfReport = ref(null)
const cfLoading = ref(false)
const cfFilter = ref({
  start_date: startOfYearISO(),
  end_date: todayISO(),
})

// Balance
const balReport = ref(null)
const balLoading = ref(false)
const balanceFilter = ref({
  report_date: todayISO(),
})

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + ' mlrd so\'m'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln so\'m'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}


async function loadPL() {
  if (!plFilter.value.start_date || !plFilter.value.end_date) {
    toast.error('Sana oralig\'ini tanlang')
    return
  }
  plLoading.value = true
  try {
    const { data } = await financeApi.getPLReport({
      start_date: plFilter.value.start_date + 'T00:00:00',
      end_date: plFilter.value.end_date + 'T23:59:59',
    })
    plReport.value = data
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Hisobot yuklanmadi')
  } finally {
    plLoading.value = false
  }
}

async function loadCashFlow() {
  if (!cfFilter.value.start_date || !cfFilter.value.end_date) {
    toast.error('Sana oralig\'ini tanlang')
    return
  }
  cfLoading.value = true
  try {
    const { data } = await financeApi.getCashFlowReport({
        start_date: cfFilter.value.start_date + 'T00:00:00',
        end_date: cfFilter.value.end_date + 'T23:59:59',
    })
    cfReport.value = data
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Hisobot yuklanmadi')
  } finally {
    cfLoading.value = false
  }
}

async function loadBalance() {
  if (!balanceFilter.value.report_date) {
    toast.error('Sanani tanlang')
    return
  }
  balLoading.value = true
  try {
    const { data } = await financeApi.getBalanceReport({
        report_date: balanceFilter.value.report_date + 'T23:59:59',
    })
    balReport.value = data
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Hisobot yuklanmadi')
  } finally {
    balLoading.value = false
  }
}
</script>