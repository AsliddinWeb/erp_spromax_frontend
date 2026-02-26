<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Yetkazib beruvchilar</h3>
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
        placeholder="Nomi yoki telefon bo'yicha qidirish..."
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
      @row-click="viewRow"
    >
      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
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
      :title="editingId ? 'Yetkazib beruvchini tahrirlash' : 'Yangi yetkazib beruvchi'"
      size="md"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Nomi"
          required
          :error="errors.name"
          placeholder="Kompaniya nomi"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.phone"
            label="Telefon"
            required
            :error="errors.phone"
            placeholder="+998901234567"
          />
          <AppInput
            v-model="form.inn"
            label="INN"
            :error="errors.inn"
            placeholder="123456789"
          />
        </div>
        <AppInput
          v-model="form.contact_person"
          label="Aloqa shaxsi"
          placeholder="F.I.Sh."
        />
        <AppInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="info@company.uz"
        />
        <AppInput
          v-model="form.address"
          label="Manzil"
          placeholder="Shahar, ko'cha, uy"
        />
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
  phone: '',
  inn: '',
  contact_person: '',
  email: '',
  address: '',
})
const form = ref(defaultForm())

const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
]

const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'contact_person', label: 'Aloqa shaxsi' },
  { key: 'phone', label: 'Telefon' },
  { key: 'inn', label: 'INN' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(item =>
      item.name?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.contact_person?.toLowerCase().includes(q)
    )
  }
  if (statusFilter.value === 'active') result = result.filter(i => i.is_active)
  if (statusFilter.value === 'inactive') result = result.filter(i => !i.is_active)
  return result
})

async function load() {
  loading.value = true
  try {
    const { data: res } = await warehouseApi.getSuppliers({ page: page.value, limit: limit.value })
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
    phone: row.phone || '',
    inn: row.inn || '',
    contact_person: row.contact_person || '',
    email: row.email || '',
    address: row.address || '',
  }
  errors.value = {}
  showModal.value = true
}

function viewRow(row) {
  // Could open detail view
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.phone) { errors.value.phone = 'Telefon kiritilishi shart'; return }

  saving.value = true
  try {
    if (editingId.value) {
      await warehouseApi.updateSupplier(editingId.value, form.value)
      toast.success('Yetkazib beruvchi yangilandi!')
    } else {
      await warehouseApi.createSupplier(form.value)
      toast.success('Yetkazib beruvchi qo\'shildi!')
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
    await warehouseApi.updateSupplier(row.id, { is_active: !row.is_active })
    toast.success('Holat o\'zgartirildi!')
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