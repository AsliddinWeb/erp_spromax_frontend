<template>
  <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ label }}</p>
        <p class="text-xl font-bold mt-1 truncate" :class="valueClass">
          {{ value }}<span v-if="unit" class="text-sm font-normal text-gray-500 ml-1">{{ unit }}</span>
        </p>
        <p v-if="sub" class="text-xs text-gray-400 mt-0.5">{{ sub }}</p>

        <!-- Badge yoki trend -->
        <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span
            v-if="badge"
            class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            :class="badgeClass"
          >{{ badge }}</span>
          <span
            v-if="trend"
            class="inline-flex items-center gap-0.5 text-[11px] font-semibold"
            :class="trendClass"
          >
            <span v-if="trend.startsWith('+')" class="text-[10px]">▲</span>
            <span v-else-if="trend.startsWith('-')" class="text-[10px]">▼</span>
            {{ trend }}
          </span>
        </div>
      </div>
      <div
        v-if="icon"
        class="w-9 h-9 rounded-lg flex items-center justify-center ml-2 flex-shrink-0"
        :class="iconBg"
      >
        <component :is="icon" class="w-4 h-4" :class="iconColor" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label:     String,
  value:     [String, Number],
  unit:      String,
  sub:       String,
  color:     { default: 'primary' },
  icon:      { default: null },
  badge:     { type: String, default: '' },
  badgeType: { type: String, default: 'default' },
  trend:     { type: String, default: '' },
  trendType: { type: String, default: 'success' },
})

const badgeColorMap = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-danger/10 text-danger',
  info:    'bg-info/10 text-info',
  primary: 'bg-primary/10 text-primary',
  default: 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400',
}
const trendColorMap = {
  success: 'text-success',
  danger:  'text-danger',
  warning: 'text-warning',
}

const badgeClass = computed(() => badgeColorMap[props.badgeType] || badgeColorMap.default)
const trendClass = computed(() => trendColorMap[props.trendType] || trendColorMap.success)

const colorMap = {
  primary: { value: 'text-primary', bg: 'bg-primary/10', icon: 'text-primary' },
  success: { value: 'text-success', bg: 'bg-success/10', icon: 'text-success' },
  warning: { value: 'text-warning', bg: 'bg-warning/10', icon: 'text-warning' },
  danger:  { value: 'text-danger',  bg: 'bg-danger/10',  icon: 'text-danger'  },
  info:    { value: 'text-info',    bg: 'bg-info/10',    icon: 'text-info'    },
  default: { value: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-dark-700', icon: 'text-gray-500' },
}

const c = computed(() => colorMap[props.color] || colorMap.default)
const valueClass = computed(() => c.value.value)
const iconBg     = computed(() => c.value.bg)
const iconColor  = computed(() => c.value.icon)
</script>