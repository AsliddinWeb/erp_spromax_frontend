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
        <StatCard label="Jami so'rovlar" :value="data.total_requests" unit="ta" color="primary" :icon="Wrench" />
        <StatCard label="Bajarilgan" :value="data.completed_requests" unit="ta" color="success" :icon="CheckCircle" />
        <StatCard label="Kutilmoqda" :value="data.pending_requests" unit="ta" color="warning" :icon="Clock" />
        <StatCard label="Jami soatlar" :value="data.total_maintenance_hours + 'h'" color="info" :icon="Timer" />
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">O'rtacha bajarish vaqti</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ data.average_completion_time }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- By type -->
        <div v-if="data.requests_by_type?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Tur bo'yicha</h4>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-dark-border">
            <div v-for="(t, i) in data.requests_by_type" :key="i" class="px-4 py-2.5 flex justify-between text-sm">
              <span class="text-gray-700 dark:text-gray-300">{{ typeLabel(t.request_type || t.type) }}</span>
              <span class="font-semibold text-primary">{{ t.count }} ta</span>
            </div>
          </div>
        </div>

        <!-- By priority -->
        <div v-if="data.requests_by_priority?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Muhimlik bo'yicha</h4>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-dark-border">
            <div v-for="(p, i) in data.requests_by_priority" :key="i" class="px-4 py-2.5 flex justify-between text-sm">
              <span class="text-gray-700 dark:text-gray-300">{{ priorityLabel(p.priority) }}</span>
              <span class="font-semibold" :class="priorityColor(p.priority)">{{ p.count }} ta</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Most maintained machines -->
      <div v-if="data.machines_most_maintained?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Ko'p ta'mirlangan mashinalar</h4>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-dark-border">
          <div v-for="(m, i) in data.machines_most_maintained" :key="i" class="px-4 py-2.5 flex items-center gap-3">
            <span class="w-5 h-5 rounded-full bg-warning/10 text-warning text-xs font-bold flex items-center justify-center flex-shrink-0">
              {{ i + 1 }}
            </span>
            <span class="flex-1 text-sm text-gray-900 dark:text-white">{{ m.machine_name || m.name }}</span>
            <span class="text-sm font-semibold text-warning">{{ m.count }} ta</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Wrench, CheckCircle, Clock, Timer } from 'lucide-vue-next'
import { analyticsApi } from '@/api'
import { useToast } from '@/composables/useToast'
import { useAnalyticsFilter } from '@/composables/useAnalyticsFilter'
import AnalyticsFilter from './AnalyticsFilter.vue'
import StatCard from '@/components/ui/StatCard.vue'

const toast = useToast()
const { activePreset, customStart, customEnd, presets, apiParams } = useAnalyticsFilter()
const data = ref(null)
const loading = ref(false)

const typeLabel = t => ({ repair: 'Ta\'mirlash', maintenance: 'Texnik xizmat', inspection: 'Tekshiruv' }[t] || t)
const priorityLabel = p => ({ low: 'Past', medium: "O'rta", high: 'Yuqori', urgent: 'Shoshilinch' }[p] || p)
const priorityColor = p => ({ low: 'text-gray-500', medium: 'text-warning', high: 'text-danger', urgent: 'text-danger' }[p] || '')

async function load() {
  loading.value = true
  try {
    const res = await analyticsApi.getMaintenance(apiParams.value)
    data.value = res.data
  } catch {
    toast.error('Texnik xizmat tahlilini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>