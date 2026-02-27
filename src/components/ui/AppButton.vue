<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :title="iconOnly ? tooltip : undefined"
    class="relative inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden
           focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50
           active:scale-[0.97]"
    :class="[sizeClass, variantClass, iconOnly ? 'aspect-square !p-0' : '', fullWidth ? 'w-full' : '']"
    v-bind="$attrs"
    @click="handleClick"
  >
    <!-- Ripple -->
    <span
      v-for="r in ripples"
      :key="r.id"
      class="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
      :style="{ width: r.size + 'px', height: r.size + 'px', left: r.x + 'px', top: r.y + 'px' }"
    />

    <Loader2 v-if="loading" class="animate-spin flex-shrink-0" :class="iconSize" />
    <component v-else-if="icon" :is="icon" class="flex-shrink-0" :class="iconSize" />
    <span v-if="$slots.default && !iconOnly"><slot /></span>
  </button>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = defineProps({
  variant:   { type: String, default: 'primary' },
  size:      { type: String, default: 'md' },
  type:      { type: String, default: 'button' },
  loading:   { type: Boolean, default: false },
  disabled:  { type: Boolean, default: false },
  icon:      { type: [Object, Function], default: null },
  iconOnly:  { type: Boolean, default: false },
  tooltip:   { type: String, default: '' },
  fullWidth: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const sizeClass = computed(() => ({
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}[props.size]))

const iconSize = computed(() => ({
  xs: 'w-3 h-3',
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
  outline:   'border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300',
}[props.variant]))

// Ripple
const ripples = ref([])
let rippleId = 0

function handleClick(e) {
  if (props.disabled || props.loading) return
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  const id = ++rippleId
  ripples.value.push({ id, size, x, y })
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 500)
  emit('click', e)
}
</script>

<style scoped>
@keyframes ripple {
  from { transform: scale(0); opacity: 0.6; }
  to   { transform: scale(1); opacity: 0; }
}
.animate-ripple {
  animation: ripple 0.5s ease-out forwards;
  transform-origin: center;
}
</style>