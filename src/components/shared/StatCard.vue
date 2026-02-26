<template>
  <div class="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-gray-100 dark:border-dark-border hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between mb-4">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="bgClass">
        <component :is="iconComponent" class="w-5 h-5" :class="iconClass" />
      </div>
      <AppBadge v-if="badge" :variant="trendType || badgeType">{{ badge }}</AppBadge>
      <AppBadge v-else-if="trend" :variant="trendType">{{ trend }}</AppBadge>
    </div>
    <div class="text-2xl font-bold text-gray-900 dark:text-white">
      {{ value ?? '—' }}
    </div>
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ label }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Banknote, ShoppingCart, Users, Factory, TrendingUp,
  UserCheck, PackageX, Wrench, BarChart3, Clock,
  CheckCircle, AlertCircle, Package, DollarSign
} from 'lucide-vue-next'
import AppBadge from '@/components/ui/AppBadge.vue'

const props = defineProps({
  icon:      { type: String, default: 'BarChart3' },
  label:     { type: String, required: true },
  value:     { type: [String, Number], default: null },
  trend:     { type: String, default: '' },
  trendType: { type: String, default: 'success' },
  badge:     { type: String, default: '' },
  badgeType: { type: String, default: 'info' },
  color:     { type: String, default: 'primary' },
  // primary | success | warning | danger
})

const iconMap = {
  Banknote, ShoppingCart, Users, Factory, TrendingUp,
  UserCheck, PackageX, Wrench, BarChart3, Clock,
  CheckCircle, AlertCircle, Package, DollarSign
}

const iconComponent = computed(() => iconMap[props.icon] || BarChart3)

const bgClass = computed(() => ({
  primary: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  danger:  'bg-danger/10',
}[props.color]))

const iconClass = computed(() => ({
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
}[props.color]))
</script>