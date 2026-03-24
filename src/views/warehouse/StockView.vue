<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Zaxira holati</h3>
      <div class="flex gap-2">
        <AppButton
          variant="secondary"
          :icon="AlertTriangle"
          @click="showLowStock = !showLowStock"
          :class="showLowStock ? 'ring-2 ring-warning' : ''"
        >
          Kam zaxira
        </AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','warehouse_manager'])"
          @click="openReceiptModal"
          :icon="Plus"
        >
          Kirim qo'shish
        </AppButton>
      </div>
    </div>

    <!-- Low stock alert -->
    <AppAlert
      v-if="lowStockItems.length > 0"
      type="warning"
      title="Diqqat: Kam zaxiradagi materiallar"
      dismissible
    >
      {{ lowStockItems.length }} ta material minimal zaxiradan past. Tezda to'ldiring.
    </AppAlert>

    <!-- Tabs: Stock / Receipts -->
    <div class="flex gap-4 border-b border-gray-200 dark:border-dark-border">
      <button
        @click="subTab = 'stock'"
        class="pb-2 text-sm font-medium transition-colors border-b-2"
        :class="subTab === 'stock' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400'"
      >
        Joriy zaxira
      </button>
      <button
        @click="subTab = 'receipts'"
        class="pb-2 text-sm font-medium transition-colors border-b-2"
        :class="subTab === 'receipts' ? 'border-primary text-primary' : 'border-transparent text-gray-500 dark:text-gray-400'"
      >
        Kirim tarixi
      </button>
    </div>

    <!-- Search -->
    <AppInput
      v-model="search"
      placeholder="Material nomi bo'yicha qidirish..."
      :prefix-icon="Search"
      class="max-w-sm"
    />

    <!-- Stock Table -->
    <AppTable
      v-if="subTab === 'stock'"
      :columns="stockColumns"
      :data="filteredStock"
      :loading="loading"
    >
      <template #stock_level="{ row }">
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span>{{ row.quantity }} {{ row.raw_material?.unit }}</span>
            <span class="text-gray-400">Min: {{ row.raw_material?.minimum_stock }}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-1.5">
            <div
              class="h-1.5 rounded-full transition-all"
              :class="getStockBarClass(row)"
              :style="{ width: getStockPercent(row) + '%' }"
            />
          </div>
        </div>
      </template>

      <template #status="{ row }">
        <AppBadge :variant="isLowStock(row) ? 'danger' : 'success'">
          {{ isLowStock(row) ? 'Kam' : 'Yetarli' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <AppButton
          v-if="hasRole(['superadmin'])"
          size="sm"
          variant="ghost"
          :icon="Trash2"
          class="text-red-500 hover:text-red-700"
          @click.stop="handleDeleteStock(row)"
        />
      </template>
    </AppTable>

    <!-- Receipts Table -->
    <AppTable
      v-if="subTab === 'receipts'"
      :columns="receiptColumns"
      :data="filteredReceipts"
      :loading="loading"
    >
      <template #receipt_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #total_price="{ value }">
        <span class="font-medium">{{ formatMoney(value) }} so'm</span>
      </template>
    </AppTable>

    <!-- Pagination -->
    <AppPagination
      :page="page"
      :limit="limit"
      :total="total"
      @change="onPageChange"
    />

    <!-- Receipt Modal -->
    <AppModal
      v-model="showReceiptModal"
      title="Yangi kirim"
      size="md"
    >
      <form @submit.prevent="saveReceipt" class="space-y-4">
        <AppSelect
          v-model="receiptForm.supplier_id"
          label="Yetkazib beruvchi"
          required
          :options="supplierOptions"
          :error="receiptErrors.supplier_id"
        />
        <AppSelect
          v-model="receiptForm.raw_material_id"
          label="Xom ashyo"
          required
          :options="materialOptions"
          :error="receiptErrors.raw_material_id"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="receiptForm.quantity"
            label="Miqdori"
            type="number"
            required
            :error="receiptErrors.quantity"
            placeholder="0"
          />
          <AppInput
            v-model="receiptForm.unit_price"
            label="Narxi (so'm)"
            type="number"
            required
            :error="receiptErrors.unit_price"
            placeholder="0"
          />
        </div>
        <AppInput
          v-model="receiptForm.receipt_date"
          label="Sana"
          type="datetime-local"
          required
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="receiptForm.notes"
            rows="2"
            placeholder="Qo'shimcha ma'lumot..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <!-- Total Preview -->
        <div v-if="receiptForm.quantity && receiptForm.unit_price" class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700 text-sm">
          <span class="text-gray-500">Jami:</span>
          <span class="ml-2 font-semibold text-gray-900 dark:text-white">
            {{ formatMoney(parseFloat(receiptForm.quantity) * parseFloat(receiptForm.unit_price)) }} so'm
          </span>
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showReceiptModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveReceipt">Saqlash</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { todayISO, nowLocalISO, startOfMonthISO, startOfYearISO, formatDate, formatDateTime } from '@/composables/useDate'
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, AlertTriangle, Trash2 } from 'lucide-vue-next'
import { warehouseApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()
const confirm = useConfirm

const stockData = ref([])
const receiptsData = ref([])
const suppliersData = ref([])
const materialsData = ref([])
const lowStockItems = ref([])
const loading = ref(false)
const saving = ref(false)
const showReceiptModal = ref(false)
const showLowStock = ref(false)
const subTab = ref('stock')
const search = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const receiptErrors = ref({})

const defaultReceiptForm = () => ({
  supplier_id: '',
  raw_material_id: '',
  quantity: '',
  unit_price: '',
  receipt_date: nowLocalISO(),
  notes: '',
})
const receiptForm = ref(defaultReceiptForm())

const stockColumns = computed(() => [
  { key: 'raw_material.name', label: 'Material nomi', sortable: true },
  { key: 'raw_material.unit', label: "O'lchov" },
  { key: 'stock_level', label: 'Zaxira miqdori' },
  { key: 'status', label: 'Holat' },
  { key: 'last_updated', label: 'Oxirgi yangilanish' },
  ...(hasRole(['superadmin']) ? [{ key: 'actions', label: '', width: '60px' }] : []),
])

const receiptColumns = [
  { key: 'batch_number', label: 'Partiya №' },
  { key: 'raw_material.name', label: 'Material' },
  { key: 'supplier.name', label: 'Yetkazib beruvchi' },
  { key: 'quantity', label: 'Miqdor' },
  { key: 'unit_price', label: 'Birlik narxi' },
  { key: 'total_price', label: 'Jami' },
  { key: 'receipt_date', label: 'Sana' },
]

const supplierOptions = computed(() =>
  suppliersData.value.map(s => ({ value: s.id, label: s.name }))
)
const materialOptions = computed(() =>
  materialsData.value.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))
)

const filteredStock = computed(() => {
  let result = showLowStock.value ? stockData.value.filter(isLowStock) : stockData.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(item => item.raw_material?.name?.toLowerCase().includes(q))
  }
  return result
})

const filteredReceipts = computed(() => {
  if (!search.value) return receiptsData.value
  const q = search.value.toLowerCase()
  return receiptsData.value.filter(item =>
    item.raw_material?.name?.toLowerCase().includes(q) ||
    item.supplier?.name?.toLowerCase().includes(q) ||
    item.batch_number?.toLowerCase().includes(q)
  )
})

function isLowStock(row) {
  const current = parseFloat(row.quantity) || 0
  const min = parseFloat(row.raw_material?.minimum_stock) || 0
  return min > 0 && current <= min
}

function getStockPercent(row) {
  const current = parseFloat(row.quantity) || 0
  const min = parseFloat(row.raw_material?.minimum_stock) || 1
  return Math.min(100, Math.round((current / (min * 3)) * 100))
}

function getStockBarClass(row) {
  const pct = getStockPercent(row)
  if (pct < 33) return 'bg-danger'
  if (pct < 66) return 'bg-warning'
  return 'bg-success'
}


function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}

async function loadAll() {
  loading.value = true
  try {
    const [stockRes, receiptRes, suppRes, matRes, lowRes] = await Promise.all([
      warehouseApi.getStock({ page: page.value, limit: limit.value }),
      warehouseApi.getReceipts({ page: page.value, limit: limit.value }),
      warehouseApi.getSuppliers({ limit: 100 }),
      warehouseApi.getRawMaterials({ limit: 100 }),
      warehouseApi.getLowStock(),
    ])
    stockData.value = stockRes.data?.items || stockRes.data || []
    receiptsData.value = receiptRes.data?.items || receiptRes.data || []
    suppliersData.value = suppRes.data?.items || suppRes.data || []
    materialsData.value = matRes.data?.items || matRes.data || []
    lowStockItems.value = lowRes.data || []
    total.value = stockRes.data?.total || stockData.value.length
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function openReceiptModal() {
  receiptForm.value = defaultReceiptForm()
  receiptErrors.value = {}
  showReceiptModal.value = true
}

async function saveReceipt() {
  receiptErrors.value = {}
  if (!receiptForm.value.supplier_id) { receiptErrors.value.supplier_id = 'Tanlang'; return }
  if (!receiptForm.value.raw_material_id) { receiptErrors.value.raw_material_id = 'Tanlang'; return }
  if (!receiptForm.value.quantity) { receiptErrors.value.quantity = 'Kiriting'; return }
  if (!receiptForm.value.unit_price) { receiptErrors.value.unit_price = 'Kiriting'; return }

  saving.value = true
  try {
    const payload = {
      ...receiptForm.value,
      receipt_date: new Date(receiptForm.value.receipt_date).toISOString(),
    }
    await warehouseApi.createReceipt(payload)
    toast.success('Kirim muvaffaqiyatli saqlandi!')
    showReceiptModal.value = false
    loadAll()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function handleDeleteStock(row) {
  const ok = await confirm({
    title: 'Zaxirani o\'chirish',
    message: `"${row.raw_material?.name}" zaxira yozuvini o\'chirmoqchimisiz? Bu amalni qaytarib bo\'lmaydi.`,
    confirmText: 'O\'chirish',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await warehouseApi.deleteStock(row.id)
    toast.success('Zaxira o\'chirildi!')
    loadAll()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  }
}

function onPageChange(newPage) {
  page.value = newPage
  loadAll()
}

onMounted(loadAll)
</script>