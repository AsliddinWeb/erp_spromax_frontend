<template>
  <div class="space-y-6">

    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Xush kelibsiz, {{ firstName }} 👋
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Sotuv holati va buyurtmalar
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
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-28 rounded-2xl bg-gray-100 dark:bg-dark-700 animate-pulse"></div>
    </div>

    <!-- Stat kartochkalar -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <StatCard
        icon="Banknote"
        label="Jami daromad"
        :value="formatMoney(data?.total_revenue)"
        color="primary"
      />

      <StatCard
        icon="ShoppingCart"
        label="Jami buyurtmalar"
        :value="data?.total_orders"
        :badge="data?.pending_orders + ' kutmoqda'"
        badge-type="warning"
        color="warning"
      />

      <StatCard
        icon="UserCheck"
        label="Jami mijozlar"
        :value="data?.total_customers"
        color="success"
      />

      <StatCard
        icon="TrendingUp"
        label="Bugungi daromad"
        :value="formatMoney(data?.revenue_today)"
        color="success"
      />

    </div>

    <!-- Pastki qism -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

      <!-- Sotuv statistikasi -->
      <div class="xl:col-span-2 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-5">Sotuv statistikasi</h3>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">To'langan</div>
            <div class="text-2xl font-bold text-success">
              {{ formatMoney(data?.total_paid) }}
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">To'lanmagan</div>
            <div class="text-2xl font-bold text-danger">
              {{ formatMoney(data?.total_unpaid) }}
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Bugun yakunlangan</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data?.completed_orders_today ?? 0 }}
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Kutilayotgan</div>
            <div class="text-2xl font-bold text-warning">
              {{ data?.pending_orders ?? 0 }}
            </div>
          </div>
        </div>

        <!-- To'lov holati progress -->
        <div class="mt-5 pt-5 border-t border-gray-100 dark:border-dark-border">
          <div class="flex justify-between text-sm mb-1.5">
            <span class="text-gray-500 dark:text-gray-400">To'lov holati</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ paidPercent }}% to'langan</span>
          </div>
          <div class="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <div class="h-full bg-success rounded-full transition-all" :style="`width: ${paidPercent}%`"></div>
          </div>
        </div>
      </div>

      <!-- Tezkor havolalar -->
      <div class="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Tezkor havolalar</h3>
        <div class="space-y-1.5">
          <RouterLink
            v-for="link in quickLinks"
            :key="link.label"
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
import { RefreshCw, ChevronRight, ShoppingCart, UserCheck, TrendingUp, Banknote, Plus } from 'lucide-vue-next'
import { salesApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/shared/StatCard.vue'

const authStore = useAuthStore()
const toast = useToast()

const data = ref(null)
const loading = ref(false)

const firstName = computed(() =>
  authStore.user?.full_name?.split(' ')[0] || 'Foydalanuvchi'
)

const paidPercent = computed(() => {
  const total = parseFloat(data.value?.total_revenue) || 0
  const paid = parseFloat(data.value?.total_paid) || 0
  if (!total) return 0
  return Math.min((paid / total * 100), 100).toFixed(0)
})

const quickLinks = [
  { path: '/sales', label: 'Yangi buyurtma',  desc: 'Buyurtma yaratish',  icon: Plus,         bg: 'bg-primary/10', color: 'text-primary' },
  { path: '/sales', label: 'Buyurtmalar',     desc: "Barcha buyurtmalar", icon: ShoppingCart, bg: 'bg-warning/10', color: 'text-warning' },
  { path: '/sales', label: 'Mijozlar',        desc: 'Mijozlar ro\'yxati', icon: UserCheck,    bg: 'bg-success/10', color: 'text-success' },
  { path: '/sales', label: 'Daromad hisobot', desc: 'Sotuv tahlili',      icon: TrendingUp,   bg: 'bg-danger/10',  color: 'text-danger'  },
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
    const { data: res } = await salesApi.getStatistics()
    data.value = res
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>