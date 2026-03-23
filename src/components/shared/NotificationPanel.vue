<template>
  <div class="relative" ref="panelRef">
    <!-- Bell Button -->
    <button
      @click="toggle"
      class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 dark:text-gray-400 transition-colors"
    >
      <Bell class="w-4 h-4" />
      <!-- Badge -->
      <span
        v-if="store.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse"
      >
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </button>

    <!-- Dropdown Panel -->
    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-1.5 w-80 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-border shadow-xl overflow-hidden z-50 flex flex-col max-h-[26rem]"
      >
        <!-- Header -->
        <div class="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-900 dark:text-white">Bildirishnomalar</span>
            <span
              v-if="store.unreadCount > 0"
              class="px-1.5 py-0.5 rounded-full bg-danger/10 text-danger text-xs font-bold"
            >
              {{ store.unreadCount }}
            </span>
          </div>
          <button
            v-if="store.unreadCount > 0"
            @click="markAll"
            class="text-xs text-primary hover:underline"
          >
            Hammasini o'qildi
          </button>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <div v-if="store.loading" class="py-8 text-center text-gray-400 text-sm">
            Yuklanmoqda...
          </div>

          <div v-else-if="store.notifications.length === 0" class="py-10 text-center">
            <BellOff class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p class="text-sm text-gray-400">Bildirishnomalar yo'q</p>
          </div>

          <div v-else>
            <button
              v-for="notif in store.notifications.slice(0, 5)"
              :key="notif.id"
              @click="handleClick(notif)"
              class="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors text-left border-b border-gray-50 dark:border-dark-border/50 last:border-0"
              :class="!notif.is_read ? 'bg-primary/3' : ''"
            >
              <!-- Icon -->
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                :class="iconBg(notif.type)"
              >
                <component :is="notifIcon(notif.type)" class="w-4 h-4" :class="iconColor(notif.type)" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                  {{ notif.title }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {{ notif.message }}
                </p>
                <p class="text-[10px] text-gray-400 mt-1">{{ timeAgo(notif.created_at) }}</p>
              </div>

              <!-- Unread dot -->
              <div
                v-if="!notif.is_read"
                class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"
              />
            </button>
          </div>
        </div>
        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-gray-100 dark:border-dark-border px-4 py-2.5">
          <RouterLink
            to="/notifications"
            @click="open = false"
            class="block text-center text-xs text-primary hover:underline font-medium"
          >
            Barcha bildirishnomalarni ko'rish
            <span v-if="store.notifications.length > 5" class="text-gray-400 font-normal">
              ({{ store.notifications.length - 5 }} ta yana)
            </span>
          </RouterLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Bell, BellOff, PackageX, Wrench, ShoppingCart, Users, Wallet, Settings } from 'lucide-vue-next'
import { useNotificationsStore } from '@/stores/notifications'

const store = useNotificationsStore()
const router = useRouter()
const open = ref(false)
const panelRef = ref(null)

const routeMap = {
  low_stock: '/warehouse',
  maintenance: '/maintenance',
  order: '/sales',
  leave_request: '/hr',
  salary: '/hr',
  system: '/',
}

function notifIcon(type) {
  const map = {
    low_stock: PackageX,
    maintenance: Wrench,
    order: ShoppingCart,
    leave_request: Users,
    salary: Wallet,
    system: Settings,
  }
  return map[type] || Bell
}

function iconBg(type) {
  const map = {
    low_stock: 'bg-danger/10',
    maintenance: 'bg-warning/10',
    order: 'bg-primary/10',
    leave_request: 'bg-purple-100 dark:bg-purple-900/20',
    salary: 'bg-success/10',
    system: 'bg-gray-100 dark:bg-dark-700',
  }
  return map[type] || 'bg-gray-100 dark:bg-dark-700'
}

function iconColor(type) {
  const map = {
    low_stock: 'text-danger',
    maintenance: 'text-warning',
    order: 'text-primary',
    leave_request: 'text-purple-600 dark:text-purple-400',
    salary: 'text-success',
    system: 'text-gray-500',
  }
  return map[type] || 'text-gray-500'
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Hozirgina'
  if (min < 60) return `${min} daqiqa oldin`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} soat oldin`
  const d = Math.floor(h / 24)
  return `${d} kun oldin`
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await store.fetchNotifications({ limit: 20 })
  }
}

async function handleClick(notif) {
  if (!notif.is_read) {
    await store.markRead(notif.id)
  }
  open.value = false
  const path = routeMap[notif.type] || '/'
  router.push(path)
}

async function markAll() {
  await store.markAllRead()
}

function handleOutsideClick(e) {
  if (panelRef.value && !panelRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))
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