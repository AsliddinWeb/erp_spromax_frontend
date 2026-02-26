<!-- AnalyticsFilter.vue -->
<template>
  <div class="flex flex-wrap gap-2 items-center">
    <div class="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-dark-700">
      <button
        v-for="p in presets"
        :key="p.key"
        @click="$emit('update:activePreset', p.key)"
        class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
        :class="activePreset === p.key
          ? 'bg-white dark:bg-dark-800 text-primary shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        {{ p.label }}
      </button>
    </div>

    <template v-if="activePreset === 'custom'">
      <input
        type="date"
        :value="customStart"
        @input="$emit('update:customStart', $event.target.value)"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span class="text-gray-400 text-sm">—</span>
      <input
        type="date"
        :value="customEnd"
        @input="$emit('update:customEnd', $event.target.value)"
        class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </template>

    <button
      @click="$emit('apply')"
      :disabled="loading"
      class="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
    >
      <RefreshCw v-if="loading" class="w-3 h-3 animate-spin" />
      <RefreshCw v-else class="w-3 h-3" />
      Yangilash
    </button>
  </div>
</template>

<script setup>
import { RefreshCw } from 'lucide-vue-next'
defineProps(['presets', 'activePreset', 'customStart', 'customEnd', 'loading'])
defineEmits(['update:activePreset', 'update:customStart', 'update:customEnd', 'apply'])
</script>