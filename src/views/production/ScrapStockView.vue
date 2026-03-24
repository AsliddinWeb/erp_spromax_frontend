<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Atxot mini sklad</h3>
      <AppButton
        v-if="hasRole(['superadmin','admin','director','production_manager'])"
        :icon="RefreshCcw"
        variant="secondary"
        @click="openGrinder"
      >
        Tegirmonga o'tkazish
      </AppButton>
    </div>

    <!-- Tabs -->
    <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
      <button
        @click="activeTab = 'recycled'"
        class="flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        :class="activeTab === 'recycled'
          ? 'bg-success text-white'
          : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'"
      >
        ♻️ Qayta ishlangan
        <span class="text-xs px-1.5 py-0.5 rounded-full" :class="activeTab === 'recycled' ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-700'">
          {{ recycledStock.length }}
        </span>
      </button>
      <button
        @click="activeTab = 'brak'"
        class="flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-l border-gray-200 dark:border-dark-border"
        :class="activeTab === 'brak'
          ? 'bg-orange-500 text-white'
          : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'"
      >
        ⚠️ Brak
        <span class="text-xs px-1.5 py-0.5 rounded-full" :class="activeTab === 'brak' ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-700'">
          {{ brakStock.length }}
        </span>
      </button>
    </div>

    <!-- ♻️ Qayta ishlangan tab -->
    <div v-if="activeTab === 'recycled'" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="p-4 rounded-xl border border-success/30 bg-success/5">
          <p class="text-xs text-success">Jami tur</p>
          <p class="text-2xl font-bold text-success mt-1">{{ recycledStock.length }}</p>
        </div>
        <div class="p-4 rounded-xl border border-success/30 bg-success/5">
          <p class="text-xs text-success">Tegirmonga o'tkazilgan jami</p>
          <p class="text-2xl font-bold text-success mt-1">{{ recycledTotal }}</p>
        </div>
      </div>

      <AppTable :columns="recycledColumns" :data="recycledStock" :loading="loading">
        <template #mahsulot="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.raw_material?.name || '—' }}</p>
            <p class="text-xs text-gray-500">{{ row.raw_material?.unit }}</p>
          </div>
        </template>
        <template #quantity="{ value }">
          <span class="font-semibold" :class="value > 0 ? 'text-success' : 'text-gray-400'">{{ value }}</span>
        </template>
        <template #last_updated="{ value }">{{ formatDate(value) }}</template>
        <template #recycled_actions="{ row }">
          <AppButton
            v-if="hasRole(['superadmin'])"
            size="sm" variant="ghost" :icon="Trash2"
            class="text-red-500 hover:text-red-700"
            @click.stop="handleDeleteScrap(row)"
          />
        </template>
      </AppTable>
    </div>

    <!-- ⚠️ Brak tab -->
    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div class="p-4 rounded-xl border border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/10">
          <p class="text-xs text-orange-600 dark:text-orange-400">Jami tur</p>
          <p class="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{{ brakStock.length }}</p>
        </div>
        <div class="p-4 rounded-xl border border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/10">
          <p class="text-xs text-orange-600 dark:text-orange-400">Mavjud qoldiqlar</p>
          <p class="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{{ brakStock.filter(s => s.quantity > 0).length }}</p>
        </div>
      </div>

      <AppTable :columns="brakColumns" :data="brakStock" :loading="loading">
        <template #mahsulot="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.finished_product?.name || '—' }}</p>
            <p class="text-xs text-gray-500">{{ row.finished_product?.unit }}</p>
          </div>
        </template>
        <template #quantity="{ value }">
          <span class="font-semibold" :class="value > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'">{{ value }}</span>
        </template>
        <template #last_updated="{ value }">{{ formatDate(value) }}</template>
        <template #actions="{ row }">
          <div class="flex gap-1">
            <AppButton
              v-if="hasRole(['superadmin','admin','director','production_manager']) && row.quantity > 0"
              size="sm" variant="ghost" :icon="RefreshCcw"
              class="text-success"
              @click.stop="openGrinderForProduct(row)"
            />
            <AppButton
              v-if="hasRole(['superadmin'])"
              size="sm" variant="ghost" :icon="Trash2"
              class="text-red-500 hover:text-red-700"
              @click.stop="handleDeleteScrap(row)"
            />
          </div>
        </template>
      </AppTable>
    </div>

    <!-- Harakatlar tarixi -->
    <div>
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Harakatlar tarixi</h4>
      <AppTable :columns="txnColumns" :data="filteredTransactions" :loading="txnLoading">
        <template #txn_mahsulot="{ row }">
          {{ row.stock_type === 'recycled' ? (row.raw_material?.name || '—') : (row.finished_product?.name || '—') }}
        </template>
        <template #transaction_type="{ value }">
          <AppBadge :variant="txnVariant(value)">{{ txnLabel(value) }}</AppBadge>
        </template>
        <template #quantity="{ value, row }">
          <span :class="['recycled_in','brak_in'].includes(row.transaction_type) ? 'text-orange-500' : 'text-success'">
            {{ ['recycled_in','brak_in'].includes(row.transaction_type) ? '+' : '-' }}{{ value }}
          </span>
        </template>
        <template #recorded_at="{ value }">{{ formatDateTime(value) }}</template>
      </AppTable>
    </div>

    <!-- Tegirmonga o'tkazish modal -->
    <AppModal v-model="showGrinderModal" title="Tegirmonga o'tkazish" size="md">
      <div class="space-y-4">
        <div class="space-y-3 p-3 rounded-xl border border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/10">
          <p class="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
            ⚠️ Kirish — Brak mahsulot
          </p>
          <AppSelect
            v-model="grinderForm.input_product_id"
            label="Brak mahsulot"
            required
            :options="brakStockOptions"
            :error="grinderErrors.input_product_id"
          />
          <div v-if="selectedBrakStock" class="text-xs text-gray-500">
            Mavjud qoldiq:
            <span class="font-semibold text-orange-600">{{ selectedBrakStock.quantity }}</span>
            {{ selectedBrakStock.finished_product?.unit }}
          </div>
          <AppInput
            v-model="grinderForm.input_quantity"
            label="Necha kg/dona kirdi"
            type="number"
            required
            :error="grinderErrors.input_quantity"
            placeholder="0"
          />
        </div>

        <div class="space-y-3 p-3 rounded-xl border border-success/30 bg-success/5">
          <p class="text-xs font-semibold text-success uppercase tracking-wide">
            ♻️ Chiqish — Qayta ishlangan xom ashyo
          </p>
          <AppSelect
            v-model="grinderForm.output_raw_material_id"
            label="Chiqadigan xom ashyo (granula va h.k.)"
            required
            :options="rawMaterialOptions"
            :error="grinderErrors.output_raw_material_id"
          />
          <p class="text-xs text-gray-400 -mt-1">
            💡 Asosiy ombor ga emas, atxot skladda (recycled) saqlanadi
          </p>
          <AppInput
            v-model="grinderForm.output_quantity"
            label="Necha kg/litr chiqdi (operator yozadi)"
            type="number"
            required
            :error="grinderErrors.output_quantity"
            placeholder="0"
          />
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="grinderForm.notes"
            rows="2"
            placeholder="Ixtiyoriy..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showGrinderModal = false">Bekor qilish</AppButton>
        <AppButton variant="success" :loading="saving" :icon="RefreshCcw" @click="doGrinder">
          O'tkazish
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RefreshCcw, Trash2 } from 'lucide-vue-next'
import { productionApi, warehouseApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { formatDate, formatDateTime } from '@/composables/useDate'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const { hasRole } = usePermission()
const toast = useToast()
const confirm = useConfirm

const stockData = ref([])
const transactions = ref([])
const loading = ref(false)
const txnLoading = ref(false)
const rawMaterialsData = ref([])
const saving = ref(false)
const showGrinderModal = ref(false)
const activeTab = ref('recycled')
const grinderErrors = ref({})
const grinderForm = ref({ input_product_id: '', input_quantity: '', output_raw_material_id: '', output_quantity: '', notes: '' })

const recycledColumns = computed(() => [
  { key: 'mahsulot', label: 'Xom ashyo' },
  { key: 'quantity', label: 'Qoldiq' },
  { key: 'last_updated', label: 'Oxirgi yangilanish' },
  ...(hasRole(['superadmin']) ? [{ key: 'recycled_actions', label: '', width: '60px' }] : []),
])
const brakColumns = computed(() => [
  { key: 'mahsulot', label: 'Mahsulot' },
  { key: 'quantity', label: 'Qoldiq' },
  { key: 'last_updated', label: 'Oxirgi yangilanish' },
  { key: 'actions', label: '', width: '60px' },
])
const txnColumns = [
  { key: 'txn_mahsulot', label: 'Mahsulot' },
  { key: 'transaction_type', label: 'Turi' },
  { key: 'quantity', label: 'Miqdor' },
  { key: 'recorded_at', label: 'Vaqt' },
]

const recycledStock = computed(() => stockData.value.filter(s => s.stock_type === 'recycled'))
const brakStock = computed(() => stockData.value.filter(s => s.stock_type === 'brak'))

const filteredTransactions = computed(() =>
  transactions.value.filter(t =>
    activeTab.value === 'recycled'
      ? ['recycled_in', 'recycled_out', 'brak_out'].includes(t.transaction_type)
      : ['brak_in', 'brak_out'].includes(t.transaction_type)
  )
)

const brakStockOptions = computed(() =>
  brakStock.value
    .filter(s => s.quantity > 0)
    .map(s => ({
      value: s.finished_product_id,
      label: `${s.finished_product?.name} (${s.quantity} ${s.finished_product?.unit})`
    }))
)
const rawMaterialOptions = computed(() =>
  rawMaterialsData.value.map(m => ({ value: m.id, label: `${m.name} (${m.unit})` }))
)
const selectedBrakStock = computed(() =>
  brakStock.value.find(s => s.finished_product_id === grinderForm.value.input_product_id)
)
const recycledTotal = computed(() =>
  transactions.value
    .filter(t => t.transaction_type === 'recycled_in')
    .reduce((sum, t) => sum + parseFloat(t.quantity || 0), 0)
)

function txnVariant(t) {
  return { brak_in: 'warning', brak_out: 'default', recycled_in: 'success', recycled_out: 'info' }[t] || 'default'
}
function txnLabel(t) {
  return {
    brak_in: 'Brak tushdi',
    brak_out: 'Tegirmonga ketdi',
    recycled_in: 'Tegirmondan kirim',
    recycled_out: 'Smenada ishlatildi',
  }[t] || t
}

async function load() {
  loading.value = true
  txnLoading.value = true
  try {
    const [stockRes, txnRes, rawRes] = await Promise.all([
      productionApi.getScrapStock(),
      productionApi.getScrapTransactions(),
      warehouseApi.getRawMaterials({ limit: 100 }),
    ])
    stockData.value = stockRes.data?.items || stockRes.data || []
    transactions.value = txnRes.data?.items || txnRes.data || []
    rawMaterialsData.value = rawRes.data?.items || rawRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
    txnLoading.value = false
  }
}

async function handleDeleteScrap(row) {
  const name = row.raw_material?.name || row.finished_product?.name || 'Yozuv'
  const ok = await confirm({
    title: 'Atxot yozuvini o\'chirish',
    message: `"${name}" atxot yozuvini o\'chirmoqchimisiz?`,
    confirmText: 'O\'chirish',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await productionApi.deleteScrapStock(row.id)
    toast.success('Atxot yozuvi o\'chirildi!')
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  }
}

function openGrinder() {
  grinderForm.value = { input_product_id: '', input_quantity: '', output_raw_material_id: '', output_quantity: '', notes: '' }
  grinderErrors.value = {}
  showGrinderModal.value = true
}
function openGrinderForProduct(row) {
  grinderForm.value = { input_product_id: row.finished_product_id, input_quantity: '', output_raw_material_id: '', output_quantity: '', notes: '' }
  grinderErrors.value = {}
  showGrinderModal.value = true
}

async function doGrinder() {
  grinderErrors.value = {}
  if (!grinderForm.value.input_product_id) { grinderErrors.value.input_product_id = 'Brak mahsulotni tanlang'; return }
  if (!grinderForm.value.input_quantity || parseFloat(grinderForm.value.input_quantity) <= 0) { grinderErrors.value.input_quantity = 'Miqdorni kiriting'; return }
  const max = selectedBrakStock.value?.quantity || 0
  if (parseFloat(grinderForm.value.input_quantity) > max) { grinderErrors.value.input_quantity = `Maksimal: ${max}`; return }
  if (!grinderForm.value.output_raw_material_id) { grinderErrors.value.output_raw_material_id = 'Chiqadigan xom ashyoni tanlang'; return }
  if (!grinderForm.value.output_quantity || parseFloat(grinderForm.value.output_quantity) <= 0) { grinderErrors.value.output_quantity = 'Miqdorni kiriting'; return }

  saving.value = true
  try {
    await productionApi.transferScrapToGrinder({
      input_product_id: grinderForm.value.input_product_id,
      input_quantity: parseFloat(grinderForm.value.input_quantity),
      output_raw_material_id: grinderForm.value.output_raw_material_id,
      output_quantity: parseFloat(grinderForm.value.output_quantity),
      notes: grinderForm.value.notes || null,
    })
    toast.success("Tegirmonga o'tkazildi!")
    showGrinderModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>