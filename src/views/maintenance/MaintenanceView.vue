<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Texnik xizmat</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Ta'mir so'rovlari, ehtiyot qismlar va jadval</p>
    </div>

    <div class="border-b border-gray-200 dark:border-dark-border">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
          :class="activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
          <span
            v-if="tab.badge"
            class="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-danger text-white"
          >
            {{ tab.badge }}
          </span>
        </button>
      </nav>
    </div>

    <RequestsView   v-if="activeTab === 'requests'" />
    <SparePartsView v-else-if="activeTab === 'spareparts'" @low-stock="lowStockCount = $event" />
    <SchedulesView  v-else-if="activeTab === 'schedules'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Wrench, Package, CalendarClock } from 'lucide-vue-next'
import RequestsView   from './RequestsView.vue'
import SparePartsView from './SparePartsView.vue'
import SchedulesView  from './SchedulesView.vue'

const activeTab = ref('requests')
const lowStockCount = ref(0)

const tabs = [
  { key: 'requests',   label: "Ta'mir so'rovlari", icon: Wrench },
  { key: 'spareparts', label: 'Ehtiyot qismlar',   icon: Package },
  { key: 'schedules',  label: 'Jadval',             icon: CalendarClock },
]
</script>