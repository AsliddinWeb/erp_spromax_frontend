import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/api'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)

  // Polling singleton — faqat bir marta ishga tushadi
  let _intervalId = null
  let _started = false

  function startPolling() {
    if (_started) return  // ikkinchi chaqiruvda ignore
    _started = true
    _poll()
    _intervalId = setInterval(_poll, 30_000)
    document.addEventListener('visibilitychange', _handleVisibility)
  }

  function stopPolling() {
    if (_intervalId) { clearInterval(_intervalId); _intervalId = null }
    _started = false
    document.removeEventListener('visibilitychange', _handleVisibility)
  }

  async function _poll() {
    if (document.hidden) return
    try {
      const { data } = await notificationsApi.getUnreadCount()
      unreadCount.value = data.count || 0
    } catch { /* silent */ }
  }

  function _handleVisibility() {
    if (!document.hidden) _poll()
  }

  async function fetchNotifications(params = {}) {
    loading.value = true
    try {
      const { data } = await notificationsApi.getAll({ limit: 20, ...params })
      notifications.value = data.items || []
      unreadCount.value = data.unread_count || 0
    } catch {
      // silent
    } finally {
      loading.value = false
    }
  }

  async function markRead(id) {
    try {
      await notificationsApi.markRead(id)
      const notif = notifications.value.find(n => n.id === id)
      if (notif) {
        notif.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead()
      notifications.value.forEach(n => { n.is_read = true })
      unreadCount.value = 0
    } catch { /* silent */ }
  }

  return {
    notifications,
    unreadCount,
    loading,
    startPolling,
    stopPolling,
    fetchNotifications,
    markRead,
    markAllRead,
  }
})