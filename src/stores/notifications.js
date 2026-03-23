import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/api'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const connected = ref(false)

  let _ws = null
  let _reconnectTimer = null
  let _pingTimer = null
  let _started = false

  function startWS() {
    if (_started) return
    _started = true
    _connect()
  }

  function stopWS() {
    _started = false
    clearTimeout(_reconnectTimer)
    clearInterval(_pingTimer)
    _reconnectTimer = null
    _pingTimer = null
    if (_ws) { _ws.close(); _ws = null }
    connected.value = false
  }

  function _connect() {
    if (!_started) return
    const token = localStorage.getItem('access_token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/api/v1/notifications/ws?token=${token}`

    try {
      _ws = new WebSocket(url)
    } catch {
      _scheduleReconnect()
      return
    }

    _ws.onopen = () => {
      connected.value = true
      fetchNotifications({ limit: 20 })
      // 30 soniyada bir ping — nginx idle timeout dan saqlash
      _pingTimer = setInterval(() => {
        if (_ws?.readyState === WebSocket.OPEN) _ws.send('ping')
      }, 30000)
    }

    _ws.onmessage = (event) => {
      if (event.data === 'pong') return
      try {
        const notif = JSON.parse(event.data)
        notifications.value.unshift(notif)
        unreadCount.value++
      } catch {}
    }

    _ws.onclose = () => {
      connected.value = false
      clearInterval(_pingTimer)
      _pingTimer = null
      _ws = null
      _scheduleReconnect()
    }

    _ws.onerror = () => {
      _ws?.close()
    }
  }

  function _scheduleReconnect() {
    if (!_started) return
    _reconnectTimer = setTimeout(_connect, 5000)
  }

  async function fetchNotifications(params = {}) {
    loading.value = true
    try {
      const { data } = await notificationsApi.getAll({ limit: 50, ...params })
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
    } catch {}
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead()
      notifications.value.forEach(n => { n.is_read = true })
      unreadCount.value = 0
    } catch {}
  }

  return {
    notifications,
    unreadCount,
    loading,
    connected,
    startWS,
    stopWS,
    fetchNotifications,
    markRead,
    markAllRead,
  }
})
