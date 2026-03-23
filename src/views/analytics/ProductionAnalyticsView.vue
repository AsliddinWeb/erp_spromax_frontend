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
        <StatCard label="Jami smenalar" :value="data.total_shifts" unit="ta" color="primary" :icon="Factory" />
        <StatCard label="Jami mahsulot" :value="data.total_output" color="success" :icon="Package" />
        <StatCard label="Jami nuqson" :value="data.total_defects" color="danger" :icon="AlertTriangle" />
        <StatCard label="O'rtacha samaradorlik" :value="pct(data.average_efficiency)" color="info" :icon="TrendingUp" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Defect rate -->
        <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
          <p class="text-xs text-gray-500 dark:text-gray-400">Nuqson darajasi</p>
          <p class="text-2xl font-bold text-danger mt-1">{{ pct(data.defect_rate) }}</p>
          <div class="mt-2 h-2 rounded-full bg-gray-100 dark:bg-dark-700">
            <div
              class="h-2 rounded-full bg-danger transition-all"
              :style="`width: ${Math.min(Number(data.defect_rate || 0), 100)}%`"
            ></div>
          </div>
        </div>

        <!-- Efficiency bar -->
        <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
          <p class="text-xs text-gray-500 dark:text-gray-400">Samaradorlik</p>
          <p class="text-2xl font-bold text-success mt-1">{{ pct(data.average_efficiency) }}</p>
          <div class="mt-2 h-2 rounded-full bg-gray-100 dark:bg-dark-700">
            <div
              class="h-2 rounded-full bg-success transition-all"
              :style="`width: ${Math.min(Number(data.average_efficiency || 0), 100)}%`"
            ></div>
          </div>
        </div>
      </div>

      <!-- Production by line -->
      <div v-if="data.production_by_line?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Liniyalar bo'yicha</h4>
        </div>
        <AppTable :columns="lineColumns" :data="data.production_by_line">
          <template #efficiency="{ value }">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-dark-700">
                <div class="h-1.5 rounded-full bg-success" :style="`width: ${Math.min(Number(value||0),100)}%`"></div>
              </div>
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 text-right">{{ pct(value) }}</span>
            </div>
          </template>
        </AppTable>
      </div>

      <!-- Top defect reasons -->
      <div v-if="data.top_defect_reasons?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Nuqson sabablari</h4>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-dark-border">
          <div v-for="(r, i) in data.top_defect_reasons" :key="i" class="px-4 py-2.5 flex justify-between text-sm">
            <span class="text-gray-900 dark:text-white">{{ r.reason }}</span>
            <span class="font-medium text-danger">{{ r.count }} ta</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Factory, Package, AlertTriangle, TrendingUp } from 'lucide-vue-next'
import { analyticsApi } from '@/api'
import { useToast } from '@/composables/useToast'
import { useAnalyticsFilter } from '@/composables/useAnalyticsFilter'
import AnalyticsFilter from './AnalyticsFilter.vue'
import StatCard from '@/components/ui/StatCard.vue'
import AppTable from '@/components/ui/AppTable.vue'

const toast = useToast()
const { activePreset, customStart, customEnd, presets, apiParams } = useAnalyticsFilter()
const data = ref(null)
const loading = ref(false)

const lineColumns = [
  { key: 'line_name', label: 'Liniya' },
  { key: 'total_output', label: 'Mahsulot' },
  { key: 'total_defects', label: 'Nuqson' },
  { key: 'efficiency', label: 'Samaradorlik' },
]

const pct = v => `${Number(v || 0).toFixed(1)}%`

async function load() {
  loading.value = true
  try {
    const res = await analyticsApi.getProduction(apiParams.value)
    data.value = res.data
  } catch {
    toast.error('Ishlab chiqarish tahlilini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>