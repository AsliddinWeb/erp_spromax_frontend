<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">To'lovlar</h3>
      <!-- To'lovlar faqat OrdersView orqali qo'shiladi -->
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Tranzaksiya ID yoki izoh bo'yicha..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect
        v-model="methodFilter"
        :options="methodOptions"
        placeholder="To'lov usuli"
        class="w-44"
      />
      <AppInput
        v-model="dateFrom"
        type="date"
        class="w-40"
      />
      <AppInput
        v-model="dateTo"
        type="date"
        class="w-40"
      />
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami to'lovlar</p>
        <p class="text-lg font-bold text-gray-900 dark:text-white mt-1">{{ filteredData.length }} ta</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami summa</p>
        <p class="text-lg font-bold text-primary mt-1">{{ formatMoney(totalAmount) }} so'm</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Naqd</p>
        <p class="text-lg font-bold text-success mt-1">{{ formatMoney(cashTotal) }} so'm</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Bank o'tkazma</p>
        <p class="text-lg font-bold text-info mt-1">{{ formatMoney(bankTotal) }} so'm</p>
      </div>
    </div>

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="filteredData"
      :loading="loading"
    >
      <template #amount="{ value }">
        <span class="font-semibold text-success">{{ formatMoney(value) }} so'm</span>
      </template>

      <template #payment_method="{ value }">
        <AppBadge :variant="methodVariant(value)">
          {{ methodLabel(value) }}
        </AppBadge>
      </template>

      <template #payment_date="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <template #receiver="{ value }">
        {{ value?.full_name || value?.username || '—' }}
      </template>

      <template #order_id="{ value }">
        <span class="text-xs font-mono text-gray-500">{{ value?.slice(0, 8) }}...</span>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from 'lucide-vue-next'
import { salesApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()

const data = ref([])
const loading = ref(false)
const search = ref('')
const methodFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const methodOptions = [
  { value: '', label: 'Barcha usullar' },
  { value: 'cash', label: 'Naqd' },
  { value: 'bank_transfer', label: "Bank o'tkazma" },
  { value: 'card', label: 'Karta' },
  { value: 'other', label: 'Boshqa' },
]

const columns = [
  { key: 'payment_date', label: 'Sana', sortable: true },
  { key: 'customer_name', label: 'Mijoz' },
  { key: 'amount', label: 'Miqdor' },
  { key: 'payment_method', label: "To'lov usuli" },
  { key: 'transaction_id', label: 'Tranzaksiya ID' },
  { key: 'receiver', label: 'Qabul qilgan' },
  { key: 'notes', label: 'Izoh' },
]

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      i.transaction_id?.toLowerCase().includes(q) ||
      i.notes?.toLowerCase().includes(q)
    )
  }
  if (methodFilter.value) result = result.filter(i => i.payment_method === methodFilter.value)
  if (dateFrom.value) result = result.filter(i => new Date(i.payment_date) >= new Date(dateFrom.value))
  if (dateTo.value) result = result.filter(i => new Date(i.payment_date) <= new Date(dateTo.value + 'T23:59:59'))
  return result
})

const totalAmount = computed(() => filteredData.value.reduce((s, i) => s + parseFloat(i.amount || 0), 0))
const cashTotal = computed(() => filteredData.value.filter(i => i.payment_method === 'cash').reduce((s, i) => s + parseFloat(i.amount || 0), 0))
const bankTotal = computed(() => filteredData.value.filter(i => i.payment_method === 'bank_transfer').reduce((s, i) => s + parseFloat(i.amount || 0), 0))

function methodVariant(m) {
  const map = { cash: 'success', bank_transfer: 'info', card: 'warning', other: 'default' }
  return map[m] || 'default'
}
function methodLabel(m) {
  const map = { cash: 'Naqd', bank_transfer: "Bank o'tkazma", card: 'Karta', other: 'Boshqa' }
  return map[m] || m
}
function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}
function formatDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function load() {
  loading.value = true
  try {
    // Barcha orderlarni olish (max 100)
    const { data: ordRes } = await salesApi.getOrders({ limit: 100 })
    const orders = ordRes.items || ordRes || []
    
    // Har bir buyurtmaning to'lovlarini parallel olish
    const paymentArrays = await Promise.all(
      orders.map(o => 
        salesApi.getOrderPayments(o.id)
          .then(r => (r.data || []).map(p => ({
            ...p,
            customer_name: o.customer?.name
          })))
          .catch(() => [])
      )
    )
    data.value = paymentArrays.flat()
    total.value = data.value.length
  } catch {
    toast.error("To'lovlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function onPageChange(p) { page.value = p }
onMounted(load)
</script>