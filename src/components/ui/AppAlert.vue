<template>
  <Transition name="alert">
    <div
      v-if="visible"
      class="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm"
      :class="variantClass"
    >
      <component :is="alertIcon" class="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div class="flex-1">
        <p v-if="title" class="font-semibold mb-0.5">{{ title }}</p>
        <p><slot /></p>
      </div>
      <button
        v-if="dismissible"
        @click="visible = false"
        class="p-0.5 rounded hover:opacity-70 transition-opacity"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-vue-next'

const props = defineProps({
  type:        { type: String, default: 'info' }, // success | error | warning | info
  title:       { type: String, default: '' },
  dismissible: { type: Boolean, default: false },
})

const visible = ref(true)

const variantClass = computed(() => ({
  success: 'bg-success/10 border-success/20 text-success',
  error:   'bg-danger/10  border-danger/20  text-danger',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  info:    'bg-primary/10 border-primary/20 text-primary',
}[props.type]))

const alertIcon = computed(() => ({
  success: CheckCircle,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
}[props.type]))
</script>

<style scoped>
.alert-enter-active,
.alert-leave-active {
  transition: all 0.2s ease;
}
.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>