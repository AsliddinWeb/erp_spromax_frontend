<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    :class="[sizeClass, variantClass]"
    v-bind="$attrs"
  >
    <Loader2 v-if="loading" class="animate-spin flex-shrink-0" :class="iconSize" />
    <component v-else-if="icon" :is="icon" class="flex-shrink-0" :class="iconSize" />
    <span v-if="$slots.default"><slot /></span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    // primary | secondary | danger | ghost | success | warning
  },
  size: {
    type: String,
    default: 'md',
    // sm | md | lg
  },
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  icon: { type: [Object, Function], default: null },
})

const sizeClass = computed(() => ({
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}[props.size]))

const iconSize = computed(() => ({
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}[props.size]))

const variantClass = computed(() => ({
  primary:   'bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/20',
  secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300',
  danger:    'bg-danger hover:bg-danger/90 text-white shadow-sm shadow-danger/20',
  success:   'bg-success hover:bg-success/90 text-white shadow-sm shadow-success/20',
  warning:   'bg-warning hover:bg-warning/90 text-white shadow-sm shadow-warning/20',
  ghost:     'hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400',
}[props.variant]))
</script>