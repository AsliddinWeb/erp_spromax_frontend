<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tayyor mahsulotlar</h3>
      <AppButton
        v-if="activeTab === 'catalog' && hasRole(['superadmin','admin','director','production_manager'])"
        @click="openCreate"
        :icon="Plus"
      >
        Qoshish
      </AppButton>
    </div>

    <!-- Tabs -->
    <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
      <button
        @click="activeTab = 'stock'"
        class="flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        :class="activeTab === 'stock'
          ? 'bg-success text-white'
          : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'"
      >
        <Boxes class="w-4 h-4" />
        Ombor
        <span class="text-xs px-1.5 py-0.5 rounded-full" :class="activeTab === 'stock' ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-700'">
          {{ stockData.filter(s => s.quantity_available > 0).length }}
        </span>
      </button>
      <button
        @click="activeTab = 'catalog'"
        class="flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-l border-gray-200 dark:border-dark-border"
        :class="activeTab === 'catalog'
          ? 'bg-primary text-white'
          : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'"
      >
        <List class="w-4 h-4" />
        Katalog
      </button>
    </div>

    <!-- ===== OMBOR TAB ===== -->
    <div v-if="activeTab === 'stock'" class="space-y-4">

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-xl border border-success/20 bg-success/5">
          <p class="text-xs text-success">Jami tur</p>
          <p class="text-2xl font-bold text-success mt-1">{{ stockStats.total }}</p>
        </div>
        <div class="p-4 rounded-xl border border-success/20 bg-success/5">
          <p class="text-xs text-success">Mavjud</p>
          <p class="text-2xl font-bold text-success mt-1">{{ stockStats.available }}</p>
        </div>
        <div class="p-4 rounded-xl border border-warning/20 bg-warning/5">
          <p class="text-xs text-warning">Rezerv</p>
          <p class="text-2xl font-bold text-warning mt-1">{{ stockStats.reserved }}</p>
        </div>
        <div class="p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-700">
          <p class="text-xs text-gray-500">Nol qoldiq</p>
          <p class="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">{{ stockStats.empty }}</p>
        </div>
      </div>

      <!-- Search -->
      <AppInput
        v-model="stockSearch"
        placeholder="Mahsulot nomi..."
        :prefix-icon="Search"
        class="max-w-xs"
      />

      <!-- Stock table -->
      <AppTable
        :columns="stockColumns"
        :data="filteredStockData"
        :loading="stockLoading"
        @row-click="openStockDetail"
      >
        <template #finished_product="{ value }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ value?.name || '—' }}</p>
            <p class="text-xs text-gray-500">{{ value?.unit }}</p>
          </div>
        </template>

        <template #quantity_available="{ value, row }">
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-200 dark:bg-dark-600 rounded-full h-1.5 w-16">
              <div
                class="h-1.5 rounded-full transition-all"
                :class="value > 0 ? 'bg-success' : 'bg-gray-300'"
                :style="`width: ${getStockPercent(row)}%`"
              ></div>
            </div>
            <span class="font-semibold text-sm" :class="value > 0 ? 'text-success' : 'text-gray-400'">
              {{ value }}
            </span>
          </div>
        </template>

        <template #quantity_reserved="{ value }">
          <span :class="value > 0 ? 'text-warning font-medium' : 'text-gray-400'">{{ value }}</span>
        </template>

        <template #quantity_total="{ value }">
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ value }}</span>
        </template>

        <template #last_updated="{ value }">
          <span class="text-xs text-gray-500">{{ formatDate(value) }}</span>
        </template>

        <template #standard_price="{ row }">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ row.finished_product?.standard_price ? formatMoney(row.finished_product.standard_price) + " so'm" : '—' }}
          </span>
        </template>
      </AppTable>
    </div>

    <!-- ===== KATALOG TAB ===== -->
    <div v-else class="space-y-4">
      <div class="flex gap-3 flex-wrap">
        <AppInput
          v-model="search"
          placeholder="Nomi boyicha qidirish..."
          :prefix-icon="Search"
          class="flex-1 min-w-[200px]"
        />
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Holat"
          class="w-40"
        />
      </div>

      <AppTable :columns="catalogColumns" :data="filteredCatalogData" :loading="loading">
        <template #standard_price="{ value }">
          {{ value ? `${formatMoney(value)} som` : '—' }}
        </template>
        <template #current_stock="{ value, row }">
          <span :class="(value || 0) > 0 ? 'text-success font-medium' : 'text-gray-400'">
            {{ value || 0 }} {{ row.unit }}
          </span>
        </template>
        <template #is_active="{ value }">
          <AppBadge :variant="value ? 'success' : 'danger'">{{ value ? 'Faol' : 'Nofaol' }}</AppBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-1">
            <AppButton
              v-if="hasRole(['superadmin','admin','director','production_manager'])"
              size="sm" variant="ghost" :icon="Edit"
              @click.stop="openEdit(row)"
            />
            <AppButton
              v-if="hasRole(['superadmin','admin'])"
              size="sm" variant="ghost"
              :icon="row.is_active ? EyeOff : Eye"
              @click.stop="toggleStatus(row)"
            />
          </div>
        </template>
      </AppTable>

      <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />
    </div>

    <!-- KATALOG MODAL -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Mahsulotni tahrirlash' : 'Yangi tayyor mahsulot'"
      size="md"
    >
      <div class="space-y-4">
        <AppInput v-model="form.name" label="Nomi" required :error="errors.name" placeholder="Masalan: PVC quvur 110mm" />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.unit" label="Olchov birligi" required :error="errors.unit" placeholder="dona, metr, kg..." />
          <AppInput v-model="form.standard_price" label="Standart narxi (som)" type="number" placeholder="0" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
          <textarea v-model="form.description" rows="3" placeholder="Mahsulot haqida malumot..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- OMBOR DETAIL MODAL -->
    <AppModal v-model="showStockDetail" title="Mahsulot ombor tafsiloti" size="md">
      <div v-if="selectedStock" class="space-y-4">
        <!-- Mahsulot info -->
        <div class="p-4 rounded-xl bg-gray-50 dark:bg-dark-700 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
            <Boxes class="w-6 h-6 text-success" />
          </div>
          <div>
            <p class="font-semibold text-gray-900 dark:text-white text-lg">{{ selectedStock.finished_product?.name }}</p>
            <p class="text-sm text-gray-500">{{ selectedStock.finished_product?.unit }} · {{ selectedStock.finished_product?.standard_price ? formatMoney(selectedStock.finished_product.standard_price) + " so'm" : 'Narx belgilanmagan' }}</p>
          </div>
        </div>

        <!-- Miqdorlar -->
        <div class="grid grid-cols-3 gap-3">
          <div class="p-3 rounded-xl border border-success/20 bg-success/5 text-center">
            <p class="text-xs text-success mb-1">Mavjud</p>
            <p class="text-2xl font-bold text-success">{{ selectedStock.quantity_available }}</p>
            <p class="text-xs text-gray-400">{{ selectedStock.finished_product?.unit }}</p>
          </div>
          <div class="p-3 rounded-xl border border-warning/20 bg-warning/5 text-center">
            <p class="text-xs text-warning mb-1">Rezerv</p>
            <p class="text-2xl font-bold text-warning">{{ selectedStock.quantity_reserved }}</p>
            <p class="text-xs text-gray-400">{{ selectedStock.finished_product?.unit }}</p>
          </div>
          <div class="p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-700 text-center">
            <p class="text-xs text-gray-500 mb-1">Jami</p>
            <p class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ selectedStock.quantity_total }}</p>
            <p class="text-xs text-gray-400">{{ selectedStock.finished_product?.unit }}</p>
          </div>
        </div>

        <!-- So'nggi yangilanish -->
        <div class="flex items-center gap-2 text-sm text-gray-500 px-1">
          <Clock class="w-4 h-4" />
          <span>Oxirgi yangilanish: {{ formatDateTime(selectedStock.last_updated) }}</span>
        </div>

        <!-- Tavsif -->
        <div v-if="selectedStock.finished_product?.description" class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700 text-sm text-gray-600 dark:text-gray-400">
          {{ selectedStock.finished_product.description }}
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showStockDetail = false">Yopish</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff, Boxes, List, Clock } from 'lucide-vue-next'
import { productionApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { formatDate, formatDateTime } from '@/composables/useDate'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()

// State
const activeTab = ref('stock')
const data = ref([])
const stockData = ref([])
const loading = ref(false)
const stockLoading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showStockDetail = ref(false)
const selectedStock = ref(null)
const editingId = ref(null)
const search = ref('')
const stockSearch = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({ name: '', unit: '', description: '', standard_price: '' })
const form = ref(defaultForm())

// Options
const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
]

// Columns
const stockColumns = [
  { key: 'finished_product', label: 'Mahsulot' },
  { key: 'quantity_available', label: 'Mavjud' },
  { key: 'quantity_reserved', label: 'Rezerv' },
  { key: 'quantity_total', label: 'Jami' },
  { key: 'standard_price', label: 'Narxi' },
  { key: 'last_updated', label: 'Yangilangan' },
]
const catalogColumns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'unit', label: "Olchov" },
  { key: 'standard_price', label: 'Narxi' },
  { key: 'current_stock', label: 'Zaxira' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

// Computed
const stockStats = computed(() => ({
  total: stockData.value.length,
  available: stockData.value.filter(s => s.quantity_available > 0).length,
  reserved: stockData.value.reduce((sum, s) => sum + parseFloat(s.quantity_reserved || 0), 0),
  empty: stockData.value.filter(s => (s.quantity_available || 0) <= 0).length,
}))

const filteredStockData = computed(() => {
  if (!stockSearch.value) return stockData.value
  const q = stockSearch.value.toLowerCase()
  return stockData.value.filter(s => s.finished_product?.name?.toLowerCase().includes(q))
})

const filteredCatalogData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.name?.toLowerCase().includes(q))
  }
  if (statusFilter.value === 'active') result = result.filter(i => i.is_active)
  if (statusFilter.value === 'inactive') result = result.filter(i => !i.is_active)
  return result
})

function getStockPercent(row) {
  const max = Math.max(...stockData.value.map(s => parseFloat(s.quantity_total || 0)))
  if (!max) return 0
  return Math.min(100, Math.round((parseFloat(row.quantity_total || 0) / max) * 100))
}

function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}

// Load
async function load() {
  loading.value = true
  stockLoading.value = true
  try {
    const [prodRes, stockRes] = await Promise.all([
      productionApi.getFinishedProducts({ page: page.value, limit: limit.value }),
      productionApi.getFinishedStock(),
    ])
    data.value = prodRes.data?.items || prodRes.data || []
    total.value = prodRes.data?.total || data.value.length
    stockData.value = stockRes.data?.items || stockRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
    stockLoading.value = false
  }
}

// Catalog CRUD
function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  errors.value = {}
  showModal.value = true
}
function openEdit(row) {
  editingId.value = row.id
  form.value = { name: row.name || '', unit: row.unit || '', description: row.description || '', standard_price: row.standard_price || '' }
  errors.value = {}
  showModal.value = true
}
async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.unit) { errors.value.unit = "Olchov birligi shart"; return }
  saving.value = true
  try {
    if (editingId.value) {
      await productionApi.updateFinishedProduct(editingId.value, form.value)
      toast.success('Mahsulot yangilandi!')
    } else {
      await productionApi.createFinishedProduct(form.value)
      toast.success("Mahsulot qoshildi!")
    }
    showModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}
async function toggleStatus(row) {
  try {
    await productionApi.updateFinishedProduct(row.id, { is_active: !row.is_active })
    toast.success("Holat ozgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

// Stock detail
function openStockDetail(row) {
  selectedStock.value = row
  showStockDetail.value = true
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>