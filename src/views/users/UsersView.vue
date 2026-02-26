<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Foydalanuvchilar</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tizim foydalanuvchilari va rollarini boshqarish
        </p>
      </div>
      <AppButton
        v-if="hasRole(['superadmin', 'admin'])"
        @click="openCreate"
        :icon="Plus"
      >
        Qo'shish
      </AppButton>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 flex-wrap">
      <AppInput
        v-model="search"
        placeholder="Ism, username yoki email bo'yicha..."
        :prefix-icon="Search"
        class="flex-1 min-w-[200px]"
      />
      <AppSelect
        v-model="roleFilter"
        :options="roleFilterOptions"
        placeholder="Rol"
        class="w-44"
      />
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        placeholder="Holat"
        class="w-40"
      />
    </div>

    <!-- Table -->
    <AppTable
      :columns="columns"
      :data="filteredData"
      :loading="loading"
      @row-click="openDetail"
    >
      <template #full_name="{ row }">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span class="text-xs font-bold text-primary">
              {{ initials(row) }}
            </span>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white text-sm leading-tight">
              {{ row.full_name || '—' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">@{{ row.username }}</p>
          </div>
        </div>
      </template>

      <template #role="{ value }">
        <AppBadge variant="info">{{ value?.name || '—' }}</AppBadge>
      </template>

      <template #is_active="{ value }">
        <AppBadge :variant="value ? 'success' : 'danger'">
          {{ value ? 'Faol' : 'Nofaol' }}
        </AppBadge>
      </template>

      <template #created_at="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton
            v-if="hasRole(['superadmin', 'admin'])"
            size="sm"
            variant="ghost"
            :icon="Edit"
            @click.stop="openEdit(row)"
          />
          <AppButton
            v-if="hasRole(['superadmin'])"
            size="sm"
            variant="ghost"
            :icon="Trash2"
            :disabled="authUser?.id === row.id"
            class="text-danger hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed"
            :title="authUser?.id === row.id ? 'O\'zingizni o\'chira olmaysiz' : 'O\'chirish'"
            @click.stop="authUser?.id !== row.id && confirmDelete(row)"
          />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- Create Modal -->
    <AppModal v-model="showCreateModal" title="Yangi foydalanuvchi" size="md">
      <form @submit.prevent="saveCreate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.full_name"
            label="To'liq ismi"
            required
            :error="errors.full_name"
            placeholder="Ism Familiya"
          />
          <AppInput
            v-model="form.username"
            label="Username"
            required
            :error="errors.username"
            placeholder="username"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.email"
            label="Email"
            type="email"
            required
            :error="errors.email"
            placeholder="email@example.com"
          />
          <AppInput
            v-model="form.phone"
            label="Telefon"
            placeholder="+998901234567"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.password"
            label="Parol"
            type="password"
            required
            :error="errors.password"
            placeholder="Kamida 8 belgi"
          />
          <AppSelect
            v-model="form.role_id"
            label="Rol"
            required
            :options="roleSelectOptions"
            :error="errors.role_id"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveCreate">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Edit Modal -->
    <AppModal v-model="showEditModal" title="Foydalanuvchini tahrirlash" size="md">
      <form @submit.prevent="saveEdit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="editForm.full_name"
            label="To'liq ismi"
            placeholder="Ism Familiya"
          />
          <AppInput
            v-model="editForm.email"
            label="Email"
            type="email"
            placeholder="email@example.com"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="editForm.phone"
            label="Telefon"
            placeholder="+998901234567"
          />
          <AppInput
            v-model="editForm.password"
            label="Yangi parol (ixtiyoriy)"
            type="password"
            placeholder="Bo'sh qoldirsa o'zgarmaydi"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppSelect
            v-if="hasRole(['superadmin'])"
            v-model="editForm.role_id"
            label="Rol"
            :options="roleSelectOptions"
          />
          <AppSelect
            v-if="hasRole(['superadmin'])"
            v-model="editForm.is_active"
            label="Holat"
            :options="[
              { value: true, label: 'Faol' },
              { value: false, label: 'Nofaol' },
            ]"
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showEditModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveEdit">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal v-model="showDetailModal" title="Foydalanuvchi ma'lumotlari" size="sm">
      <div v-if="selectedUser" class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span class="text-xl font-bold text-primary">{{ initials(selectedUser) }}</span>
          </div>
          <div class="flex-1">
            <p class="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              {{ selectedUser.full_name || selectedUser.username }}
            </p>
            <p class="text-sm text-gray-500">@{{ selectedUser.username }}</p>
          </div>
          <div class="flex flex-col items-end gap-1">
            <AppBadge variant="info">{{ selectedUser.role?.name || '—' }}</AppBadge>
            <AppBadge :variant="selectedUser.is_active ? 'success' : 'danger'">
              {{ selectedUser.is_active ? 'Faol' : 'Nofaol' }}
            </AppBadge>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Email</p>
            <p class="font-medium text-gray-900 dark:text-white break-all">{{ selectedUser.email }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Telefon</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedUser.phone || '—' }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Yaratilgan</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedUser.created_at) }}</p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Yangilangan</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(selectedUser.updated_at) }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="hasRole(['superadmin', 'admin'])"
          :icon="Edit"
          @click="openEdit(selectedUser); showDetailModal = false"
        >
          Tahrirlash
        </AppButton>
      </template>
    </AppModal>

    <!-- Delete Confirm Modal -->
    <AppModal v-model="showDeleteModal" title="O'chirishni tasdiqlash" size="sm">
      <div class="space-y-3">
        <div class="flex items-center gap-3 p-3 rounded-lg bg-danger/10 border border-danger/20">
          <AlertTriangle class="w-5 h-5 text-danger flex-shrink-0" />
          <p class="text-sm text-danger font-medium">Bu amalni ortga qaytarib bo'lmaydi!</p>
        </div>
        <p class="text-sm text-gray-700 dark:text-gray-300">
          <span class="font-semibold">
            {{ deletingUser?.full_name || deletingUser?.username }}
          </span>
          foydalanuvchisini o'chirishni tasdiqlaysizmi?
        </p>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDeleteModal = false">Bekor qilish</AppButton>
        <AppButton variant="danger" :loading="deleting" @click="deleteUser">
          Ha, o'chirish
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Trash2, AlertTriangle } from 'lucide-vue-next'
import { usersApi } from '@/api'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import AppTable from '@/components/ui/AppTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const { hasRole } = usePermission()
const toast = useToast()
const authStore = useAuthStore()
const authUser = computed(() => authStore.user)

// State
const data = ref([])
const rolesData = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const editingId = ref(null)
const selectedUser = ref(null)
const deletingUser = ref(null)
const search = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const errors = ref({})

// Forms
const defaultForm = () => ({
  full_name: '', username: '', email: '',
  phone: '', password: '', role_id: '',
})
const form = ref(defaultForm())
const editForm = ref({
  full_name: '', email: '', phone: '',
  password: '', role_id: '', is_active: true,
})

// Options
const statusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Nofaol' },
]

const columns = [
  { key: 'full_name', label: 'Foydalanuvchi', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefon' },
  { key: 'role', label: 'Rol' },
  { key: 'is_active', label: 'Holat' },
  { key: 'created_at', label: 'Yaratilgan' },
  { key: 'actions', label: '', width: '90px' },
]

const roleFilterOptions = computed(() => [
  { value: '', label: 'Barcha rollar' },
  ...rolesData.value.map(r => ({ value: r.id, label: r.name })),
])
const roleSelectOptions = computed(() =>
  rolesData.value.map(r => ({ value: r.id, label: r.name }))
)

const filteredData = computed(() => {
  let result = data.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(i =>
      i.full_name?.toLowerCase().includes(q) ||
      i.username?.toLowerCase().includes(q) ||
      i.email?.toLowerCase().includes(q)
    )
  }
  if (roleFilter.value) result = result.filter(i => i.role_id === roleFilter.value)
  if (statusFilter.value === 'active') result = result.filter(i => i.is_active)
  if (statusFilter.value === 'inactive') result = result.filter(i => !i.is_active)
  return result
})

// Helpers
function initials(user) {
  const name = user?.full_name || user?.username || '?'
  return name[0].toUpperCase()
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// Load
async function load() {
  loading.value = true
  try {
    const [usersRes, rolesRes] = await Promise.all([
      usersApi.getUsers({ page: page.value, limit: limit.value }),
      usersApi.getRoles(),
    ])
    data.value = usersRes.data?.items || usersRes.data || []
    total.value = usersRes.data?.total || data.value.length
    rolesData.value = rolesRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

// CRUD
function openCreate() {
  form.value = defaultForm()
  errors.value = {}
  showCreateModal.value = true
}

function openEdit(row) {
  editingId.value = row.id
  editForm.value = {
    full_name: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    password: '',
    role_id: row.role_id || '',
    is_active: row.is_active,
  }
  showEditModal.value = true
}

function openDetail(row) {
  selectedUser.value = row
  showDetailModal.value = true
}

function confirmDelete(row) {
  deletingUser.value = row
  showDeleteModal.value = true
}

async function saveCreate() {
  errors.value = {}
  if (!form.value.full_name) { errors.value.full_name = 'Ism kiritilishi shart'; return }
  if (!form.value.username) { errors.value.username = 'Username kiritilishi shart'; return }
  if (!form.value.email) { errors.value.email = 'Email kiritilishi shart'; return }
  if (!form.value.password) { errors.value.password = 'Parol kiritilishi shart'; return }
  if (form.value.password.length < 8) { errors.value.password = 'Kamida 8 belgi'; return }
  if (!form.value.role_id) { errors.value.role_id = 'Rolni tanlang'; return }

  saving.value = true
  try {
    await usersApi.createUser({
      full_name: form.value.full_name,
      username: form.value.username,
      email: form.value.email,
      phone: form.value.phone || null,
      password: form.value.password,
      role_id: form.value.role_id,
    })
    toast.success("Foydalanuvchi qo'shildi!")
    showCreateModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function saveEdit() {
  saving.value = true
  try {
    const payload = {
      full_name: editForm.value.full_name || null,
      email: editForm.value.email || null,
      phone: editForm.value.phone || null,
      is_active: editForm.value.is_active,
    }
    // superadmin rol o'zgartira oladi
    if (hasRole(['superadmin']) && editForm.value.role_id) {
      payload.role_id = editForm.value.role_id
    }
    // Parol faqat kiritilsa yuboriladi
    if (editForm.value.password) {
      payload.password = editForm.value.password
    }
    await usersApi.updateUser(editingId.value, payload)
    toast.success('Foydalanuvchi yangilandi!')
    showEditModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function deleteUser() {
  deleting.value = true
  try {
    await usersApi.deleteUser(deletingUser.value.id)
    toast.success("Foydalanuvchi o'chirildi!")
    showDeleteModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    deleting.value = false
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>