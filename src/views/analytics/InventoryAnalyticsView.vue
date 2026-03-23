<template>
  <div class="space-y-5">
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <template v-else-if="data">
      <!-- Raw materials -->
      <div>
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Package class="w-4 h-4 text-primary" /> Xom ashyo
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Jami turlari" :value="data.total_raw_materials" unit="tur" color="primary" :icon="Package" />
          <StatCard label="Kam qoldiq" :value="data.low_stock_materials" unit="tur" color="danger" :icon="AlertTriangle" />
          <StatCard label="Umumiy qiymat" :value="formatMoney(data.total_raw_material_value)" color="success" :icon="Wallet" />
        </div>
      </div>

      <!-- Finished products -->
      <div>
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Box class="w-4 h-4 text-success" /> Tayyor mahsulotlar
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Jami turlari" :value="data.total_finished_products" unit="tur" color="primary" :icon="Box" />
          <StatCard label="Kam qoldiq" :value="data.low_stock_finished_products" unit="tur" color="danger" :icon="AlertTriangle" />
          <StatCard label="Umumiy qiymat" :value="formatMoney(data.total_finished_product_value)" color="success" :icon="Wallet" />
        </div>
      </div>

      <!-- Spare parts -->
      <div>
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Wrench class="w-4 h-4 text-warning" /> Ehtiyot qismlar
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Jami turlari" :value="data.total_spare_parts" unit="tur" color="primary" :icon="Wrench" />
          <StatCard label="Kam qoldiq" :value="data.low_stock_spare_parts" unit="tur" color="danger" :icon="AlertTriangle" />
          <StatCard label="Umumiy qiymat" :value="formatMoney(data.total_spare_parts_value)" color="success" :icon="Wallet" />
        </div>
      </div>

      <!-- Raw materials by category -->
      <div v-if="data.raw_materials_by_category?.length" class="rounded-xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-border overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
          <h4 class="font-semibold text-gray-900 dark:text-white text-sm">Xom ashyo kategoriyalari</h4>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-dark-border">
          <div
            v-for="(c, i) in data.raw_materials_by_category"
            :key="i"
            class="px-4 py-2.5 flex justify-between items-center text-sm"
          >
            <span class="text-gray-700 dark:text-gray-300">{{ c.category_name || c.name }}</span>
            <div class="flex items-center gap-3">
              <span class="text-gray-500">{{ c.count }} tur</span>
              <span class="font-semibold text-primary">{{ formatMoney(c.total_value || c.value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Package, AlertTriangle, Wallet, Box, Wrench } from 'lucide-vue-next'
import { analyticsApi } from '@/api'
import { useToast } from '@/composables/useToast'
import StatCard from '@/components/ui/StatCard.vue'

const toast = useToast()
const data = ref(null)
const loading = ref(false)

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return num.toLocaleString('uz-UZ') + ' so\'m'
}

async function load() {
  loading.value = true
  try {
    const res = await analyticsApi.getInventory()
    data.value = res.data
  } catch {
    toast.error('Inventar tahlilini yuklashda xatolik')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>