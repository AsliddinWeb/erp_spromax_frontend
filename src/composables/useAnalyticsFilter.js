// src/composables/useAnalyticsFilter.js
import { ref, computed } from 'vue'

export function useAnalyticsFilter() {
  const activePreset = ref('month')
  const customStart = ref('')
  const customEnd = ref('')

  const presets = [
    { key: 'today', label: 'Bugun' },
    { key: 'week',  label: 'Shu hafta' },
    { key: 'month', label: 'Shu oy' },
    { key: 'custom', label: 'Custom' },
  ]

  const dateRange = computed(() => {
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

    if (activePreset.value === 'today') {
      const t = fmt(now)
      return { start: t, end: t }
    }
    if (activePreset.value === 'week') {
      const day = now.getDay() || 7
      const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
      return { start: fmt(mon), end: fmt(now) }
    }
    if (activePreset.value === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: fmt(start), end: fmt(now) }
    }
    return { start: customStart.value, end: customEnd.value }
  })

  const apiParams = computed(() => ({
    start_date: dateRange.value.start || undefined,
    end_date:   dateRange.value.end   || undefined,
    }))

  return { activePreset, customStart, customEnd, presets, dateRange, apiParams }
}