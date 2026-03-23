<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Bildirishnomalar</h2>
        <span
          v-if="store.unreadCount > 0"
          class="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-xs font-bold"
        >{{ store.unreadCount }} yangi</span>
        <span
          v-if="store.connected"
          class="flex items-center gap-1 text-[10px] text-success font-medium"
          title="Real-time ulanish faol"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
          Live
        </span>
      </div>
      <button
        v-if="store.unreadCount > 0"
        @click="store.markAllRead()"
        class="text-sm text-primary hover:underline"
      >Hammasini o'qildi deb belgilash</button>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-lg w-fit">
      <button
        v-for="tab in tabs" :key="tab.value"
        @click="activeTab = tab.value"
        class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
        :class="activeTab === tab.value
          ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
      >{{ tab.label }}</button>
    </div>

    <!-- List -->
    <div class="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
      <div v-if="store.loading" class="py-16 text-center text-gray-400 text-sm">
        Yuklanmoqda...
      </div>

      <div v-else-if="filtered.length === 0" class="py-16 text-center">
        <BellOff class="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
        <p class="text-sm text-gray-400">Bildirishnomalar yo'q</p>
      </div>

      <div v-else>
        <button
          v-for="notif in filtered"
          :key="notif.id"
          @click="handleClick(notif)"
          class="w-full flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors text-left border-b border-gray-50 dark:border-dark-border/50 last:border-0"
          :class="!notif.is_read ? 'bg-primary/[0.02]' : ''"
        >
          <!-- Icon -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            :class="iconBg(notif.type)"
          >
            <component :is="notifIcon(notif.type)" class="w-5 h-5" :class="iconColor(notif.type)" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {{ notif.title }}
              </p>
              <span class="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                {{ timeAgo(notif.created_at) }}
              </span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {{ notif.message }}
            </p>
            <span
              class="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
              :class="typeBadge(notif.type)"
            >{{ typeLabel(notif.type) }}</span>
          </div>

          <!-- Unread indicator -->
          <div
            v-if="!notif.is_read"
            class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, BellOff, PackageX, Wrench, ShoppingCart, Users, Wallet, Settings } from 'lucide-vue-next'
import { useNotificationsStore } from '@/stores/notifications'

const store = useNotificationsStore()
const router = useRouter()
const activeTab = ref('all')

const tabs = [
  { value: 'all',    label: 'Barchasi' },
  { value: 'unread', label: 'O\'qilmagan' },
  { value: 'read',   label: 'O\'qilgan' },
]

const filtered = computed(() => {
  if (activeTab.value === 'unread') return store.notifications.filter(n => !n.is_read)
  if (activeTab.value === 'read')   return store.notifications.filter(n => n.is_read)
  return store.notifications
})

const routeMap = {
  low_stock: '/warehouse',
  maintenance: '/maintenance',
  order: '/sales',
  leave_request: '/hr',
  salary: '/hr',
  system: '/',
}

function notifIcon(type) {
  return { low_stock: PackageX, maintenance: Wrench, order: ShoppingCart, leave_request: Users, salary: Wallet, system: Settings }[type] || Bell
}

function iconBg(type) {
  return { low_stock: 'bg-danger/10', maintenance: 'bg-warning/10', order: 'bg-primary/10', leave_request: 'bg-purple-100 dark:bg-purple-900/20', salary: 'bg-success/10', system: 'bg-gray-100 dark:bg-dark-700' }[type] || 'bg-gray-100 dark:bg-dark-700'
}

function iconColor(type) {
  return { low_stock: 'text-danger', maintenance: 'text-warning', order: 'text-primary', leave_request: 'text-purple-600 dark:text-purple-400', salary: 'text-success', system: 'text-gray-500' }[type] || 'text-gray-500'
}

function typeBadge(type) {
  return { low_stock: 'bg-danger/10 text-danger', maintenance: 'bg-warning/10 text-warning', order: 'bg-primary/10 text-primary', leave_request: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', salary: 'bg-success/10 text-success', system: 'bg-gray-100 dark:bg-dark-700 text-gray-500' }[type] || 'bg-gray-100 text-gray-500'
}

function typeLabel(type) {
  return { low_stock: 'Kam qoldiq', maintenance: 'Texnik xizmat', order: 'Buyurtma', leave_request: 'Ta\'til so\'rovi', salary: 'Ish haqi', system: 'Tizim' }[type] || type
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

async function handleClick(notif) {
  if (!notif.is_read) await store.markRead(notif.id)
  router.push(routeMap[notif.type] || '/')
}

onMounted(() => {
  store.fetchNotifications({ limit: 100 })
})
</script>
