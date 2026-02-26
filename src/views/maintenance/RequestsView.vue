<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ta'mir so'rovlari</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','maintenance','production_manager','operator'])"
        @click="openCreate"
        :icon="Plus"
      >
        So'rov yuborish
      </AppButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Kutilmoqda</p>
        <p class="text-xl font-bold text-warning mt-1">{{ stats.pending_requests }}</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jarayonda</p>
        <p class="text-xl font-bold text-info mt-1">{{ stats.in_progress_requests }}</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Bajarilgan</p>
        <p class="text-xl font-bold text-success mt-1">{{ stats.completed_requests }}</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami soatlar</p>
        <p class="text-xl font-bold text-primary mt-1">{{ stats.total_maintenance_hours }}h</p>
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
      <AppSelect v-model="statusFilter" :options="statusOptions" placeholder="Holat" class="w-44" />
      <AppSelect v-model="priorityFilter" :options="priorityOptions" placeholder="Muhimlik" class="w-40" />
      <AppSelect v-model="typeFilter" :options="typeOptions" placeholder="Tur" class="w-44" />
    </div>

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="filteredData"
      :loading="loading"
      @row-click="openDetail"
    >
      <template #machine="{ value }">
        {{ value?.name || '—' }}
      </template>

      <template #status="{ value }">
        <AppBadge :variant="statusVariant(value)">
          {{ statusLabel(value) }}
        </AppBadge>
      </template>

      <template #priority="{ value }">
        <AppBadge :variant="priorityVariant(value)" :class="value === 'urgent' ? 'font-bold' : ''">
          {{ priorityLabel(value) }}
        </AppBadge>
      </template>

      <template #request_type="{ value }">
        {{ typeLabel(value) }}
      </template>

      <template #requested_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="hasRole(['superadmin','admin','director','maintenance'])"
            size="sm" variant="ghost" :icon="Edit"
            @click.stop="openEdit(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create Modal -->
    <AppModal v-model="showCreateModal" title="Yangi ta'mir so'rovi" size="md">
      <form @submit.prevent="saveCreate" class="space-y-4">
        <AppSelect
          v-model="form.machine_id"
          label="Mashina"
          required
          :options="machineOptions"
          :error="errors.machine_id"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppSelect
            v-model="form.request_type"
            label="Ta'mir turi"
            required
            :options="typeOptions.filter(o => o.value)"
            :error="errors.request_type"
          />
          <AppSelect
            v-model="form.priority"
            label="Muhimlik"
            required
            :options="priorityOptions.filter(o => o.value)"
            :error="errors.priority"
          />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tavsif <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Muammo tavsifi..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
          <p v-if="errors.description" class="text-xs text-danger">{{ errors.description }}</p>
        </div>
        <AppInput v-model="form.scheduled_date" label="Rejalashtirilgan sana" type="date" />
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveCreate">Yuborish</AppButton>
      </template>
    </AppModal>

    <!-- Edit Modal -->
    <AppModal v-model="showEditModal" title="So'rovni yangilash" size="md">
      <form @submit.prevent="saveEdit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppSelect
            v-model="editForm.status"
            label="Holat"
            :options="statusOptions.filter(o => o.value)"
          />
          <AppSelect
            v-model="editForm.priority"
            label="Muhimlik"
            :options="priorityOptions.filter(o => o.value)"
          />
        </div>
        <AppSelect
          v-model="editForm.assigned_to"
          label="Texnikga biriktirish"
          :options="technicianOptions"
        />
        <AppInput v-model="editForm.scheduled_date" label="Rejalashtirilgan sana" type="date" />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
          <textarea
            v-model="editForm.description"
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

    <!-- Detail Modal -->
    <AppModal v-model="showDetailModal" title="So'rov tafsilotlari" size="lg">
      <div v-if="selectedRequest" class="space-y-4">
        <!-- Status row -->
        <div class="flex gap-2 flex-wrap">
          <AppBadge :variant="statusVariant(selectedRequest.status)">
            {{ statusLabel(selectedRequest.status) }}
          </AppBadge>
          <AppBadge :variant="priorityVariant(selectedRequest.priority)" :class="selectedRequest.priority === 'urgent' ? 'font-bold' : ''">
            {{ priorityLabel(selectedRequest.priority) }}
          </AppBadge>
          <AppBadge variant="default">{{ typeLabel(selectedRequest.request_type) }}</AppBadge>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Mashina</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedRequest.machine?.name || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Sana</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedRequest.requested_date) }}</p>
          </div>
          <div v-if="selectedRequest.scheduled_date">
            <p class="text-gray-500 dark:text-gray-400">Rejalashtirilgan</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedRequest.scheduled_date) }}</p>
          </div>
          <div v-if="selectedRequest.completed_date">
            <p class="text-gray-500 dark:text-gray-400">Bajarilgan</p>
            <p class="font-medium text-success">{{ formatDate(selectedRequest.completed_date) }}</p>
          </div>
          <div class="col-span-2">
            <p class="text-gray-500 dark:text-gray-400">Tavsif</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedRequest.description }}</p>
          </div>
        </div>

        <!-- Log qo'shish (maintenance rol uchun) -->
        <div v-if="hasRole(['superadmin','admin','maintenance']) && selectedRequest.status !== 'completed'" class="border-t border-gray-200 dark:border-dark-border pt-3">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ish jurnali qo'shish</p>
          <div class="space-y-2">
            <textarea
              v-model="logForm.work_description"
              rows="2"
              placeholder="Bajarilgan ish tavsifi..."
              class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <div class="flex gap-2">
              <AppInput v-model="logForm.hours_spent" type="number" placeholder="Soatlar" class="w-32" />
              <AppButton variant="secondary" :loading="logSaving" @click="addLog" class="flex-1">
                Jurnal qo'shish
              </AppButton>
            </div>
          </div>
        </div>

        <!-- Logs -->
        <div v-if="requestLogs.length" class="border-t border-gray-200 dark:border-dark-border pt-3">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ish jurnali</p>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="log in requestLogs"
              :key="log.id"
              class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700 text-sm"
            >
              <div class="flex justify-between items-start">
                <p class="font-medium text-gray-900 dark:text-white">{{ log.work_description }}</p>
                <span class="text-xs text-gray-500 ml-2 whitespace-nowrap">{{ log.hours_spent }}h</span>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ formatDate(log.log_date) }}</p>
            </div>
          </div>
        </div>

        <!-- Ishlatilgan ehtiyot qismlar -->
        <div v-if="requestSpareParts.length" class="border-t border-gray-200 dark:border-dark-border pt-3">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ishlatilgan ehtiyot qismlar</p>
          <div class="space-y-1">
            <div
              v-for="usage in requestSpareParts"
              :key="usage.id"
              class="flex justify-between items-center text-sm p-2 rounded-lg bg-gray-50 dark:bg-dark-700"
            >
              <span class="text-gray-900 dark:text-white">{{ usage.spare_part?.name }}</span>
              <span class="text-gray-600 dark:text-gray-400 font-medium">
                {{ usage.quantity_used }} {{ usage.spare_part?.unit }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','maintenance']) && selectedRequest?.status !== 'completed'"
          :icon="Edit"
          @click="openEdit(selectedRequest); showDetailModal = false"
        >
          Tahrirlash
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit } from 'lucide-vue-next'
import { maintenanceApi, productionApi } from '@/api'
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
const machinesData = ref([])
const loading = ref(false)
const saving = ref(false)
const logSaving = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref(null)
const selectedRequest = ref(null)
const requestLogs = ref([])
const requestSpareParts = ref([])
const search = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')
const typeFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})
const stats = ref({
  pending_requests: 0, in_progress_requests: 0,
  completed_requests: 0, total_maintenance_hours: 0,
})

const defaultForm = () => ({
  machine_id: '', request_type: 'repair',
  priority: 'medium', description: '', scheduled_date: '',
})
const form = ref(defaultForm())
const editForm = ref({ status: '', priority: '', assigned_to: '', scheduled_date: '', description: '' })
const logForm = ref({ work_description: '', hours_spent: '', notes: '', request_id: '' })

const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'in_progress', label: 'Jarayonda' },
  { value: 'completed', label: 'Bajarildi' },
  { value: 'cancelled', label: 'Bekor qilindi' },
]
const priorityOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'low', label: 'Past' },
  { value: 'medium', label: "O'rta" },
  { value: 'high', label: 'Yuqori' },
  { value: 'urgent', label: 'Shoshilinch' },
]
const typeOptions = [
  { value: '', label: 'Barcha turlar' },
  { value: 'repair', label: 'Ta\'mirlash' },
  { value: 'maintenance', label: 'Texnik xizmat' },
  { value: 'inspection', label: 'Tekshiruv' },
]

const columns = [
  { key: 'machine', label: 'Mashina', sortable: true },
  { key: 'request_type', label: 'Tur' },
  { key: 'priority', label: 'Muhimlik' },
  { key: 'status', label: 'Holat' },
  { key: 'requested_date', label: 'Sana' },
  { key: 'description', label: 'Tavsif' },
  { key: 'actions', label: '', width: '60px' },
]

const machineOptions = computed(() =>
  machinesData.value.map(m => ({ value: m.id, label: m.name }))
)
const technicianOptions = computed(() => [
  { value: '', label: "Biriktirilmagan" },
])

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.description?.toLowerCase().includes(q))
  }
  if (statusFilter.value) result = result.filter(i => i.status === statusFilter.value)
  if (priorityFilter.value) result = result.filter(i => i.priority === priorityFilter.value)
  if (typeFilter.value) result = result.filter(i => i.request_type === typeFilter.value)
  return result
})

function statusVariant(s) {
  const map = { pending: 'warning', in_progress: 'info', completed: 'success', cancelled: 'danger' }
  return map[s] || 'default'
}
function statusLabel(s) {
  const map = { pending: 'Kutilmoqda', in_progress: 'Jarayonda', completed: 'Bajarildi', cancelled: 'Bekor qilindi' }
  return map[s] || s
}
function priorityVariant(p) {
  const map = { low: 'default', medium: 'warning', high: 'danger', urgent: 'danger' }
  return map[p] || 'default'
}
function priorityLabel(p) {
  const map = { low: 'Past', medium: "O'rta", high: 'Yuqori', urgent: 'Shoshilinch' }
  return map[p] || p
}
function typeLabel(t) {
  const map = { corrective: 'Tuzatish', preventive: 'Profilaktika', emergency: 'Favqulodda', inspection: 'Tekshiruv' }
  return map[t] || t
}
function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const [reqRes, machRes, statRes] = await Promise.all([
      maintenanceApi.getRequests({ page: page.value, limit: limit.value }),
      productionApi.getMachines({ limit: 100 }),
      maintenanceApi.getStatistics(),
    ])
    data.value = reqRes.data?.items || reqRes.data || []
    total.value = reqRes.data?.total || data.value.length
    machinesData.value = machRes.data?.items || machRes.data || []
    stats.value = statRes.data || stats.value
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

async function saveCreate() {
  errors.value = {}
  if (!form.value.machine_id) { errors.value.machine_id = 'Mashinani tanlang'; return }
  if (!form.value.description) { errors.value.description = 'Tavsif kiriting'; return }

  saving.value = true
  try {
    await maintenanceApi.createRequest({
        machine_id: form.value.machine_id,
        request_type: form.value.request_type,
        priority: form.value.priority,
        description: form.value.description,
        scheduled_date: form.value.scheduled_date
            ? new Date(form.value.scheduled_date + 'T00:00:00').toISOString()
            : null,
    })
    toast.success("So'rov yuborildi!")
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
    status: row.status || '',
    priority: row.priority || '',
    assigned_to: row.assigned_to || '',
    scheduled_date: row.scheduled_date ? row.scheduled_date.slice(0, 10) : '',
    description: row.description || '',
  }
  showEditModal.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await maintenanceApi.updateRequest(editingId.value, {
      status: editForm.value.status || null,
      priority: editForm.value.priority || null,
      assigned_to: editForm.value.assigned_to || null,
      scheduled_date: editForm.value.scheduled_date || null,
      description: editForm.value.description || null,
    })
    toast.success("So'rov yangilandi!")
    showEditModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function openDetail(row) {
  selectedRequest.value = row
  requestLogs.value = []
  requestSpareParts.value = []
  showDetailModal.value = true
  logForm.value = { work_description: '', hours_spent: '', notes: '', request_id: row.id }

  try {
    const [logsRes, partsRes] = await Promise.all([
      maintenanceApi.getRequestLogs(row.id),
      maintenanceApi.getRequestSpareParts(row.id),
    ])
    requestLogs.value = logsRes.data || []
    requestSpareParts.value = partsRes.data || []
  } catch {
    // silent
  }
}

async function addLog() {
  if (!logForm.value.work_description) {
    toast.error('Tavsif kiriting')
    return
  }
  logSaving.value = true
  try {
    await maintenanceApi.createLog({
      request_id: logForm.value.request_id,
      work_description: logForm.value.work_description,
      hours_spent: logForm.value.hours_spent ? Number(logForm.value.hours_spent) : null,
      notes: logForm.value.notes || null,
    })
    toast.success('Jurnal qo\'shildi!')
    logForm.value.work_description = ''
    logForm.value.hours_spent = ''
    const logsRes = await maintenanceApi.getRequestLogs(logForm.value.request_id)
    requestLogs.value = logsRes.data || []
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    logSaving.value = false
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>