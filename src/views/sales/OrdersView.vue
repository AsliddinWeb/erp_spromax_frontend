<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Buyurtmalar</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','sales_manager'])"
        @click="openCreate"
        :icon="Plus"
      >
        Yangi buyurtma
      </AppButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Mijoz nomi bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect
        v-model="paymentFilter"
        :options="paymentStatusOptions"
        placeholder="To'lov holati"
        class="w-44"
      />
      <AppSelect
        v-model="deliveryFilter"
        :options="deliveryStatusOptions"
        placeholder="Yetkazish holati"
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
      <template #customer="{ value }">
        {{ value?.name || '—' }}
      </template>

      <template #total_amount="{ value }">
        <span class="font-semibold">{{ formatMoney(value) }} so'm</span>
      </template>

      <template #paid_amount="{ value }">
        {{ formatMoney(value) }} so'm
      </template>

      <template #payment_status="{ value }">
        <AppBadge :variant="paymentStatusVariant(value)">
          {{ paymentStatusLabel(value) }}
        </AppBadge>
      </template>

      <template #delivery_status="{ value }">
        <AppBadge :variant="deliveryStatusVariant(value)">
          {{ deliveryStatusLabel(value) }}
        </AppBadge>
      </template>

      <template #order_date="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="hasRole(['superadmin','admin','director','sales_manager'])"
            size="sm" variant="ghost" :icon="Edit"
            @click.stop="openEdit(row)"
          />
          <AppButton
            v-if="hasRole(['superadmin','admin','director','sales_manager','accountant']) && row.payment_status !== 'paid'"
            size="sm" variant="ghost" :icon="CreditCard"
            class="text-success hover:text-success"
            @click.stop="openPayment(row)"
          />
          <AppButton
            size="sm" variant="ghost" :icon="Eye"
            @click.stop="openDetail(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create Order Modal -->
    <AppModal
      v-model="showCreateModal"
      title="Yangi buyurtma"
      size="lg"
    >
      <form @submit.prevent="saveCreate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppSelect
            v-model="form.customer_id"
            label="Mijoz"
            required
            :options="customerOptions"
            :error="errors.customer_id"
          />
          <AppInput
            v-model="form.order_date"
            label="Buyurtma sanasi"
            type="datetime-local"
            required
            :error="errors.order_date"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.delivery_address"
            label="Yetkazish manzili"
            placeholder="Shahar, ko'cha..."
          />
          <AppInput
            v-model="form.delivery_date"
            label="Yetkazish sanasi"
            type="datetime-local"
          />
        </div>

        <!-- Order Items -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mahsulotlar <span class="text-danger">*</span>
            </label>
            <AppButton size="sm" variant="secondary" :icon="Plus" @click="addItem">
              Qo'shish
            </AppButton>
          </div>

          <div class="space-y-2">
            <div
              v-for="(item, idx) in form.items"
              :key="idx"
              class="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-gray-50 dark:bg-dark-700"
            >
              <div class="col-span-5">
                <AppSelect
                  v-model="item.finished_product_id"
                  :label="idx === 0 ? 'Mahsulot' : ''"
                  :options="productOptions"
                  placeholder="Tanlang"
                  @change="fillPrice(item)"
                />
              </div>
              <div class="col-span-3">
                <AppInput
                  v-model="item.quantity"
                  :label="idx === 0 ? 'Miqdor' : ''"
                  type="number"
                  placeholder="0"
                />
              </div>
              <div class="col-span-3">
                <AppInput
                  v-model="item.unit_price"
                  :label="idx === 0 ? 'Narxi (so\'m)' : ''"
                  type="number"
                  placeholder="0"
                />
              </div>
              <div class="col-span-1 pb-1">
                <AppButton
                  size="sm" variant="ghost"
                  :icon="Trash2"
                  class="text-danger"
                  @click="removeItem(idx)"
                />
              </div>
            </div>
          </div>

          <div v-if="errors.items" class="text-danger text-xs">{{ errors.items }}</div>
        </div>

        <!-- Total -->
        <div v-if="orderTotal > 0" class="p-3 rounded-lg bg-primary/10 dark:bg-primary/5 flex justify-between items-center">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Jami summa:</span>
          <span class="text-lg font-bold text-primary">{{ formatMoney(orderTotal) }} so'm</span>
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
        <AppButton :loading="saving" @click="saveCreate">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Edit Order Modal (delivery info) -->
    <AppModal
      v-model="showEditModal"
      title="Buyurtmani tahrirlash"
      size="md"
    >
      <form @submit.prevent="saveEdit" class="space-y-4">
        <AppInput
          v-model="editForm.delivery_address"
          label="Yetkazish manzili"
          placeholder="Shahar, ko'cha..."
        />
        <AppInput
          v-model="editForm.delivery_date"
          label="Yetkazish sanasi"
          type="datetime-local"
        />
        <AppSelect
          v-model="editForm.delivery_status"
          label="Yetkazish holati"
          :options="deliveryStatusOptions.filter(o => o.value)"
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

    <!-- Payment Modal -->
    <AppModal
      v-model="showPaymentModal"
      title="To'lov qabul qilish"
      size="sm"
    >
      <div v-if="payingOrder" class="space-y-4">
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700 text-sm space-y-1">
          <p><span class="text-gray-500">Mijoz:</span> <span class="font-medium text-gray-900 dark:text-white">{{ payingOrder.customer?.name }}</span></p>
          <p><span class="text-gray-500">Jami summa:</span> <span class="font-semibold text-gray-900 dark:text-white">{{ formatMoney(payingOrder.total_amount) }} so'm</span></p>
          <p><span class="text-gray-500">To'langan:</span> <span class="font-semibold text-success">{{ formatMoney(payingOrder.paid_amount) }} so'm</span></p>
          <p><span class="text-gray-500">Qoldiq:</span> <span class="font-semibold text-danger">{{ formatMoney(parseFloat(payingOrder.total_amount) - parseFloat(payingOrder.paid_amount)) }} so'm</span></p>
        </div>

        <AppInput
          v-model="paymentForm.amount"
          label="To'lov miqdori (so'm)"
          type="number"
          required
          :error="paymentErrors.amount"
          placeholder="0"
        />
        <AppSelect
          v-model="paymentForm.payment_method"
          label="To'lov usuli"
          required
          :options="paymentMethodOptions"
          :error="paymentErrors.payment_method"
        />
        <AppInput
          v-model="paymentForm.payment_date"
          label="Sana"
          type="datetime-local"
          required
        />
        <AppInput
          v-model="paymentForm.transaction_id"
          label="Tranzaksiya ID"
          placeholder="Ixtiyoriy"
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="paymentForm.notes"
            rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showPaymentModal = false">Bekor qilish</AppButton>
        <AppButton variant="success" :loading="saving" @click="savePayment">To'lovni qabul qilish</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal
      v-model="showDetailModal"
      title="Buyurtma tafsilotlari"
      size="lg"
    >
      <div v-if="selectedOrder" class="space-y-4">
        <!-- Status row -->
        <div class="flex gap-2 flex-wrap">
          <AppBadge :variant="paymentStatusVariant(selectedOrder.payment_status)">
            To'lov: {{ paymentStatusLabel(selectedOrder.payment_status) }}
          </AppBadge>
          <AppBadge :variant="deliveryStatusVariant(selectedOrder.delivery_status)">
            Yetkazish: {{ deliveryStatusLabel(selectedOrder.delivery_status) }}
          </AppBadge>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Mijoz</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedOrder.customer?.name }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Buyurtma sanasi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedOrder.order_date) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Jami summa</p>
            <p class="font-semibold text-primary">{{ formatMoney(selectedOrder.total_amount) }} so'm</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">To'langan</p>
            <p class="font-semibold text-success">{{ formatMoney(selectedOrder.paid_amount) }} so'm</p>
          </div>
          <div v-if="selectedOrder.delivery_address">
            <p class="text-gray-500 dark:text-gray-400">Yetkazish manzili</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedOrder.delivery_address }}</p>
          </div>
          <div v-if="selectedOrder.delivery_date">
            <p class="text-gray-500 dark:text-gray-400">Yetkazish sanasi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedOrder.delivery_date) }}</p>
          </div>
        </div>

        <!-- Order items -->
        <div v-if="selectedOrder.order_items?.length">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buyurtma tarkibi</p>
          <div class="rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th class="px-3 py-2 text-left text-gray-500 dark:text-gray-400 font-medium">Mahsulot</th>
                  <th class="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">Miqdor</th>
                  <th class="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">Narxi</th>
                  <th class="px-3 py-2 text-right text-gray-500 dark:text-gray-400 font-medium">Jami</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-dark-border">
                <tr v-for="item in selectedOrder.order_items" :key="item.id">
                  <td class="px-3 py-2 text-gray-900 dark:text-white">{{ item.finished_product?.name || '—' }}</td>
                  <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ item.quantity }} {{ item.finished_product?.unit }}</td>
                  <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ formatMoney(item.unit_price) }}</td>
                  <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">{{ formatMoney(item.total_price) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="selectedOrder.notes">
          <p class="text-sm text-gray-500 dark:text-gray-400">Izoh</p>
          <p class="text-sm text-gray-900 dark:text-white mt-1">{{ selectedOrder.notes }}</p>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','sales_manager','accountant']) && selectedOrder?.payment_status !== 'paid'"
          variant="success"
          :icon="CreditCard"
          @click="openPayment(selectedOrder); showDetailModal = false"
        >
          To'lov qabul qilish
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, CreditCard, Trash2 } from 'lucide-vue-next'
import { salesApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { productionApi } from '@/api'
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
const customersData = ref([])
const productsData = ref([])
const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPaymentModal = ref(false)
const showDetailModal = ref(false)
const editingId = ref(null)
const selectedOrder = ref(null)
const payingOrder = ref(null)
const search = ref('')
const paymentFilter = ref('')
const deliveryFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})
const paymentErrors = ref({})

const defaultForm = () => ({
  customer_id: '',
  order_date: new Date().toISOString().slice(0, 16),
  delivery_address: '',
  delivery_date: '',
  notes: '',
  items: [{ finished_product_id: '', quantity: '', unit_price: '' }],
})
const form = ref(defaultForm())
const editForm = ref({ delivery_address: '', delivery_date: '', delivery_status: '', notes: '' })
const paymentForm = ref({
  order_id: '',
  amount: '',
  payment_method: 'cash',
  payment_date: new Date().toISOString().slice(0, 16),
  transaction_id: '',
  notes: '',
})

const paymentStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'unpaid', label: "To'lanmagan" },
  { value: 'partial', label: "Qisman to'langan" },
  { value: 'paid', label: "To'langan" },
]
const deliveryStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'in_transit', label: 'Yetkazilmoqda' },
  { value: 'delivered', label: 'Yetkazildi' },
  { value: 'cancelled', label: 'Bekor qilindi' },
]
const paymentMethodOptions = [
  { value: 'cash', label: 'Naqd' },
  { value: 'bank_transfer', label: 'Bank o\'tkazma' },
  { value: 'card', label: 'Karta' },
  { value: 'other', label: 'Boshqa' },
]

const columns = [
  { key: 'customer', label: 'Mijoz', sortable: true },
  { key: 'order_date', label: 'Sana' },
  { key: 'total_amount', label: 'Jami summa' },
  { key: 'paid_amount', label: "To'langan" },
  { key: 'payment_status', label: "To'lov" },
  { key: 'delivery_status', label: 'Yetkazish' },
  { key: 'actions', label: '', width: '110px' },
]

const customerOptions = computed(() =>
  customersData.value.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))
)
const productOptions = computed(() =>
  productsData.value.map(p => ({ value: p.id, label: `${p.name} — ${formatMoney(p.standard_price)} so'm/${p.unit}`, price: p.standard_price }))
)

const orderTotal = computed(() =>
  form.value.items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
  }, 0)
)

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.customer?.name?.toLowerCase().includes(q))
  }
  if (paymentFilter.value) result = result.filter(i => i.payment_status === paymentFilter.value)
  if (deliveryFilter.value) result = result.filter(i => i.delivery_status === deliveryFilter.value)
  return result
})

function paymentStatusVariant(s) {
  const map = { paid: 'success', partial: 'warning', unpaid: 'danger' }
  return map[s] || 'default'
}
function paymentStatusLabel(s) {
  const map = { paid: "To'langan", partial: "Qisman to'langan", unpaid: "To'lanmagan" }
  return map[s] || s
}
function deliveryStatusVariant(s) {
  const map = { delivered: 'success', in_transit: 'info', pending: 'warning', cancelled: 'danger' }
  return map[s] || 'default'
}
function deliveryStatusLabel(s) {
  const map = { delivered: 'Yetkazildi', in_transit: 'Yetkazilmoqda', pending: 'Kutilmoqda', cancelled: 'Bekor qilindi' }
  return map[s] || s
}
function formatMoney(val) {
  return Number(val || 0).toLocaleString('uz-UZ')
}
function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function addItem() {
  form.value.items.push({ finished_product_id: '', quantity: '', unit_price: '' })
}
function removeItem(idx) {
  if (form.value.items.length > 1) form.value.items.splice(idx, 1)
}
function fillPrice(item) {
  const product = productsData.value.find(p => p.id === item.finished_product_id)
  if (product?.standard_price) item.unit_price = product.standard_price
}

async function load() {
  loading.value = true
  try {
    const [ordRes, custRes, prodRes] = await Promise.all([
      salesApi.getOrders({ page: page.value, limit: limit.value }),
      salesApi.getCustomers({ limit: 100 }),
      productionApi.getFinishedProducts({ limit: 100 }),
    ])
    data.value = ordRes.data?.items || ordRes.data || []
    total.value = ordRes.data?.total || data.value.length
    customersData.value = custRes.data?.items || custRes.data || []
    productsData.value = prodRes.data?.items || prodRes.data || []
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
  if (!form.value.customer_id) { errors.value.customer_id = 'Mijozni tanlang'; return }
  if (!form.value.order_date) { errors.value.order_date = 'Sanani kiriting'; return }
  const validItems = form.value.items.filter(i => i.finished_product_id && i.quantity && i.unit_price)
  if (!validItems.length) { errors.value.items = 'Kamida bitta mahsulot kiriting'; return }

  saving.value = true
  try {
    await salesApi.createOrder({
      ...form.value,
      order_date: new Date(form.value.order_date).toISOString(),
      delivery_date: form.value.delivery_date
        ? new Date(form.value.delivery_date).toISOString()
        : null,
      items: validItems,
    })
    toast.success('Buyurtma yaratildi!')
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
    delivery_address: row.delivery_address || '',
    delivery_date: row.delivery_date ? row.delivery_date.slice(0, 16) : '',
    delivery_status: row.delivery_status || '',
    notes: row.notes || '',
  }
  showEditModal.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await salesApi.updateOrder(editingId.value, {
      ...editForm.value,
      delivery_date: editForm.value.delivery_date
        ? new Date(editForm.value.delivery_date).toISOString()
        : null,
    })
    toast.success('Buyurtma yangilandi!')
    showEditModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openPayment(row) {
  payingOrder.value = row
  paymentForm.value = {
    order_id: row.id,
    amount: (parseFloat(row.total_amount) - parseFloat(row.paid_amount)).toString(),
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 16),
    transaction_id: '',
    notes: '',
  }
  paymentErrors.value = {}
  showPaymentModal.value = true
}

async function savePayment() {
  paymentErrors.value = {}
  if (!paymentForm.value.amount) { paymentErrors.value.amount = 'Miqdorni kiriting'; return }
  if (!paymentForm.value.payment_method) { paymentErrors.value.payment_method = 'Usulni tanlang'; return }

  saving.value = true
  try {
    await salesApi.createPayment({
      ...paymentForm.value,
      payment_date: new Date(paymentForm.value.payment_date).toISOString(),
    })
    toast.success("To'lov qabul qilindi!")
    showPaymentModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openDetail(row) {
  selectedOrder.value = row
  showDetailModal.value = true
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>