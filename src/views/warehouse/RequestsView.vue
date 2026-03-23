<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Material so'rovlari</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','warehouse_manager','operator','production_manager'])"
        @click="openCreate"
        :icon="Plus"
      >
        So'rov yuborish
      </AppButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Material nomi bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
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
      <template #request_status="{ value }">
        <AppBadge :variant="statusVariant(value)">
          {{ statusLabel(value) }}
        </AppBadge>
      </template>

      <template #request_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <!-- Approve/Reject: only warehouse_manager, admin etc -->
          <template v-if="hasRole(['superadmin','admin','director','warehouse_manager']) && row.request_status === 'pending'">
            <AppButton
              size="sm"
              variant="ghost"
              :icon="CheckCircle"
              class="text-success hover:text-success"
              @click.stop="openApprove(row)"
            />
            <AppButton
              size="sm"
              variant="ghost"
              :icon="XCircle"
              class="text-danger hover:text-danger"
              @click.stop="openReject(row)"
            />
          </template>
          <AppButton
            size="sm"
            variant="ghost"
            :icon="Eye"
            @click.stop="openDetail(row)"
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

    <!-- Pagination -->
    <AppPagination
      :page="page"
      :limit="limit"
      :total="total"
      @change="onPageChange"
    />

    <!-- Create Request Modal -->
    <AppModal
      v-model="showCreateModal"
      title="Yangi material so'rovi"
      size="md"
    >
      <form @submit.prevent="saveCreate" class="space-y-4">
        <AppSelect
          v-model="form.raw_material_id"
          label="Xom ashyo"
          required
          :options="materialOptions"
          :error="errors.raw_material_id"
        />
        <AppInput
          v-model="form.requested_quantity"
          label="So'ralgan miqdor"
          type="number"
          required
          :error="errors.requested_quantity"
          placeholder="0"
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="Nima uchun kerak ekanligi haqida..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveCreate">Yuborish</AppButton>
      </template>
    </AppModal>

    <!-- Approve Modal -->
    <AppModal
      v-model="showApproveModal"
      title="So'rovni tasdiqlash"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium">Material:</span>
          {{ selectedRequest?.raw_material?.name }}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium">So'ralgan miqdor:</span>
          {{ selectedRequest?.requested_quantity }}
        </p>
        <AppInput
          v-model="approveForm.approved_quantity"
          label="Tasdiqlangan miqdor"
          type="number"
          required
          placeholder="So'ralgan miqdor yoki kamroq"
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="approveForm.notes"
            rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showApproveModal = false">Bekor qilish</AppButton>
        <AppButton variant="success" :loading="saving" @click="confirmApprove">Tasdiqlash</AppButton>
      </template>
    </AppModal>

    <!-- Reject Modal -->
    <AppModal
      v-model="showRejectModal"
      title="So'rovni rad etish"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span class="font-medium">Material:</span>
          {{ selectedRequest?.raw_material?.name }}
        </p>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Rad etish sababi <span class="text-danger">*</span></label>
          <textarea
            v-model="rejectReason"
            rows="3"
            placeholder="Nima uchun rad etilmoqda..."
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
    <AppModal
      v-model="showDetailModal"
      title="So'rov tafsilotlari"
      size="md"
    >
      <div v-if="selectedRequest" class="space-y-3">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Material</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedRequest.raw_material?.name }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Holat</p>
            <AppBadge :variant="statusVariant(selectedRequest.request_status)">
              {{ statusLabel(selectedRequest.request_status) }}
            </AppBadge>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">So'ralgan miqdor</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedRequest.requested_quantity }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Tasdiqlangan miqdor</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedRequest.approved_quantity || '-' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">So'rov sanasi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedRequest.request_date) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Tasdiqlangan sana</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedRequest.approval_date) }}</p>
          </div>
        </div>
        <div v-if="selectedRequest.notes">
          <p class="text-gray-500 dark:text-gray-400 text-sm">Izoh</p>
          <p class="text-gray-900 dark:text-white text-sm mt-1">{{ selectedRequest.notes }}</p>
        </div>
        <div v-if="selectedRequest.rejection_reason" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          <p class="text-danger text-sm font-medium">Rad etish sababi</p>
          <p class="text-danger text-sm mt-1">{{ selectedRequest.rejection_reason }}</p>
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
import { Search, Plus, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-vue-next'
import { warehouseApi } from '@/api'
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
const materialsData = ref([])
const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showDetailModal = ref(false)
const selectedRequest = ref(null)
const rejectReason = ref('')
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  raw_material_id: '',
  requested_quantity: '',
  notes: '',
})
const form = ref(defaultForm())
const approveForm = ref({ approved_quantity: '', notes: '' })

const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'approved', label: 'Tasdiqlangan' },
  { value: 'rejected', label: 'Rad etilgan' },
  { value: 'issued', label: 'Berilgan' },
]

const columns = [
  { key: 'raw_material.name', label: 'Material', sortable: true },
  { key: 'requested_quantity', label: "So'ralgan miqdor" },
  { key: 'approved_quantity', label: 'Tasdiqlangan' },
  { key: 'requester.full_name', label: "So'rov yuboruvchi" },
  { key: 'request_status', label: 'Holat' },
  { key: 'request_date', label: 'Sana' },
  { key: 'actions', label: '', width: '100px' },
]

const materialOptions = computed(() =>
  materialsData.value.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))
)

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(item => item.raw_material?.name?.toLowerCase().includes(q))
  }
  if (statusFilter.value) {
    result = result.filter(i => i.request_status === statusFilter.value)
  }
  return result
})

function statusVariant(s) {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', issued: 'info' }
  return map[s] || 'default'
}
function statusLabel(s) {
  const map = { pending: 'Kutilmoqda', approved: 'Tasdiqlangan', rejected: 'Rad etilgan', issued: 'Berilgan' }
  return map[s] || s
}
function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  try {
    const [reqRes, matRes] = await Promise.all([
      warehouseApi.getMaterialRequests({ page: page.value, limit: limit.value }),
      warehouseApi.getRawMaterials({ limit: 100 }),
    ])
    data.value = reqRes.data?.items || reqRes.data || []
    total.value = reqRes.data?.total || data.value.length
    materialsData.value = matRes.data?.items || matRes.data || []
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
  if (!form.value.raw_material_id) { errors.value.raw_material_id = 'Tanlang'; return }
  if (!form.value.requested_quantity) { errors.value.requested_quantity = 'Kiriting'; return }

  saving.value = true
  try {
    await warehouseApi.createMaterialRequest(form.value)
    toast.success("So'rov muvaffaqiyatli yuborildi!")
    showCreateModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openApprove(row) {
  selectedRequest.value = row
  approveForm.value = { approved_quantity: row.requested_quantity, notes: '' }
  showApproveModal.value = true
}

async function confirmApprove() {
  if (!approveForm.value.approved_quantity) {
    toast.error('Miqdorni kiriting')
    return
  }
  saving.value = true
  try {
    await warehouseApi.approveRequest(selectedRequest.value.id, approveForm.value)
    toast.success("So'rov tasdiqlandi!")
    showApproveModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openReject(row) {
  selectedRequest.value = row
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    toast.error('Rad etish sababini kiriting')
    return
  }
  saving.value = true
  try {
    await warehouseApi.rejectRequest(selectedRequest.value.id, { rejection_reason: rejectReason.value })
    toast.success("So'rov rad etildi!")
    showRejectModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openDetail(row) {
  selectedRequest.value = row
  showDetailModal.value = true
}

async function handleDelete(row) {
  const ok = await confirm({
    title: 'O\'chirishni tasdiqlang',
    message: 'Bu material so\'rovini o\'chirmoqchimisiz?',
    confirmText: 'O\'chirish',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await warehouseApi.deleteMaterialRequest(row.id)
    toast.success('So\'rov o\'chirildi!')
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  }
}

function onPageChange(newPage) {
  page.value = newPage
  load()
}

onMounted(load)
</script>