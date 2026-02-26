<template>
  <div class="w-full">
    <!-- Table wrapper -->
    <div class="overflow-x-auto rounded-xl border border-gray-100 dark:border-dark-border">
      <table class="w-full text-sm">
        <!-- Head -->
        <thead>
          <tr class="bg-gray-50 dark:bg-dark-700 border-b border-gray-100 dark:border-dark-border">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap"
              :class="[col.width ? `w-${col.width}` : '', col.sortable ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : '']"
              :style="col.width ? `width: ${col.width}` : ''"
              @click="col.sortable && toggleSort(col.key)"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <span v-if="col.sortable" class="flex flex-col">
                  <ChevronUp
                    class="w-3 h-3 -mb-1"
                    :class="sortKey === col.key && sortDir === 'asc' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'"
                  />
                  <ChevronDown
                    class="w-3 h-3"
                    :class="sortKey === col.key && sortDir === 'desc' ? 'text-primary' : 'text-gray-300 dark:text-gray-600'"
                  />
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="divide-y divide-gray-100 dark:divide-dark-border bg-white dark:bg-dark-800">

          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="i">
              <td v-for="col in columns" :key="col.key" class="px-4 py-3">
                <div class="h-4 bg-gray-100 dark:bg-dark-700 rounded animate-pulse" :style="`width: ${Math.random() * 40 + 50}%`"></div>
              </td>
            </tr>
          </template>

          <!-- Empty -->
          <template v-else-if="!data || data.length === 0">
            <tr>
              <td :colspan="columns.length" class="px-4 py-12 text-center">
                <div class="flex flex-col items-center gap-2">
                  <Inbox class="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  <p class="text-sm text-gray-400 dark:text-gray-500">{{ emptyText }}</p>
                </div>
              </td>
            </tr>
          </template>

          <!-- Data -->
          <template v-else>
            <tr
              v-for="(row, i) in sortedData"
              :key="row.id || i"
              class="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
              :class="onRowClick ? 'cursor-pointer' : ''"
              @click="onRowClick && onRowClick(row)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-gray-900 dark:text-gray-100 whitespace-nowrap"
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronUp, ChevronDown, Inbox } from 'lucide-vue-next'

const props = defineProps({
  columns:     { type: Array, default: () => [] },
  data:        { type: Array, default: () => [] },
  loading:     { type: Boolean, default: false },
  emptyText:   { type: String, default: "Ma'lumot topilmadi" },
  skeletonRows:{ type: Number, default: 5 },
  onRowClick:  { type: Function, default: null },
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
</script>