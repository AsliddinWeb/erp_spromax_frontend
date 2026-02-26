<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Mijozlar</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','sales_manager'])"
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
        v-model="typeFilter"
        :options="typeOptions"
        placeholder="Turi"
        class="w-44"
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
      @row-click="openDetail"
    >
      <template #customer_type="{ value }">
        <AppBadge :variant="value === 'wholesale' ? 'info' : 'default'">
          {{ value === 'wholesale' ? 'Ulgurji' : 'Oddiy' }}
        </AppBadge>
      </template>

      <template #total_orders="{ value }">
        {{ value || 0 }} ta
      </template>

      <template #total_spent="{ value }">
        <span class="font-medium">{{ formatMoney(value) }} so'm</span>
      </template>

      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="hasRole(['superadmin','admin','director','sales_manager'])"
            size="sm" variant="ghost" :icon="Edit"
            @click.stop="openEdit(row)"
          />
          <AppButton
            size="sm" variant="ghost" :icon="BarChart2"
            @click.stop="openStats(row)"
          />
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

    <!-- Create/Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Mijozni tahrirlash' : 'Yangi mijoz'"
      size="md"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Nomi"
          required
          :error="errors.name"
          placeholder="Kompaniya yoki F.I.Sh."
        />
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.phone"
            label="Telefon"
            required
            :error="errors.phone"
            placeholder="+998901234567"
          />
          <AppSelect
            v-model="form.customer_type"
            label="Turi"
            required
            :options="[{ value: 'regular', label: 'Oddiy' }, { value: 'wholesale', label: 'Ulgurji' }]"
            :error="errors.customer_type"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.inn"
            label="INN"
            placeholder="123456789"
          />
          <AppInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="info@company.uz"
          />
        </div>
        <AppInput
          v-model="form.contact_person"
          label="Aloqa shaxsi"
          placeholder="F.I.Sh."
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

    <!-- Stats Modal -->
    <AppModal
      v-model="showStatsModal"
      title="Mijoz statistikasi"
      size="md"
    >
      <div v-if="statsLoading" class="flex justify-center py-8">
        <AppSpinner size="md" />
      </div>
      <div v-else-if="customerStats" class="space-y-4">
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ customerStats.customer_name }}</p>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">Jami buyurtmalar</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">{{ customerStats.total_orders }} ta</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">Jami xarid</p>
            <p class="text-xl font-bold text-primary mt-1">{{ formatMoney(customerStats.total_spent) }} so'm</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">To'langan</p>
            <p class="text-xl font-bold text-success mt-1">{{ formatMoney(customerStats.total_paid) }} so'm</p>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">Qarzdorlik</p>
            <p class="text-xl font-bold text-danger mt-1">{{ formatMoney(customerStats.total_unpaid) }} so'm</p>
          </div>
        </div>

        <div v-if="customerStats.last_order_date" class="text-sm text-gray-500 dark:text-gray-400">
          Oxirgi buyurtma: <span class="font-medium text-gray-700 dark:text-gray-300">{{ formatDate(customerStats.last_order_date) }}</span>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showStatsModal = false">Yopish</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal
      v-model="showDetailModal"
      title="Mijoz ma'lumotlari"
      size="md"
    >
      <div v-if="selectedCustomer" class="space-y-3 text-sm">
        <div class="flex items-center gap-2">
          <AppBadge :variant="selectedCustomer.customer_type === 'wholesale' ? 'info' : 'default'">
            {{ selectedCustomer.customer_type === 'wholesale' ? 'Ulgurji' : 'Oddiy' }}
          </AppBadge>
          <AppBadge :variant="selectedCustomer.is_active ? 'success' : 'danger'">
            {{ selectedCustomer.is_active ? 'Faol' : 'Nofaol' }}
          </AppBadge>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Nomi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.name }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Telefon</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.phone }}</p>
          </div>
          <div v-if="selectedCustomer.inn">
            <p class="text-gray-500 dark:text-gray-400">INN</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.inn }}</p>
          </div>
          <div v-if="selectedCustomer.email">
            <p class="text-gray-500 dark:text-gray-400">Email</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.email }}</p>
          </div>
          <div v-if="selectedCustomer.contact_person">
            <p class="text-gray-500 dark:text-gray-400">Aloqa shaxsi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.contact_person }}</p>
          </div>
          <div v-if="selectedCustomer.address">
            <p class="text-gray-500 dark:text-gray-400">Manzil</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.address }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Jami buyurtmalar</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer.total_orders || 0 }} ta</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Jami xarid</p>
            <p class="font-medium text-primary">{{ formatMoney(selectedCustomer.total_spent) }} so'm</p>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','sales_manager'])"
          :icon="Edit"
          @click="openEdit(selectedCustomer); showDetailModal = false"
        >
          Tahrirlash
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff, BarChart2 } from 'lucide-vue-next'
import { salesApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()

const data = ref([])
const loading = ref(false)
const saving = ref(false)
const statsLoading = ref(false)
const showModal = ref(false)
const showStatsModal = ref(false)
const showDetailModal = ref(false)
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

function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}
function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    email: row.email || '',
    inn: row.inn || '',
    contact_person: row.contact_person || '',
    address: row.address || '',
    customer_type: row.customer_type || 'regular',
  }
  errors.value = {}
  showModal.value = true
}

function openDetail(row) {
  selectedCustomer.value = row
  showDetailModal.value = true
}

async function openStats(row) {
  selectedCustomer.value = row
  customerStats.value = null
  showStatsModal.value = true
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