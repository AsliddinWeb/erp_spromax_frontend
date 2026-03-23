<template>
  <div class="max-w-4xl mx-auto space-y-6">

    <!-- Avatar + asosiy ma'lumotlar -->
    <div class="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-border p-6">
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <!-- Avatar -->
        <div class="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
          <span class="text-3xl font-bold text-white">{{ userInitial }}</span>
        </div>

        <!-- Info -->
        <div class="flex-1 text-center sm:text-left">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ user?.full_name }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">@{{ user?.username }}</p>
          <span class="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {{ user?.role?.name }}
          </span>

          <div class="flex flex-col sm:flex-row gap-3 mt-3 text-sm text-gray-600 dark:text-gray-400">
            <div class="flex items-center gap-1.5">
              <Mail class="w-4 h-4 text-gray-400 flex-shrink-0" />
              {{ user?.email || '—' }}
            </div>
            <div v-if="user?.phone" class="flex items-center gap-1.5">
              <Phone class="w-4 h-4 text-gray-400 flex-shrink-0" />
              {{ user?.phone }}
            </div>
          </div>
        </div>

        <!-- Tugmalar -->
        <div class="flex gap-2 flex-shrink-0">
          <AppButton variant="secondary" :icon="Pencil" size="sm" @click="openEdit">
            Tahrirlash
          </AppButton>
          <AppButton variant="secondary" :icon="KeyRound" size="sm" @click="openPassword">
            Parol
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Rol ga qarab statistika -->
    <div v-if="loading" class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-24 rounded-2xl bg-gray-100 dark:bg-dark-700 animate-pulse" />
    </div>

    <template v-else-if="stats">
      <!-- superadmin / admin / director -->
      <template v-if="isAdmin">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tizim statistikasi</h3>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard :icon="Users" label="Jami xodimlar" :value="stats.total_employees" color="primary" />
          <StatCard :icon="TrendingUp" label="Bugungi daromad" :value="formatMoney(stats.revenue_today)" color="success" />
          <StatCard :icon="ShoppingCart" label="Kutilayotgan buyurtmalar" :value="stats.pending_orders" color="warning" />
          <StatCard :icon="Factory" label="Faol smenalar" :value="stats.active_shifts" color="primary" />
        </div>
      </template>

      <!-- warehouse_manager -->
      <template v-else-if="role === 'warehouse_manager'">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ombor holati</h3>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard :icon="Package" label="Jami materiallar" :value="stats.total_raw_materials" color="primary" />
          <StatCard :icon="PackageX" label="Kam qoldiqlar" :value="stats.low_stock_items_count" color="danger" />
          <StatCard :icon="ClipboardList" label="Kutilayotgan so'rovlar" :value="stats.pending_requests_count" color="warning" />
          <StatCard :icon="Wallet" label="Oy qiymati" :value="formatMoney(stats.total_receipts_value_this_month)" color="success" />
        </div>
      </template>

      <!-- operator / production_manager -->
      <template v-else-if="role === 'operator' || role === 'production_manager'">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ishlab chiqarish</h3>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard :icon="Factory" label="Faol smenalar" :value="stats.active_shifts" color="primary" />
          <StatCard :icon="Package" label="Bugungi mahsulot" :value="stats.total_output_today" color="success" />
          <StatCard :icon="AlertTriangle" label="Bugungi brak" :value="stats.total_defects_today" color="danger" />
          <StatCard :icon="Users" label="Jami xodimlar" :value="stats.total_employees" color="default" />
        </div>
      </template>

      <!-- sales_manager -->
      <template v-else-if="role === 'sales_manager'">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sotuv ko'rsatkichlari</h3>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard :icon="TrendingUp" label="Bugungi sotuv" :value="formatMoney(stats.revenue_today)" color="success" />
          <StatCard :icon="Wallet" label="Oy daromadi" :value="formatMoney(stats.total_revenue)" color="primary" />
          <StatCard :icon="ShoppingCart" label="Kutilayotgan buyurtmalar" :value="stats.pending_orders" color="warning" />
          <StatCard :icon="Users" label="Jami mijozlar" :value="stats.total_customers" color="default" />
        </div>
      </template>

      <!-- accountant -->
      <template v-else-if="role === 'accountant'">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Moliya xulosasi</h3>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard :icon="TrendingUp" label="Bugungi daromad" :value="formatMoney(stats.income_today)" color="success" />
          <StatCard :icon="TrendingDown" label="Bugungi xarajat" :value="formatMoney(stats.expense_today)" color="danger" />
          <StatCard :icon="Wallet" label="Oy foydasi" :value="formatMoney(stats.income_this_month - stats.expense_this_month)" color="primary" />
          <StatCard :icon="BarChart2" label="Jami tranzaksiyalar" :value="stats.total_transactions" color="default" />
        </div>
      </template>

      <!-- hr_manager -->
      <template v-else-if="role === 'hr_manager'">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HR xulosasi</h3>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard :icon="Users" label="Jami xodimlar" :value="stats.total_employees" color="primary" />
          <StatCard :icon="UserCheck" label="Bugungi davomat" :value="stats.present_today" color="success" />
          <StatCard :icon="UserX" label="Shu kun yo'q" :value="stats.absent_today" color="danger" />
          <StatCard :icon="ClipboardList" label="Kutilayotgan ta'til" :value="stats.pending_leave_requests" color="warning" />
        </div>
      </template>

      <!-- maintenance -->
      <template v-else-if="role === 'maintenance'">
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Texnik xizmat</h3>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard :icon="ClipboardList" label="Kutilayotgan so'rovlar" :value="stats.pending_requests" color="warning" />
          <StatCard :icon="Wrench" label="Jarayondagi" :value="stats.in_progress_requests" color="primary" />
          <StatCard :icon="PackageX" label="Kam ehtiyot qismlar" :value="stats.low_stock_parts" color="danger" />
          <StatCard :icon="CheckCircle" label="Bajarilgan" :value="stats.completed_requests" color="success" />
        </div>
      </template>
    </template>

    <!-- Profil tahrirlash modali -->
    <AppModal v-model="showEditModal" title="Ma'lumotlarni tahrirlash" size="sm">
      <form @submit.prevent="saveProfile" class="space-y-4">
        <AppInput v-model="editForm.full_name" label="To'liq ism" required :error="editErrors.full_name" />
        <AppInput v-model="editForm.email" label="Email" type="email" required :error="editErrors.email" />
        <AppInput v-model="editForm.phone" label="Telefon" placeholder="+998901234567" :error="editErrors.phone" />
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showEditModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" @click="saveProfile">Saqlash</AppButton>
      </template>
    </AppModal>

    <!-- Parol o'zgartirish modali -->
    <AppModal v-model="showPasswordModal" title="Parol o'zgartirish" size="sm">
      <form @submit.prevent="savePassword" class="space-y-4">
        <AppInput v-model="pwForm.old_password" label="Joriy parol" type="password" required :error="pwErrors.old_password" />
        <AppInput v-model="pwForm.new_password" label="Yangi parol" type="password" required :error="pwErrors.new_password" placeholder="Kamida 8 belgi, katta harf, raqam" />
        <AppInput v-model="pwForm.confirm_password" label="Yangi parolni tasdiqlang" type="password" required :error="pwErrors.confirm_password" />
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="showPasswordModal = false">Bekor qilish</AppButton>
        <AppButton :loading="pwSaving" @click="savePassword">Saqlash</AppButton>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Mail, Phone, Pencil, KeyRound,
  Users, TrendingUp, TrendingDown, ShoppingCart, Factory,
  Package, PackageX, Wallet, ClipboardList, Wrench,
  BarChart2, UserCheck, UserX, AlertTriangle, CheckCircle
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { authApi, analyticsApi, warehouseApi, salesApi, financeApi, hrApi, maintenanceApi } from '@/api'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import StatCard from '@/components/ui/StatCard.vue'

const authStore = useAuthStore()
const toast = useToast()

const user = computed(() => authStore.user)
const role = computed(() => user.value?.role?.name)
const isAdmin = computed(() => ['superadmin', 'admin', 'director'].includes(role.value))

const userInitial = computed(() => {
  const name = user.value?.full_name || user.value?.username || '?'
  return name[0].toUpperCase()
})

const stats = ref(null)
const loading = ref(false)

// Modal state
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const saving = ref(false)
const pwSaving = ref(false)
const editErrors = ref({})
const pwErrors = ref({})

const editForm = ref({ full_name: '', email: '', phone: '' })
const pwForm = ref({ old_password: '', new_password: '', confirm_password: '' })

function formatMoney(val) {
  const num = Number(val || 0)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + ' mlrd'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + ' mln'
  return Math.round(num).toLocaleString('uz-UZ') + " so'm"
}

async function loadStats() {
  loading.value = true
  try {
    const r = role.value
    if (isAdmin.value || r === 'operator' || r === 'production_manager') {
      const { data } = await analyticsApi.getDashboard()
      stats.value = data
    } else if (r === 'warehouse_manager') {
      const { data } = await warehouseApi.getStatistics()
      stats.value = data
    } else if (r === 'sales_manager') {
      const { data } = await salesApi.getStatistics()
      stats.value = data
    } else if (r === 'accountant') {
      const { data } = await financeApi.getStatistics()
      stats.value = data
    } else if (r === 'hr_manager') {
      const { data } = await hrApi.getStatistics()
      stats.value = data
    } else if (r === 'maintenance') {
      const { data } = await maintenanceApi.getStatistics()
      stats.value = data
    }
  } catch {
    // statistika yuklanmasa ham profil ishlaydi
  } finally {
    loading.value = false
  }
}

function openEdit() {
  editForm.value = {
    full_name: user.value?.full_name || '',
    email: user.value?.email || '',
    phone: user.value?.phone || '',
  }
  editErrors.value = {}
  showEditModal.value = true
}

function openPassword() {
  pwForm.value = { old_password: '', new_password: '', confirm_password: '' }
  pwErrors.value = {}
  showPasswordModal.value = true
}

async function saveProfile() {
  editErrors.value = {}
  if (!editForm.value.full_name) { editErrors.value.full_name = 'Ismni kiriting'; return }
  if (!editForm.value.email) { editErrors.value.email = 'Emailni kiriting'; return }

  saving.value = true
  try {
    const { data } = await authApi.updateProfile({
      full_name: editForm.value.full_name,
      email: editForm.value.email,
      phone: editForm.value.phone || null,
    })
    authStore.user = data
    toast.success("Ma'lumotlar yangilandi!")
    showEditModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function savePassword() {
  pwErrors.value = {}
  if (!pwForm.value.old_password) { pwErrors.value.old_password = 'Joriy parolni kiriting'; return }
  if (!pwForm.value.new_password) { pwErrors.value.new_password = 'Yangi parolni kiriting'; return }
  if (pwForm.value.new_password.length < 8) { pwErrors.value.new_password = 'Kamida 8 belgi'; return }
  if (pwForm.value.new_password !== pwForm.value.confirm_password) {
    pwErrors.value.confirm_password = 'Parollar mos kelmaydi'; return
  }

  pwSaving.value = true
  try {
    await authApi.changePassword({
      old_password: pwForm.value.old_password,
      new_password: pwForm.value.new_password,
    })
    toast.success('Parol muvaffaqiyatli o\'zgartirildi!')
    showPasswordModal.value = false
  } catch (e) {
    const msg = e.response?.data?.detail
    if (msg?.toLowerCase().includes('old') || msg?.toLowerCase().includes('joriy') || msg?.toLowerCase().includes('eski')) {
      pwErrors.value.old_password = 'Joriy parol noto\'g\'ri'
    } else {
      toast.error(msg || 'Xatolik yuz berdi')
    }
  } finally {
    pwSaving.value = false
  }
}

onMounted(loadStats)
</script>