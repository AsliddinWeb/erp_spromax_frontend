<template>
  <div class="space-y-6">

    <!-- Welcome -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Xush kelibsiz, {{ firstName }} 👋
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Xodimlar holati va davomat
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
        icon="Users"
        label="Jami xodimlar"
        :value="data?.total_employees"
        :badge="data?.active_employees + ' faol'"
        badge-type="success"
        color="primary"
      />

      <StatCard
        icon="UserCheck"
        label="Ta'tilda"
        :value="data?.on_leave"
        color="warning"
      />

      <StatCard
        icon="Banknote"
        label="Shu oy ish haqi"
        :value="formatMoney(data?.total_salary_paid_this_month)"
        color="success"
      />

      <StatCard
        icon="BarChart3"
        label="Davomat foizi"
        :value="data?.attendance_rate + '%'"
        color="primary"
      />

    </div>

    <!-- Pastki qism -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">

      <!-- Bo'limlar -->
      <div class="xl:col-span-2 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-5">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-5">Bo'limlar bo'yicha xodimlar</h3>

        <div v-if="data?.departments?.length" class="space-y-3">
          <div
            v-for="dept in data.departments"
            :key="dept.department_id"
            class="flex items-center gap-3"
          >
            <div class="w-32 text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ dept.department_name }}
            </div>
            <div class="flex-1 h-2 bg-gray-100 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all"
                :style="`width: ${getPercent(dept.employee_count)}%`"
              ></div>
            </div>
            <div class="w-8 text-sm font-semibold text-gray-900 dark:text-white text-right">
              {{ dept.employee_count }}
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-400 text-center py-8">
          Bo'limlar topilmadi
        </div>

        <!-- O'rtacha ish haqi -->
        <div class="mt-5 pt-5 border-t border-gray-100 dark:border-dark-border">
          <div class="bg-gray-50 dark:bg-dark-700 rounded-xl p-3 flex items-center justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">O'rtacha ish haqi</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ formatMoney(data?.average_salary) }}</span>
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
import { RefreshCw, ChevronRight, Users, UserCheck, Banknote, BarChart3, Plus, ClipboardList } from 'lucide-vue-next'
import { hrApi } from '@/api'
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

const maxEmployees = computed(() => {
  if (!data.value?.departments?.length) return 1
  return Math.max(...data.value.departments.map(d => d.employee_count), 1)
})

function getPercent(count) {
  return Math.min((count / maxEmployees.value) * 100, 100).toFixed(0)
}

const quickLinks = [
  { path: '/hr', label: 'Xodim qo\'shish', desc: 'Yangi xodim',       icon: Plus,          bg: 'bg-primary/10', color: 'text-primary' },
  { path: '/hr', label: 'Davomat',         desc: 'Bugungi davomat',   icon: ClipboardList, bg: 'bg-success/10', color: 'text-success' },
  { path: '/hr', label: 'Ish haqi',        desc: 'To\'lov qilish',    icon: Banknote,      bg: 'bg-warning/10', color: 'text-warning' },
  { path: '/hr', label: "Ta'til so'rovlar", desc: 'Kutilayotganlar',  icon: UserCheck,     bg: 'bg-danger/10',  color: 'text-danger'  },
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
    const { data: res } = await hrApi.getStatistics()
    data.value = res
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>