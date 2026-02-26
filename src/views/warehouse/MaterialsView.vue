<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Xom ashyolar</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','warehouse_manager'])"
        @click="openCreate"
        :icon="Plus"
      >
        Qo'shish
      </AppButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Nomi bo'yicha qidirish..."
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

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="filteredData"
      :loading="loading"
    >
      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
        </AppBadge>
      </template>

      <template #stock_status="{ row }">
        <AppBadge
          :variant="isLowStock(row) ? 'danger' : 'success'"
        >
          {{ isLowStock(row) ? 'Kam zaxira' : 'Normal' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="hasRole(['superadmin','admin','director','warehouse_manager'])"
            size="sm"
            variant="ghost"
            :icon="Edit"
            @click.stop="openEdit(row)"
          />
          <AppButton
            v-if="hasRole(['superadmin','admin'])"
            size="sm"
            variant="ghost"
            :icon="row.is_active ? EyeOff : Eye"
            @click.stop="toggleStatus(row)"
          />
        </div>
      </template>
    </AppTable>

    <!-- Pagination -->
    <AppPagination
      :page="page"
      :limit="limit"
      :total="total"
      @change="onPageChange"
    />

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Xom ashyoni tahrirlash' : 'Yangi xom ashyo'"
      size="md"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Nomi"
          required
          :error="errors.name"
          placeholder="Masalan: PVC granula"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.unit"
            label="O'lchov birligi"
            required
            :error="errors.unit"
            placeholder="kg, litr, dona..."
          />
          <AppInput
            v-model="form.minimum_stock"
            label="Minimal zaxira"
            type="number"
            placeholder="0"
          />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Xom ashyo haqida qo'shimcha ma'lumot..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Saqlash</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff } from 'lucide-vue-next'
import { warehouseApi } from '@/api'
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
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  name: '',
  unit: '',
  description: '',
  minimum_stock: 0,
})
const form = ref(defaultForm())

const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
]

const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'unit', label: "O'lchov birligi" },
  { key: 'minimum_stock', label: 'Min. zaxira' },
  { key: 'current_stock', label: 'Joriy zaxira' },
  { key: 'stock_status', label: 'Zaxira holati' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(item => item.name?.toLowerCase().includes(q))
  }
  if (statusFilter.value === 'active') result = result.filter(i => i.is_active)
  if (statusFilter.value === 'inactive') result = result.filter(i => !i.is_active)
  return result
})

function isLowStock(row) {
  const current = parseFloat(row.current_stock) || 0
  const min = parseFloat(row.minimum_stock) || 0
  return min > 0 && current <= min
}

async function load() {
  loading.value = true
  try {
    const { data: res } = await warehouseApi.getRawMaterials({ page: page.value, limit: limit.value })
    data.value = res.items || res
    total.value = res.total || data.value.length
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
    unit: row.unit || '',
    description: row.description || '',
    minimum_stock: row.minimum_stock || 0,
  }
  errors.value = {}
  showModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.unit) { errors.value.unit = "O'lchov birligi kiritilishi shart"; return }

  saving.value = true
  try {
    if (editingId.value) {
      await warehouseApi.updateRawMaterial(editingId.value, form.value)
      toast.success('Xom ashyo yangilandi!')
    } else {
      await warehouseApi.createRawMaterial(form.value)
      toast.success("Xom ashyo qo'shildi!")
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
    await warehouseApi.updateRawMaterial(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(newPage) {
  page.value = newPage
  load()
}

onMounted(load)
</script>