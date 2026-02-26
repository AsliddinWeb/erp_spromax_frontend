<template>
  <div class="flex items-center justify-between gap-4">
    <!-- Info -->
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Jami <span class="font-semibold text-gray-900 dark:text-white">{{ total }}</span> ta,
      {{ from }}–{{ to }} ko'rsatilmoqda
    </p>

    <!-- Buttons -->
    <div class="flex items-center gap-1">
      <!-- Prev -->
      <button
        @click="$emit('change', page - 1)"
        :disabled="page <= 1"
        class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 transition-colors"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <!-- Pages -->
      <button
        v-for="p in pages"
        :key="p"
        @click="p !== '...' && $emit('change', p)"
        class="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors"
        :class="p === page
          ? 'bg-primary text-white shadow-sm shadow-primary/20'
          : p === '...'
            ? 'text-gray-400 cursor-default'
            : 'border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400'"
      >
        {{ p }}
      </button>

      <!-- Next -->
      <button
        @click="$emit('change', page + 1)"
        :disabled="page >= totalPages"
        class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 transition-colors"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  page:  { type: Number, default: 1 },
  limit: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
})

defineEmits(['change'])

const totalPages = computed(() => Math.ceil(props.total / props.limit))
const from = computed(() => Math.min((props.page - 1) * props.limit + 1, props.total))
const to = computed(() => Math.min(props.page * props.limit, props.total))

const pages = computed(() => {
  const total = totalPages.value
  const current = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total-4, total-3, total-2, total-1, total]
  return [1, '...', current-1, current, current+1, '...', total]
})
</script>