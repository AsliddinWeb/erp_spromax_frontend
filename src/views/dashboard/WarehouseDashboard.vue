<template>
  <div class="space-y-6">

    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Xush kelibsiz, {{ firstName }} 👋
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Ombor holati va material qoldiqlar
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
        icon="Package"
        label="Jami xom-ashyolar"
        :value="data?.total_raw_materials"
        color="primary"
      />

      <StatCard
        icon="PackageX"
        label="Kam qoldiq"
        :value="data?.low_stock_items_count"
        :badge="data?.low_stock_items_count > 0 ? 'Diqqat!' : 'Yaxshi'"
        :badge-type="data?.low_stock_items_count > 0 ? 'danger' : 'success'"
        color="danger"
      />

      <StatCard
        icon="Banknote"
        label="Ombor qiymati"
        :value="formatMoney(data?.total_stock_value)"
        color="success"
      />

      <StatCard
        icon="Clock"
        label="Kutilayotgan so'rovlar"
        :value="data?.pending_requests_count"
        :badge="data?.pending_requests_count > 0 ? 'Yangi' : ''"
        badge-type="warning"
        color="warning"
      />

    </div>

    <!-- Pastki qism -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

      <!-- Oy statistikasi -->
      <div class="xl:col-span-2 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-semibold text-gray-900 dark:text-white">Shu oy qabullari</h3>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Qabul soni</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data?.total_receipts_this_month ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">ta qabul</div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Qabul qiymati</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ formatMoney(data?.total_receipts_value_this_month) }}
            </div>
            <div class="text-xs text-gray-400 mt-1">so'm</div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Yetkazuvchilar</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data?.total_suppliers ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">ta yetkazuvchi</div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Kam qoldiq</div>
            <div class="text-2xl font-bold text-danger">
              {{ data?.low_stock_items_count ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">ta material</div>
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
import { RefreshCw, ChevronRight, Package, PackageX, Truck, ClipboardList } from 'lucide-vue-next'
import { warehouseApi } from '@/api'
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

const quickLinks = [
  { path: '/warehouse', label: 'Yangi qabul',      desc: 'Xom-ashyo qabul qilish', icon: Truck,         bg: 'bg-primary/10', color: 'text-primary' },
  { path: '/warehouse', label: 'Materiallar',       desc: 'Xom-ashyo katalogi',     icon: Package,       bg: 'bg-success/10', color: 'text-success' },
  { path: '/warehouse', label: 'Qoldiqlar',         desc: 'Joriy qoldiqlar',        icon: PackageX,      bg: 'bg-warning/10', color: 'text-warning' },
  { path: '/warehouse', label: "Material so'rovlar", desc: 'Kelgan so\'rovlar',     icon: ClipboardList, bg: 'bg-danger/10',  color: 'text-danger'  },
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
    const { data: res } = await warehouseApi.getStatistics()
    data.value = res
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>