<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tayyor mahsulotlar</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','production_manager'])"
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
      <template #standard_price="{ value }">
        {{ value ? `${formatMoney(value)} so'm` : '—' }}
      </template>

      <template #current_stock="{ value, row }">
        <span>{{ value || 0 }} {{ row.unit }}</span>
      </template>

      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
        </AppBadge>
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

    <!-- Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Mahsulotni tahrirlash' : 'Yangi tayyor mahsulot'"
      size="md"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Nomi"
          required
          :error="errors.name"
          placeholder="Masalan: PVC quvur 110mm"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.unit"
            label="O'lchov birligi"
            required
            :error="errors.unit"
            placeholder="dona, metr, kg..."
          />
          <AppInput
            v-model="form.standard_price"
            label="Standart narxi (so'm)"
            type="number"
            placeholder="0"
          />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Mahsulot haqida ma'lumot..."
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
import { productionApi } from '@/api'
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

const defaultForm = () => ({ name: '', unit: '', description: '', standard_price: '' })
const form = ref(defaultForm())

const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
]

const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'unit', label: "O'lchov" },
  { key: 'standard_price', label: 'Narxi' },
  { key: 'current_stock', label: 'Zaxira' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.name?.toLowerCase().includes(q))
  }
  if (statusFilter.value === 'active') result = result.filter(i => i.is_active)
  if (statusFilter.value === 'inactive') result = result.filter(i => !i.is_active)
  return result
})

function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}

async function load() {
  loading.value = true
  try {
    const { data: res } = await productionApi.getFinishedProducts({ page: page.value, limit: limit.value })
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
    standard_price: row.standard_price || '',
  }
  errors.value = {}
  showModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.unit) { errors.value.unit = "O'lchov birligi shart"; return }
  saving.value = true
  try {
    if (editingId.value) {
      await productionApi.updateFinishedProduct(editingId.value, form.value)
      toast.success('Mahsulot yangilandi!')
    } else {
      await productionApi.createFinishedProduct(form.value)
      toast.success("Mahsulot qo'shildi!")
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
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>