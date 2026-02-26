<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Sotuv</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Mijozlar, buyurtmalar va to'lovlar</p>
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

    <CustomersView v-if="activeTab === 'customers'" />
    <OrdersView v-else-if="activeTab === 'orders'" />
    <PaymentsView v-else-if="activeTab === 'payments'" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Users, ShoppingCart, CreditCard } from 'lucide-vue-next'
import CustomersView from './CustomersView.vue'
import OrdersView from './OrdersView.vue'
import PaymentsView from './PaymentsView.vue'

const activeTab = ref('customers')

const tabs = [
  { key: 'customers', label: 'Mijozlar',    icon: Users },
  { key: 'orders',    label: 'Buyurtmalar', icon: ShoppingCart },
  { key: 'payments',  label: "To'lovlar",   icon: CreditCard },
]
</script>