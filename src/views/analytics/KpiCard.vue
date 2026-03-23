<template>
  <div class="p-4 rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ label }}</p>
        <p class="text-xl font-bold mt-1" :class="positive ? 'text-success' : 'text-danger'">
          {{ value }}
        </p>
      </div>
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center ml-2 flex-shrink-0"
        :class="positive ? 'bg-success/10' : 'bg-danger/10'"
      >
        <component :is="icon" class="w-4 h-4" :class="positive ? 'text-success' : 'text-danger'" />
      </div>
    </div>
    <div class="mt-2 flex items-center gap-1">
      <div class="w-2 h-2 rounded-full" :class="positive ? 'bg-success' : 'bg-danger'"></div>
      <span class="text-xs" :class="positive ? 'text-success' : 'text-danger'">
        {{ positive ? 'Maqsadga erishilmoqda' : 'Diqqat talab qiladi' }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label:    String,
  value:    [String, Number],
  icon:     { default: null },
  positive: { type: Boolean, default: true },
})
</script>