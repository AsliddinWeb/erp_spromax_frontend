<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="closeOnBackdrop && $emit('update:modelValue', false)"
        ></div>

        <!-- Modal -->
        <div
          class="relative w-full bg-white dark:bg-dark-800 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-border flex flex-col max-h-[90vh]"
          :class="sizeClass"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <button
              @click="$emit('update:modelValue', false)"
              class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <slot />
          </div>

          <!-- Footer -->
          <div
            v-if="$slots.footer"
            class="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-dark-border flex-shrink-0"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  title:           { type: String, default: '' },
  size:            { type: String, default: 'md' },
  closeOnBackdrop: { type: Boolean, default: true },
})

defineEmits(['update:modelValue'])

const sizeClass = computed(() => ({
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}[props.size]))
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>