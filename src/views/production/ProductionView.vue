<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Ishlab chiqarish</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Liniyalar, mashinalar, tayyor mahsulotlar va smenalar</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 dark:border-dark-border">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in visibleTabs"
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
    <LinesView v-if="activeTab === 'lines'" />
    <MachinesView v-else-if="activeTab === 'machines'" />
    <FinishedProductsView v-else-if="activeTab === 'products'" />
    <ShiftsView v-else-if="activeTab === 'shifts'" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { GitBranch, Cog, Package, Clock } from 'lucide-vue-next'
import { usePermission } from '@/composables/usePermission'
import LinesView from './LinesView.vue'
import MachinesView from './MachinesView.vue'
import FinishedProductsView from './FinishedProductsView.vue'
import ShiftsView from './ShiftsView.vue'

const { hasRole } = usePermission()
const activeTab = ref('shifts')

const tabs = [
  { key: 'shifts',   label: 'Smenalar',          icon: Clock,      roles: ['superadmin','admin','director','production_manager','operator'] },
  { key: 'lines',    label: 'Liniyalar',          icon: GitBranch,  roles: ['superadmin','admin','director','production_manager','warehouse_manager'] },
  { key: 'machines', label: 'Mashinalar',         icon: Cog,        roles: ['superadmin','admin','director','production_manager','warehouse_manager'] },
  { key: 'products', label: 'Tayyor mahsulotlar', icon: Package,    roles: ['superadmin','admin','director','production_manager','warehouse_manager'] },
]

const visibleTabs = computed(() =>
  tabs.filter(t => hasRole(t.roles))
)
</script>