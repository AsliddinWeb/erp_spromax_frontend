<template>
  <div class="space-y-6">

    <!-- Welcome -->
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Xush kelibsiz, {{ firstName }} 👋
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Texnik xizmat holati va so'rovlar
        </p>
      </div>
      <button
        @click="load"
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-300 transition-all flex-shrink-0"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
        Yangilash
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-28 rounded-2xl bg-gray-100 dark:bg-dark-700 animate-pulse"></div>
    </div>

    <!-- Stat kartochkalar -->
    <div v-else class="grid grid-cols-2 xl:grid-cols-4 gap-4">

      <StatCard
        :icon="Wrench"
        label="Jami so'rovlar"
        :value="data?.total_requests"
        color="primary"
      />

      <StatCard
        :icon="Clock"
        label="Kutilayotgan"
        :value="data?.pending_requests"
        :badge="data?.pending_requests > 0 ? 'Yangi' : ''"
        badge-type="warning"
        color="warning"
      />

      <StatCard
        :icon="CheckCircle"
        label="Yakunlangan"
        :value="data?.completed_requests"
        color="success"
      />

      <StatCard
        :icon="PackageX"
        label="Kam ehtiyot qismlar"
        :value="data?.low_stock_spare_parts"
        :badge="data?.low_stock_spare_parts > 0 ? 'Diqqat!' : 'Yaxshi'"
        :badge-type="data?.low_stock_spare_parts > 0 ? 'danger' : 'success'"
        color="danger"
      />

    </div>

    <!-- Pastki qism -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

      <!-- Texnik xizmat statistikasi -->
      <div class="xl:col-span-2 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-5">Texnik xizmat statistikasi</h3>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Jami so'rovlar</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data?.total_requests ?? 0 }}
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Jarayonda</div>
            <div class="text-2xl font-bold text-primary">
              {{ data?.in_progress_requests ?? 0 }}
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Ta'mirda mashinalar</div>
            <div class="text-2xl font-bold text-warning">
              {{ data?.machines_under_maintenance ?? 0 }}
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Rejalashtirilgan</div>
            <div class="text-2xl font-bold text-success">
              {{ data?.scheduled_maintenance ?? 0 }}
            </div>
          </div>
        </div>

        <!-- Yakunlash foizi -->
        <div class="mt-5 pt-5 border-t border-gray-100 dark:border-dark-border">
          <div class="flex justify-between text-sm mb-1.5">
            <span class="text-gray-500 dark:text-gray-400">Yakunlash foizi</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ completionPercent }}%</span>
          </div>
          <div class="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="completionPercent >= 80 ? 'bg-success' : completionPercent >= 50 ? 'bg-warning' : 'bg-danger'"
              :style="`width: ${completionPercent}%`"
            ></div>
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
import {
  RefreshCw, ChevronRight, Wrench, Clock,
  CheckCircle, PackageX, Plus, ClipboardList, Calendar
} from 'lucide-vue-next'
import { maintenanceApi } from '@/api'
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

const completionPercent = computed(() => {
  const total = data.value?.total_requests || 0
  const completed = data.value?.completed_requests || 0
  if (!total) return 0
  return Math.min((completed / total) * 100, 100).toFixed(0)
})

const quickLinks = [
  { path: '/maintenance', label: "Yangi so'rov",     desc: "Ta'mir so'rovi",     icon: Plus,          bg: 'bg-primary/10', color: 'text-primary' },
  { path: '/maintenance', label: "So'rovlar",         desc: 'Barcha so\'rovlar',  icon: ClipboardList, bg: 'bg-warning/10', color: 'text-warning' },
  { path: '/maintenance', label: 'Ehtiyot qismlar',  desc: 'Qoldiqlar holati',   icon: PackageX,      bg: 'bg-danger/10',  color: 'text-danger'  },
  { path: '/maintenance', label: 'Jadval',            desc: 'Rejalashtirilgan',   icon: Calendar,      bg: 'bg-success/10', color: 'text-success' },
]

async function load() {
  loading.value = true
  try {
    const { data: res } = await maintenanceApi.getStatistics()
    data.value = res
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>