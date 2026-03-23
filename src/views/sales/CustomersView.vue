<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Mijozlar</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','sales_manager'])"
        @click="openCreate" :icon="Plus"
      >
        Qo'shish
      </AppButton>
    </div>

    <!-- Stats top bar -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3 rounded-xl border border-primary/20 bg-primary/5">
        <p class="text-xs text-primary">Jami mijozlar</p>
        <p class="text-2xl font-bold text-primary mt-1">{{ total }}</p>
      </div>
      <div class="p-3 rounded-xl border border-success/20 bg-success/5">
        <p class="text-xs text-success">Faol</p>
        <p class="text-2xl font-bold text-success mt-1">{{ data.filter(c => c.is_active).length }}</p>
      </div>
      <div class="p-3 rounded-xl border border-info/20 bg-info/5">
        <p class="text-xs text-info">Ulgurji</p>
        <p class="text-2xl font-bold text-info mt-1">{{ data.filter(c => c.customer_type === 'wholesale').length }}</p>
      </div>
      <div class="p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-700">
        <p class="text-xs text-gray-500">Jami aylanma</p>
        <p class="text-base font-bold text-gray-700 dark:text-gray-300 mt-1">{{ formatMoney(totalSpent) }} so'm</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <AppInput v-model="search" placeholder="Nomi yoki telefon..." :prefix-icon="Search" class="flex-1 min-w-[200px]" />
      <AppSelect v-model="typeFilter" :options="typeOptions" placeholder="Turi" class="w-44" />
      <AppSelect v-model="statusFilter" :options="statusOptions" placeholder="Holat" class="w-40" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #name="{ value, row }">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">{{ value }}</p>
          <p v-if="row.contact_person" class="text-xs text-gray-400">{{ row.contact_person }}</p>
        </div>
      </template>
      <template #customer_type="{ value }">
        <AppBadge :variant="value === 'wholesale' ? 'info' : 'default'">
          {{ value === 'wholesale' ? 'Ulgurji' : 'Oddiy' }}
        </AppBadge>
      </template>
      <template #total_orders="{ value }">
        <span :class="(value || 0) > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-400'">
          {{ value || 0 }} ta
        </span>
      </template>
      <template #total_spent="{ value }">
        <span :class="(value || 0) > 0 ? 'font-semibold text-primary' : 'text-gray-400'">
          {{ formatMoney(value) }} so'm
        </span>
      </template>
      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">{{ value ? 'Faol' : 'Nofaol' }}</AppBadge>
      </template>
      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="hasRole(['superadmin','admin','director','sales_manager'])"
            size="sm" variant="ghost" :icon="Edit" @click.stop="openEdit(row)"
          />
          <AppButton size="sm" variant="ghost" :icon="BarChart2" @click.stop="openStats(row)" />
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

    <!-- CREATE/EDIT MODAL -->
    <AppModal v-model="showModal" :title="editingId ? 'Mijozni tahrirlash' : 'Yangi mijoz'" size="md">
      <div class="space-y-4">
        <AppInput v-model="form.name" label="Nomi" required :error="errors.name" placeholder="Kompaniya yoki F.I.Sh." />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.phone" label="Telefon" required :error="errors.phone" placeholder="+998901234567" />
          <AppSelect v-model="form.customer_type" label="Turi" required
            :options="[{ value: 'regular', label: 'Oddiy' }, { value: 'wholesale', label: 'Ulgurji' }]"
            :error="errors.customer_type"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.inn" label="INN" placeholder="123456789" />
          <AppInput v-model="form.email" label="Email" type="email" placeholder="info@company.uz" />
        </div>
        <AppInput v-model="form.contact_person" label="Aloqa shaxsi" placeholder="F.I.Sh." />
        <AppInput v-model="form.address" label="Manzil" placeholder="Shahar, ko'cha, uy" />
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- DETAIL MODAL -->
    <AppModal v-model="showDetailModal" :title="selectedCustomer?.name || 'Mijoz'" size="md">
      <div v-if="selectedCustomer" class="space-y-4">
        <div class="flex items-center gap-2 flex-wrap">
          <AppBadge :variant="selectedCustomer.customer_type === 'wholesale' ? 'info' : 'default'">
            {{ selectedCustomer.customer_type === 'wholesale' ? 'Ulgurji' : 'Oddiy' }}
          </AppBadge>
          <AppBadge :variant="selectedCustomer.is_active ? 'success' : 'danger'">
            {{ selectedCustomer.is_active ? 'Faol' : 'Nofaol' }}
          </AppBadge>
        </div>

        <!-- Asosiy ko'rsatkichlar -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl border border-primary/20 bg-primary/5 text-center">
            <p class="text-xs text-primary mb-1">Buyurtmalar</p>
            <p class="text-2xl font-bold text-primary">{{ selectedCustomer.total_orders || 0 }}</p>
            <p class="text-xs text-gray-400">ta</p>
          </div>
          <div class="p-3 rounded-xl border border-success/20 bg-success/5 text-center">
            <p class="text-xs text-success mb-1">Jami xarid</p>
            <p class="text-xl font-bold text-success">{{ formatMoney(selectedCustomer.total_spent) }}</p>
            <p class="text-xs text-gray-400">so'm</p>
          </div>
        </div>

        <!-- Kontakt ma'lumotlar -->
        <div class="space-y-2 text-sm">
          <div v-if="selectedCustomer.phone" class="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-dark-border">
            <Phone class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span class="text-gray-500 w-24 flex-shrink-0">Telefon</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.phone }}</span>
          </div>
          <div v-if="selectedCustomer.email" class="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-dark-border">
            <Mail class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span class="text-gray-500 w-24 flex-shrink-0">Email</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.email }}</span>
          </div>
          <div v-if="selectedCustomer.contact_person" class="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-dark-border">
            <User class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span class="text-gray-500 w-24 flex-shrink-0">Aloqa shaxsi</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.contact_person }}</span>
          </div>
          <div v-if="selectedCustomer.inn" class="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-dark-border">
            <FileText class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span class="text-gray-500 w-24 flex-shrink-0">INN</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.inn }}</span>
          </div>
          <div v-if="selectedCustomer.address" class="flex items-start gap-2 py-1.5">
            <MapPin class="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <span class="text-gray-500 w-24 flex-shrink-0">Manzil</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.address }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton size="sm" variant="ghost-primary" :icon="BarChart2" @click="openStats(selectedCustomer); showDetailModal = false">
          Statistika
        </AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','sales_manager'])"
          :icon="Edit"
          @click="openEdit(selectedCustomer); showDetailModal = false"
        >
          Tahrirlash
        </AppButton>
      </template>
    </AppModal>

    <!-- STATS MODAL -->
    <AppModal v-model="showStatsModal" :title="selectedCustomer?.name + ' — statistika'" size="md">
      <div v-if="statsLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <div v-else-if="customerStats" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl border border-primary/20 bg-primary/5 text-center">
            <p class="text-xs text-primary mb-1">Jami buyurtmalar</p>
            <p class="text-2xl font-bold text-primary">{{ customerStats.total_orders }}</p>
            <p class="text-xs text-gray-400">ta</p>
          </div>
          <div class="p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-700 text-center">
            <p class="text-xs text-gray-500 mb-1">Jami xarid</p>
            <p class="text-xl font-bold text-gray-800 dark:text-white">{{ formatMoney(customerStats.total_spent) }}</p>
            <p class="text-xs text-gray-400">so'm</p>
          </div>
          <div class="p-3 rounded-xl border border-success/20 bg-success/5 text-center">
            <p class="text-xs text-success mb-1">To'langan</p>
            <p class="text-xl font-bold text-success">{{ formatMoney(customerStats.total_paid) }}</p>
            <p class="text-xs text-gray-400">so'm</p>
          </div>
          <div class="p-3 rounded-xl border border-danger/20 bg-danger/5 text-center">
            <p class="text-xs text-danger mb-1">Qarzdorlik</p>
            <p class="text-xl font-bold text-danger">{{ formatMoney(customerStats.total_unpaid) }}</p>
            <p class="text-xs text-gray-400">so'm</p>
          </div>
        </div>

        <!-- To'lov foizi progress bar -->
        <div v-if="customerStats.total_spent > 0">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>To'lov holati</span>
            <span>{{ paymentPercent }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="paymentPercent >= 100 ? 'bg-success' : paymentPercent >= 50 ? 'bg-warning' : 'bg-danger'"
              :style="`width: ${paymentPercent}%`"
            ></div>
          </div>
        </div>

        <div v-if="customerStats.last_order_date" class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Clock class="w-4 h-4" />
          Oxirgi buyurtma: <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatDate(customerStats.last_order_date) }}</span>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showStatsModal = false">Yopish</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff, BarChart2, Phone, Mail, User, MapPin, FileText, Clock } from 'lucide-vue-next'
import { salesApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/composables/useDate'
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
const statsLoading = ref(false)
const showModal = ref(false)
const showDetailModal = ref(false)
const showStatsModal = ref(false)
const editingId = ref(null)
const selectedCustomer = ref(null)
const customerStats = ref(null)
const search = ref('')
const typeFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({
  name: '', phone: '', email: '', inn: '',
  contact_person: '', address: '', customer_type: 'regular',
})
const form = ref(defaultForm())

const typeOptions = [
  { value: '', label: 'Barcha turlar' },
  { value: 'regular', label: 'Oddiy' },
  { value: 'wholesale', label: 'Ulgurji' },
]
const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
]
const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'phone', label: 'Telefon' },
  { key: 'customer_type', label: 'Turi' },
  { key: 'total_orders', label: 'Buyurtmalar' },
  { key: 'total_spent', label: 'Jami xarid' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '110px' },
]

const totalSpent = computed(() =>
  data.value.reduce((s, c) => s + parseFloat(c.total_spent || 0), 0)
)
const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      i.name?.toLowerCase().includes(q) ||
      i.phone?.toLowerCase().includes(q) ||
      i.contact_person?.toLowerCase().includes(q)
    )
  }
  if (typeFilter.value) result = result.filter(i => i.customer_type === typeFilter.value)
  if (statusFilter.value === 'active') result = result.filter(i => i.is_active)
  if (statusFilter.value === 'inactive') result = result.filter(i => !i.is_active)
  return result
})
const paymentPercent = computed(() => {
  if (!customerStats.value?.total_spent || customerStats.value.total_spent <= 0) return 0
  return Math.min(100, Math.round((customerStats.value.total_paid / customerStats.value.total_spent) * 100))
})

function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}

async function load() {
  loading.value = true
  try {
    const { data: res } = await salesApi.getCustomers({ page: page.value, limit: limit.value })
    data.value = res.items || res
    total.value = res.total || data.value.length
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null; form.value = defaultForm(); errors.value = {}; showModal.value = true
}
function openEdit(row) {
  editingId.value = row.id
  form.value = {
    name: row.name || '', phone: row.phone || '', email: row.email || '',
    inn: row.inn || '', contact_person: row.contact_person || '',
    address: row.address || '', customer_type: row.customer_type || 'regular',
  }
  errors.value = {}; showModal.value = true
}
function openDetail(row) {
  selectedCustomer.value = row; showDetailModal.value = true
}
async function openStats(row) {
  selectedCustomer.value = row; customerStats.value = null; showStatsModal.value = true
  statsLoading.value = true
  try {
    const { data: res } = await salesApi.getCustomerStatistics(row.id)
    customerStats.value = res
  } catch {
    toast.error('Statistika yuklanmadi')
  } finally {
    statsLoading.value = false
  }
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.phone) { errors.value.phone = 'Telefon kiritilishi shart'; return }
  if (!form.value.customer_type) { errors.value.customer_type = 'Turni tanlang'; return }
  saving.value = true
  try {
    if (editingId.value) {
      await salesApi.updateCustomer(editingId.value, form.value)
      toast.success('Mijoz yangilandi!')
    } else {
      await salesApi.createCustomer(form.value)
      toast.success("Mijoz qo'shildi!")
    }
    showModal.value = false; load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row) {
  try {
    await salesApi.updateCustomer(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>