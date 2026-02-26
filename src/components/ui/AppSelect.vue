<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <div class="relative">
      <select
        v-bind="$attrs"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        @change="$emit('update:modelValue', $event.target.value)"
        class="w-full pl-3.5 pr-9 py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary dark:focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all appearance-none"
        :class="error
          ? 'border-danger dark:border-danger'
          : 'border-gray-200 dark:border-dark-border'"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Arrow icon -->
      <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>

    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-400">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ChevronDown } from 'lucide-vue-next'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  label:      { type: String, default: '' },
  placeholder:{ type: String, default: "Tanlang" },
  options:    { type: Array, default: () => [] },
  // options: [{ label: 'Nomi', value: 'qiymati' }]
  error:      { type: String, default: '' },
  hint:       { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  required:   { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])
</script>