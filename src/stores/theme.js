import { defineStore } from 'pinia'
import { ref } from 'vue'

const SCALE_MAP = {
  normal:  1.0,
  large:   1.1,
  xlarge:  1.2,
  xxlarge: 1.3,
}

export const useThemeStore = defineStore('theme', () => {
  const isDark   = ref(localStorage.getItem('theme') !== 'light')
  const uiScale  = ref(localStorage.getItem('uiScale') || 'normal')

  function init() {
    applyTheme()
    applyScale()
  }

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function setScale(scale) {
    uiScale.value = scale
    localStorage.setItem('uiScale', scale)
    applyScale()
  }

  function applyScale() {
    const factor = SCALE_MAP[uiScale.value] ?? 1.0
    document.documentElement.style.fontSize = (16 * factor) + 'px'
  }

  return { isDark, uiScale, toggle, init, setScale }
})
