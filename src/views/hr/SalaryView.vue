<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ish haqi to'lovlari</h3>
      <div class="flex gap-2">
        <AppButton variant="primary" :icon="Calculator" @click="openBatchModal">Oylik hisoblash va to'lash</AppButton>
        <AppButton variant="secondary" :icon="Plus" @click="openCreate">Yakka to'lov</AppButton>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <AppSelect v-model="employeeFilter" :options="employeeOptions" placeholder="Xodim" class="w-56" />
      <AppSelect v-model="methodFilter" :options="methodOptions" placeholder="To'lov usuli" class="w-44" />
      <AppInput v-model="dateFrom" type="date" class="w-40" />
      <AppInput v-model="dateTo" type="date" class="w-40" />
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-3 gap-3">
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami to'lovlar</p>
        <p class="text-lg font-bold text-gray-900 dark:text-white mt-1">{{ filteredData.length }} ta</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami summa</p>
        <p class="text-lg font-bold text-primary mt-1">{{ formatMoney(totalPaid) }}</p>
      </div>
      <div class="p-3 rounded-lg bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border">
        <p class="text-xs text-gray-500 dark:text-gray-400">Jami bonus</p>
        <p class="text-lg font-bold text-success mt-1">{{ formatMoney(totalBonus) }}</p>
      </div>
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #employee="{ value }">
        {{ value ? `${value.first_name} ${value.last_name}` : '—' }}
      </template>
      <template #total_amount="{ value }">
        <span class="font-semibold text-primary">{{ formatMoney(value) }}</span>
      </template>
      <template #base_salary="{ value }">{{ formatMoney(value) }}</template>
      <template #bonus="{ value }">
        <span :class="Number(value) > 0 ? 'text-success font-medium' : ''">{{ formatMoney(value) }}</span>
      </template>
      <template #deductions="{ value }">
        <span :class="Number(value) > 0 ? 'text-danger font-medium' : ''">
          {{ Number(value) > 0 ? '-' : '' }}{{ formatMoney(value) }}
        </span>
      </template>
      <template #payment_date="{ value }">{{ formatDate(value) }}</template>
      <template #payment_method="{ value }">
        <AppBadge variant="default">{{ methodLabel(value) }}</AppBadge>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- ===== BATCH OYLIK MODAL ===== -->
    <AppModal v-model="showBatchModal" title="Oylik hisoblash va to'lash" size="xl">
      <div class="space-y-4">
        <!-- Oy tanlash -->
        <div class="flex items-end gap-3">
          <AppInput
            v-model="batchMonth"
            label="Oy"
            type="month"
            class="w-48"
          />
          <AppButton :loading="previewLoading" :icon="Search" @click="loadPreview">Hisoblash</AppButton>
        </div>

        <!-- Preview jadval -->
        <div v-if="previewData.length > 0">
          <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-border">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-dark-800">
                <tr>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">Xodim</th>
                  <th class="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-300">Bo'lim</th>
                  <th class="px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-300">Ish haqi</th>
                  <th class="px-3 py-2.5 text-center font-medium text-gray-600 dark:text-gray-300">Ta'til</th>
                  <th class="px-3 py-2.5 text-right font-medium text-danger">Chegirma</th>
                  <th class="px-3 py-2.5 text-right font-medium text-success">Bonus</th>
                  <th class="px-3 py-2.5 text-right font-medium text-primary">Jami</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-dark-border">
                <tr
                  v-for="(item, idx) in previewData"
                  :key="item.employee_id"
                  class="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
                >
                  <td class="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{{ item.full_name }}</td>
                  <td class="px-3 py-2.5 text-gray-600 dark:text-gray-400">{{ item.department }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-700 dark:text-gray-300">{{ formatMoney(item.base_salary) }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <span v-if="item.unpaid_leave_days > 0" class="text-danger font-medium">
                      {{ item.unpaid_leave_days }} kun
                    </span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-3 py-2.5 text-right text-danger font-medium">
                    {{ item.deduction > 0 ? '-' + formatMoney(item.deduction) : '—' }}
                  </td>
                  <td class="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      v-model="batchBonuses[idx]"
                      class="w-24 text-right rounded border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-800 px-2 py-1 text-sm text-success focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0"
                      min="0"
                    />
                  </td>
                  <td class="px-3 py-2.5 text-right font-bold text-primary">
                    {{ formatMoney(computedTotal(item, idx)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Jami summa -->
          <div class="mt-3 p-3 rounded-lg bg-primary/10 flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Jami {{ previewData.length }} xodimga:
            </span>
            <span class="text-xl font-bold text-primary">{{ formatMoney(grandTotal) }}</span>
          </div>
        </div>

        <div v-else-if="previewLoaded" class="py-8 text-center text-gray-400 text-sm">
          Bu oy uchun aktiv xodimlar topilmadi
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" @click="showBatchModal = false">Bekor qilish</AppButton>
        <AppButton
          v-if="previewData.length > 0"
          variant="success"
          :loading="batchSaving"
          :icon="CheckCircle"
          @click="confirmBatch"
        >
          Hammasiga to'lash ({{ previewData.length }} xodim)
        </AppButton>
      </template>
    </AppModal>

    <!-- Confirm Dialog -->
    <AppModal v-model="showConfirm" title="Tasdiqlash" size="sm">
      <div class="space-y-3 text-sm">
        <p class="text-gray-700 dark:text-gray-300">
          <strong>{{ batchMonth }}</strong> oyi uchun <strong>{{ previewData.length }} xodimga</strong>
          jami <strong class="text-primary">{{ formatMoney(grandTotal) }}</strong> to'lanadi.
        </p>
        <p class="text-warning text-xs">Bu amalni bekor qilib bo'lmaydi!</p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showConfirm = false">Bekor</AppButton>
        <AppButton variant="danger" :loading="batchSaving" @click="executeBatch">Ha, to'lash</AppButton>
      </template>
    </AppModal>

    <!-- Yakka to'lov Modal -->
    <AppModal v-model="showCreateModal" title="Ish haqi to'lovi" size="md">
      <form @submit.prevent="save" class="space-y-4">
        <AppSelect v-model="form.employee_id" label="Xodim" required :options="employeeSelectOptions" :error="errors.employee_id" />
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.period_start" label="Davr boshlanishi" type="date" required :error="errors.period_start" />
          <AppInput v-model="form.period_end" label="Davr tugashi" type="date" required :error="errors.period_end" />
        </div>
        <div class="grid grid-cols-3 gap-4">
          <AppInput v-model="form.base_salary" label="Asosiy ish haqi" type="number" placeholder="0" :error="errors.base_salary" />
          <AppInput v-model="form.bonus" label="Bonus" type="number" placeholder="0" />
          <AppInput v-model="form.deductions" label="Chegirmalar" type="number" placeholder="0" />
        </div>
        <div v-if="totalPreview > 0" class="p-3 rounded-lg bg-primary/10 flex justify-between items-center">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Jami to'lov:</span>
          <span class="text-lg font-bold text-primary">{{ formatMoney(totalPreview) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.payment_date" label="To'lov sanasi" type="date" required :error="errors.payment_date" />
          <AppSelect v-model="form.payment_method" label="To'lov usuli" required :options="methodOptions.filter(o => o.value)" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea v-model="form.notes" rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton variant="success" :loading="saving" @click="save">To'lash</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal v-model="showDetailModal" title="To'lov tafsilotlari" size="sm">
      <div v-if="selectedPayment" class="space-y-3 text-sm">
        <div class="text-center py-2">
          <p class="text-gray-500 dark:text-gray-400">Jami to'lov</p>
          <p class="text-3xl font-bold text-primary mt-1">{{ formatMoney(selectedPayment.total_amount) }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Xodim</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ selectedPayment.employee?.first_name }} {{ selectedPayment.employee?.last_name }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Sana</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedPayment.payment_date) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Asosiy ish haqi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatMoney(selectedPayment.base_salary) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Bonus</p>
            <p class="font-medium text-success">+{{ formatMoney(selectedPayment.bonus) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Chegirmalar</p>
            <p class="font-medium text-danger">-{{ formatMoney(selectedPayment.deductions) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">To'lov usuli</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ methodLabel(selectedPayment.payment_method) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Davr</p>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ formatDate(selectedPayment.period_start) }} – {{ formatDate(selectedPayment.period_end) }}
            </p>
          </div>
        </div>
        <div v-if="selectedPayment.notes">
          <p class="text-gray-500 dark:text-gray-400">Izoh</p>
          <p class="text-gray-900 dark:text-white mt-0.5">{{ selectedPayment.notes }}</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { todayISO, nowLocalISO, startOfMonthISO, startOfYearISO, formatDate, formatDateTime } from '@/composables/useDate'
import { ref, computed, onMounted } from 'vue'
import { Plus, Calculator, Search, CheckCircle } from 'lucide-vue-next'
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
const employeesData = ref([])
const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const showBatchModal = ref(false)
const showConfirm = ref(false)
const selectedPayment = ref(null)
const employeeFilter = ref('')
const methodFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

// Batch
const batchMonth = ref(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tashkent' }).slice(0, 7))
const previewData = ref([])
const batchBonuses = ref([])
const previewLoading = ref(false)
const previewLoaded = ref(false)
const batchSaving = ref(false)

const now = new Date()
const defaultForm = () => ({
  employee_id: '',
  period_start: startOfMonthISO(),
  period_end: todayISO(),
  base_salary: '',
  bonus: '0',
  deductions: '0',
  payment_date: todayISO(),
  payment_method: 'bank_transfer',
  notes: '',
})
const form = ref(defaultForm())

const methodOptions = [
  { value: '', label: 'Barcha usullar' },
  { value: 'cash', label: 'Naqd' },
  { value: 'bank_transfer', label: 'Bank o\'tkazma' },
  { value: 'card', label: 'Karta' },
]

const columns = [
  { key: 'payment_date', label: 'Sana', sortable: true },
  { key: 'employee', label: 'Xodim' },
  { key: 'base_salary', label: 'Asosiy' },
  { key: 'bonus', label: 'Bonus' },
  { key: 'deductions', label: 'Chegirma' },
  { key: 'total_amount', label: 'Jami' },
  { key: 'payment_method', label: 'Usul' },
]

const employeeOptions = computed(() => [
  { value: '', label: 'Barcha xodimlar' },
  ...employeesData.value.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
])
const employeeSelectOptions = computed(() =>
  employeesData.value.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))
)

const totalPreview = computed(() => {
  const base = Number(form.value.base_salary) || 0
  const bonus = Number(form.value.bonus) || 0
  const ded = Number(form.value.deductions) || 0
  return base + bonus - ded
})

const filteredData = computed(() => {
  let result = data.value
  if (employeeFilter.value) result = result.filter(i => i.employee_id === employeeFilter.value)
  if (methodFilter.value) result = result.filter(i => i.payment_method === methodFilter.value)
  if (dateFrom.value) result = result.filter(i => i.payment_date >= dateFrom.value)
  if (dateTo.value) result = result.filter(i => i.payment_date <= dateTo.value)
  return result
})

const totalPaid = computed(() => filteredData.value.reduce((s, i) => s + Number(i.total_amount || 0), 0))
const totalBonus = computed(() => filteredData.value.reduce((s, i) => s + Number(i.bonus || 0), 0))

// Batch computed
function computedTotal(item, idx) {
  const bonus = Number(batchBonuses.value[idx]) || 0
  return Number(item.base_salary) - Number(item.deduction) + bonus
}

const grandTotal = computed(() =>
  previewData.value.reduce((sum, item, idx) => sum + computedTotal(item, idx), 0)
)

function methodLabel(m) {
  const map = { cash: 'Naqd', bank_transfer: 'Bank o\'tkazma', card: 'Karta' }
  return map[m] || m
}
function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}

async function load() {
  loading.value = true
  try {
    const [payRes, empRes] = await Promise.all([
      hrApi.getSalaryPayments({ page: page.value, limit: limit.value }),
      hrApi.getEmployees({ limit: 100 }),
    ])
    data.value = payRes.data?.items || payRes.data || []
    total.value = payRes.data?.total || data.value.length
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
  selectedPayment.value = row
  showDetailModal.value = true
}

function openBatchModal() {
  previewData.value = []
  batchBonuses.value = []
  previewLoaded.value = false
  batchMonth.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tashkent' }).slice(0, 7)
  showBatchModal.value = true
}

async function loadPreview() {
  if (!batchMonth.value) { toast.error('Oyni tanlang'); return }
  previewLoading.value = true
  previewLoaded.value = false
  try {
    const res = await hrApi.calculateSalaryPreview(batchMonth.value)
    previewData.value = res.data || []
    batchBonuses.value = previewData.value.map(() => 0)
    previewLoaded.value = true
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Hisoblashda xatolik')
  } finally {
    previewLoading.value = false
  }
}

function confirmBatch() {
  showConfirm.value = true
}

async function executeBatch() {
  batchSaving.value = true
  try {
    const payments = previewData.value.map((item, idx) => {
      const bonus = Number(batchBonuses.value[idx]) || 0
      return {
        employee_id: item.employee_id,
        base_salary: Number(item.base_salary),
        bonus: bonus,
        deduction: Number(item.deduction),
        total_amount: computedTotal(item, idx),
        notes: `${batchMonth.value} oyi ish haqi`,
      }
    })

    const res = await hrApi.batchSalaryPayment({
      month: batchMonth.value,
      payments,
    })

    const result = res.data
    if (result.success_count > 0) {
      toast.success(`${result.success_count} xodimga ish haqi to'landi!`)
    }
    if (result.failed_count > 0) {
      toast.error(`${result.failed_count} ta xatolik: ${result.errors.join(', ')}`)
    }

    showConfirm.value = false
    showBatchModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    batchSaving.value = false
  }
}

async function save() {
  errors.value = {}
  if (!form.value.employee_id) { errors.value.employee_id = 'Xodimni tanlang'; return }
  if (!form.value.base_salary) { errors.value.base_salary = 'Ish haqi kiriting'; return }
  if (!form.value.period_start) { errors.value.period_start = 'Davr boshini kiriting'; return }
  if (!form.value.period_end) { errors.value.period_end = 'Davr tugashini kiriting'; return }
  if (!form.value.payment_date) { errors.value.payment_date = 'Sanani kiriting'; return }

  saving.value = true
  try {
    await hrApi.createSalaryPayment({
      employee_id: form.value.employee_id,
      payment_date: form.value.payment_date,
      period_start: form.value.period_start,
      period_end: form.value.period_end,
      base_salary: Number(form.value.base_salary),
      bonus: Number(form.value.bonus) || 0,
      deductions: Number(form.value.deductions) || 0,
      payment_method: form.value.payment_method,
      notes: form.value.notes || null,
    })
    toast.success('Ish haqi to\'landi!')
    showCreateModal.value = false
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