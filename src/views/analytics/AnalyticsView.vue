<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Tahlil</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Biznes ko'rsatkichlari va statistika</p>
    </div>

    <div class="border-b border-gray-200 dark:border-dark-border">
      <nav class="-mb-px flex space-x-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          class="py-3 px-3 border-b-2 font-medium text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
          :class="activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <SalesAnalyticsView       v-if="activeTab === 'sales'" />
    <ProductionAnalyticsView  v-else-if="activeTab === 'production'" />
    <FinanceAnalyticsView     v-else-if="activeTab === 'finance'" />
    <HRAnalyticsView          v-else-if="activeTab === 'hr'" />
    <InventoryAnalyticsView   v-else-if="activeTab === 'inventory'" />
    <MaintenanceAnalyticsView v-else-if="activeTab === 'maintenance'" />
    <KPIView                  v-else-if="activeTab === 'kpi'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  ShoppingCart, Factory, Wallet, Users,
  Package, Wrench, Target
} from 'lucide-vue-next'
import SalesAnalyticsView       from './SalesAnalyticsView.vue'
import ProductionAnalyticsView  from './ProductionAnalyticsView.vue'
import FinanceAnalyticsView     from './FinanceAnalyticsView.vue'
import HRAnalyticsView          from './HRAnalyticsView.vue'
import InventoryAnalyticsView   from './InventoryAnalyticsView.vue'
import MaintenanceAnalyticsView from './MaintenanceAnalyticsView.vue'
import KPIView                  from './KPIView.vue'

const activeTab = ref('sales')

const tabs = [
  { key: 'sales',       label: 'Sotuv',            icon: ShoppingCart },
  { key: 'production',  label: 'Ishlab chiqarish',  icon: Factory },
  { key: 'finance',     label: 'Moliya',            icon: Wallet },
  { key: 'hr',          label: 'HR',                icon: Users },
  { key: 'inventory',   label: 'Inventar',          icon: Package },
  { key: 'maintenance', label: 'Texnik xizmat',     icon: Wrench },
  { key: 'kpi',         label: 'KPI',               icon: Target },
]
</script>