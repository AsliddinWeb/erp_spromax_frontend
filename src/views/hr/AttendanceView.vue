<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Davomat</h3>
      <AppButton @click="openCreate" :icon="Plus">Davomat qo'shish</AppButton>
    </div>

    <!-- Bugungi davomat -->
    <div class="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
      <div class="px-4 py-3 bg-primary/5 dark:bg-primary/10 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <CalendarCheck class="w-4 h-4 text-primary" />
          Bugungi davomat
        </h4>
        <div class="flex gap-2 text-xs">
          <span class="px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
            Kelgan: {{ todayStats.present }}
          </span>
          <span class="px-2 py-0.5 rounded-full bg-danger/10 text-danger font-medium">
            Kelmagan: {{ todayStats.absent }}
          </span>
          <span class="px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">
            Kechikkan: {{ todayStats.late }}
          </span>
        </div>
      </div>
      <div v-if="todayLoading" class="flex justify-center py-6">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
      <div v-else-if="todayData.length" class="divide-y divide-gray-100 dark:divide-dark-border max-h-48 overflow-y-auto">
        <div v-for="att in todayData" :key="att.id" class="px-4 py-2 flex items-center justify-between">
          <span class="text-sm text-gray-900 dark:text-white font-medium">
            {{ att.employee?.first_name }} {{ att.employee?.last_name }}
          </span>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">
              {{ att.check_in_time ? att.check_in_time.slice(11, 16) : '—' }}
              <span v-if="att.check_out_time"> – {{ att.check_out_time.slice(11, 16) }}</span>
            </span>
            <AppBadge :variant="attendanceVariant(att.status)" size="sm">
              {{ attendanceLabel(att.status) }}
            </AppBadge>
          </div>
        </div>
      </div>
      <div v-else class="px-4 py-6 text-center text-sm text-gray-400">
        Bugungi davomat yo'q
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <AppSelect v-model="employeeFilter" :options="employeeOptions" placeholder="Xodim" class="w-56" />
      <AppSelect v-model="statusFilter" :options="attendanceStatusOptions" placeholder="Holat" class="w-44" />
      <AppInput v-model="dateFrom" type="date" class="w-40" />
      <AppInput v-model="dateTo" type="date" class="w-40" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading">
      <template #employee="{ value }">
        {{ value ? `${value.first_name} ${value.last_name}` : '—' }}
      </template>

      <template #status="{ value }">
        <AppBadge :variant="attendanceVariant(value)">
          {{ attendanceLabel(value) }}
        </AppBadge>
      </template>

      <template #attendance_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #check_in_time="{ value }">
        {{ value ? value.slice(11, 16) : '—' }}
      </template>

      <template #check_out_time="{ value }">
        {{ value ? value.slice(11, 16) : '—' }}
      </template>

      <template #actions="{ row }">
        <AppButton size="sm" variant="ghost" :icon="Edit" @click.stop="openEdit(row)" />
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create Modal -->
    <AppModal v-model="showCreateModal" title="Davomat qo'shish" size="md">
      <form @submit.prevent="saveCreate" class="space-y-4">
        <AppSelect
          v-model="form.employee_id"
          label="Xodim"
          required
          :options="employeeSelectOptions"
          :error="errors.employee_id"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.attendance_date" label="Sana" type="date" required :error="errors.attendance_date" />
          <AppSelect
            v-model="form.status"
            label="Holat"
            required
            :options="attendanceStatusOptions.filter(o => o.value)"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.check_in_time" label="Kelish vaqti" type="time" />
          <AppInput v-model="form.check_out_time" label="Ketish vaqti" type="time" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveCreate">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Edit Modal -->
    <AppModal v-model="showEditModal" title="Davomatni tahrirlash" size="md">
      <form @submit.prevent="saveEdit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="editForm.check_in_time" label="Kelish vaqti" type="time" />
          <AppInput v-model="editForm.check_out_time" label="Ketish vaqti" type="time" />
        </div>
        <AppSelect
          v-model="editForm.status"
          label="Holat"
          :options="attendanceStatusOptions.filter(o => o.value)"
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="editForm.notes"
            rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showEditModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveEdit">Saqlash</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { todayISO, nowLocalISO, startOfMonthISO, startOfYearISO, formatDate, formatDateTime } from '@/composables/useDate'
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, CalendarCheck } from 'lucide-vue-next'
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
const todayData = ref([])
const employeesData = ref([])
const loading = ref(false)
const todayLoading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingId = ref(null)
const employeeFilter = ref('')
const statusFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  employee_id: '',
  attendance_date: todayISO(),
  status: 'present',
  check_in_time: '',
  check_out_time: '',
  notes: '',
})
const form = ref(defaultForm())
const editForm = ref({ check_in_time: '', check_out_time: '', status: '', notes: '' })

const attendanceStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'present', label: 'Kelgan' },
  { value: 'absent', label: 'Kelmagan' },
  { value: 'late', label: 'Kechikkan' },
  { value: 'half_day', label: 'Yarim kun' },
]

const columns = [
  { key: 'attendance_date', label: 'Sana', sortable: true },
  { key: 'employee', label: 'Xodim' },
  { key: 'status', label: 'Holat' },
  { key: 'check_in_time', label: 'Kelish' },
  { key: 'check_out_time', label: 'Ketish' },
  { key: 'notes', label: 'Izoh' },
  { key: 'actions', label: '', width: '60px' },
]

const employeeOptions = computed(() => [
  { value: '', label: 'Barcha xodimlar' },
  ...employeesData.value.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
])
const employeeSelectOptions = computed(() =>
  employeesData.value.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
)

const todayStats = computed(() => ({
  present: todayData.value.filter(a => a.status === 'present').length,
  absent: todayData.value.filter(a => a.status === 'absent').length,
  late: todayData.value.filter(a => a.status === 'late').length,
}))

const filteredData = computed(() => {
  let result = data.value
  if (employeeFilter.value) result = result.filter(i => i.employee_id === employeeFilter.value)
  if (statusFilter.value) result = result.filter(i => i.status === statusFilter.value)
  if (dateFrom.value) result = result.filter(i => i.attendance_date >= dateFrom.value)
  if (dateTo.value) result = result.filter(i => i.attendance_date <= dateTo.value)
  return result
})

function attendanceVariant(s) {
  const map = { present: 'success', absent: 'danger', late: 'warning', half_day: 'info' }
  return map[s] || 'default'
}
function attendanceLabel(s) {
  const map = { present: 'Kelgan', absent: 'Kelmagan', late: 'Kechikkan', half_day: 'Yarim kun' }
  return map[s] || s
}

async function load() {
  loading.value = true
  todayLoading.value = true
  try {
    const [attRes, empRes, todayRes] = await Promise.all([
      hrApi.getAttendances({ page: page.value, limit: limit.value }),
      hrApi.getEmployees({ limit: 100 }),
      hrApi.getTodayAttendance(),
    ])
    data.value = attRes.data?.items || attRes.data || []
    total.value = attRes.data?.total || data.value.length
    employeesData.value = empRes.data?.items || empRes.data || []
    todayData.value = todayRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
    todayLoading.value = false
  }
}

function openCreate() {
  form.value = defaultForm()
  errors.value = {}
  showCreateModal.value = true
}

async function saveCreate() {
  errors.value = {}
  if (!form.value.employee_id) { errors.value.employee_id = 'Xodimni tanlang'; return }
  if (!form.value.attendance_date) { errors.value.attendance_date = 'Sanani kiriting'; return }

  saving.value = true
  try {
    const payload = {
      employee_id: form.value.employee_id,
      attendance_date: form.value.attendance_date,
      status: form.value.status,
      check_in_time: form.value.check_in_time
        ? `${form.value.attendance_date}T${form.value.check_in_time}:00`
        : null,
      check_out_time: form.value.check_out_time
        ? `${form.value.attendance_date}T${form.value.check_out_time}:00`
        : null,
      notes: form.value.notes || null,
    }
    await hrApi.createAttendance(payload)
    toast.success('Davomat qo\'shildi!')
    showCreateModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openEdit(row) {
  editingId.value = row.id
  editForm.value = {
    check_in_time: row.check_in_time ? row.check_in_time.slice(11, 16) : '',
    check_out_time: row.check_out_time ? row.check_out_time.slice(11, 16) : '',
    status: row.status || '',
    notes: row.notes || '',
  }
  showEditModal.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    const row = data.value.find(r => r.id === editingId.value)
    const date = row?.attendance_date || todayISO()
    await hrApi.updateAttendance(editingId.value, {
      status: editForm.value.status || null,
      check_in_time: editForm.value.check_in_time ? `${date}T${editForm.value.check_in_time}:00` : null,
      check_out_time: editForm.value.check_out_time ? `${date}T${editForm.value.check_out_time}:00` : null,
      notes: editForm.value.notes || null,
    })
    toast.success('Davomat yangilandi!')
    showEditModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>