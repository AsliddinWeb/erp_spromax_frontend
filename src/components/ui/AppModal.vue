<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="modelValue" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" @click="closeOnBackdrop && $emit('update:modelValue', false)" />
    </Transition>

    <Transition :name="isMobile ? 'modal-slide' : 'modal-scale'">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex pointer-events-none" :class="isMobile ? 'items-end' : 'items-center justify-center p-4'">
        <div
          class="relative bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-border flex flex-col pointer-events-auto"
          :class="[
            isMobile
              ? 'w-full rounded-t-2xl max-h-[92vh] shadow-2xl'
              : `w-full rounded-2xl shadow-xl max-h-[90vh] ${sizeClass}`
          ]"
        >
          <!-- Mobile drag handle -->
          <div v-if="isMobile" class="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border flex-shrink-0">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
            <button
              @click="$emit('update:modelValue', false)"
              class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronDown v-if="isMobile" class="w-5 h-5" />
              <X v-else class="w-4 h-4" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-dark-border flex-shrink-0" :class="isMobile ? 'pb-6' : ''">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { X, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  title:           { type: String, default: '' },
  size:            { type: String, default: 'md' },
  closeOnBackdrop: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 1024)
const sizeClass = computed(() => ({ sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[props.size]))
</script>

<style scoped>
.modal-backdrop-enter-active, .modal-backdrop-leave-active { transition: opacity 0.2s ease; }
.modal-backdrop-enter-from, .modal-backdrop-leave-to { opacity: 0; }

.modal-scale-enter-active { transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-scale-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.modal-scale-enter-from, .modal-scale-leave-to { opacity: 0; transform: scale(0.94); }

.modal-slide-enter-active { transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
.modal-slide-leave-active { transition: all 0.25s ease; }
.modal-slide-enter-from, .modal-slide-leave-to { opacity: 0; transform: translateY(100%); }
</style>