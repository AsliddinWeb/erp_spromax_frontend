<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
    :class="variantClass"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    // success | warning | danger | info | default
  },
  dot: { type: Boolean, default: false },
})

const variantClass = computed(() => ({
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger:  'bg-danger/10 text-danger',
  info:    'bg-primary/10 text-primary',
  default: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400',
}[props.variant]))

const dotClass = computed(() => ({
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-primary',
  default: 'bg-gray-400',
}[props.variant]))
</script>