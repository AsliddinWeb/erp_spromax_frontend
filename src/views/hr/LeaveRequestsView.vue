<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ta'til so'rovlari</h3>
      <AppButton @click="openCreate" :icon="Plus">So'rov yuborish</AppButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppSelect v-model="employeeFilter" :options="employeeOptions" placeholder="Xodim" class="w-56" />
      <AppSelect v-model="statusFilter" :options="statusOptions" placeholder="Holat" class="w-44" />
      <AppSelect v-model="typeFilter" :options="leaveTypeOptions" placeholder="Ta'til turi" class="w-44" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #employee="{ value }">
        {{ value ? `${value.first_name} ${value.last_name}` : '—' }}
      </template>

      <template #leave_type="{ value }">
        {{ leaveTypeLabel(value) }}
      </template>

      <template #status="{ value }">
        <AppBadge :variant="statusVariant(value)">
          {{ statusLabel(value) }}
        </AppBadge>
      </template>

      <template #start_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #end_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #days_count="{ value }">
        <span class="font-medium">{{ value }} kun</span>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1" v-if="row.status === 'pending' && hasRole(['superadmin','admin','director','hr_manager'])">
          <AppButton
            size="sm" variant="ghost"
            class="text-success hover:text-success"
            :icon="Check"
            @click.stop="approve(row)"
            title="Tasdiqlash"
          />
          <AppButton
            size="sm" variant="ghost"
            class="text-danger hover:text-danger"
            :icon="X"
            @click.stop="openReject(row)"
            title="Rad etish"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create Modal -->
    <AppModal v-model="showCreateModal" title="Ta'til so'rovi" size="md">
      <form @submit.prevent="save" class="space-y-4">
        <AppSelect
          v-model="form.employee_id"
          label="Xodim"
          required
          :options="employeeSelectOptions"
          :error="errors.employee_id"
        />
        <AppSelect
          v-model="form.leave_type"
          label="Ta'til turi"
          required
          :options="leaveTypeOptions.filter(o => o.value)"
          :error="errors.leave_type"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.start_date" label="Boshlanish sanasi" type="date" required :error="errors.start_date" />
          <AppInput v-model="form.end_date" label="Tugash sanasi" type="date" required :error="errors.end_date" />
        </div>
        <div v-if="daysPreview > 0" class="p-3 rounded-lg bg-primary/10 text-sm text-center">
          <span class="font-semibold text-primary">{{ daysPreview }} kun</span> ta'til so'ralmoqda
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sabab</label>
          <textarea
            v-model="form.reason"
            rows="3"
            placeholder="Ta'til sababi..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Yuborish</AppButton>
      </template>
    </AppModal>

    <!-- Reject Modal -->
    <AppModal v-model="showRejectModal" title="So'rovni rad etish" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Rad etish sababini kiriting:
        </p>
        <div class="space-y-1">
          <textarea
            v-model="rejectReason"
            rows="3"
            placeholder="Sabab..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showRejectModal = false">Bekor qilish</AppButton>
        <AppButton variant="danger" :loading="saving" @click="confirmReject">Rad etish</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal v-model="showDetailModal" title="Ta'til so'rovi tafsilotlari" size="sm">
      <div v-if="selectedRequest" class="space-y-3 text-sm">
        <div class="flex items-center gap-2">
          <AppBadge :variant="statusVariant(selectedRequest.status)">
            {{ statusLabel(selectedRequest.status) }}
          </AppBadge>
          <span class="text-gray-500">{{ leaveTypeLabel(selectedRequest.leave_type) }}</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Xodim</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ selectedRequest.employee?.first_name }} {{ selectedRequest.employee?.last_name }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Davomiyligi</p>
            <p class="font-semibold text-primary">{{ selectedRequest.days_count }} kun</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Boshlanish</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedRequest.start_date) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Tugash</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedRequest.end_date) }}</p>
          </div>
          <div v-if="selectedRequest.reason" class="col-span-2">
            <p class="text-gray-500 dark:text-gray-400">Sabab</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedRequest.reason }}</p>
          </div>
          <div v-if="selectedRequest.approver">
            <p class="text-gray-500 dark:text-gray-400">Ko'rib chiquvchi</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ selectedRequest.approver?.full_name || selectedRequest.approver?.username }}
            </p>
          </div>
        </div>

        <div
          v-if="selectedRequest.status === 'pending' && hasRole(['superadmin','admin','director','hr_manager'])"
          class="flex gap-2 pt-2"
        >
          <AppButton variant="success" class="flex-1" :icon="Check" @click="approve(selectedRequest); showDetailModal = false">
            Tasdiqlash
          </AppButton>
          <AppButton variant="danger" class="flex-1" :icon="X" @click="openReject(selectedRequest); showDetailModal = false">
            Rad etish
          </AppButton>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Check, X } from 'lucide-vue-next'
import { hrApi } from '@/api'
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
const employeesData = ref([])
const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showRejectModal = ref(false)
const selectedRequest = ref(null)
const rejectingId = ref(null)
const rejectReason = ref('')
const employeeFilter = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  employee_id: '',
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  reason: '',
})
const form = ref(defaultForm())

const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: "Ko'rib chiqilmoqda" },
  { value: 'approved', label: 'Tasdiqlangan' },
  { value: 'rejected', label: 'Rad etilgan' },
]

const leaveTypeOptions = [
  { value: '', label: 'Barcha turlar' },
  { value: 'annual', label: 'Yillik ta\'til' },
  { value: 'sick', label: 'Kasallik' },
  { value: 'unpaid', label: 'Haqsiz ta\'til' },
  { value: 'maternity', label: 'Tug\'ruq ta\'tili' },
  { value: 'other', label: 'Boshqa' },
]

const columns = [
  { key: 'employee', label: 'Xodim' },
  { key: 'leave_type', label: 'Tur' },
  { key: 'start_date', label: 'Boshlanish' },
  { key: 'end_date', label: 'Tugash' },
  { key: 'days_count', label: 'Kunlar' },
  { key: 'status', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const employeeOptions = computed(() => [
  { value: '', label: 'Barcha xodimlar' },
  ...employeesData.value.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
])
const employeeSelectOptions = computed(() =>
  employeesData.value.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
)

const daysPreview = computed(() => {
  if (!form.value.start_date || !form.value.end_date) return 0
  const diff = new Date(form.value.end_date) - new Date(form.value.start_date)
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1)
})

const filteredData = computed(() => {
  let result = data.value
  if (employeeFilter.value) result = result.filter(i => i.employee_id === employeeFilter.value)
  if (statusFilter.value) result = result.filter(i => i.status === statusFilter.value)
  if (typeFilter.value) result = result.filter(i => i.leave_type === typeFilter.value)
  return result
})

function statusVariant(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[s] || 'default'
}
function statusLabel(s) {
  const map = { pending: "Ko'rib chiqilmoqda", approved: 'Tasdiqlangan', rejected: 'Rad etilgan' }
  return map[s] || s
}
function leaveTypeLabel(t) {
  const map = {
    annual: "Yillik ta'til", sick: 'Kasallik',
    unpaid: "Haqsiz ta'til", maternity: "Tug'ruq ta'tili", other: 'Boshqa'
  }
  return map[t] || t
}
function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const [reqRes, empRes] = await Promise.all([
      hrApi.getLeaveRequests({ page: page.value, limit: limit.value }),
      hrApi.getEmployees({ limit: 100 }),
    ])
    data.value = reqRes.data?.items || reqRes.data || []
    total.value = reqRes.data?.total || data.value.length
    employeesData.value = empRes.data?.items || empRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.value = defaultForm()
  errors.value = {}
  showCreateModal.value = true
}

function openDetail(row) {
  selectedRequest.value = row
  showDetailModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.employee_id) { errors.value.employee_id = 'Xodimni tanlang'; return }
  if (!form.value.leave_type) { errors.value.leave_type = 'Ta\'til turini tanlang'; return }
  if (!form.value.start_date) { errors.value.start_date = 'Sanani kiriting'; return }
  if (!form.value.end_date) { errors.value.end_date = 'Sanani kiriting'; return }

  saving.value = true
  try {
    await hrApi.createLeaveRequest({
      employee_id: form.value.employee_id,
      leave_type: form.value.leave_type,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      reason: form.value.reason || null,
    })
    toast.success("Ta'til so'rovi yuborildi!")
    showCreateModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function approve(row) {
  try {
    await hrApi.approveLeaveRequest(row.id, { status: 'approved' })
    toast.success("So'rov tasdiqlandi!")
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  }
}

function openReject(row) {
  rejectingId.value = row.id
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  saving.value = true
  try {
    await hrApi.approveLeaveRequest(rejectingId.value, {
      status: 'rejected',
      rejection_reason: rejectReason.value || null,
    })
    toast.success("So'rov rad etildi!")
    showRejectModal.value = false
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