<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Ombor boshqaruvi</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Yetkazib beruvchilar, materiallar, zaxira va so'rovlar</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-dark-border">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors"
          :class="activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <SuppliersView v-if="activeTab === 'suppliers'" />
    <MaterialsView v-else-if="activeTab === 'materials'" />
    <StockView v-else-if="activeTab === 'stock'" />
    <RequestsView v-else-if="activeTab === 'requests'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Truck, Package, BarChart3, ClipboardList } from 'lucide-vue-next'
import SuppliersView from './SuppliersView.vue'
import MaterialsView from './MaterialsView.vue'
import StockView from './StockView.vue'
import RequestsView from './RequestsView.vue'

const activeTab = ref('suppliers')

const tabs = [
  { key: 'suppliers', label: 'Yetkazib beruvchilar', icon: Truck },
  { key: 'materials', label: 'Xom ashyolar', icon: Package },
  { key: 'stock', label: 'Zaxira', icon: BarChart3 },
  { key: 'requests', label: "So'rovlar", icon: ClipboardList },
]
</script>