<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Xodimlar</h3>
      <AppButton @click="openCreate" :icon="Plus">Qo'shish</AppButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Ism yoki telefon bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect v-model="deptFilter" :options="deptOptions" placeholder="Bo'lim" class="w-48" />
      <AppSelect v-model="statusFilter" :options="statusOptions" placeholder="Holat" class="w-44" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #full_name="{ row }">
        <span class="font-medium text-gray-900 dark:text-white">{{ row.first_name }} {{ row.last_name }}</span>
      </template>

      <template #department="{ value }">
        {{ value?.name || '—' }}
      </template>

      <template #salary="{ value }">
        <span class="font-medium">{{ formatMoney(value) }}</span>
      </template>

      <template #employment_status="{ value }">
        <AppBadge :variant="statusVariant(value)">
          {{ statusLabel(value) }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
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
      :title="editingId ? 'Xodimni tahrirlash' : 'Yangi xodim'"
      size="lg"
    >
      <form @submit.prevent="save" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.first_name" label="Ismi" required :error="errors.first_name" placeholder="Ism" />
          <AppInput v-model="form.last_name" label="Familiyasi" required :error="errors.last_name" placeholder="Familiya" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.phone" label="Telefon" required :error="errors.phone" placeholder="+998901234567" />
          <AppInput v-model="form.email" label="Email" type="email" placeholder="email@example.com" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppSelect
            v-model="form.department_id"
            label="Bo'lim"
            required
            :options="deptSelectOptions"
            :error="errors.department_id"
          />
          <AppInput v-model="form.position" label="Lavozim" required :error="errors.position" placeholder="Masalan: Menejer" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.hire_date" label="Ishga kirgan sana" type="date" required :error="errors.hire_date" />
          <AppInput v-model="form.salary" label="Ish haqi (so'm)" type="number" placeholder="0" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppSelect
            v-model="form.employment_status"
            label="Holat"
            required
            :options="employmentStatusOptions"
          />
          <AppInput v-model="form.passport_serial" label="Pasport seriyasi" placeholder="AA1234567" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.inn" label="INN" placeholder="123456789" />
          <AppInput v-model="form.address" label="Manzil" placeholder="Shahar, ko'cha..." />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal v-model="showDetailModal" title="Xodim ma'lumotlari" size="md">
      <div v-if="selectedEmployee" class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-primary font-bold text-lg">
              {{ selectedEmployee.first_name?.[0] }}{{ selectedEmployee.last_name?.[0] }}
            </span>
          </div>
          <div>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ selectedEmployee.first_name }} {{ selectedEmployee.last_name }}
            </p>
            <p class="text-sm text-gray-500">{{ selectedEmployee.position }}</p>
          </div>
          <AppBadge :variant="statusVariant(selectedEmployee.employment_status)" class="ml-auto">
            {{ statusLabel(selectedEmployee.employment_status) }}
          </AppBadge>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Bo'lim</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedEmployee.department?.name || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Telefon</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedEmployee.phone }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Ish haqi</p>
            <p class="font-semibold text-primary">{{ formatMoney(selectedEmployee.salary) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Ishga kirgan</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedEmployee.hire_date) }}</p>
          </div>
          <div v-if="selectedEmployee.email">
            <p class="text-gray-500 dark:text-gray-400">Email</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedEmployee.email }}</p>
          </div>
          <div v-if="selectedEmployee.address">
            <p class="text-gray-500 dark:text-gray-400">Manzil</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedEmployee.address }}</p>
          </div>
          <div v-if="selectedEmployee.passport_serial">
            <p class="text-gray-500 dark:text-gray-400">Pasport</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedEmployee.passport_serial }}</p>
          </div>
          <div v-if="selectedEmployee.inn">
            <p class="text-gray-500 dark:text-gray-400">INN</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedEmployee.inn }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton :icon="Edit" @click="openEdit(selectedEmployee); showDetailModal = false">Tahrirlash</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff } from 'lucide-vue-next'
import { hrApi } from '@/api'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const toast = useToast()

const data = ref([])
const deptsData = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref(null)
const selectedEmployee = ref(null)
const search = ref('')
const deptFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  first_name: '', last_name: '', phone: '', email: '',
  address: '', passport_serial: '', inn: '',
  department_id: '', position: '',
  hire_date: new Date().toISOString().slice(0, 10),
  salary: '', employment_status: 'active', user_id: null,
})
const form = ref(defaultForm())

const employmentStatusOptions = [
  { value: 'active', label: 'Faol' },
  { value: 'on_leave', label: "Ta'tilda" },
  { value: 'terminated', label: 'Ishdan ketgan' },
]

const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'on_leave', label: "Ta'tilda" },
  { value: 'terminated', label: 'Ishdan ketgan' },
]

const columns = [
  { key: 'full_name', label: 'F.I.Sh.', sortable: true },
  { key: 'department', label: "Bo'lim" },
  { key: 'position', label: 'Lavozim' },
  { key: 'phone', label: 'Telefon' },
  { key: 'salary', label: 'Ish haqi' },
  { key: 'employment_status', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const deptOptions = computed(() => [
  { value: '', label: "Barcha bo'limlar" },
  ...deptsData.value.map(d => ({ value: d.id, label: d.name }))
])
const deptSelectOptions = computed(() =>
  deptsData.value.map(d => ({ value: d.id, label: d.name }))
)

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      `${i.first_name} ${i.last_name}`.toLowerCase().includes(q) ||
      i.phone?.includes(q)
    )
  }
  if (deptFilter.value) result = result.filter(i => i.department_id === deptFilter.value)
  if (statusFilter.value) result = result.filter(i => i.employment_status === statusFilter.value)
  return result
})

function statusVariant(s) {
  const map = { active: 'success', on_leave: 'warning', terminated: 'danger' }
  return map[s] || 'default'
}
function statusLabel(s) {
  const map = { active: 'Faol', on_leave: "Ta'tilda", terminated: 'Ishdan ketgan' }
  return map[s] || s
}
function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}
function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const [empRes, deptRes] = await Promise.all([
      hrApi.getEmployees({ page: page.value, limit: limit.value }),
      hrApi.getDepartments({ limit: 100 }),
    ])
    data.value = empRes.data?.items || empRes.data || []
    total.value = empRes.data?.total || data.value.length
    deptsData.value = deptRes.data?.items || deptRes.data || []
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
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    passport_serial: row.passport_serial || '',
    inn: row.inn || '',
    department_id: row.department_id || '',
    position: row.position || '',
    hire_date: row.hire_date ? row.hire_date.slice(0, 10) : '',
    salary: row.salary || '',
    employment_status: row.employment_status || 'active',
    user_id: row.user_id || null,
  }
  errors.value = {}
  showModal.value = true
}

function openDetail(row) {
  selectedEmployee.value = row
  showDetailModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.first_name) { errors.value.first_name = 'Ism kiritilishi shart'; return }
  if (!form.value.last_name) { errors.value.last_name = 'Familiya kiritilishi shart'; return }
  if (!form.value.phone) { errors.value.phone = 'Telefon kiritilishi shart'; return }
  if (!form.value.department_id) { errors.value.department_id = "Bo'limni tanlang"; return }
  if (!form.value.position) { errors.value.position = 'Lavozim kiritilishi shart'; return }
  if (!form.value.hire_date) { errors.value.hire_date = 'Sanani kiriting'; return }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      salary: form.value.salary ? Number(form.value.salary) : null,
      user_id: form.value.user_id || null,
    }
    if (editingId.value) {
      await hrApi.updateEmployee(editingId.value, payload)
      toast.success('Xodim yangilandi!')
    } else {
      await hrApi.createEmployee(payload)
      toast.success("Xodim qo'shildi!")
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
    await hrApi.updateEmployee(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>