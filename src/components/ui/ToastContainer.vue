<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium"
          :class="toastClass(toast.type)"
        >
          <component :is="toastIcon(toast.type)" class="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

function toastClass(type) {
  return {
    success: 'bg-success/10 border-success/30 text-success',
    error:   'bg-danger/10  border-danger/30  text-danger',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info:    'bg-primary/10 border-primary/30 text-primary',
  }[type] || 'bg-primary/10 border-primary/30 text-primary'
}

function toastIcon(type) {
  return {
    success: CheckCircle,
    error:   XCircle,
    warning: AlertCircle,
    info:    Info,
  }[type] || Info
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>