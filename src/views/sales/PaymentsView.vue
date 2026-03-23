<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">To'lovlar</h3>
      <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Info class="w-3.5 h-3.5" />
        To'lovlar buyurtmalar sahifasidan qo'shiladi
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-4 rounded-xl border border-success/20 bg-success/5">
        <p class="text-xs text-success">Jami to'lovlar</p>
        <p class="text-2xl font-bold text-success mt-1">{{ filteredData.length }}</p>
        <p class="text-xs text-gray-400 mt-0.5">ta tranzaksiya</p>
      </div>
      <div class="p-4 rounded-xl border border-primary/20 bg-primary/5">
        <p class="text-xs text-primary">Jami summa</p>
        <p class="text-lg font-bold text-primary mt-1">{{ formatMoney(totalAmount) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">so'm</p>
      </div>
      <div class="p-4 rounded-xl border border-success/20 bg-success/5">
        <p class="text-xs text-success">Naqd</p>
        <p class="text-lg font-bold text-success mt-1">{{ formatMoney(cashTotal) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">so'm</p>
      </div>
      <div class="p-4 rounded-xl border border-info/20 bg-info/5">
        <p class="text-xs text-info">Bank o'tkazma</p>
        <p class="text-lg font-bold text-info mt-1">{{ formatMoney(bankTotal) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">so'm</p>
      </div>
    </div>

    <!-- To'lov usuli breakdown -->
    <div class="p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">To'lov usullari bo'yicha</p>
      <div class="flex flex-wrap gap-4">
        <div v-for="(val, method) in methodBreakdown" :key="method" class="flex items-center gap-2">
          <AppBadge :variant="methodVariant(method)">{{ methodLabel(method) }}</AppBadge>
          <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatMoney(val) }} so'm</span>
          <span class="text-xs text-gray-400">({{ methodCount(method) }} ta)</span>
        </div>
        <p v-if="!Object.keys(methodBreakdown).length" class="text-sm text-gray-400">Ma'lumot yo'q</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <AppInput
        v-model="search"
        placeholder="Mijoz nomi yoki tranzaksiya ID..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect v-model="methodFilter" :options="methodOptions" placeholder="To'lov usuli" class="w-44" />
      <AppInput v-model="dateFrom" type="date" class="w-36" />
      <AppInput v-model="dateTo" type="date" class="w-36" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="pagedData" :loading="loading" @row-click="openDetail">
      <template #customer_name="{ value }">
        <span class="font-medium text-gray-900 dark:text-white">{{ value || '—' }}</span>
      </template>
      <template #amount="{ value }">
        <span class="font-bold text-success">{{ formatMoney(value) }} so'm</span>
      </template>
      <template #payment_method="{ value }">
        <AppBadge :variant="methodVariant(value)">{{ methodLabel(value) }}</AppBadge>
      </template>
      <template #payment_date="{ value }">
        <span class="text-sm">{{ formatDateTime(value) }}</span>
      </template>
      <template #transaction_id="{ value }">
        <span v-if="value" class="text-xs font-mono text-gray-500 dark:text-gray-400">{{ value }}</span>
        <span v-else class="text-gray-300">—</span>
      </template>
      <template #notes="{ value }">
        <span class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{{ value || '—' }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="hasRole(['superadmin','admin'])"
            size="sm"
            variant="ghost"
            :icon="Trash2"
            class="text-red-500 hover:text-red-700"
            @click.stop="handleDelete(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="filteredData.length" @change="p => page = p" />

    <!-- Detail Modal -->
    <AppModal v-model="showDetail" title="To'lov tafsiloti" size="sm">
      <div v-if="selectedPayment" class="space-y-4">
        <!-- Summa -->
        <div class="text-center p-4 rounded-xl bg-success/5 border border-success/20">
          <p class="text-xs text-success mb-1">To'lov miqdori</p>
          <p class="text-3xl font-bold text-success">{{ formatMoney(selectedPayment.amount) }}</p>
          <p class="text-sm text-gray-500 mt-0.5">so'm</p>
        </div>

        <!-- Ma'lumotlar -->
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
            <span class="text-gray-500">Mijoz</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ selectedPayment.customer_name }}</span>
          </div>
          <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
            <span class="text-gray-500">To'lov usuli</span>
            <AppBadge :variant="methodVariant(selectedPayment.payment_method)">
              {{ methodLabel(selectedPayment.payment_method) }}
            </AppBadge>
          </div>
          <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
            <span class="text-gray-500">Sana</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(selectedPayment.payment_date) }}</span>
          </div>
          <div v-if="selectedPayment.transaction_id" class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
            <span class="text-gray-500">Tranzaksiya ID</span>
            <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ selectedPayment.transaction_id }}</span>
          </div>
          <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-dark-border">
            <span class="text-gray-500">Buyurtma ID</span>
            <span class="font-mono text-xs text-gray-500">{{ selectedPayment.order_id?.slice(0, 8) }}...</span>
          </div>
          <div v-if="selectedPayment.notes" class="py-1.5">
            <p class="text-gray-500 mb-1">Izoh</p>
            <p class="text-gray-900 dark:text-white">{{ selectedPayment.notes }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetail = false">Yopish</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatDateTime } from '@/composables/useDate'
import { Search, Info, Trash2 } from 'lucide-vue-next'
import { salesApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import AppTable from '@/components/ui/AppTable.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()
const confirm = useConfirm

const data = ref([])
const loading = ref(false)
const search = ref('')
const methodFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = ref(20)
const showDetail = ref(false)
const selectedPayment = ref(null)

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
  { key: 'notes', label: 'Izoh' },
  { key: 'actions', label: '', width: '60px' },
]

const filteredData = computed(() => {
  let result = [...data.value].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      i.customer_name?.toLowerCase().includes(q) ||
      i.transaction_id?.toLowerCase().includes(q) ||
      i.notes?.toLowerCase().includes(q)
    )
  }
  if (methodFilter.value) result = result.filter(i => i.payment_method === methodFilter.value)
  if (dateFrom.value) result = result.filter(i => new Date(i.payment_date) >= new Date(dateFrom.value))
  if (dateTo.value) result = result.filter(i => new Date(i.payment_date) <= new Date(dateTo.value + 'T23:59:59'))
  return result
})

const pagedData = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredData.value.slice(start, start + limit.value)
})

const totalAmount = computed(() => filteredData.value.reduce((s, i) => s + parseFloat(i.amount || 0), 0))
const cashTotal = computed(() => filteredData.value.filter(i => i.payment_method === 'cash').reduce((s, i) => s + parseFloat(i.amount || 0), 0))
const bankTotal = computed(() => filteredData.value.filter(i => i.payment_method === 'bank_transfer').reduce((s, i) => s + parseFloat(i.amount || 0), 0))

const methodBreakdown = computed(() => {
  const result = {}
  for (const p of filteredData.value) {
    if (!result[p.payment_method]) result[p.payment_method] = 0
    result[p.payment_method] += parseFloat(p.amount || 0)
  }
  return result
})

function methodCount(method) {
  return filteredData.value.filter(p => p.payment_method === method).length
}
function methodVariant(m) {
  return { cash: 'success', bank_transfer: 'info', card: 'warning', other: 'default' }[m] || 'default'
}
function methodLabel(m) {
  return { cash: 'Naqd', bank_transfer: "Bank o'tkazma", card: 'Karta', other: 'Boshqa' }[m] || m
}
function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}
async function handleDelete(row) {
  const ok = await confirm({
    title: 'O\'chirishni tasdiqlang',
    message: 'Bu to\'lovni o\'chirmoqchimisiz?',
    confirmText: 'O\'chirish',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await salesApi.deletePayment(row.id)
    toast.success('To\'lov o\'chirildi!')
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  }
}

function openDetail(row) {
  selectedPayment.value = row
  showDetail.value = true
}

async function load() {
  loading.value = true
  try {
    const { data: res } = await salesApi.getAllPayments({ limit: 100 })
    data.value = res.items || res || []
  } catch {
    toast.error("To'lovlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>