<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-2">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium pointer-events-auto cursor-pointer select-none"
          :class="toastClass(toast.type)"
          @click="dismiss(toast.id)"
        >
          <component :is="toastIcon(toast.type)" class="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span class="flex-1 leading-snug">{{ toast.message }}</span>
          <X class="w-3.5 h-3.5 opacity-50 hover:opacity-100 flex-shrink-0 mt-0.5 transition-opacity" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

function toastClass(type) {
  return {
    success: 'bg-white dark:bg-dark-800 border-success/30 text-gray-800 dark:text-gray-200 shadow-success/10',
    error:   'bg-white dark:bg-dark-800 border-danger/30  text-gray-800 dark:text-gray-200 shadow-danger/10',
    warning: 'bg-white dark:bg-dark-800 border-warning/30 text-gray-800 dark:text-gray-200 shadow-warning/10',
    info:    'bg-white dark:bg-dark-800 border-primary/30 text-gray-800 dark:text-gray-200 shadow-primary/10',
  }[type] || 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-border text-gray-800 dark:text-gray-200'
}

function toastIcon(type) {
  return { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info }[type] || Info
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(110%); }
.toast-leave-to   { opacity: 0; transform: translateX(110%); }
.toast-move       { transition: transform 0.2s ease; }
</style>