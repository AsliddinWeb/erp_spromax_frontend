<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Moliya</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Tranzaksiyalar, kategoriyalar va hisobotlar</p>
    </div>

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

    <TransactionsView v-if="activeTab === 'transactions'" />
    <CategoriesView v-else-if="activeTab === 'categories'" />
    <ReportsView v-else-if="activeTab === 'reports'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeftRight, Tag, BarChart2 } from 'lucide-vue-next'
import TransactionsView from './TransactionsView.vue'
import CategoriesView from './CategoriesView.vue'
import ReportsView from './ReportsView.vue'

const activeTab = ref('transactions')

const tabs = [
  { key: 'transactions', label: 'Tranzaksiyalar', icon: ArrowLeftRight },
  { key: 'categories',   label: 'Kategoriyalar',  icon: Tag },
  { key: 'reports',      label: 'Hisobotlar',      icon: BarChart2 },
]
</script>