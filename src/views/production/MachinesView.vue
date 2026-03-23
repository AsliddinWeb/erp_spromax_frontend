<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Mashinalar</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director'])"
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
        placeholder="Nomi yoki seriya raqami..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect
        v-model="lineFilter"
        :options="lineOptions"
        placeholder="Liniya"
        class="w-48"
      />
      <AppSelect
        v-model="statusFilter"
        :options="machineStatusOptions"
        placeholder="Holat"
        class="w-44"
      />
    </div>

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="filteredData"
      :loading="loading"
    >
      <template #status="{ value }">
        <AppBadge :variant="machineStatusVariant(value)">
          {{ machineStatusLabel(value) }}
        </AppBadge>
      </template>

      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
        </AppBadge>
      </template>

      <template #production_line="{ value }">
        {{ value?.name || '—' }}
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

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Mashinani tahrirlash' : 'Yangi mashina'"
      size="md"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Nomi"
          required
          :error="errors.name"
          placeholder="Masalan: Ekstruder-1"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.serial_number"
            label="Seriya raqami"
            placeholder="SN-001"
          />
          <AppSelect
            v-model="form.status"
            label="Mashina holati"
            :options="machineStatusOptions.filter(o => o.value)"
            required
            :error="errors.status"
          />
        </div>
        <AppSelect
          v-model="form.production_line_id"
          label="Ishlab chiqarish liniyasi"
          :options="lineSelectOptions"
          placeholder="Liniyani tanlang"
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
import { Search, Plus, Edit, Eye, EyeOff, Trash2 } from 'lucide-vue-next'
import { productionApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()
const confirm = useConfirm

const data = ref([])
const linesData = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const search = ref('')
const lineFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({ name: '', serial_number: '', production_line_id: '', status: 'active' })
const form = ref(defaultForm())

const machineStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Ishlayapti' },
  { value: 'idle', label: "Bo'sh" },
  { value: 'maintenance', label: "Ta'mirda" },
  { value: 'broken', label: 'Ishlamayapti' },
  { value: 'inactive', label: 'Nofaol' },
]

const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'serial_number', label: 'Seriya №' },
  { key: 'production_line', label: 'Liniya' },
  { key: 'status', label: 'Mashina holati' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const lineOptions = computed(() => [
  { value: '', label: 'Barcha liniyalar' },
  ...linesData.value.map(l => ({ value: l.id, label: l.name }))
])
const lineSelectOptions = computed(() =>
  linesData.value.map(l => ({ value: l.id, label: l.name }))
)

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.serial_number?.toLowerCase().includes(q)
    )
  }
  if (lineFilter.value) result = result.filter(i => i.production_line_id === lineFilter.value)
  if (statusFilter.value === 'inactive') {
    result = result.filter(i => !i.is_active)
  } else if (statusFilter.value) {
    result = result.filter(i => i.is_active && i.status === statusFilter.value)
  }
  return result
})

function machineStatusVariant(s) {
  const map = { active: 'success', idle: 'default', maintenance: 'warning', broken: 'danger' }
  return map[s] || 'default'
}
function machineStatusLabel(s) {
  const map = { active: 'Ishlayapti', idle: "Bo'sh", maintenance: "Ta'mirda", broken: 'Ishlamayapti' }
  return map[s] || s
}

async function load() {
  loading.value = true
  try {
    const [machRes, lineRes] = await Promise.all([
      productionApi.getMachines({ skip: 0, limit: 100, include_inactive: true }),
      productionApi.getLines({ skip: 0, limit: 100 }),
    ])
    data.value = machRes.data?.items || machRes.data || []
    total.value = machRes.data?.total || data.value.length
    linesData.value = lineRes.data?.items || lineRes.data || []
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
    serial_number: row.serial_number || '',
    production_line_id: row.production_line_id || '',
    status: row.status || 'active',
  }
  errors.value = {}
  showModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.status) { errors.value.status = 'Holatni tanlang'; return }
  saving.value = true
  try {
    if (editingId.value) {
      await productionApi.updateMachine(editingId.value, form.value)
      toast.success('Mashina yangilandi!')
    } else {
      await productionApi.createMachine(form.value)
      toast.success("Mashina qo'shildi!")
    }
    showModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  const ok = await confirm({
    title: 'O\'chirishni tasdiqlang',
    message: `"${row.name}" mashinani o'chirmoqchimisiz?`,
    confirmText: 'O\'chirish',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await productionApi.deleteMachine(row.id)
    toast.success("Mashina o'chirildi!")
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  }
}

async function toggleStatus(row) {
  try {
    await productionApi.updateMachine(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>