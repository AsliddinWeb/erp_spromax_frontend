<template>
  <div class="flex h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden">

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 bg-black/50 z-30 lg:hidden" @click="mobileOpen = false" />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed lg:relative inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-dark-800 border-r border-gray-100 dark:border-dark-border flex-shrink-0 transition-all duration-300"
      :class="[collapsed ? 'w-16' : 'w-64', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center border-b border-gray-100 dark:border-dark-border flex-shrink-0 overflow-hidden" :class="collapsed ? 'justify-center' : 'px-5'">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/30">
            <Factory class="w-4 h-4 text-white" />
          </div>
          <div v-if="!collapsed" class="overflow-hidden">
            <p class="text-sm font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">S PROMAX</p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 leading-tight whitespace-nowrap tracking-wider uppercase">PLAST ERP</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-3" :class="collapsed ? 'px-2' : 'px-3'">
        <template v-for="group in navGroups" :key="group.label">
          <!-- Group label -->
          <div
            v-if="!collapsed && hasVisibleItems(group.items)"
            class="px-3 pt-4 pb-1.5 first:pt-1"
          >
            <p class="text-[10px] font-semibold text-gray-300 dark:text-gray-600 uppercase tracking-widest">
              {{ group.label }}
            </p>
          </div>
          <div v-else-if="collapsed && hasVisibleItems(group.items)" class="py-2">
            <div class="h-px bg-gray-100 dark:bg-dark-700 mx-1" />
          </div>

          <!-- Nav items -->
          <div
            v-for="item in group.items"
            :key="item.to"
            v-show="canSeeNav(item.roles)"
            class="relative group mb-0.5"
          >
            <RouterLink
              :to="item.to"
              @click="mobileOpen = false"
              class="flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
              :class="[
                collapsed ? 'justify-center px-0' : 'px-3',
                isActive(item.to)
                  ? 'bg-primary/10 dark:bg-primary/15 text-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white hover:translate-x-0.5'
              ]"
            >
              <!-- Active left accent -->
              <span
                v-if="isActive(item.to) && !collapsed"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
              />
              <component :is="item.icon" class="w-4 h-4 flex-shrink-0" :class="isActive(item.to) ? 'text-primary' : ''" />
              <span v-if="!collapsed" class="whitespace-nowrap overflow-hidden">{{ item.label }}</span>
            </RouterLink>

            <!-- Tooltip collapsed desktop -->
            <div
              v-if="collapsed"
              class="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 hidden lg:block shadow-lg"
            >
              {{ item.label }}
              <span class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800" />
            </div>
          </div>
        </template>
      </nav>

      <!-- User + version -->
      <div class="border-t border-gray-100 dark:border-dark-border" :class="collapsed ? 'p-2' : 'p-3'">
        <RouterLink to="/profile" @click="mobileOpen = false">
          <div v-if="!collapsed" class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors cursor-pointer">
            <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/20">
              <span class="text-[11px] font-bold text-white">{{ userInitial }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">{{ authStore.user?.full_name }}</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight">{{ authStore.user?.role?.name }}</p>
            </div>
          </div>
          <div v-else class="flex justify-center py-1 relative group/user">
            <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:ring-2 hover:ring-primary/30 transition-all">
              <span class="text-[11px] font-bold text-white">{{ userInitial }}</span>
            </div>
            <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/user:opacity-100 transition-all z-50 hidden lg:block shadow-lg">
              Profil
            </div>
          </div>
        </RouterLink>

        <!-- Version -->
        <p v-if="!collapsed" class="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-2 tracking-wider">v1.0.0</p>
      </div>

      <!-- Collapse toggle -->
      <button
        @click="toggleCollapse"
        class="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border shadow-sm items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors z-10"
      >
        <ChevronLeft class="w-3 h-3 text-gray-500 transition-transform duration-300" :class="collapsed ? 'rotate-180' : ''" />
      </button>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar -->
      <header class="h-16 bg-white dark:bg-dark-800 border-b border-gray-100 dark:border-dark-border flex items-center px-4 gap-3 flex-shrink-0 z-10">
        <button @click="mobileOpen = true" class="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500">
          <Menu class="w-5 h-5" />
        </button>

        <div class="lg:hidden flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Factory class="w-3.5 h-3.5 text-white" />
          </div>
          <span class="text-sm font-bold text-gray-900 dark:text-white">S PROMAX</span>
        </div>

        <div class="hidden lg:block flex-1">
          <h1 class="text-base font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
        </div>

        <div class="flex-1 lg:hidden" />

        <button @click="toggleDark" class="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 transition-colors">
          <Sun v-if="isDark" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>
        <button @click="toggleFullscreen" class="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 transition-colors" :title="isFullscreen ? 'Kichraytirish' : 'To\'liq ekran'">
          <Minimize2 v-if="isFullscreen" class="w-4 h-4" />
          <Maximize2 v-else class="w-4 h-4" />
        </button>

        <NotificationPanel />

        <!-- Profile dropdown -->
        <div class="relative" ref="profileRef">
          <button
            @click="profileOpen = !profileOpen"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <span class="text-[11px] font-bold text-white">{{ userInitial }}</span>
            </div>
            <div class="hidden sm:block text-left">
              <p class="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{{ authStore.user?.full_name }}</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{{ authStore.user?.role?.name }}</p>
            </div>
            <ChevronDown class="hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200" :class="profileOpen ? 'rotate-180' : ''" />
          </button>

          <Transition name="dropdown">
            <div v-if="profileOpen" class="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-border shadow-lg overflow-hidden z-50">
              <div class="px-4 py-3 border-b border-gray-50 dark:border-dark-border">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ authStore.user?.full_name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">@{{ authStore.user?.username }}</p>
                <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                  {{ authStore.user?.role?.name }}
                </span>
              </div>
              <div class="py-1">
                <button @click="toggleDark; profileOpen = false" class="sm:hidden w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <Sun v-if="isDark" class="w-4 h-4 text-gray-400" />
                  <Moon v-else class="w-4 h-4 text-gray-400" />
                  {{ isDark ? 'Kunduzgi rejim' : 'Tungi rejim' }}
                </button>
                <RouterLink to="/profile" @click="profileOpen = false" class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <UserCircle class="w-4 h-4 text-gray-400" />
                  Profil
                </RouterLink>
                <button @click="openChangePassword" class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <KeyRound class="w-4 h-4 text-gray-400" />
                  Parol o'zgartirish
                </button>
                <div class="h-px bg-gray-50 dark:bg-dark-border mx-2 my-1" />
                <button @click="logout" class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors">
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
        <RouterView v-slot="{ Component }"><Transition name="page" mode="out-in"><component :is="Component" /></Transition></RouterView>
      </main>
    </div>
  </div>

  <!-- Change Password Modal -->
  <AppModal v-model="showPasswordModal" title="Parol o'zgartirish" size="sm">
    <form @submit.prevent="changePassword" class="space-y-4">
      <AppInput v-model="pwForm.old_password" label="Joriy parol" type="password" required :error="pwErrors.old_password" />
      <AppInput v-model="pwForm.new_password" label="Yangi parol" type="password" required :error="pwErrors.new_password" placeholder="Kamida 8 belgi, katta harf, raqam" />
      <AppInput v-model="pwForm.confirm_password" label="Yangi parolni tasdiqlang" type="password" required :error="pwErrors.confirm_password" />
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="showPasswordModal = false">Bekor qilish</AppButton>
      <AppButton :loading="pwSaving" @click="changePassword">Saqlash</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard, Package, Factory, ShoppingCart,
  Wallet, Users, Wrench, UserCog, BarChart2, Settings2,
  Menu, Sun, Moon, ChevronDown, ChevronLeft, LogOut, KeyRound, UserCircle,
  Maximize2, Minimize2
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { usePermission } from '@/composables/usePermission'
import { useNotificationsStore } from '@/stores/notifications'
import { authApi } from '@/api'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import NotificationPanel from '@/components/shared/NotificationPanel.vue'

const authStore = useAuthStore()
const toast = useToast()
const { hasRole } = usePermission()
const route = useRoute()
const router = useRouter()
const notifStore = useNotificationsStore()

const mobileOpen = ref(false)
const collapsed = ref(localStorage.getItem('sidebar_collapsed') === 'true')
const profileOpen = ref(false)
const profileRef = ref(null)
const isDark = ref(document.documentElement.classList.contains('dark'))
const isFullscreen = ref(!!document.fullscreenElement)
const showPasswordModal = ref(false)
const pwSaving = ref(false)
const pwErrors = ref({})
const pwForm = ref({ old_password: '', new_password: '', confirm_password: '' })

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar_collapsed', String(collapsed.value))
}

watch(() => route.path, () => { mobileOpen.value = false })

const navGroups = [
  {
    label: 'ASOSIY',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: null },
    ]
  },
  {
    label: 'MODULLAR',
    items: [
      { to: '/warehouse',   label: 'Ombor',            icon: Package,      roles: ['superadmin','admin','director','warehouse_manager'] },
      { to: '/production',  label: 'Ishlab chiqarish', icon: Factory,      roles: ['superadmin','admin','director','production_manager','operator'] },
      { to: '/sales',       label: 'Sotuv',            icon: ShoppingCart, roles: ['superadmin','admin','director','sales_manager'] },
      { to: '/finance',     label: 'Moliya',           icon: Wallet,       roles: ['superadmin','admin','director','accountant'] },
    ]
  },
  {
    label: 'BOSHQARUV',
    items: [
      { to: '/hr',          label: 'Kadrlar',          icon: Users,        roles: ['superadmin','admin','director','hr_manager'] },
      { to: '/maintenance', label: 'Texnik xizmat',    icon: Wrench,       roles: ['superadmin','admin','director','maintenance','production_manager','operator'] },
      { to: '/users',           label: 'Foydalanuvchilar', icon: UserCog,      roles: ['superadmin','admin'] },
      { to: '/analytics',       label: 'Tahlil',           icon: BarChart2,    roles: ['superadmin','admin','director'] },
      { to: '/system-settings', label: 'Tizim Sozlamalari', icon: Settings2,   roles: ['superadmin'] },
    ]
  }
]

function hasVisibleItems(items) {
  return items.some(item => canSeeNav(item.roles))
}

const pageTitle = computed(() => {
  const map = {
    '/': 'Dashboard', '/warehouse': 'Ombor', '/production': 'Ishlab chiqarish',
    '/sales': 'Sotuv', '/finance': 'Moliya', '/hr': 'Kadrlar bo\'limi',
    '/maintenance': 'Texnik xizmat', '/users': 'Foydalanuvchilar', '/analytics': 'Tahlil',
    '/system-settings': 'Tizim Sozlamalari',
    '/profile': 'Profil',
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

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
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
  if (pwForm.value.new_password !== pwForm.value.confirm_password) { pwErrors.value.confirm_password = 'Parollar mos kelmaydi'; return }
  pwSaving.value = true
  try {
    await authApi.changePassword({ old_password: pwForm.value.old_password, new_password: pwForm.value.new_password })
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

function handleClickOutside(e) {
  if (profileRef.value && !profileRef.value.contains(e.target)) profileOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  notifStore.startPolling()
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style>
.page-enter-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.page-leave-active { transition: opacity 0.1s ease; }
.page-enter-from   { opacity: 0; transform: translateY(5px); }
.page-leave-to     { opacity: 0; }
</style>