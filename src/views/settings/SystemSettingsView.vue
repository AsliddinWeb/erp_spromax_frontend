<template>
  <div class="p-6 max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tizim Sozlamalari</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Faqat superadmin o'zgartira oladi</p>
    </div>

    <!-- Timezone Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Clock class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-white">Vaqt Zonasi</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Joriy: <strong class="text-blue-600 dark:text-blue-400">{{ currentTz }}</strong>
          </p>
        </div>
      </div>

      <!-- Current time preview -->
      <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
        <span class="text-gray-500 dark:text-gray-400">Hozirgi tizim vaqti: </span>
        <span class="font-mono font-semibold text-gray-900 dark:text-white">{{ previewTime }}</span>
      </div>

      <!-- Timezone selector -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Vaqt zonasini tanlang
        </label>
        <select
          v-model="selectedTz"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option v-for="tz in availableTzList" :key="tz.timezone" :value="tz.timezone">
            {{ tz.description }} ({{ tz.offset }})
          </option>
        </select>

        <button
          @click="saveTz"
          :disabled="saving || selectedTz === currentTz"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <AppSpinner v-if="saving" size="sm" />
          <Save v-else class="w-4 h-4" />
          Saqlash
        </button>
      </div>
    </div>

    <!-- UI Scale Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <ZoomIn class="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 class="font-semibold text-gray-900 dark:text-white">Interfeys o'lchami</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Shrift va elementlar razmerini o'zgartirish</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="opt in scaleOptions"
          :key="opt.value"
          @click="applyScale(opt.value)"
          :class="[
            'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
            currentScale === opt.value
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
      <p class="text-xs text-gray-400 mt-3">Hozirgi: <strong class="text-gray-600 dark:text-gray-300">{{ scaleOptions.find(o => o.value === currentScale)?.label }}</strong></p>
    </div>

    <!-- Other Settings -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Settings class="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 class="font-semibold text-gray-900 dark:text-white">Boshqa Sozlamalar</h2>
      </div>

      <div v-if="loadingSettings" class="flex justify-center py-6">
        <AppSpinner />
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="s in otherSettings"
          :key="s.key"
          class="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ s.key }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ s.description }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <input
              v-model="editValues[s.key]"
              class="w-40 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              @click="saveSetting(s.key)"
              :disabled="editValues[s.key] === s.value"
              class="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
            >
              Saqlash
            </button>
          </div>
        </div>

        <p v-if="!otherSettings.length" class="text-sm text-gray-400 text-center py-4">
          Qo'shimcha sozlamalar yo'q
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Clock, Save, Settings, ZoomIn } from 'lucide-vue-next'
import { settingsApi } from '@/api'
import { useToast } from '@/composables/useToast'
import { useThemeStore } from '@/stores/theme'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const toast = useToast()
const themeStore = useThemeStore()

const scaleOptions = [
  { value: 'normal',  label: 'Normal (100%)' },
  { value: 'large',   label: 'Katta (110%)' },
  { value: 'xlarge',  label: 'Kattaroq (120%)' },
  { value: 'xxlarge', label: 'Eng katta (130%)' },
]
const currentScale = computed(() => themeStore.uiScale)

function applyScale(val) {
  themeStore.setScale(val)
}

const currentTz = ref('Asia/Tashkent')
const selectedTz = ref('Asia/Tashkent')
const availableTzList = ref([])
const allSettings = ref([])
const editValues = ref({})
const saving = ref(false)
const loadingSettings = ref(false)

// Clock preview
const previewTime = ref('')
let clockTimer = null

function updateClock() {
  previewTime.value = new Date().toLocaleString('ru-RU', {
    timeZone: selectedTz.value,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const otherSettings = computed(() =>
  allSettings.value.filter(s => s.key !== 'timezone')
)

async function loadTimezone() {
  try {
    const res = await settingsApi.getTimezone()
    currentTz.value = res.data.timezone
    selectedTz.value = res.data.timezone
    availableTzList.value = res.data.available || []
  } catch {
    availableTzList.value = [
      { timezone: 'Asia/Tashkent', offset: 'UTC+5', description: "Toshkent (O'zbekiston)" },
      { timezone: 'Europe/Moscow', offset: 'UTC+3', description: 'Moskva (Rossiya)' },
      { timezone: 'UTC',           offset: 'UTC+0', description: 'UTC (Universal)' },
    ]
  }
}

async function loadSettings() {
  loadingSettings.value = true
  try {
    const res = await settingsApi.getAll()
    allSettings.value = res.data
    res.data.forEach(s => { editValues.value[s.key] = s.value })
  } catch {
    // ignore
  } finally {
    loadingSettings.value = false
  }
}

async function saveTz() {
  saving.value = true
  try {
    await settingsApi.updateTimezone({ timezone: selectedTz.value })
    currentTz.value = selectedTz.value
    toast.success(`Vaqt zonasi "${selectedTz.value}" ga o'zgartirildi`)
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function saveSetting(key) {
  try {
    await settingsApi.updateSetting(key, { value: editValues.value[key] })
    const s = allSettings.value.find(x => x.key === key)
    if (s) s.value = editValues.value[key]
    toast.success('Saqlandi')
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  }
}

onMounted(() => {
  loadTimezone()
  loadSettings()
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>
