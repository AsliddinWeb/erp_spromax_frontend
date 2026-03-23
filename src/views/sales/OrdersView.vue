<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Buyurtmalar</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','sales_manager'])"
        @click="openCreate" :icon="Plus"
      >
        Yangi buyurtma
      </AppButton>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="p-3 rounded-xl border border-primary/20 bg-primary/5">
        <p class="text-xs text-primary">Jami buyurtma</p>
        <p class="text-2xl font-bold text-primary mt-1">{{ total }}</p>
      </div>
      <div class="p-3 rounded-xl border border-danger/20 bg-danger/5">
        <p class="text-xs text-danger">Tolanmagan</p>
        <p class="text-2xl font-bold text-danger mt-1">{{ data.filter(o => o.payment_status === 'unpaid').length }}</p>
      </div>
      <div class="p-3 rounded-xl border border-warning/20 bg-warning/5">
        <p class="text-xs text-warning">Qisman tolangan</p>
        <p class="text-2xl font-bold text-warning mt-1">{{ data.filter(o => o.payment_status === 'partial').length }}</p>
      </div>
      <div class="p-3 rounded-xl border border-success/20 bg-success/5">
        <p class="text-xs text-success">Tolangan</p>
        <p class="text-2xl font-bold text-success mt-1">{{ data.filter(o => o.payment_status === 'paid').length }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <AppInput v-model="search" placeholder="Mijoz nomi..." :prefix-icon="Search" class="flex-1 min-w-[200px]" />
      <AppSelect v-model="paymentFilter" :options="paymentStatusOptions" placeholder="Tolov holati" class="w-44" />
      <AppSelect v-model="deliveryFilter" :options="deliveryStatusOptions" placeholder="Yetkazish holati" class="w-44" />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #customer="{ value }">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">{{ value?.name || '—' }}</p>
          <p v-if="value?.phone" class="text-xs text-gray-400">{{ value.phone }}</p>
        </div>
      </template>
      <template #total_amount="{ value }">
        <span class="font-semibold text-gray-900 dark:text-white">{{ formatMoney(value) }} so'm</span>
      </template>
      <template #paid_amount="{ value, row }">
        <div>
          <span :class="parseFloat(value) >= parseFloat(row.total_amount) ? 'text-success font-medium' : 'text-gray-700 dark:text-gray-300'">
            {{ formatMoney(value) }} so'm
          </span>
          <p v-if="parseFloat(row.total_amount) > parseFloat(value)" class="text-xs text-danger">
            -{{ formatMoney(parseFloat(row.total_amount) - parseFloat(value)) }}
          </p>
        </div>
      </template>
      <template #payment_status="{ value }">
        <AppBadge :variant="paymentStatusVariant(value)">{{ paymentStatusLabel(value) }}</AppBadge>
      </template>
      <template #delivery_status="{ value }">
        <AppBadge :variant="deliveryStatusVariant(value)">{{ deliveryStatusLabel(value) }}</AppBadge>
      </template>
      <template #order_date="{ value }">{{ formatDate(value) }}</template>
      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton v-if="hasRole(['superadmin','admin','director','sales_manager'])" size="sm" variant="ghost" :icon="Edit" @click.stop="openEdit(row)" />
          <AppButton
            v-if="hasRole(['superadmin','admin','director','sales_manager','accountant']) && row.payment_status !== 'paid'"
            size="sm" variant="ghost" :icon="CreditCard" class="text-success"
            @click.stop="openPayment(row)"
          />
          <AppButton size="sm" variant="ghost" :icon="Eye" @click.stop="openDetail(row)" />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- ===== YANGI BUYURTMA MODAL ===== -->
    <AppModal v-model="showCreateModal" title="Yangi buyurtma" size="xl">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppSelect v-model="form.customer_id" label="Mijoz" required :options="customerOptions" :error="errors.customer_id" />
          <AppInput v-model="form.order_date" label="Buyurtma sanasi" type="datetime-local" required :error="errors.order_date" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model="form.delivery_address" label="Yetkazish manzili" placeholder="Shahar, kocha..." />
          <AppInput v-model="form.delivery_date" label="Yetkazish sanasi" type="datetime-local" />
        </div>

        <!-- Mahsulotlar -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mahsulotlar <span class="text-danger">*</span>
            </label>
            <AppButton size="sm" variant="secondary" :icon="Plus" @click="addItem">Qoshish</AppButton>
          </div>

          <!-- Mahsulot qo'shish qatori -->
          <div
            v-for="(item, idx) in form.items"
            :key="idx"
            class="p-3 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-700 space-y-2"
          >
            <div class="grid grid-cols-12 gap-2 items-end">
              <!-- Mahsulot select -->
              <div class="col-span-5">
                <label v-if="idx === 0" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mahsulot</label>
                <select
                  v-model="item.finished_product_id"
                  @change="fillPrice(item)"
                  class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
                >
                  <option value="">Tanlang</option>
                  <option
                    v-for="p in productOptions"
                    :key="p.value"
                    :value="p.value"
                    :disabled="p.disabled"
                  >{{ p.label }}</option>
                </select>
              </div>
              <!-- Miqdor -->
              <div class="col-span-3">
                <AppInput
                  v-model="item.quantity"
                  :label="idx === 0 ? 'Miqdor' : ''"
                  type="number" min="1"
                  placeholder="0"
                  :error="item.quantityError"
                  @input="validateItemQty(item)"
                />
              </div>
              <!-- Narx -->
              <div class="col-span-3">
                <AppInput
                  v-model="item.unit_price"
                  :label="idx === 0 ? 'Narxi (som)' : ''"
                  type="number" placeholder="0"
                />
              </div>
              <!-- O'chirish -->
              <div class="col-span-1 pb-1">
                <AppButton size="sm" variant="ghost" :icon="Trash2" class="text-danger" @click="removeItem(idx)" />
              </div>
            </div>

            <!-- Mahsulot stock info -->
            <div v-if="item.finished_product_id" class="flex items-center gap-3 px-1">
              <template v-if="getProductStock(item.finished_product_id) !== null">
                <div class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full" :class="getProductStock(item.finished_product_id) > 0 ? 'bg-success' : 'bg-danger'"></div>
                  <span class="text-xs" :class="getProductStock(item.finished_product_id) > 0 ? 'text-success' : 'text-danger'">
                    Omborda: <strong>{{ getProductStock(item.finished_product_id) }}</strong>
                    {{ getProductUnit(item.finished_product_id) }}
                  </span>
                </div>
                <span v-if="item.quantity && parseFloat(item.quantity) > getProductStock(item.finished_product_id)" class="text-xs text-danger">
                  ⚠️ Yetarli emas ({{ parseFloat(item.quantity) - getProductStock(item.finished_product_id) }} ta kam)
                </span>
              </template>
              <!-- Qiymat -->
              <span v-if="item.quantity && item.unit_price" class="ml-auto text-xs font-semibold text-primary">
                = {{ formatMoney(parseFloat(item.quantity) * parseFloat(item.unit_price)) }} so'm
              </span>
            </div>
          </div>

          <div v-if="errors.items" class="text-danger text-xs px-1">{{ errors.items }}</div>
        </div>

        <!-- Jami -->
        <div v-if="orderTotal > 0" class="p-3 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Jami summa:</span>
          <span class="text-xl font-bold text-primary">{{ formatMoney(orderTotal) }} so'm</span>
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea v-model="form.notes" rows="2" placeholder="Qoshimcha malumot..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" :disabled="hasStockError" :icon="ShoppingCart" @click="saveCreate">
          Buyurtma yaratish
        </AppButton>
      </template>
    </AppModal>

    <!-- ===== TAHRIRLASH MODAL ===== -->
    <AppModal v-model="showEditModal" title="Buyurtmani tahrirlash" size="md">
      <div class="space-y-4">
        <AppInput v-model="editForm.delivery_address" label="Yetkazish manzili" placeholder="Shahar, kocha..." />
        <AppInput v-model="editForm.delivery_date" label="Yetkazish sanasi" type="datetime-local" />
        <AppSelect v-model="editForm.delivery_status" label="Yetkazish holati" :options="deliveryStatusOptions.filter(o => o.value)" />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea v-model="editForm.notes" rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showEditModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveEdit">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- ===== TO'LOV MODAL ===== -->
    <AppModal v-model="showPaymentModal" title="Tolov qabul qilish" size="sm">
      <div v-if="payingOrder" class="space-y-4">
        <div class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700 text-sm space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-500">Mijoz</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ payingOrder.customer?.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Jami summa</span>
            <span class="font-semibold">{{ formatMoney(payingOrder.total_amount) }} so'm</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Tolangan</span>
            <span class="font-semibold text-success">{{ formatMoney(payingOrder.paid_amount) }} so'm</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 dark:border-dark-border pt-2 mt-1">
            <span class="text-gray-500">Qoldiq</span>
            <span class="font-bold text-danger text-base">{{ formatMoney(parseFloat(payingOrder.total_amount) - parseFloat(payingOrder.paid_amount)) }} so'm</span>
          </div>
        </div>
        <AppInput v-model="paymentForm.amount" label="Tolov miqdori (som)" type="number" required :error="paymentErrors.amount" placeholder="0" />
        <AppSelect v-model="paymentForm.payment_method" label="Tolov usuli" required :options="paymentMethodOptions" :error="paymentErrors.payment_method" />
        <AppInput v-model="paymentForm.payment_date" label="Sana" type="datetime-local" required />
        <div class="p-2.5 rounded-lg bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-border flex items-center gap-2">
          <span class="text-xs text-gray-500">Tranzaksiya ID:</span>
          <span class="text-xs font-mono font-semibold text-primary">Avtomatik (SPX-XXXXXXXXXX)</span>
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea v-model="paymentForm.notes" rows="2"
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showPaymentModal = false">Bekor qilish</AppButton>
        <AppButton variant="success" :loading="saving" :icon="CreditCard" @click="savePayment">Tolovni qabul qilish</AppButton>
      </template>
    </AppModal>

    <!-- ===== DETAIL MODAL ===== -->
    <AppModal v-model="showDetailModal" title="Buyurtma tafsilotlari" size="lg">
      <div v-if="selectedOrder" class="space-y-4">

        <!-- Statuslar -->
        <div class="flex gap-2 flex-wrap">
          <AppBadge :variant="paymentStatusVariant(selectedOrder.payment_status)">
            Tolov: {{ paymentStatusLabel(selectedOrder.payment_status) }}
          </AppBadge>
          <AppBadge :variant="deliveryStatusVariant(selectedOrder.delivery_status)">
            Yetkazish: {{ deliveryStatusLabel(selectedOrder.delivery_status) }}
          </AppBadge>
        </div>

        <!-- Ma'lumotlar -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-xs text-gray-500 mb-0.5">Mijoz</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedOrder.customer?.name }}</p>
            <p v-if="selectedOrder.customer?.phone" class="text-xs text-gray-400">{{ selectedOrder.customer.phone }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-0.5">Buyurtma sanasi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedOrder.order_date) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-0.5">Jami summa</p>
            <p class="font-bold text-primary text-base">{{ formatMoney(selectedOrder.total_amount) }} so'm</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-0.5">Tolov holati</p>
            <p class="font-semibold text-success">{{ formatMoney(selectedOrder.paid_amount) }} so'm tolangan</p>
            <p v-if="parseFloat(selectedOrder.total_amount) > parseFloat(selectedOrder.paid_amount)" class="text-xs text-danger">
              Qoldiq: {{ formatMoney(parseFloat(selectedOrder.total_amount) - parseFloat(selectedOrder.paid_amount)) }} so'm
            </p>
          </div>
          <div v-if="selectedOrder.delivery_address">
            <p class="text-xs text-gray-500 mb-0.5">Yetkazish manzili</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedOrder.delivery_address }}</p>
          </div>
          <div v-if="selectedOrder.delivery_date">
            <p class="text-xs text-gray-500 mb-0.5">Yetkazish sanasi</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedOrder.delivery_date) }}</p>
          </div>
        </div>

        <!-- To'lov progress -->
        <div v-if="parseFloat(selectedOrder.total_amount) > 0">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Tolov holati</span>
            <span>{{ Math.round(parseFloat(selectedOrder.paid_amount) / parseFloat(selectedOrder.total_amount) * 100) }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="selectedOrder.payment_status === 'paid' ? 'bg-success' : selectedOrder.payment_status === 'partial' ? 'bg-warning' : 'bg-danger'"
              :style="`width: ${Math.min(100, Math.round(parseFloat(selectedOrder.paid_amount) / parseFloat(selectedOrder.total_amount) * 100))}%`"
            ></div>
          </div>
        </div>

        <!-- Buyurtma tarkibi -->
        <div v-if="selectedOrder.order_items?.length">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Buyurtma tarkibi</p>
          <div class="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-dark-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs text-gray-500 font-medium">Mahsulot</th>
                  <th class="px-3 py-2 text-right text-xs text-gray-500 font-medium">Miqdor</th>
                  <th class="px-3 py-2 text-right text-xs text-gray-500 font-medium">Narxi</th>
                  <th class="px-3 py-2 text-right text-xs text-gray-500 font-medium">Jami</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-dark-border">
                <tr v-for="item in selectedOrder.order_items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-dark-700">
                  <td class="px-3 py-2 font-medium text-gray-900 dark:text-white">{{ item.finished_product?.name || '—' }}</td>
                  <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{{ item.quantity }} {{ item.finished_product?.unit }}</td>
                  <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{{ formatMoney(item.unit_price) }} so'm</td>
                  <td class="px-3 py-2 text-right font-semibold text-primary">{{ formatMoney(item.total_price) }} so'm</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-border">
                <tr>
                  <td colspan="3" class="px-3 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Jami:</td>
                  <td class="px-3 py-2 text-right font-bold text-primary">{{ formatMoney(selectedOrder.total_amount) }} so'm</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div v-if="selectedOrder.notes" class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700 text-sm text-gray-600 dark:text-gray-400">
          {{ selectedOrder.notes }}
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','sales_manager'])"
          variant="ghost" :icon="Edit"
          @click="openEdit(selectedOrder); showDetailModal = false"
        >
          Tahrirlash
        </AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','sales_manager','accountant']) && selectedOrder?.payment_status !== 'paid'"
          variant="success" :icon="CreditCard"
          @click="openPayment(selectedOrder); showDetailModal = false"
        >
          Tolov
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { nowLocalISO, formatDate } from '@/composables/useDate'
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, CreditCard, Trash2, ShoppingCart } from 'lucide-vue-next'
import { salesApi, productionApi } from '@/api'
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
const customersData = ref([])
const productsData = ref([])
const finishedStockData = ref([])
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
  order_date: nowLocalISO(),
  delivery_address: '',
  delivery_date: '',
  notes: '',
  items: [{ finished_product_id: '', quantity: '', unit_price: '', quantityError: '' }],
})
const form = ref(defaultForm())
const editForm = ref({ delivery_address: '', delivery_date: '', delivery_status: '', notes: '' })
const paymentForm = ref({
  order_id: '', amount: '', payment_method: 'cash',
  payment_date: nowLocalISO(), transaction_id: '', notes: '',
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
  { value: 'bank_transfer', label: "Bank o'tkazma" },
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

// Helpers
const customerOptions = computed(() =>
  customersData.value
    .filter(c => c.is_active)
    .map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }))
)

// Mahsulot options — stock ko'rsatiladi, 0 bo'lsa disabled
const productOptions = computed(() =>
  productsData.value.map(p => {
    const stock = finishedStockData.value.find(s => s.finished_product_id === p.id)
    const qty = stock ? parseFloat(stock.quantity_available) : 0
    const disabled = qty <= 0
    const label = `${p.name} (${p.unit}) — Ombor: ${qty}`
    return {
      value: p.id,
      label,
      disabled,
      price: p.standard_price,
      stock: qty,
      unit: p.unit,
    }
  })
)

const orderTotal = computed(() =>
  form.value.items.reduce((sum, item) =>
    sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0)
)

// Agar birorta item da stock xatosi bo'lsa buyurtma yaratilmaydi
const hasStockError = computed(() =>
  form.value.items.some(item => {
    if (!item.finished_product_id || !item.quantity) return false
    const stock = getProductStock(item.finished_product_id)
    return stock !== null && parseFloat(item.quantity) > stock
  })
)

const filteredData = computed(() => {
  let result = [...data.value].sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.customer?.name?.toLowerCase().includes(q))
  }
  if (paymentFilter.value) result = result.filter(i => i.payment_status === paymentFilter.value)
  if (deliveryFilter.value) result = result.filter(i => i.delivery_status === deliveryFilter.value)
  return result
})

function getProductStock(productId) {
  const stock = finishedStockData.value.find(s => s.finished_product_id === productId)
  return stock ? parseFloat(stock.quantity_available) : null
}
function getProductUnit(productId) {
  const p = productsData.value.find(p => p.id === productId)
  return p?.unit || ''
}
function validateItemQty(item) {
  if (!item.finished_product_id || !item.quantity) { item.quantityError = ''; return }
  const stock = getProductStock(item.finished_product_id)
  if (stock !== null && parseFloat(item.quantity) > stock) {
    item.quantityError = `Maksimal: ${stock}`
  } else {
    item.quantityError = ''
  }
}

function paymentStatusVariant(s) { return { paid: 'success', partial: 'warning', unpaid: 'danger' }[s] || 'default' }
function paymentStatusLabel(s) { return { paid: "To'langan", partial: "Qisman to'langan", unpaid: "To'lanmagan" }[s] || s }
function deliveryStatusVariant(s) { return { delivered: 'success', in_transit: 'info', pending: 'warning', cancelled: 'danger' }[s] || 'default' }
function deliveryStatusLabel(s) { return { delivered: 'Yetkazildi', in_transit: 'Yetkazilmoqda', pending: 'Kutilmoqda', cancelled: 'Bekor qilindi' }[s] || s }
function formatMoney(val) { return Number(val || 0).toLocaleString('uz-UZ') }

function addItem() {
  form.value.items.push({ finished_product_id: '', quantity: '', unit_price: '', quantityError: '' })
}
function removeItem(idx) {
  if (form.value.items.length > 1) form.value.items.splice(idx, 1)
}
function fillPrice(item) {
  const product = productsData.value.find(p => p.id === item.finished_product_id)
  if (product?.standard_price) item.unit_price = product.standard_price
  item.quantityError = ''
}

async function load() {
  loading.value = true
  try {
    const [ordRes, custRes, prodRes, stockRes] = await Promise.all([
      salesApi.getOrders({ page: page.value, limit: limit.value }),
      salesApi.getCustomers({ limit: 100 }),
      productionApi.getFinishedProducts({ limit: 100 }),
      productionApi.getFinishedStock(),
    ])
    data.value = ordRes.data?.items || ordRes.data || []
    total.value = ordRes.data?.total || data.value.length
    customersData.value = custRes.data?.items || custRes.data || []
    productsData.value = prodRes.data?.items || prodRes.data || []
    finishedStockData.value = stockRes.data?.items || stockRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function openCreate() { form.value = defaultForm(); errors.value = {}; showCreateModal.value = true }

async function saveCreate() {
  errors.value = {}
  if (!form.value.customer_id) { errors.value.customer_id = 'Mijozni tanlang'; return }
  if (!form.value.order_date) { errors.value.order_date = 'Sanani kiriting'; return }
  const validItems = form.value.items.filter(i => i.finished_product_id && i.quantity && i.unit_price)
  if (!validItems.length) { errors.value.items = 'Kamida bitta mahsulot kiriting'; return }

  // Stock tekshirish
  for (const item of validItems) {
    const stock = getProductStock(item.finished_product_id)
    if (stock !== null && parseFloat(item.quantity) > stock) {
      const p = productsData.value.find(p => p.id === item.finished_product_id)
      errors.value.items = `"${p?.name}" omborda yetarli emas. Mavjud: ${stock}`
      return
    }
    if (stock !== null && stock <= 0) {
      const p = productsData.value.find(p => p.id === item.finished_product_id)
      errors.value.items = `"${p?.name}" omborda mavjud emas (0 ta)`
      return
    }
  }

  saving.value = true
  try {
    await salesApi.createOrder({
      ...form.value,
      order_date: new Date(form.value.order_date).toISOString(),
      delivery_date: form.value.delivery_date ? new Date(form.value.delivery_date).toISOString() : null,
      items: validItems.map(i => ({
        finished_product_id: i.finished_product_id,
        quantity: parseFloat(i.quantity),
        unit_price: parseFloat(i.unit_price),
      })),
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
      delivery_date: editForm.value.delivery_date ? new Date(editForm.value.delivery_date).toISOString() : null,
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
    payment_date: nowLocalISO(),
    transaction_id: '', notes: '',
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

function openDetail(row) { selectedOrder.value = row; showDetailModal.value = true }
function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>