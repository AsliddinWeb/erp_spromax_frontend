<template>
  <div class="flex h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden">
    <!-- Sidebar -->
    <aside
      class="flex flex-col w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-border flex-shrink-0 z-20"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-5 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Factory class="w-4 h-4 text-white" />
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900 dark:text-white leading-tight">S PROMAX</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">PLAST ERP</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          v-show="canSeeNav(item.roles)"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group"
          :class="isActive(item.to)
            ? 'bg-primary text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User section bottom -->
      <div class="p-3 border-t border-gray-200 dark:border-dark-border">
        <div class="flex items-center gap-2 px-2 py-1.5">
          <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span class="text-xs font-bold text-primary">{{ userInitial }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ authStore.user?.full_name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.user?.role?.name }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-border flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <!-- Mobile menu -->
        <button
          @click="sidebarOpen = !sidebarOpen"
          class="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500"
        >
          <Menu class="w-5 h-5" />
        </button>

        <!-- Page title -->
        <div class="flex-1">
          <h1 class="text-base font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
        </div>

        <!-- Dark mode toggle -->
        <button
          @click="toggleDark"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 transition-colors"
        >
          <Sun v-if="isDark" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>

        <!-- Profile dropdown -->
        <div class="relative" ref="profileRef">
          <button
            @click="profileOpen = !profileOpen"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span class="text-xs font-bold text-primary">{{ userInitial }}</span>
            </div>
            <div class="hidden sm:block text-left">
              <p class="text-xs font-medium text-gray-900 dark:text-white leading-tight">{{ authStore.user?.full_name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">{{ authStore.user?.role?.name }}</p>
            </div>
            <ChevronDown class="w-3.5 h-3.5 text-gray-400" :class="profileOpen ? 'rotate-180' : ''" style="transition: transform 0.2s" />
          </button>

          <!-- Dropdown -->
          <Transition name="dropdown">
            <div
              v-if="profileOpen"
              class="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-border shadow-lg overflow-hidden z-50"
            >
              <!-- User info -->
              <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ authStore.user?.full_name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{{ authStore.user?.username }}</p>
                <span class="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {{ authStore.user?.role?.name }}
                </span>
              </div>

              <!-- Actions -->
              <div class="py-1">
                <button
                  @click="openChangePassword"
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
                >
                  <KeyRound class="w-4 h-4 text-gray-400" />
                  Parol o'zgartirish
                </button>
                <button
                  @click="logout"
                  class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut class="w-4 h-4" />
                  Chiqish
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <RouterView />
      </main>
    </div>
  </div>

  <!-- Change Password Modal -->
  <AppModal v-model="showPasswordModal" title="Parol o'zgartirish" size="sm">
    <form @submit.prevent="changePassword" class="space-y-4">
      <AppInput
        v-model="pwForm.old_password"
        label="Joriy parol"
        type="password"
        required
        :error="pwErrors.old_password"
        placeholder="Joriy parolingiz"
      />
      <AppInput
        v-model="pwForm.new_password"
        label="Yangi parol"
        type="password"
        required
        :error="pwErrors.new_password"
        placeholder="Kamida 8 belgi"
      />
      <AppInput
        v-model="pwForm.confirm_password"
        label="Yangi parolni tasdiqlang"
        type="password"
        required
        :error="pwErrors.confirm_password"
        placeholder="Parolni qayta kiriting"
      />
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="showPasswordModal = false">Bekor qilish</AppButton>
      <AppButton :loading="pwSaving" @click="changePassword">Saqlash</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, Package, Factory, ShoppingCart,
  Wallet, Users, Wrench, UserCog, BarChart2,
  Menu, Sun, Moon, ChevronDown, LogOut, KeyRound
} from 'lucide-vue-next'
// Factory icon for logo
import { Factory as FactoryLogo } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { usePermission } from '@/composables/usePermission'
import { authApi } from '@/api'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'

const authStore = useAuthStore()
const toast = useToast()
const { hasRole } = usePermission()
const route = useRoute()
const router = useRouter()

const sidebarOpen = ref(false)
const profileOpen = ref(false)
const profileRef = ref(null)
const isDark = ref(document.documentElement.classList.contains('dark'))
const showPasswordModal = ref(false)
const pwSaving = ref(false)
const pwErrors = ref({})
const pwForm = ref({ old_password: '', new_password: '', confirm_password: '' })

const navItems = [
  { to: '/',            label: 'Dashboard',        icon: LayoutDashboard, roles: null },
  { to: '/warehouse',   label: 'Ombor',            icon: Package,         roles: ['superadmin','admin','director','warehouse_manager'] },
  { to: '/production',  label: 'Ishlab chiqarish', icon: Factory,         roles: ['superadmin','admin','director','production_manager','operator'] },
  { to: '/sales',       label: 'Sotuv',            icon: ShoppingCart,    roles: ['superadmin','admin','director','sales_manager'] },
  { to: '/finance',     label: 'Moliya',           icon: Wallet,          roles: ['superadmin','admin','director','accountant'] },
  { to: '/hr',          label: 'Kadrlar',          icon: Users,           roles: ['superadmin','admin','director','hr_manager'] },
  { to: '/maintenance', label: 'Texnik xizmat',    icon: Wrench,          roles: ['superadmin','admin','director','maintenance','production_manager','operator'] },
  { to: '/users',       label: 'Foydalanuvchilar', icon: UserCog,         roles: ['superadmin','admin'] },
  { to: '/analytics',   label: 'Tahlil',           icon: BarChart2,       roles: ['superadmin','admin','director'] },
]

const pageTitle = computed(() => {
  const map = {
    '/': 'Dashboard',
    '/warehouse': 'Ombor',
    '/production': 'Ishlab chiqarish',
    '/sales': 'Sotuv',
    '/finance': 'Moliya',
    '/hr': 'Kadrlar bo\'limi',
    '/maintenance': 'Texnik xizmat',
    '/users': 'Foydalanuvchilar',
    '/analytics': 'Tahlil',
  }
  return map[route.path] || 'ERP Tizimi'
})

const userInitial = computed(() => {
  const name = authStore.user?.full_name || authStore.user?.username || '?'
  return name[0].toUpperCase()
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function canSeeNav(roles) {
  if (!roles) return true
  return hasRole(roles)
}

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function openChangePassword() {
  profileOpen.value = false
  pwForm.value = { old_password: '', new_password: '', confirm_password: '' }
  pwErrors.value = {}
  showPasswordModal.value = true
}

async function changePassword() {
  pwErrors.value = {}
  if (!pwForm.value.old_password) { pwErrors.value.old_password = 'Joriy parolni kiriting'; return }
  if (!pwForm.value.new_password) { pwErrors.value.new_password = 'Yangi parolni kiriting'; return }
  if (pwForm.value.new_password.length < 8) { pwErrors.value.new_password = 'Kamida 8 belgi'; return }
  if (pwForm.value.new_password !== pwForm.value.confirm_password) {
    pwErrors.value.confirm_password = 'Parollar mos kelmaydi'; return
  }
  pwSaving.value = true
  try {
    await authApi.changePassword({
      old_password: pwForm.value.old_password,
      new_password: pwForm.value.new_password,
    })
    toast.success('Parol muvaffaqiyatli o\'zgartirildi!')
    showPasswordModal.value = false
  } catch (e) {
    const msg = e.response?.data?.detail
    if (msg?.toLowerCase().includes('old') || msg?.toLowerCase().includes('joriy')) {
      pwErrors.value.old_password = 'Joriy parol noto\'g\'ri'
    } else {
      toast.error(msg || 'Xatolik yuz berdi')
    }
  } finally {
    pwSaving.value = false
  }
}

async function logout() {
  profileOpen.value = false
  try { await authApi.logout() } catch {}
  authStore.logout()
  router.push('/login')
}

// Click outside to close dropdown
function handleClickOutside(e) {
  if (profileRef.value && !profileRef.value.contains(e.target)) {
    profileOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>