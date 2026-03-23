<template>
  <div class="space-y-6">

    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Xush kelibsiz, {{ firstName }} 👋
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Umumiy holat — barcha modullar
        </p>
      </div>
      <button
        @click="load"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 transition-all"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
        Yangilash
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="i in 8" :key="i" class="h-28 rounded-2xl bg-gray-100 dark:bg-dark-700 animate-pulse"></div>
    </div>

    <!-- Stat kartochkalar -->
    <div v-else class="grid grid-cols-2 xl:grid-cols-4 gap-4">

      <StatCard
        :icon="Banknote"
        label="Umumiy daromad"
        :value="formatMoney(data?.total_revenue)"
        trend="+12%"
        trend-type="success"
        color="primary"
      />

      <StatCard
        :icon="TrendingUp"
        label="Sof foyda"
        :value="formatMoney(data?.net_profit)"
        color="success"
      />

      <StatCard
        :icon="ShoppingCart"
        label="Jami buyurtmalar"
        :value="data?.total_orders"
        :badge="data?.pending_orders + ' kutmoqda'"
        badge-type="warning"
        color="warning"
      />

      <StatCard
        :icon="Users"
        label="Jami xodimlar"
        :value="data?.total_employees"
        :badge="data?.active_employees + ' faol'"
        badge-type="success"
        color="success"
      />

      <StatCard
        :icon="Factory"
        label="Bugungi mahsulot"
        :value="data?.total_output_today"
        :badge="data?.active_shifts + ' smena'"
        badge-type="info"
        color="primary"
      />

      <StatCard
        :icon="UserCheck"
        label="Jami mijozlar"
        :value="data?.total_customers"
        color="warning"
      />

      <StatCard
        :icon="PackageX"
        label="Kam qoldiq materiallar"
        :value="data?.low_stock_materials"
        :badge="data?.low_stock_materials > 0 ? 'Diqqat!' : ''"
        badge-type="danger"
        color="danger"
      />

      <StatCard
        :icon="Wrench"
        label="Ta'mirda mashinalar"
        :value="data?.machines_under_maintenance"
        :badge="data?.pending_maintenance + ' kutmoqda'"
        badge-type="danger"
        color="danger"
      />

    </div>

    <!-- Pastki qism -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

      <!-- Moliyaviy holat -->
      <div class="xl:col-span-2 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-semibold text-gray-900 dark:text-white">Moliyaviy holat</h3>
          <span class="text-xs text-gray-400">Jami</span>
        </div>

        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Daromad</span>
              <span class="font-semibold text-success">{{ formatMoney(data?.total_income) }}</span>
            </div>
            <div class="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
              <div class="h-full bg-success rounded-full" :style="`width: ${incomePercent}%`"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Xarajat</span>
              <span class="font-semibold text-danger">{{ formatMoney(data?.total_expense) }}</span>
            </div>
            <div class="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
              <div class="h-full bg-danger rounded-full" :style="`width: ${expensePercent}%`"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-gray-500 dark:text-gray-400">Sof foyda</span>
              <span class="font-semibold text-primary">{{ formatMoney(data?.net_profit) }}</span>
            </div>
            <div class="h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full" :style="`width: ${profitPercent}%`"></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-dark-border">
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
            <div class="text-xs text-gray-400 mb-1">Bugungi daromad</div>
            <div class="font-bold text-gray-900 dark:text-white">{{ formatMoney(data?.revenue_today) }}</div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-3">
            <div class="text-xs text-gray-400 mb-1">Shu oy daromad</div>
            <div class="font-bold text-gray-900 dark:text-white">{{ formatMoney(data?.revenue_this_month) }}</div>
          </div>
        </div>
      </div>

      <!-- Tezkor havolalar -->
      <div class="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Tezkor havolalar</h3>
        <div class="space-y-1.5">
          <RouterLink
            v-for="link in quickLinks"
            :key="link.path"
            :to="link.path"
            class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :class="link.bg">
              <component :is="link.icon" class="w-4 h-4" :class="link.color" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ link.label }}</div>
              <div class="text-xs text-gray-400">{{ link.desc }}</div>
            </div>
            <ChevronRight class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
          </RouterLink>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Banknote, ShoppingCart, Users, Factory, TrendingUp,
  UserCheck, PackageX, Wrench, RefreshCw, ChevronRight
} from 'lucide-vue-next'
import { analyticsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/ui/StatCard.vue'

const authStore = useAuthStore()
const toast = useToast()

const data = ref(null)
const loading = ref(false)

const firstName = computed(() =>
  authStore.user?.full_name?.split(' ')[0] || 'Foydalanuvchi'
)

const total = computed(() => {
  const income = parseFloat(data.value?.total_income) || 0
  const expense = parseFloat(data.value?.total_expense) || 0
  return Math.max(income + expense, 1)
})

const incomePercent = computed(() =>
  Math.min((parseFloat(data.value?.total_income) || 0) / total.value * 100, 100).toFixed(0)
)
const expensePercent = computed(() =>
  Math.min((parseFloat(data.value?.total_expense) || 0) / total.value * 100, 100).toFixed(0)
)
const profitPercent = computed(() =>
  Math.min(Math.max((parseFloat(data.value?.net_profit) || 0) / total.value * 100, 0), 100).toFixed(0)
)

const quickLinks = [
  { path: '/warehouse',   label: 'Yangi qabul',     desc: 'Xom-ashyo qabul',    icon: PackageX,     bg: 'bg-primary/10', color: 'text-primary' },
  { path: '/sales',       label: 'Yangi buyurtma',  desc: 'Mijoz buyurtmasi',   icon: ShoppingCart, bg: 'bg-warning/10', color: 'text-warning' },
  { path: '/production',  label: 'Smena boshlash',  desc: 'Ishlab chiqarish',   icon: Factory,      bg: 'bg-success/10', color: 'text-success' },
  { path: '/hr',          label: 'Davomat',         desc: 'Bugungi davomat',    icon: Users,        bg: 'bg-primary/10', color: 'text-primary' },
  { path: '/maintenance', label: "Ta'mir so'rovi",  desc: 'Texnik xizmat',      icon: Wrench,       bg: 'bg-danger/10',  color: 'text-danger'  },
]

function formatMoney(val) {
  if (!val) return "0"
  const num = parseFloat(val)
  if (isNaN(num)) return "0"
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  if (num >= 1_000) return (num / 1_000).toFixed(0) + ' ming'
  return num.toLocaleString()
}

async function load() {
  loading.value = true
  try {
    const { data: res } = await analyticsApi.getDashboard()
    data.value = res
  } catch {
    toast.error("Dashboard ma'lumotlarini yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>