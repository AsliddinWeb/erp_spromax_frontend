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
      <!-- Prefix icon -->
      <div
        v-if="prefixIcon"
        class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      >
        <component :is="prefixIcon" class="w-4 h-4" />
      </div>

      <input
        v-bind="$attrs"
        :value="modelValue"
        :type="type"
        :disabled="disabled"
        :placeholder="placeholder"
        :required="required"
        @input="$emit('update:modelValue', $event.target.value)"
        class="w-full py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary dark:focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        :class="[
          prefixIcon ? 'pl-9' : 'pl-3.5',
          suffixIcon ? 'pr-9' : 'pr-3.5',
          error
            ? 'border-danger dark:border-danger'
            : 'border-gray-200 dark:border-dark-border'
        ]"
      />

      <!-- Suffix icon -->
      <div
        v-if="suffixIcon"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      >
        <component :is="suffixIcon" class="w-4 h-4" />
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
    <!-- Hint -->
    <p v-else-if="hint" class="mt-1 text-xs text-gray-400">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label:      { type: String, default: '' },
  type:       { type: String, default: 'text' },
  placeholder:{ type: String, default: '' },
  error:      { type: String, default: '' },
  hint:       { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  required:   { type: Boolean, default: false },
  prefixIcon: { type: [Object, Function], default: null },
  suffixIcon: { type: [Object, Function], default: null },
})

defineEmits(['update:modelValue'])
</script>