<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tizim loglari</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Kim, qachon, nima qilgani haqida to'liq tarix</p>
      </div>
      <AppButton variant="secondary" :icon="RefreshCw" :loading="loading" @click="load">Yangilash</AppButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl border border-primary/20 bg-primary/5">
        <p class="text-xs text-primary">Jami</p>
        <p class="text-2xl font-bold text-primary mt-1">{{ filteredData.length }}</p>
        <p class="text-xs text-gray-400 mt-0.5">ta amal</p>
      </div>
      <div class="p-4 rounded-xl border border-success/20 bg-success/5">
        <p class="text-xs text-success">GET</p>
        <p class="text-2xl font-bold text-success mt-1">{{ countByMethod('GET') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">so'rovlar</p>
      </div>
      <div class="p-4 rounded-xl border border-warning/20 bg-warning/5">
        <p class="text-xs text-warning">POST / PUT</p>
        <p class="text-2xl font-bold text-warning mt-1">{{ countByMethod('POST') + countByMethod('PUT') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">o'zgarishlar</p>
      </div>
      <div class="p-4 rounded-xl border border-danger/20 bg-danger/5">
        <p class="text-xs text-danger">DELETE</p>
        <p class="text-2xl font-bold text-danger mt-1">{{ countByMethod('DELETE') }}</p>
        <p class="text-xs text-gray-400 mt-0.5">o'chirishlar</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <AppInput
        v-model="search"
        placeholder="Foydalanuvchi yoki URL bo'yicha..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect v-model="methodFilter" :options="methodOptions" placeholder="Metod" class="w-36" />
      <AppSelect v-model="statusFilter" :options="statusOptions" placeholder="Status" class="w-36" />
      <AppInput v-model="dateFrom" type="date" class="w-36" />
      <AppInput v-model="dateTo" type="date" class="w-36" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="pagedData" :loading="loading">
      <template #username="{ value }">
        <span class="font-medium text-gray-900 dark:text-white">{{ value || '—' }}</span>
      </template>
      <template #method="{ value }">
        <AppBadge :variant="methodVariant(value)">{{ value }}</AppBadge>
      </template>
      <template #path="{ value }">
        <span class="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">{{ value }}</span>
      </template>
      <template #status_code="{ value }">
        <AppBadge :variant="statusVariant(value)">{{ value }}</AppBadge>
      </template>
      <template #ip_address="{ value }">
        <span class="text-xs font-mono text-gray-500 dark:text-gray-400">{{ value || '—' }}</span>
      </template>
      <template #created_at="{ value }">
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDateTime(value) }}</span>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="filteredData.length" @change="p => page = p" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, RefreshCw } from 'lucide-vue-next'
import { auditApi } from '@/api'
import { formatDateTime } from '@/composables/useDate'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const toast = useToast()

const data = ref([])
const loading = ref(false)
const search = ref('')
const methodFilter = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = ref(50)

const methodOptions = [
  { value: '', label: 'Barcha metodlar' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
]

const statusOptions = [
  { value: '', label: 'Barcha statuslar' },
  { value: '2xx', label: '2xx — Muvaffaqiyat' },
  { value: '4xx', label: '4xx — Xatolik' },
  { value: '5xx', label: '5xx — Server xatosi' },
]

const columns = [
  { key: 'created_at', label: 'Vaqt', sortable: true },
  { key: 'username', label: 'Foydalanuvchi' },
  { key: 'method', label: 'Metod' },
  { key: 'path', label: 'URL' },
  { key: 'status_code', label: 'Status' },
  { key: 'ip_address', label: 'IP manzil' },
]

const filteredData = computed(() => {
  let result = [...data.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      i.username?.toLowerCase().includes(q) ||
      i.path?.toLowerCase().includes(q) ||
      i.ip_address?.toLowerCase().includes(q)
    )
  }
  if (methodFilter.value) result = result.filter(i => i.method === methodFilter.value)
  if (statusFilter.value === '2xx') result = result.filter(i => i.status_code >= 200 && i.status_code < 300)
  if (statusFilter.value === '4xx') result = result.filter(i => i.status_code >= 400 && i.status_code < 500)
  if (statusFilter.value === '5xx') result = result.filter(i => i.status_code >= 500)
  if (dateFrom.value) result = result.filter(i => new Date(i.created_at) >= new Date(dateFrom.value))
  if (dateTo.value) result = result.filter(i => new Date(i.created_at) <= new Date(dateTo.value + 'T23:59:59'))

  return result
})

const pagedData = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredData.value.slice(start, start + limit.value)
})

function countByMethod(method) {
  return filteredData.value.filter(i => i.method === method).length
}

function methodVariant(m) {
  return { GET: 'default', POST: 'success', PUT: 'warning', DELETE: 'danger', PATCH: 'warning' }[m] || 'default'
}

function statusVariant(code) {
  if (code >= 200 && code < 300) return 'success'
  if (code >= 400 && code < 500) return 'warning'
  if (code >= 500) return 'danger'
  return 'default'
}

async function load() {
  loading.value = true
  try {
    const { data: res } = await auditApi.getLogs({ limit: 500 })
    data.value = res || []
  } catch {
    toast.error('Loglarni yuklashda xatolik')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
