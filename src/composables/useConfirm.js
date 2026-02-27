import { ref, markRaw } from 'vue'

// Global state — singleton
const visible = ref(false)
const options = ref({})
let _resolve = null

export function useConfirmState() {
  return { visible, options }
}

export async function useConfirm(opts = {}) {
  options.value = {
    title: opts.title || 'Tasdiqlash',
    message: opts.message || 'Rostdan ham davom etmoqchimisiz?',
    confirmText: opts.confirmText || 'Tasdiqlash',
    cancelText: opts.cancelText || 'Bekor qilish',
    variant: opts.variant || 'danger',
  }
  visible.value = true

  return new Promise((resolve) => {
    _resolve = resolve
  })
}

export function _confirmResolve(value) {
  visible.value = false
  if (_resolve) {
    _resolve(value)
    _resolve = null
  }
}