<template>
  <div class="w-full space-y-2">

    <!-- Natijalar soni -->
    <div v-if="!loading && data && data.length > 0" class="flex items-center justify-between px-1">
      <p class="text-xs text-gray-400 dark:text-gray-500">
        <span class="font-semibold text-gray-600 dark:text-gray-300">{{ data.length }}</span> ta natija
      </p>
    </div>

    <!-- DESKTOP: jadval -->
    <div class="hidden lg:block rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <!-- Sticky head -->
          <thead class="sticky top-0 z-10">
            <tr class="bg-gray-50 dark:bg-dark-700 border-b border-gray-100 dark:border-dark-700">
              <th
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap"
                :style="col.width ? `width: ${col.width}; min-width: ${col.width}` : 'min-width: 80px'"
                :class="col.sortable ? 'cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-300' : ''"
                @click="col.sortable && toggleSort(col.key)"
              >
                <div class="flex items-center gap-1">
                  {{ col.label }}
                  <span v-if="col.sortable" class="flex flex-col">
                    <ChevronUp class="w-3 h-3 -mb-1" :class="sortKey === col.key && sortDir === 'asc' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'" />
                    <ChevronDown class="w-3 h-3" :class="sortKey === col.key && sortDir === 'desc' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'" />
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="bg-white dark:bg-dark-800 divide-y divide-gray-50 dark:divide-dark-700/50">

            <!-- Loading skeleton -->
            <template v-if="loading">
              <tr v-for="i in skeletonRows" :key="i">
                <td v-for="col in columns" :key="col.key" class="px-4 py-3.5">
                  <div
                    class="h-4 bg-gray-100 dark:bg-dark-700 rounded animate-pulse"
                    :style="`width: ${col.skeletonWidth || '60%'}`"
                  />
                </td>
              </tr>
            </template>

            <!-- Empty -->
            <template v-else-if="!data || data.length === 0">
              <tr>
                <td :colspan="columns.length" class="px-4 py-14 text-center">
                  <slot name="empty">
                    <div class="flex flex-col items-center gap-3">
                      <div class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                        <Inbox class="w-6 h-6 text-gray-300 dark:text-gray-600" />
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-400 dark:text-gray-500">{{ emptyText }}</p>
                        <p class="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Hali hech narsa qo'shilmagan</p>
                      </div>
                    </div>
                  </slot>
                </td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else>
              <tr
                v-for="(row, i) in sortedData"
                :key="row.id || i"
                class="group transition-colors duration-100"
                :class="[
                  onRowClick ? 'cursor-pointer' : '',
                  i % 2 === 1 ? 'bg-gray-50/60 dark:bg-dark-700/20' : '',
                  'hover:bg-primary/5 dark:hover:bg-primary/5'
                ]"
                :style="`animation: fadeInRow 0.2s ease forwards; animation-delay: ${Math.min(i * 20, 300)}ms; opacity: 0`"
                @click="onRowClick && onRowClick(row)"
              >
                <td
                  v-for="col in columns"
                  :key="col.key"
                  class="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap tabular-nums"
                >
                  <slot :name="col.key" :row="row" :value="getVal(row, col.key)">
                    {{ getVal(row, col.key) ?? '—' }}
                  </slot>
                </td>
              </tr>
            </template>

          </tbody>
        </table>
      </div>
    </div>

    <!-- MOBILE: card view -->
    <div class="lg:hidden space-y-3">
      <template v-if="loading">
        <div v-for="i in skeletonRows" :key="i" class="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-border p-4 space-y-3">
          <div class="h-4 bg-gray-100 dark:bg-dark-700 rounded animate-pulse w-2/3" />
          <div class="h-3 bg-gray-100 dark:bg-dark-700 rounded animate-pulse w-1/2" />
          <div class="h-3 bg-gray-100 dark:bg-dark-700 rounded animate-pulse w-3/4" />
        </div>
      </template>

      <template v-else-if="!data || data.length === 0">
        <div class="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-border px-4 py-12 text-center">
          <slot name="empty">
            <div class="flex flex-col items-center gap-2">
              <Inbox class="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p class="text-sm text-gray-400 dark:text-gray-500">{{ emptyText }}</p>
            </div>
          </slot>
        </div>
      </template>

      <template v-else>
        <div
          v-for="(row, i) in sortedData"
          :key="row.id || i"
          class="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-border p-4 space-y-3 transition-colors active:bg-gray-50 dark:active:bg-dark-700/50"
          :class="onRowClick ? 'cursor-pointer' : ''"
          @click="onRowClick && onRowClick(row)"
        >
          <div v-if="firstCol" class="flex items-start justify-between gap-2">
            <div class="text-sm font-semibold text-gray-900 dark:text-white">
              <slot :name="firstCol.key" :row="row" :value="getVal(row, firstCol.key)">
                {{ getVal(row, firstCol.key) ?? '—' }}
              </slot>
            </div>
            <div v-if="statusCol" class="flex-shrink-0">
              <slot :name="statusCol.key" :row="row" :value="getVal(row, statusCol.key)">
                {{ getVal(row, statusCol.key) ?? '—' }}
              </slot>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            <template v-for="col in middleCols" :key="col.key">
              <div v-if="col.label">
                <p class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{{ col.label }}</p>
                <div class="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                  <slot :name="col.key" :row="row" :value="getVal(row, col.key)">
                    {{ getVal(row, col.key) ?? '—' }}
                  </slot>
                </div>
              </div>
            </template>
          </div>
          <div v-if="actionsCol" class="pt-2 border-t border-gray-100 dark:border-dark-border flex justify-end" @click.stop>
            <slot :name="actionsCol.key" :row="row" :value="getVal(row, actionsCol.key)" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronUp, ChevronDown, Inbox } from 'lucide-vue-next'

const props = defineProps({
  columns:      { type: Array, default: () => [] },
  data:         { type: Array, default: () => [] },
  loading:      { type: Boolean, default: false },
  emptyText:    { type: String, default: "Ma'lumot topilmadi" },
  skeletonRows: { type: Number, default: 5 },
  onRowClick:   { type: Function, default: null },
})

const sortKey = ref('')
const sortDir = ref('asc')

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function getVal(row, key) {
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

const sortedData = computed(() => {
  if (!sortKey.value) return props.data
  return [...props.data].sort((a, b) => {
    const aVal = getVal(a, sortKey.value)
    const bVal = getVal(b, sortKey.value)
    if (aVal === bVal) return 0
    const result = aVal > bVal ? 1 : -1
    return sortDir.value === 'asc' ? result : -result
  })
})

const firstCol = computed(() => props.columns[0] || null)
const statusCol = computed(() => props.columns.find(c => ['status','is_paid','is_active'].includes(c.key)))
const actionsCol = computed(() => props.columns.find(c => c.key === 'actions'))
const middleCols = computed(() => {
  const skip = new Set([firstCol.value?.key, statusCol.value?.key, actionsCol.value?.key])
  return props.columns.filter(c => !skip.has(c.key) && c.label)
})
</script>

<style>
@keyframes fadeInRow {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>