<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Smenalar</h3>
      <div class="flex gap-2">
        <!-- Operator faqat o'z smenalarini ko'radi -->
        <AppButton
          v-if="isOperator"
          :variant="showMyOnly ? 'primary' : 'secondary'"
          :icon="User"
          @click="showMyOnly = !showMyOnly"
        >
          Mening smenalarim
        </AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','production_manager','operator'])"
          @click="openCreate"
          :icon="Plus"
        >
          Smena boshlash
        </AppButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppSelect
        v-model="lineFilter"
        :options="lineOptions"
        placeholder="Liniya"
        class="w-48"
      />
      <AppSelect
        v-model="statusFilter"
        :options="shiftStatusOptions"
        placeholder="Holat"
        class="w-44"
      />
    </div>

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="filteredData"
      :loading="loading"
      @row-click="openDetail"
    >
      <template #status="{ value }">
        <AppBadge :variant="shiftStatusVariant(value)">
          {{ shiftStatusLabel(value) }}
        </AppBadge>
      </template>

      <template #production_line="{ value }">
        {{ value?.name || '—' }}
      </template>

      <template #operator="{ value }">
        {{ value?.full_name || value?.username || '—' }}
      </template>

      <template #start_time="{ value }">
        {{ formatDateTime(value) }}
      </template>

      <template #end_time="{ value }">
        {{ value ? formatDateTime(value) : '—' }}
      </template>

      <template #duration="{ row }">
        {{ calcDuration(row) }}
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="canComplete(row)"
            size="sm"
            variant="success"
            :icon="CheckSquare"
            @click.stop="openComplete(row)"
          >
            Yakunlash
          </AppButton>
          <AppButton
            size="sm" variant="ghost" :icon="Eye"
            @click.stop="openDetail(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create Shift Modal -->
    <AppModal
      v-model="showCreateModal"
      title="Yangi smena boshlash"
      size="md"
    >
      <form @submit.prevent="saveCreate" class="space-y-4">
        <AppSelect
          v-model="form.production_line_id"
          label="Ishlab chiqarish liniyasi"
          required
          :options="lineSelectOptions"
          :error="errors.production_line_id"
        />
        <AppInput
          v-model="form.start_time"
          label="Boshlanish vaqti"
          type="datetime-local"
          required
          :error="errors.start_time"
        />
        <!-- Mashinalar tanlash -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mashinalar <span class="text-gray-400 font-normal">(ixtiyoriy)</span>
          </label>
          <div class="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-dark-border p-3">
            <label
              v-for="machine in availableMachines"
              :key="machine.id"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="machine.id"
                v-model="form.machine_ids"
                class="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ machine.name }}
                <span class="text-xs text-gray-400 ml-1">{{ machine.production_line?.name }}</span>
              </span>
            </label>
            <p v-if="!availableMachines.length" class="text-sm text-gray-400">
              Liniyani tanlang
            </p>
          </div>
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Qo'shimcha ma'lumot..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveCreate">Boshlash</AppButton>
      </template>
    </AppModal>

    <!-- Complete Shift Modal -->
    <AppModal
      v-model="showCompleteModal"
      title="Smenani yakunlash"
      size="md"
    >
      <div v-if="selectedShift" class="space-y-4">
        <!-- Shift info -->
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700 text-sm space-y-1">
          <p><span class="text-gray-500">Liniya:</span> <span class="font-medium text-gray-900 dark:text-white">{{ selectedShift.production_line?.name }}</span></p>
          <p><span class="text-gray-500">Boshlangan:</span> <span class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(selectedShift.start_time) }}</span></p>
        </div>

        <AppInput
          v-model="completeForm.end_time"
          label="Tugash vaqti"
          type="datetime-local"
          required
        />

        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Smena yakuniy hisoboti</label>
          <textarea
            v-model="completeForm.notes"
            rows="3"
            placeholder="Smena davomida nima qilindi, natijalar..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showCompleteModal = false">Bekor qilish</AppButton>
        <AppButton variant="success" :loading="saving" @click="confirmComplete">Yakunlash</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal
      v-model="showDetailModal"
      title="Smena tafsilotlari"
      size="lg"
    >
      <div v-if="selectedShift" class="space-y-4">
        <!-- Status + Info -->
        <div class="flex items-center justify-between">
          <AppBadge :variant="shiftStatusVariant(selectedShift.status)" class="text-sm">
            {{ shiftStatusLabel(selectedShift.status) }}
          </AppBadge>
          <span class="text-sm text-gray-500">{{ calcDuration(selectedShift) }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Liniya</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedShift.production_line?.name || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Operator</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedShift.operator?.full_name || selectedShift.operator?.username || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Boshlanish</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDateTime(selectedShift.start_time) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Tugash</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedShift.end_time ? formatDateTime(selectedShift.end_time) : '—' }}</p>
          </div>
        </div>

        <!-- Machines -->
        <div v-if="selectedShift.machines?.length">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Mashinalar</p>
          <div class="flex flex-wrap gap-2">
            <AppBadge
              v-for="m in selectedShift.machines"
              :key="m.id"
              variant="default"
            >
              {{ m.name }}
            </AppBadge>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="selectedShift.notes">
          <p class="text-sm text-gray-500 dark:text-gray-400">Izoh</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ selectedShift.notes }}</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="canComplete(selectedShift)"
          variant="success"
          :icon="CheckSquare"
          @click="openComplete(selectedShift); showDetailModal = false"
        >
          Yakunlash
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, Eye, CheckSquare, User } from 'lucide-vue-next'
import { productionApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()
const authStore = useAuthStore()

const data = ref([])
const linesData = ref([])
const machinesData = ref([])
const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const showCompleteModal = ref(false)
const showDetailModal = ref(false)
const selectedShift = ref(null)
const showMyOnly = ref(false)
const lineFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  production_line_id: '',
  start_time: new Date().toISOString().slice(0, 16),
  machine_ids: [],
  notes: '',
})
const form = ref(defaultForm())
const completeForm = ref({ end_time: new Date().toISOString().slice(0, 16), notes: '' })

const isOperator = computed(() => hasRole(['operator']) && !hasRole(['superadmin','admin','director','production_manager']))

const shiftStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'completed', label: 'Yakunlangan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
]

const columns = [
  { key: 'production_line', label: 'Liniya', sortable: true },
  { key: 'operator', label: 'Operator' },
  { key: 'start_time', label: 'Boshlanish' },
  { key: 'end_time', label: 'Tugash' },
  { key: 'duration', label: 'Davomiyligi' },
  { key: 'status', label: 'Holat' },
  { key: 'actions', label: '', width: '140px' },
]

const lineOptions = computed(() => [
  { value: '', label: 'Barcha liniyalar' },
  ...linesData.value.map(l => ({ value: l.id, label: l.name }))
])
const lineSelectOptions = computed(() =>
  linesData.value.map(l => ({ value: l.id, label: l.name }))
)

const availableMachines = computed(() => {
  if (!form.value.production_line_id) return []
  return machinesData.value.filter(m =>
    m.production_line_id === form.value.production_line_id && m.status === 'active'
  )
})

// Clear machine_ids when line changes
watch(() => form.value.production_line_id, () => {
  form.value.machine_ids = []
})

const filteredData = computed(() => {
  let result = data.value
  if (lineFilter.value) result = result.filter(i => i.production_line_id === lineFilter.value)
  if (statusFilter.value) result = result.filter(i => i.status === statusFilter.value)
  return result
})

function shiftStatusVariant(s) {
  const map = { active: 'success', completed: 'info', cancelled: 'danger' }
  return map[s] || 'default'
}
function shiftStatusLabel(s) {
  const map = { active: 'Faol', completed: 'Yakunlangan', cancelled: 'Bekor qilingan' }
  return map[s] || s
}

function formatDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function calcDuration(row) {
  if (!row?.start_time) return '—'
  const start = new Date(row.start_time)
  const end = row.end_time ? new Date(row.end_time) : new Date()
  const mins = Math.round((end - start) / 60000)
  if (mins < 60) return `${mins} daqiqa`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} soat ${m} daqiqa` : `${h} soat`
}

function canComplete(row) {
  if (!row || row?.status !== 'active') return false
  if (hasRole(['superadmin','admin','director','production_manager'])) return true
  // Operator faqat o'z smenasini yakunlay oladi
  if (hasRole(['operator']) && row.operator_id === authStore.user?.id) return true
  return false
}

async function load() {
  loading.value = true
  try {
    const endpoint = (showMyOnly.value || isOperator.value)
      ? productionApi.getMyShifts({ page: page.value, limit: limit.value })
      : productionApi.getShifts({ page: page.value, limit: limit.value })

    const [shiftRes, lineRes, machRes] = await Promise.all([
      endpoint,
      productionApi.getLines({ limit: 100 }),
      productionApi.getMachines({ limit: 100 }),
    ])
    data.value = shiftRes.data?.items || shiftRes.data || []
    total.value = shiftRes.data?.total || data.value.length
    linesData.value = lineRes.data?.items || lineRes.data || []
    machinesData.value = machRes.data?.items || machRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

watch(showMyOnly, () => { page.value = 1; load() })

function openCreate() {
  form.value = defaultForm()
  errors.value = {}
  showCreateModal.value = true
}

async function saveCreate() {
  errors.value = {}
  if (!form.value.production_line_id) { errors.value.production_line_id = 'Liniyani tanlang'; return }
  if (!form.value.start_time) { errors.value.start_time = 'Vaqtni kiriting'; return }

  saving.value = true
  try {
    const payload = {
      ...form.value,
      start_time: new Date(form.value.start_time).toISOString(),
    }
    await productionApi.createShift(payload)
    toast.success('Smena boshlandi!')
    showCreateModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openComplete(row) {
  selectedShift.value = row
  completeForm.value = {
    end_time: new Date().toISOString().slice(0, 16),
    notes: '',
  }
  showCompleteModal.value = true
}

async function confirmComplete() {
  if (!completeForm.value.end_time) {
    toast.error('Tugash vaqtini kiriting')
    return
  }
  saving.value = true
  try {
    const payload = {
      end_time: new Date(completeForm.value.end_time).toISOString(),
    }
    if (completeForm.value.notes?.trim()) {
      payload.notes = completeForm.value.notes
    }

    await productionApi.completeShift(selectedShift.value.id, {
      complete_data: {
        end_time: new Date(completeForm.value.end_time).toISOString(),
        notes: completeForm.value.notes?.trim() || null,
      }
    })
    toast.success('Smena muvaffaqiyatli yakunlandi!')
    showCompleteModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openDetail(row) {
  selectedShift.value = row
  showDetailModal.value = true
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>