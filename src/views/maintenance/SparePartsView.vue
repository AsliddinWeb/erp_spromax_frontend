<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ehtiyot qismlar</h3>
      <div class="flex gap-2">
        <AppButton
          v-if="lowStockData.length"
          variant="danger"
          :icon="AlertTriangle"
          @click="showLowStock = !showLowStock"
        >
          Kam qoldiq ({{ lowStockData.length }})
        </AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','maintenance'])"
          @click="openCreate"
          :icon="Plus"
        >
          Qo'shish
        </AppButton>
      </div>
    </div>

    <!-- Low stock alert -->
    <div v-if="showLowStock && lowStockData.length" class="rounded-xl border border-danger/30 bg-danger/5 overflow-hidden">
      <div class="px-4 py-3 bg-danger/10 border-b border-danger/20">
        <p class="text-sm font-semibold text-danger flex items-center gap-2">
          <AlertTriangle class="w-4 h-4" />
          Kam qoldiqli ehtiyot qismlar
        </p>
      </div>
      <div class="divide-y divide-danger/10">
        <div
          v-for="part in lowStockData"
          :key="part.id"
          class="px-4 py-2 flex justify-between items-center text-sm"
        >
          <span class="font-medium text-gray-900 dark:text-white">{{ part.name }}</span>
          <span class="text-danger font-semibold">
            {{ part.quantity_in_stock }} {{ part.unit }}
            <span class="text-gray-500 font-normal">(min: {{ part.min_stock_level }})</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Nomi yoki raqami bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect v-model="stockFilter" :options="stockOptions" placeholder="Qoldiq holati" class="w-44" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #name="{ row }">
        <div class="flex items-center gap-2">
          <span :class="row.is_low_stock ? 'text-danger font-semibold' : 'text-gray-900 dark:text-white'">
            {{ row.name }}
          </span>
          <span v-if="row.is_low_stock" class="text-xs px-1.5 py-0.5 rounded bg-danger/10 text-danger font-medium">
            Kam
          </span>
        </div>
      </template>

      <template #quantity_in_stock="{ row }">
        <span :class="row.is_low_stock ? 'text-danger font-bold' : 'font-medium text-gray-900 dark:text-white'">
          {{ row.quantity_in_stock }} {{ row.unit }}
        </span>
      </template>

      <template #min_stock_level="{ value, row }">
        <span class="text-gray-500 dark:text-gray-400">{{ value }} {{ row.unit }}</span>
      </template>

      <template #unit_price="{ value }">
        {{ value ? formatMoney(value) : '—' }}
      </template>

      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1" v-if="hasRole(['superadmin','admin','director','maintenance'])">
          <AppButton size="sm" variant="ghost" :icon="Edit" @click.stop="openEdit(row)" />
          <AppButton
            size="sm" variant="ghost"
            :icon="row.is_active ? EyeOff : Eye"
            @click.stop="toggleStatus(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Ehtiyot qismni tahrirlash' : 'Yangi ehtiyot qism'"
      size="md"
    >
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.name" label="Nomi" required :error="errors.name" placeholder="Ehtiyot qism nomi" />
          <AppInput v-model="form.part_number" label="Raqami" placeholder="EQ-001" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.unit" label="O'lchov birligi" required :error="errors.unit" placeholder="dona, kg, m..." />
          <AppInput v-model="form.unit_price" label="Narxi (so'm)" type="number" placeholder="0" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.quantity_in_stock" label="Qoldiq miqdori" type="number" placeholder="0" />
          <AppInput v-model="form.min_stock_level" label="Minimal daraja" type="number" placeholder="5" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Ehtiyot qism haqida..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal v-model="showDetailModal" title="Ehtiyot qism" size="sm">
      <div v-if="selectedPart" class="space-y-3 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-gray-900 dark:text-white">{{ selectedPart.name }}</span>
          <span v-if="selectedPart.is_low_stock" class="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-xs font-semibold">
            Kam qoldiq
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Raqami</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedPart.part_number || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Qoldiq</p>
            <p class="font-bold" :class="selectedPart.is_low_stock ? 'text-danger' : 'text-success'">
              {{ selectedPart.quantity_in_stock }} {{ selectedPart.unit }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Minimal daraja</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedPart.min_stock_level }} {{ selectedPart.unit }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Narxi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedPart.unit_price ? formatMoney(selectedPart.unit_price) : '—' }}</p>
          </div>
          <div v-if="selectedPart.description" class="col-span-2">
            <p class="text-gray-500 dark:text-gray-400">Tavsif</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedPart.description }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','maintenance'])"
          :icon="Edit"
          @click="openEdit(selectedPart); showDetailModal = false"
        >
          Tahrirlash
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff, AlertTriangle } from 'lucide-vue-next'
import { maintenanceApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const emit = defineEmits(['low-stock'])
const { hasRole } = usePermission()
const toast = useToast()

const data = ref([])
const lowStockData = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const showLowStock = ref(true)
const editingId = ref(null)
const selectedPart = ref(null)
const search = ref('')
const stockFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  name: '', part_number: '', description: '',
  unit: 'dona', unit_price: '', quantity_in_stock: '0', min_stock_level: '5',
})
const form = ref(defaultForm())

const stockOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'low', label: 'Kam qoldiq' },
  { value: 'ok', label: 'Yetarli' },
]

const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'part_number', label: 'Raqami' },
  { key: 'quantity_in_stock', label: 'Qoldiq' },
  { key: 'min_stock_level', label: 'Minimal' },
  { key: 'unit_price', label: 'Narxi' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.part_number?.toLowerCase().includes(q)
    )
  }
  if (stockFilter.value === 'low') result = result.filter(i => i.is_low_stock)
  if (stockFilter.value === 'ok') result = result.filter(i => !i.is_low_stock)
  return result
})

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}

async function load() {
  loading.value = true
  try {
    const [partsRes, lowRes] = await Promise.all([
      maintenanceApi.getSpareParts({ page: page.value, limit: limit.value }),
      maintenanceApi.getLowStockParts(),
    ])
    data.value = partsRes.data?.items || partsRes.data || []
    total.value = partsRes.data?.total || data.value.length
    lowStockData.value = lowRes.data || []
    emit('low-stock', lowStockData.value.length)
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  errors.value = {}
  showModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    name: row.name || '',
    part_number: row.part_number || '',
    description: row.description || '',
    unit: row.unit || 'dona',
    unit_price: row.unit_price || '',
    quantity_in_stock: row.quantity_in_stock || '0',
    min_stock_level: row.min_stock_level || '5',
  }
  errors.value = {}
  showModal.value = true
}

function openDetail(row) {
  selectedPart.value = row
  showDetailModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.unit) { errors.value.unit = 'O\'lchov birligi kiritilishi shart'; return }

  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      part_number: form.value.part_number || null,
      description: form.value.description || null,
      unit: form.value.unit,
      unit_price: form.value.unit_price ? Number(form.value.unit_price) : null,
      quantity_in_stock: Number(form.value.quantity_in_stock) || 0,
      min_stock_level: Number(form.value.min_stock_level) || 5,
    }
    if (editingId.value) {
      await maintenanceApi.updateSparePart(editingId.value, payload)
      toast.success('Ehtiyot qism yangilandi!')
    } else {
      await maintenanceApi.createSparePart(payload)
      toast.success("Ehtiyot qism qo'shildi!")
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
    await maintenanceApi.updateSparePart(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>