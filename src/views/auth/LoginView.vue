<template>
  <div class="min-h-screen flex">

    <!-- Chap panel -->
    <div
      class="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
      :class="themeStore.isDark ? 'bg-dark-900' : 'bg-[#1a3a6e]'"
    >
      <!-- Dekorativ elementlar -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute -top-40 -left-40 w-96 h-96 rounded-full"
          :class="themeStore.isDark ? 'bg-primary/10' : 'bg-white/10'"
        ></div>
        <div
          class="absolute -bottom-40 -right-40 w-96 h-96 rounded-full"
          :class="themeStore.isDark ? 'bg-primary/10' : 'bg-white/10'"
        ></div>
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full"
          :class="themeStore.isDark ? 'bg-primary/5' : 'bg-white/5'"
        ></div>
        <!-- Grid -->
        <div
          class="absolute inset-0"
          :class="themeStore.isDark ? 'opacity-5' : 'opacity-10'"
          style="background-image: linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px); background-size: 48px 48px"
        ></div>
        <!-- Dark mode da border -->
        <div
          v-if="themeStore.isDark"
          class="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent"
        ></div>
      </div>

      <!-- Logo -->
      <div class="relative z-10">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :class="themeStore.isDark ? 'bg-primary/20 ring-1 ring-primary/40' : 'bg-white/20'"
          >
            <span class="text-white font-bold text-lg">SP</span>
          </div>
          <div>
            <div class="text-white font-bold text-base leading-none">S PROMAX PLAST</div>
            <div class="text-white/50 text-xs mt-0.5">ERP Tizimi</div>
          </div>
        </div>
      </div>

      <!-- Matn -->
      <div class="relative z-10">
        <!-- Badge -->
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          :class="themeStore.isDark ? 'bg-primary/15 ring-1 ring-primary/30' : 'bg-white/15'"
        >
          <div class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
          <span class="text-white/80 text-xs font-medium">Tizim faol • 24/7</span>
        </div>

        <h2 class="text-4xl font-bold text-white leading-tight mb-4">
          Zavodingizni<br/>raqamli<br/>boshqaring
        </h2>
        <p
          class="text-base leading-relaxed max-w-xs"
          :class="themeStore.isDark ? 'text-gray-400' : 'text-white/65'"
        >
          Ishlab chiqarish, ombor, sotuv, moliya va HR — barchasi bitta tizimda. Real vaqtda nazorat.
        </p>

        <!-- Stats -->
        <div class="flex gap-6 mt-10">
          <div>
            <div class="text-3xl font-bold text-white">8+</div>
            <div
              class="text-xs mt-1 uppercase tracking-wider"
              :class="themeStore.isDark ? 'text-gray-500' : 'text-white/50'"
            >Modul</div>
          </div>
          <div :class="themeStore.isDark ? 'w-px bg-dark-border' : 'w-px bg-white/15'"></div>
          <div>
            <div class="text-3xl font-bold text-white">9</div>
            <div
              class="text-xs mt-1 uppercase tracking-wider"
              :class="themeStore.isDark ? 'text-gray-500' : 'text-white/50'"
            >Rol</div>
          </div>
          <div :class="themeStore.isDark ? 'w-px bg-dark-border' : 'w-px bg-white/15'"></div>
          <div>
            <div class="text-3xl font-bold text-white">24/7</div>
            <div
              class="text-xs mt-1 uppercase tracking-wider"
              :class="themeStore.isDark ? 'text-gray-500' : 'text-white/50'"
            >Ishlaydi</div>
          </div>
        </div>
      </div>

      <div
        class="relative z-10 text-xs"
        :class="themeStore.isDark ? 'text-gray-700' : 'text-white/30'"
      >
        © 2025 S PROMAX PLAST. Barcha huquqlar himoyalangan.
      </div>
    </div>

    <!-- O'ng panel -->
    <div class="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white dark:bg-dark-800 relative">

      <!-- Theme toggle -->
      <button
        @click="themeStore.toggle()"
        class="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
        :class="themeStore.isDark
          ? 'bg-dark-700 border-dark-border text-gray-400 hover:text-primary hover:border-primary'
          : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-primary hover:border-primary'"
      >
        <Sun v-if="themeStore.isDark" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </button>

      <div class="w-full max-w-sm">

        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-2 mb-8">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span class="text-white font-bold text-sm">SP</span>
          </div>
          <span class="font-bold text-gray-900 dark:text-white">S PROMAX PLAST</span>
        </div>

        <!-- Sarlavha -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Xush kelibsiz</h1>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Hisobingizga kiring</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">

          <!-- Username -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Foydalanuvchi nomi
            </label>
            <div class="relative">
              <User class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="form.username"
                type="text"
                required
                autocomplete="username"
                placeholder="username"
                :disabled="loading"
                class="w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-all outline-none disabled:opacity-60 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border-gray-200 dark:border-dark-border focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Parol
            </label>
            <div class="relative">
              <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                :disabled="loading"
                class="w-full pl-10 pr-11 py-3 text-sm rounded-xl border transition-all outline-none disabled:opacity-60 bg-gray-50 dark:bg-dark-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 border-gray-200 dark:border-dark-border focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <div class="pt-1">
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3 bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
              <LogIn v-else class="w-4 h-4" />
              {{ loading ? 'Kirish...' : 'Tizimga kirish' }}
            </button>
          </div>

        </form>

        <p class="text-center text-xs text-gray-300 dark:text-gray-700 mt-10">
          S PROMAX PLAST ERP v1.0
        </p>

      </div>
    </div>

    <!-- Toast (login sahifasi uchun alohida) -->
    <ToastContainer />

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Eye, EyeOff, Loader2, Sun, Moon, LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useToast } from '@/composables/useToast'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()
const toast = useToast()

const form = ref({ username: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (loading.value) return
  loading.value = true
  try {
    await authStore.login(form.value)
    toast.success('Tizimga muvaffaqiyatli kirdingiz!')
    router.push('/')
  } catch (e) {
    console.log('XATO:', e)
    console.log('RESPONSE:', e.response)
    console.log('DETAIL:', e.response?.data?.detail)
    const msg = e.response?.data?.detail || "Login yoki parol noto'g'ri"
    toast.error(msg)
  } finally {
    loading.value = false
  }
}
</script>