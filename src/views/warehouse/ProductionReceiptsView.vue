<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ishlab chiqarishdan qabul</h3>
      <AppBadge variant="success">Barchasi avto tasdiqlangan</AppBadge>
    </div>

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="data"
      :loading="loading"
    >
      <template #status="{ value }">
        <AppBadge variant="success">Tasdiqlangan</AppBadge>
      </template>

      <template #received_at="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #quantity="{ value, row }">
        {{ value }} {{ row.finished_product?.unit || '' }}
      </template>
    </AppTable>

    <!-- Pagination -->
    <AppPagination
      :page="page"
      :limit="limit"
      :total="total"
      @change="onPageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { warehouseApi } from '@/api'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const toast = useToast()
const data = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const columns = [
  { key: 'finished_product.name', label: 'Mahsulot', sortable: true },
  { key: 'quantity', label: 'Miqdor' },
  { key: 'status', label: 'Holat' },
  { key: 'received_at', label: 'Qabul sanasi' },
  { key: 'notes', label: 'Izoh' },
]

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function load() {
  loading.value = true
  try {
    const res = await warehouseApi.getProductionReceipts({ page: page.value, limit: limit.value })
    data.value = res.data?.items || []
    total.value = res.data?.total || 0
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function onPageChange(newPage) {
  page.value = newPage
  load()
}

onMounted(load)
</script>
