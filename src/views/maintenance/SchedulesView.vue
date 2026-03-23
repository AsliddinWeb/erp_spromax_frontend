<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Texnik xizmat jadvali</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','maintenance'])"
        @click="openCreate"
        :icon="Plus"
      >
        Jadval qo'shish
      </AppButton>
    </div>

    <!-- Upcoming alerts -->
    <div v-if="upcomingData.length" class="rounded-xl border border-warning/30 bg-warning/5 overflow-hidden">
      <div class="px-4 py-3 bg-warning/10 border-b border-warning/20">
        <p class="text-sm font-semibold text-warning flex items-center gap-2">
          <Bell class="w-4 h-4" />
          Yaqin orada rejalashtirilgan (7 kun ichida)
        </p>
      </div>
      <div class="divide-y divide-warning/10 max-h-40 overflow-y-auto">
        <div
          v-for="sch in upcomingData"
          :key="sch.id"
          class="px-4 py-2 flex justify-between items-center text-sm"
        >
          <span class="font-medium text-gray-900 dark:text-white">{{ sch.machine?.name }}</span>
          <div class="flex items-center gap-3">
            <span class="text-gray-500">{{ scheduleTypeLabel(sch.schedule_type) }}</span>
            <span class="text-warning font-semibold">{{ formatDate(sch.next_maintenance_date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <AppInput
        v-model="search"
        placeholder="Mashina nomi bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect v-model="machineFilter" :options="machineOptions" placeholder="Mashina" class="w-48" />
      <AppSelect v-model="typeFilter" :options="scheduleTypeOptions" placeholder="Tur" class="w-44" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #machine="{ value }">
        {{ value?.name || '—' }}
      </template>

      <template #schedule_type="{ value }">
        <AppBadge variant="default">{{ scheduleTypeLabel(value) }}</AppBadge>
      </template>

      <template #next_maintenance_date="{ value }">
        <span :class="isOverdue(value) ? 'text-danger font-semibold' : isUpcoming(value) ? 'text-warning font-medium' : 'text-gray-700 dark:text-gray-300'">
          {{ formatDate(value) }}
          <span v-if="isOverdue(value)" class="text-xs ml-1">(Muddati o'tgan)</span>
          <span v-else-if="isUpcoming(value)" class="text-xs ml-1">(Yaqin)</span>
        </span>
      </template>

      <template #last_maintenance_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #interval_days="{ value }">
        {{ value }} kun
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
      :title="editingId ? 'Jadvalni tahrirlash' : 'Yangi jadval'"
      size="md"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppSelect
          v-model="form.machine_id"
          label="Mashina"
          required
          :options="machineSelectOptions"
          :error="errors.machine_id"
        />
        <div class="grid grid-cols-2 gap-4">
          <AppSelect
            v-model="form.schedule_type"
            label="Xizmat turi"
            required
            :options="scheduleTypeOptions.filter(o => o.value)"
            :error="errors.schedule_type"
          />
          <AppInput
            v-model="form.interval_days"
            label="Interval (kun)"
            type="number"
            required
            :error="errors.interval_days"
            placeholder="30"
          />
        </div>
        <AppInput
          v-model="form.last_maintenance_date"
          label="Oxirgi xizmat sanasi"
          type="date"
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tavsif</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Xizmat tavsifi..."
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
    <AppModal v-model="showDetailModal" title="Jadval tafsilotlari" size="sm">
      <div v-if="selectedSchedule" class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Mashina</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedSchedule.machine?.name || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Tur</p>
            <AppBadge variant="default">{{ scheduleTypeLabel(selectedSchedule.schedule_type) }}</AppBadge>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Interval</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedSchedule.interval_days }} kun</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Keyingi xizmat</p>
            <p class="font-semibold" :class="isOverdue(selectedSchedule.next_maintenance_date) ? 'text-danger' : isUpcoming(selectedSchedule.next_maintenance_date) ? 'text-warning' : 'text-success'">
              {{ formatDate(selectedSchedule.next_maintenance_date) }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Oxirgi xizmat</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedSchedule.last_maintenance_date) }}</p>
          </div>
          <div v-if="selectedSchedule.description" class="col-span-2">
            <p class="text-gray-500 dark:text-gray-400">Tavsif</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedSchedule.description }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','maintenance'])"
          :icon="Edit"
          @click="openEdit(selectedSchedule); showDetailModal = false"
        >
          Tahrirlash
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { todayISO, nowLocalISO, startOfMonthISO, startOfYearISO, formatDate, formatDateTime } from '@/composables/useDate'
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff, Bell } from 'lucide-vue-next'
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
const showModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref(null)
const selectedSchedule = ref(null)
const search = ref('')
const machineFilter = ref('')
const typeFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  machine_id: '', schedule_type: 'preventive',
  description: '', interval_days: '30', last_maintenance_date: '',
})
const form = ref(defaultForm())

const scheduleTypeOptions = [
  { value: '', label: 'Barcha turlar' },
  { value: 'preventive', label: 'Profilaktika' },
  { value: 'inspection', label: 'Tekshiruv' },
  { value: 'lubrication', label: 'Moylaш' },
  { value: 'calibration', label: 'Kalibrlash' },
  { value: 'cleaning', label: 'Tozalash' },
]

const columns = [
  { key: 'machine', label: 'Mashina', sortable: true },
  { key: 'schedule_type', label: 'Tur' },
  { key: 'interval_days', label: 'Interval' },
  { key: 'last_maintenance_date', label: 'Oxirgi' },
  { key: 'next_maintenance_date', label: 'Keyingi' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const machineOptions = computed(() => [
  { value: '', label: 'Barcha mashinalar' },
  ...machinesData.value.map(m => ({ value: m.id, label: m.name }))
])
const machineSelectOptions = computed(() =>
  machinesData.value.map(m => ({ value: m.id, label: m.name }))
)

// 7 kun ichidagi jadvallar
const upcomingData = computed(() => {
  const now = new Date()
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return data.value.filter(s => {
    if (!s.next_maintenance_date || !s.is_active) return false
    const d = new Date(s.next_maintenance_date)
    return d <= soon
  })
})

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.machine?.name?.toLowerCase().includes(q))
  }
  if (machineFilter.value) result = result.filter(i => i.machine_id === machineFilter.value)
  if (typeFilter.value) result = result.filter(i => i.schedule_type === typeFilter.value)
  return result
})

function scheduleTypeLabel(t) {
  const map = {
    preventive: 'Profilaktika', inspection: 'Tekshiruv',
    lubrication: 'Moylaш', calibration: 'Kalibrlash', cleaning: 'Tozalash'
  }
  return map[t] || t
}
function isOverdue(dt) {
  if (!dt) return false
  return new Date(dt) < new Date()
}
function isUpcoming(dt) {
  if (!dt) return false
  const d = new Date(dt)
  const now = new Date()
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return d >= now && d <= soon
}

async function load() {
  loading.value = true
  try {
    const [schRes, machRes] = await Promise.all([
      maintenanceApi.getSchedules({ page: page.value, limit: limit.value }),
      productionApi.getMachines({ limit: 100 }),
    ])
    data.value = schRes.data?.items || schRes.data || []
    total.value = schRes.data?.total || data.value.length
    machinesData.value = machRes.data?.items || machRes.data || []
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
    machine_id: row.machine_id || '',
    schedule_type: row.schedule_type || 'preventive',
    description: row.description || '',
    interval_days: String(row.interval_days || 30),
    last_maintenance_date: row.last_maintenance_date ? row.last_maintenance_date.slice(0, 10) : '',
  }
  errors.value = {}
  showModal.value = true
}

function openDetail(row) {
  selectedSchedule.value = row
  showDetailModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.machine_id) { errors.value.machine_id = 'Mashinani tanlang'; return }
  if (!form.value.interval_days) { errors.value.interval_days = 'Intervalni kiriting'; return }

  saving.value = true
  try {
    const payload = {
      machine_id: form.value.machine_id,
      schedule_type: form.value.schedule_type,
      description: form.value.description || 'Texnik xizmat',
      interval_days: Number(form.value.interval_days),
      last_maintenance_date: form.value.last_maintenance_date || null,
    }
    if (editingId.value) {
      await maintenanceApi.updateSchedule(editingId.value, payload)
      toast.success('Jadval yangilandi!')
    } else {
      await maintenanceApi.createSchedule(payload)
      toast.success("Jadval qo'shildi!")
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
    await maintenanceApi.updateSchedule(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>