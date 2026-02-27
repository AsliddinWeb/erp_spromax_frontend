<template>
  <Teleport to="body">
    <Transition name="confirm-backdrop">
      <div
        v-if="visible"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="cancel"
      />
    </Transition>

    <Transition name="confirm-dialog">
      <div
        v-if="visible"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          class="w-full max-w-sm bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden pointer-events-auto"
          @keydown.enter.prevent="confirm"
          @keydown.esc.prevent="cancel"
          tabindex="-1"
          ref="dialogRef"
        >
          <!-- Top accent bar -->
          <div class="h-1 w-full" :class="isDanger ? 'bg-danger' : 'bg-warning'" />

          <div class="p-6 space-y-4">
            <!-- Icon + Title -->
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="isDanger ? 'bg-danger/10' : 'bg-warning/10'"
              >
                <Trash2 v-if="isDanger" class="w-5 h-5 text-danger" />
                <AlertTriangle v-else class="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                  {{ options.title }}
                </h3>
              </div>
            </div>

            <!-- Message -->
            <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {{ options.message }}
            </p>

            <!-- Buttons -->
            <div class="flex gap-2.5 pt-1">
              <button
                @click="cancel"
                class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 active:scale-[0.97] transition-all"
              >
                {{ options.cancelText }}
              </button>
              <button
                ref="confirmBtn"
                @click="confirm"
                class="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium active:scale-[0.97] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
                :class="isDanger
                  ? 'bg-danger hover:bg-danger/90 focus:ring-danger/50 shadow-danger/20'
                  : 'bg-warning hover:bg-warning/90 focus:ring-warning/50 shadow-warning/20'"
              >
                {{ options.confirmText }}
              </button>
            </div>

            <!-- Keyboard hint -->
            <p class="text-center text-xs text-gray-300 dark:text-gray-600">
              <kbd class="font-mono">Enter</kbd> — tasdiqlash &nbsp;·&nbsp; <kbd class="font-mono">Esc</kbd> — bekor qilish
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, nextTick, ref } from 'vue'
import { AlertTriangle, Trash2 } from 'lucide-vue-next'
import { useConfirmState, _confirmResolve } from '@/composables/useConfirm'

const { visible, options } = useConfirmState()
const dialogRef = ref(null)
const confirmBtn = ref(null)

const isDanger = computed(() => options.value.variant !== 'warning')

function confirm() { _confirmResolve(true) }
function cancel() { _confirmResolve(false) }

// Focus confirmBtn when dialog opens
watch(visible, async (val) => {
  if (val) {
    await nextTick()
    confirmBtn.value?.focus()
  }
})

// Global keyboard
function onKeydown(e) {
  if (!visible.value) return
  if (e.key === 'Enter') { e.preventDefault(); confirm() }
  if (e.key === 'Escape') { e.preventDefault(); cancel() }
}
import { onMounted, onUnmounted } from 'vue'
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.confirm-backdrop-enter-active, .confirm-backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.confirm-backdrop-enter-from, .confirm-backdrop-leave-to { opacity: 0; }

.confirm-dialog-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.confirm-dialog-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.confirm-dialog-enter-from, .confirm-dialog-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>