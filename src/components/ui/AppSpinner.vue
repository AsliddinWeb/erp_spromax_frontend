<template>
  <div class="flex items-center justify-center" :class="wrapClass">
    <Loader2
      class="animate-spin text-primary"
      :class="sizeClass"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  size: { type: String, default: 'md' }, // sm | md | lg
  full: { type: Boolean, default: false }, // to'liq ekran
})

const sizeClass = computed(() => ({
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}[props.size]))

const wrapClass = computed(() =>
  props.full ? 'fixed inset-0 bg-white/50 dark:bg-dark-900/50 z-50' : ''
)
</script>