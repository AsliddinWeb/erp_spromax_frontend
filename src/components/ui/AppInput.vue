<template>
  <div class="w-full">

    <!-- Standard label (floating bo'lmasa) -->
    <label
      v-if="label && !floating"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>

    <!-- Floating label wrapper -->
    <div class="relative" :class="floating ? 'mt-1' : ''">

      <!-- Prefix icon -->
      <div v-if="prefixIcon" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
        <component :is="prefixIcon" class="w-4 h-4" />
      </div>

      <!-- Floating label -->
      <label
        v-if="floating && label"
        class="absolute text-sm font-medium pointer-events-none transition-all duration-200 z-10"
        :class="[
          isFocused || hasValue
            ? 'top-0 -translate-y-1/2 text-xs px-1 bg-white dark:bg-dark-700 rounded'
            : 'top-1/2 -translate-y-1/2 text-gray-400',
          prefixIcon ? (isFocused || hasValue ? 'left-3' : 'left-9') : 'left-3.5',
          isFocused
            ? (error ? 'text-danger' : success ? 'text-success' : 'text-primary')
            : 'text-gray-500 dark:text-gray-400',
          error ? 'text-danger' : '',
          success ? 'text-success' : '',
        ]"
      >
        {{ label }}<span v-if="required" class="text-danger ml-0.5">*</span>
      </label>

      <input
        v-bind="inputAttrs"
        :value="modelValue"
        :type="inputType"
        :disabled="disabled"
        :placeholder="floating ? (isFocused ? placeholder : '') : placeholder"
        :required="required"
        :maxlength="maxlength"
        @input="onInput"
        @focus="isFocused = true"
        @blur="isFocused = false"
        class="w-full py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        :class="[
          prefixIcon ? 'pl-9' : 'pl-3.5',
          hasSuffix ? 'pr-9' : 'pr-3.5',
          error
            ? 'border-danger dark:border-danger focus:ring-danger/20 focus:border-danger'
            : success
              ? 'border-success dark:border-success focus:ring-success/20 focus:border-success'
              : 'border-gray-200 dark:border-dark-border focus:ring-primary/30 focus:border-primary dark:focus:border-primary',
          floating ? 'pt-3' : '',
        ]"
      />

      <!-- Suffix area: password toggle / clear / success icon -->
      <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <!-- Clear button -->
        <button
          v-if="clearable && hasValue && !disabled"
          type="button"
          @click="$emit('update:modelValue', ''); $emit('clear')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5"
        >
          <X class="w-3.5 h-3.5" />
        </button>

        <!-- Password toggle -->
        <button
          v-if="type === 'password'"
          type="button"
          @click="showPass = !showPass"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5"
        >
          <Eye v-if="!showPass" class="w-4 h-4" />
          <EyeOff v-else class="w-4 h-4" />
        </button>

        <!-- Success icon -->
        <CheckCircle v-else-if="success && !error" class="w-4 h-4 text-success" />

        <!-- Custom suffix icon -->
        <component v-else-if="suffixIcon" :is="suffixIcon" class="w-4 h-4 text-gray-400" />
      </div>
    </div>

    <!-- Footer row: error/hint + char counter -->
    <div class="flex items-center justify-between mt-1">
      <p v-if="error" class="text-xs text-danger">{{ error }}</p>
      <p v-else-if="success && successMessage" class="text-xs text-success">{{ successMessage }}</p>
      <p v-else-if="hint" class="text-xs text-gray-400">{{ hint }}</p>
      <span v-else />
      <span v-if="maxlength" class="text-xs ml-auto" :class="charCount >= maxlength ? 'text-danger' : 'text-gray-400'">
        {{ charCount }}/{{ maxlength }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Eye, EyeOff, X, CheckCircle } from 'lucide-vue-next'

const props = defineProps({
  modelValue:     { type: [String, Number], default: '' },
  label:          { type: String, default: '' },
  type:           { type: String, default: 'text' },
  placeholder:    { type: String, default: '' },
  error:          { type: String, default: '' },
  hint:           { type: String, default: '' },
  success:        { type: Boolean, default: false },
  successMessage: { type: String, default: '' },
  disabled:       { type: Boolean, default: false },
  required:       { type: Boolean, default: false },
  clearable:      { type: Boolean, default: false },
  floating:       { type: Boolean, default: false },
  maxlength:      { type: Number, default: null },
  prefixIcon:     { type: [Object, Function], default: null },
  suffixIcon:     { type: [Object, Function], default: null },
})

const emit = defineEmits(['update:modelValue', 'clear'])

const isFocused = ref(false)
const showPass = ref(false)

const inputType = computed(() => props.type === 'password' ? (showPass.value ? 'text' : 'password') : props.type)
const hasValue = computed(() => props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined)
const hasSuffix = computed(() => (props.clearable && hasValue.value) || props.type === 'password' || props.success || props.suffixIcon)
const charCount = computed(() => String(props.modelValue || '').length)

// attrs qo'lda tozalab berish (class qayta qo'shilmasligi uchun)
const inputAttrs = computed(() => {
  const { label, error, hint, success, successMessage, clearable, floating, maxlength, prefixIcon, suffixIcon, ...rest } = props
  return {}
})

function onInput(e) {
  emit('update:modelValue', e.target.value)
}
</script>