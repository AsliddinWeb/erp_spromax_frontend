<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Bo'limlar</h3>
      <AppButton @click="openCreate" :icon="Plus">Qo'shish</AppButton>
    </div>

    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Nomi bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
    </div>

    <AppTable :columns="columns" :data="filteredData" :loading="loading">
      <template #employee_count="{ value }">
        <span class="font-medium text-gray-900 dark:text-white">{{ value || 0 }} nafar</span>
      </template>

      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
        </AppBadge>
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton size="sm" variant="ghost" :icon="Edit" @click.stop="openEdit(row)" />
          <AppButton
            size="sm" variant="ghost"
            :icon="row.is_active ? EyeOff : Eye"
            @click.stop="toggleStatus(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <AppModal
      v-model="showModal"
      :title="editingId ? 'Bo\'limni tahrirlash' : 'Yangi bo\'lim'"
      size="sm"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Nomi"
          required
          :error="errors.name"
          placeholder="Bo'lim nomi"
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Bo'lim haqida..."
            class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="save">Saqlash</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Eye, EyeOff } from 'lucide-vue-next'
import { hrApi } from '@/api'
import { useToast } from '@/composables/useToast'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const toast = useToast()

const data = ref([])
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const search = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({ name: '', description: '' })
const form = ref(defaultForm())

const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'description', label: 'Izoh' },
  { key: 'employee_count', label: 'Xodimlar' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const filteredData = computed(() => {
  if (!search.value) return data.value
  const q = search.value.toLowerCase()
  return data.value.filter(i => i.name?.toLowerCase().includes(q))
})

async function load() {
  loading.value = true
  try {
    const { data: res } = await hrApi.getDepartments({ page: page.value, limit: limit.value })
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
  form.value = { name: row.name || '', description: row.description || '' }
  errors.value = {}
  showModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  saving.value = true
  try {
    if (editingId.value) {
      await hrApi.updateDepartment(editingId.value, form.value)
      toast.success("Bo'lim yangilandi!")
    } else {
      await hrApi.createDepartment(form.value)
      toast.success("Bo'lim qo'shildi!")
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
    await hrApi.updateDepartment(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>