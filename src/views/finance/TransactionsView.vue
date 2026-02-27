<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tranzaksiyalar</h3>
      <AppButton @click="openCreate" :icon="Plus">Qo'shish</AppButton>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami kirim</p>
        <p class="text-lg font-bold text-success mt-1">{{ formatMoney(stats.total_income) }}</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami chiqim</p>
        <p class="text-lg font-bold text-danger mt-1">{{ formatMoney(stats.total_expense) }}</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Sof foyda</p>
        <p class="text-lg font-bold mt-1" :class="Number(stats.net_profit) >= 0 ? 'text-success' : 'text-danger'">
          {{ formatMoney(stats.net_profit) }}
        </p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Bu oy kirim</p>
        <p class="text-lg font-bold text-primary mt-1">{{ formatMoney(stats.income_this_month) }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Tavsif bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect v-model="typeFilter" :options="typeOptions" placeholder="Turi" class="w-40" />
      <!-- Manba filtr (yangi) -->
      <AppSelect v-model="sourceFilter" :options="sourceOptions" placeholder="Manba" class="w-44" />
      <AppSelect v-model="categoryFilter" :options="categoryOptions" placeholder="Kategoriya" class="w-48" />
      <AppInput v-model="dateFrom" type="date" class="w-40" />
      <AppInput v-model="dateTo" type="date" class="w-40" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #transaction_type="{ value }">
        <AppBadge :variant="value === 'income' ? 'success' : 'danger'">
          {{ value === 'income' ? 'Kirim' : 'Chiqim' }}
        </AppBadge>
      </template>

      <template #amount="{ row }">
        <span class="font-semibold" :class="row.transaction_type === 'income' ? 'text-success' : 'text-danger'">
          {{ row.transaction_type === 'income' ? '+' : '-' }}{{ formatMoney(row.amount) }}
        </span>
      </template>

      <template #category="{ value }">{{ value?.name || '—' }}</template>

      <template #transaction_date="{ value }">{{ formatDate(value) }}</template>

      <!-- Manba ustuni (yangi) -->
      <template #source="{ row }">
        <div class="flex items-center gap-1.5 flex-wrap">
          <AppBadge v-if="row.is_auto" variant="info" class="text-xs">Avto</AppBadge>
          <AppBadge v-else variant="default" class="text-xs">Qo'lda</AppBadge>
          <span
            v-if="row.reference_type"
            class="text-xs font-medium px-1.5 py-0.5 rounded"
            :class="referenceClass(row.reference_type)"
            :title="row.reference_id"
          >
            {{ referenceLabel(row.reference_type, row.reference_id) }}
          </span>
        </div>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton v-if="!row.is_auto" size="sm" variant="ghost" :icon="Edit" @click.stop="openEdit(row)" />
          <AppButton v-else size="sm" variant="ghost" :icon="Eye" @click.stop="openDetail(row)" />
          <AppButton
            v-if="!row.is_auto"
            size="sm" variant="ghost"
            :icon="row.is_active ? EyeOff : Eye"
            @click.stop="toggleStatus(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create/Edit Modal -->
    <AppModal v-model="showModal" :title="editingId ? 'Tranzaksiyani tahrirlash' : 'Yangi tranzaksiya'" size="md">
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppSelect v-model="form.transaction_type" label="Turi" required
            :options="[{ value: 'income', label: 'Kirim' }, { value: 'expense', label: 'Chiqim' }]"
            :error="errors.transaction_type" />
          <AppInput v-model="form.transaction_date" label="Sana" type="datetime-local" required :error="errors.transaction_date" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.amount" label="Miqdor (so'm)" type="number" required :error="errors.amount" placeholder="0" />
          <AppSelect v-model="form.category_id" label="Kategoriya" required :options="filteredCategoryOptions" :error="errors.category_id" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
          <textarea v-model="form.description" rows="2" placeholder="Tranzaksiya haqida..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.reference_type" label="Havola turi" placeholder="order, salary..." />
          <AppInput v-model="form.reference_id" label="Havola ID" placeholder="UUID" />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal v-model="showDetailModal" title="Tranzaksiya tafsilotlari" size="sm">
      <div v-if="selectedTx" class="space-y-3 text-sm">
        <div class="flex items-center gap-2 flex-wrap">
          <AppBadge :variant="selectedTx.transaction_type === 'income' ? 'success' : 'danger'">
            {{ selectedTx.transaction_type === 'income' ? 'Kirim' : 'Chiqim' }}
          </AppBadge>
          <AppBadge v-if="selectedTx.is_auto" variant="info">Avto</AppBadge>
          <AppBadge v-else variant="default">Qo'lda</AppBadge>
          <span class="text-xl font-bold" :class="selectedTx.transaction_type === 'income' ? 'text-success' : 'text-danger'">
            {{ selectedTx.transaction_type === 'income' ? '+' : '-' }}{{ formatMoney(selectedTx.amount) }} so'm
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Kategoriya</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedTx.category?.name || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Sana</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedTx.transaction_date) }}</p>
          </div>
          <div v-if="selectedTx.description" class="col-span-2">
            <p class="text-gray-500 dark:text-gray-400">Tavsif</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedTx.description }}</p>
          </div>
          <div v-if="selectedTx.reference_type" class="col-span-2">
            <p class="text-gray-500 dark:text-gray-400 mb-1">Manba</p>
            <span class="text-xs font-medium px-2 py-1 rounded" :class="referenceClass(selectedTx.reference_type)">
              {{ referenceLabel(selectedTx.reference_type, selectedTx.reference_id) }}
            </span>
          </div>
          <div v-if="selectedTx.reference_id" class="col-span-2">
            <p class="text-gray-500 dark:text-gray-400">Havola ID</p>
            <p class="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{{ selectedTx.reference_id }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton v-if="!selectedTx?.is_auto" :icon="Edit" @click="openEdit(selectedTx); showDetailModal = false">Tahrirlash</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff } from 'lucide-vue-next'
import { financeApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()

const data = ref([])
const categoriesData = ref([])
const stats = ref({ total_income: 0, total_expense: 0, net_profit: 0, income_this_month: 0, expense_this_month: 0 })
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref(null)
const selectedTx = ref(null)
const search = ref('')
const typeFilter = ref('')
const sourceFilter = ref('')
const categoryFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  transaction_type: 'income',
  transaction_date: new Date().toISOString().slice(0, 16),
  amount: '',
  category_id: '',
  description: '',
  reference_type: '',
  reference_id: '',
})
const form = ref(defaultForm())

const typeOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'income', label: 'Kirim' },
  { value: 'expense', label: 'Chiqim' },
]

const sourceOptions = [
  { value: '', label: 'Barcha manba' },
  { value: 'sales_payment', label: '🟡 Sotuv' },
  { value: 'salary_payment', label: '🔵 HR' },
  { value: 'warehouse_receipt', label: '🟢 Ombor' },
  { value: 'manual', label: "✏️ Qo'lda" },
]

const columns = [
  { key: 'transaction_date', label: 'Sana', sortable: true },
  { key: 'transaction_type', label: 'Turi' },
  { key: 'category', label: 'Kategoriya' },
  { key: 'amount', label: 'Miqdor' },
  { key: 'source', label: 'Manba' },
  { key: 'description', label: 'Tavsif' },
  { key: 'actions', label: '', width: '80px' },
]

const categoryOptions = computed(() => [
  { value: '', label: 'Barcha kategoriyalar' },
  ...categoriesData.value.map(c => ({ value: c.id, label: `${c.name} (${c.category_type === 'income' ? 'Kirim' : 'Chiqim'})` }))
])

const filteredCategoryOptions = computed(() => {
  const cats = categoriesData.value.filter(c => !form.value.transaction_type || c.category_type === form.value.transaction_type)
  return cats.map(c => ({ value: c.id, label: c.name }))
})

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.description?.toLowerCase().includes(q))
  }
  if (typeFilter.value) result = result.filter(i => i.transaction_type === typeFilter.value)
  if (categoryFilter.value) result = result.filter(i => i.category_id === categoryFilter.value)
  if (dateFrom.value) result = result.filter(i => new Date(i.transaction_date) >= new Date(dateFrom.value))
  if (dateTo.value) result = result.filter(i => new Date(i.transaction_date) <= new Date(dateTo.value + 'T23:59:59'))

  // Manba filtr
  if (sourceFilter.value === 'manual') {
    result = result.filter(i => !i.is_auto)
  } else if (sourceFilter.value) {
    result = result.filter(i => i.reference_type === sourceFilter.value)
  }

  return result
})

function referenceClass(refType) {
  const map = {
    sales_payment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    salary_payment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    warehouse_receipt: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  }
  return map[refType] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

function referenceLabel(refType, refId) {
  const shortId = refId ? String(refId).slice(0, 8) : '?'
  const map = {
    sales_payment: `Sotuv #${shortId}`,
    salary_payment: `Ish haqi #${shortId}`,
    warehouse_receipt: `Ombor #${shortId}`,
  }
  return map[refType] || `${refType} #${shortId}`
}

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + " mlrd so'm"
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + " mln so'm"
  return num.toLocaleString('uz-UZ') + " so'm"
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const [txRes, catRes, statRes] = await Promise.all([
      financeApi.getTransactions({ page: page.value, limit: limit.value }),
      financeApi.getCategories({ limit: 100 }),
      financeApi.getStatistics(),
    ])
    data.value = txRes.data?.items || txRes.data || []
    total.value = txRes.data?.total || data.value.length
    categoriesData.value = catRes.data?.items || catRes.data || []
    stats.value = statRes.data || stats.value
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

watch(() => form.value.transaction_type, () => { form.value.category_id = '' })

function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  errors.value = {}
  showModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    transaction_type: row.transaction_type || 'income',
    transaction_date: row.transaction_date ? row.transaction_date.slice(0, 16) : '',
    amount: row.amount || '',
    category_id: row.category_id || '',
    description: row.description || '',
    reference_type: row.reference_type || '',
    reference_id: row.reference_id || '',
  }
  errors.value = {}
  showModal.value = true
}

function openDetail(row) {
  selectedTx.value = row
  showDetailModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.transaction_type) { errors.value.transaction_type = 'Turni tanlang'; return }
  if (!form.value.amount || Number(form.value.amount) <= 0) { errors.value.amount = 'Miqdorni kiriting'; return }
  if (!form.value.category_id) { errors.value.category_id = 'Kategoriyani tanlang'; return }
  if (!form.value.transaction_date) { errors.value.transaction_date = 'Sanani kiriting'; return }

  saving.value = true
  try {
    const payload = {
      transaction_type: form.value.transaction_type,
      transaction_date: new Date(form.value.transaction_date).toISOString(),
      amount: Number(form.value.amount),
      category_id: form.value.category_id,
      description: form.value.description || null,
      reference_type: form.value.reference_type || null,
      reference_id: form.value.reference_id || null,
    }
    if (editingId.value) {
      await financeApi.updateTransaction(editingId.value, payload)
      toast.success('Tranzaksiya yangilandi!')
    } else {
      await financeApi.createTransaction(payload)
      toast.success("Tranzaksiya qo'shildi!")
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
    await financeApi.updateTransaction(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>