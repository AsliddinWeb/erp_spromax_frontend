<template>
  <div class="space-y-6">

    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Xush kelibsiz, {{ firstName }} 👋
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Ishlab chiqarish holati va smenalar
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
      <div v-for="i in 4" :key="i" class="h-28 rounded-2xl bg-gray-100 dark:bg-dark-700 animate-pulse"></div>
    </div>

    <!-- Stat kartochkalar -->
    <div v-else class="grid grid-cols-2 xl:grid-cols-4 gap-4">

      <StatCard
        :icon="Factory"
        label="Faol smenalar"
        :value="data?.active_shifts"
        color="primary"
      />

      <StatCard
        :icon="Package"
        label="Bugungi mahsulot"
        :value="data?.total_output_today"
        color="success"
      />

      <StatCard
        :icon="AlertCircle"
        label="Bugungi brak"
        :value="data?.total_defects_today"
        :badge="data?.total_defects_today > 0 ? 'Diqqat!' : 'Yaxshi'"
        :badge-type="data?.total_defects_today > 0 ? 'danger' : 'success'"
        color="danger"
      />

      <StatCard
        :icon="BarChart3"
        label="Ishlab chiqarish liniyalari"
        :value="data?.total_production_lines"
        color="warning"
      />

    </div>

    <!-- Pastki qism -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

      <!-- Ishlab chiqarish statistikasi -->
      <div class="xl:col-span-2 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-5">Ishlab chiqarish statistikasi</h3>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Jami liniyalar</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ data?.total_production_lines ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">ta liniya</div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Faol smenalar</div>
            <div class="text-2xl font-bold text-success">
              {{ data?.active_shifts ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">ta smena</div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Bugungi mahsulot</div>
            <div class="text-2xl font-bold text-primary">
              {{ data?.total_output_today ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">dona</div>
          </div>
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-4">
            <div class="text-xs text-gray-400 mb-1">Bugungi brak</div>
            <div class="text-2xl font-bold text-danger">
              {{ data?.total_defects_today ?? 0 }}
            </div>
            <div class="text-xs text-gray-400 mt-1">dona</div>
          </div>
        </div>

        <!-- Samaradorlik -->
        <div class="mt-5 pt-5 border-t border-gray-100 dark:border-dark-border">
          <div class="flex justify-between text-sm mb-1.5">
            <span class="text-gray-500 dark:text-gray-400">Samaradorlik</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ efficiencyPercent }}%</span>
          </div>
          <div class="h-2.5 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="efficiencyPercent >= 80 ? 'bg-success' : efficiencyPercent >= 60 ? 'bg-warning' : 'bg-danger'"
              :style="`width: ${efficiencyPercent}%`"
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
  RefreshCw, ChevronRight, Factory, Package,
  AlertCircle, BarChart3, Plus, ClipboardList, Wrench
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

const efficiencyPercent = computed(() => {
  const output = parseFloat(data.value?.total_output_today) || 0
  const defects = parseFloat(data.value?.total_defects_today) || 0
  const total = output + defects
  if (!total) return 0
  return Math.min((output / total) * 100, 100).toFixed(0)
})

const quickLinks = [
  { path: '/production', label: 'Smena boshlash',  desc: 'Yangi smena',          icon: Plus,          bg: 'bg-primary/10', color: 'text-primary' },
  { path: '/production', label: 'Smenalar',         desc: 'Barcha smenalar',      icon: ClipboardList, bg: 'bg-success/10', color: 'text-success' },
  { path: '/production', label: 'Mashinalar',       desc: 'Mashina holati',       icon: Factory,       bg: 'bg-warning/10', color: 'text-warning' },
  { path: '/maintenance', label: "Ta'mir so'rovi",  desc: 'Texnik xizmat',        icon: Wrench,        bg: 'bg-danger/10',  color: 'text-danger'  },
]

async function load() {
  loading.value = true
  try {
    const { data: res } = await analyticsApi.getDashboard()
    data.value = res
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>