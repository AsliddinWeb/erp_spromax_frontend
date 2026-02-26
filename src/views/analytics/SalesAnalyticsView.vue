<template>
  <div class="space-y-5">
    <!-- Date filter -->
    <AnalyticsFilter
      :presets="presets"
      v-model:activePreset="activePreset"
      v-model:customStart="customStart"
      v-model:customEnd="customEnd"
      :loading="loading"
      @apply="load"
    />

    <!-- Stat cards -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Jami buyurtmalar" :value="data.total_orders" unit="ta" color="primary" :icon="ShoppingCart" />
        <StatCard label="Jami daromad" :value="formatMoney(data.total_revenue)" color="success" :icon="TrendingUp" />
        <StatCard label="To'langan" :value="formatMoney(data.total_paid)" color="info" :icon="CheckCircle" />
        <StatCard label="Qarzdorlik" :value="formatMoney(data.total_unpaid)" color="warning" :icon="Clock" />
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-sm text-gray-500 dark:text-gray-400">O'rtacha buyurtma qiymati</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ formatMoney(data.average_order_value) }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Top customers -->
        <div class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Top mijozlar</h4>
          </div>
          <div v-if="data.top_customers?.length" class="divide-y divide-gray-100 dark:divide-dark-border">
            <div
              v-for="(c, i) in data.top_customers"
              :key="i"
              class="px-4 py-2.5 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {{ i + 1 }}
                </span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ c.customer_name || c.name }}</span>
              </div>
              <span class="text-sm font-semibold text-primary">{{ formatMoney(c.total_amount || c.total) }}</span>
            </div>
          </div>
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">Ma'lumot yo'q</div>
        </div>

        <!-- Top products -->
        <div class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Top mahsulotlar</h4>
          </div>
          <div v-if="data.top_products?.length" class="divide-y divide-gray-100 dark:divide-dark-border">
            <div
              v-for="(p, i) in data.top_products"
              :key="i"
              class="px-4 py-2.5 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-success/10 text-success text-xs font-bold flex items-center justify-center">
                  {{ i + 1 }}
                </span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ p.product_name || p.name }}</span>
              </div>
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ p.total_quantity || p.quantity }} dona</span>
            </div>
          </div>
          <div v-else class="px-4 py-6 text-center text-sm text-gray-400">Ma'lumot yo'q</div>
        </div>
      </div>

      <!-- Sales by day -->
      <div v-if="data.sales_by_day?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Kunlik sotuv</h4>
        </div>
        <AppTable :columns="dayColumns" :data="data.sales_by_day">
          <template #revenue="{ value }">
            <span class="font-medium text-primary">{{ formatMoney(value) }}</span>
          </template>
        </AppTable>
      </div>
    </template>

    <div v-else class="text-center py-12 text-gray-400">
      <ShoppingCart class="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p class="text-sm">Ma'lumot yuklanmadi</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ShoppingCart, TrendingUp, CheckCircle, Clock } from 'lucide-vue-next'
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

const dayColumns = [
  { key: 'date', label: 'Sana' },
  { key: 'orders_count', label: 'Buyurtmalar' },
  { key: 'amount', label: 'Daromad' },
]

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}

async function load() {
  loading.value = true
  try {
    const res = await analyticsApi.getSales(apiParams.value)
    data.value = res.data
  } catch {
    toast.error('Sotuv tahlilini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>