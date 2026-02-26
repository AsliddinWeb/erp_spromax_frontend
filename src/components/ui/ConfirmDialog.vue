<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        @click.self="$emit('update:modelValue', false)"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Dialog -->
        <div class="relative w-full max-w-sm bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <!-- Top accent -->
          <div class="h-1 w-full" :class="variant === 'danger' ? 'bg-danger' : 'bg-warning'"></div>

          <div class="p-5 space-y-4">
            <!-- Icon + Title -->
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="variant === 'danger' ? 'bg-danger/10' : 'bg-warning/10'"
              >
                <AlertTriangle
                  class="w-5 h-5"
                  :class="variant === 'danger' ? 'text-danger' : 'text-warning'"
                />
              </div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
            </div>

            <!-- Message -->
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ message }}</p>

            <!-- Buttons -->
            <div class="flex gap-2 pt-1">
              <button
                @click="$emit('update:modelValue', false); $emit('cancel')"
                class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                {{ cancelText || 'Bekor qilish' }}
              </button>
              <button
                @click="$emit('confirm'); $emit('update:modelValue', false)"
                class="flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                :class="variant === 'danger'
                  ? 'bg-danger hover:bg-danger/90'
                  : 'bg-warning hover:bg-warning/90'"
              >
                {{ confirmText || 'Tasdiqlash' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertTriangle } from 'lucide-vue-next'

defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Tasdiqlash' },
  message: { type: String, default: 'Rostdan ham davom etmoqchimisiz?' },
  confirmText: String,
  cancelText: String,
  variant: { type: String, default: 'danger' },
})

defineEmits(['update:modelValue', 'confirm', 'cancel'])
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>