<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Kategoriyalar</h3>
      <AppButton @click="openCreate" :icon="Plus">Qo'shish</AppButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Nomi bo'yicha qidirish..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect
        v-model="typeFilter"
        :options="typeOptions"
        placeholder="Turi"
        class="w-44"
      />
    </div>

    <!-- Table -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading">
      <template #category_type="{ value }">
        <AppBadge :variant="value === 'income' ? 'success' : 'danger'">
          {{ value === 'income' ? 'Kirim' : 'Chiqim' }}
        </AppBadge>
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

    <!-- Modal -->
    <AppModal
      v-model="showModal"
      :title="editingId ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'"
      size="sm"
    >
      <form @submit.prevent="save" class="space-y-4">
        <AppInput
          v-model="form.name"
          label="Nomi"
          required
          :error="errors.name"
          placeholder="Kategoriya nomi"
        />
        <AppSelect
          v-model="form.category_type"
          label="Turi"
          required
          :options="[{ value: 'income', label: 'Kirim' }, { value: 'expense', label: 'Chiqim' }]"
          :error="errors.category_type"
        />
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Qo'shimcha ma'lumot..."
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
import { financeApi } from '@/api'
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
const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingId = ref(null)
const search = ref('')
const typeFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

const defaultForm = () => ({ name: '', category_type: 'income', description: '' })
const form = ref(defaultForm())

const typeOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'income', label: 'Kirim' },
  { value: 'expense', label: 'Chiqim' },
]

const columns = [
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'category_type', label: 'Turi' },
  { key: 'description', label: 'Izoh' },
  { key: 'is_active', label: 'Holat' },
  { key: 'actions', label: '', width: '80px' },
]

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i => i.name?.toLowerCase().includes(q))
  }
  if (typeFilter.value) result = result.filter(i => i.category_type === typeFilter.value)
  return result
})

async function load() {
  loading.value = true
  try {
    const { data: res } = await financeApi.getCategories({ page: page.value, limit: limit.value })
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
  form.value = {
    name: row.name || '',
    category_type: row.category_type || 'income',
    description: row.description || '',
  }
  errors.value = {}
  showModal.value = true
}

async function save() {
  errors.value = {}
  if (!form.value.name) { errors.value.name = 'Nom kiritilishi shart'; return }
  if (!form.value.category_type) { errors.value.category_type = 'Turni tanlang'; return }

  saving.value = true
  try {
    if (editingId.value) {
      await financeApi.updateCategory(editingId.value, form.value)
      toast.success('Kategoriya yangilandi!')
    } else {
      await financeApi.createCategory(form.value)
      toast.success("Kategoriya qo'shildi!")
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
    await financeApi.updateCategory(row.id, { is_active: !row.is_active })
    toast.success("Holat o'zgartirildi!")
    load()
  } catch {
    toast.error('Xatolik yuz berdi')
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>