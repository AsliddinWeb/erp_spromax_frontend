import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import './assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Theme init (dark mode)
const themeStore = useThemeStore()
themeStore.init()

// Auth init (token bo'lsa user ma'lumotini olish)
const authStore = useAuthStore()
authStore.init().finally(() => {
  app.mount('#app')
})