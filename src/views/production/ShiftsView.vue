<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Smenalar</h3>
      <div class="flex gap-2">
        <AppButton
          v-if="isOperator"
          :variant="showMyOnly ? 'primary' : 'secondary'"
          :icon="User"
          @click="showMyOnly = !showMyOnly"
        >
          Mening smenalarim
        </AppButton>
        <AppButton
          v-if="hasRole(['superadmin','admin','director','production_manager','operator'])"
          @click="openCreate"
          :icon="Plus"
        >
          Smena boshlash
        </AppButton>
      </div>
    </div>

    <!-- Active shifts banner -->
    <div v-if="activeShifts.length" class="space-y-2">
      <div
        v-for="shift in activeShifts"
        :key="shift.id"
        class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-success/30 bg-success/5 dark:bg-success/10"
      >
        <div class="flex items-center gap-3">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ shift.production_line?.name }} — faol smena
            </p>
            <p class="text-xs text-gray-500">
              Boshlangan: {{ formatDateTime(shift.start_time) }} · {{ calcDuration(shift) }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <AppButton size="sm" variant="secondary" :icon="PauseCircle" @click="openPause(shift)">To'xtatish</AppButton>
          <AppButton size="sm" variant="secondary" :icon="PackagePlus" @click="openMaterialModal(shift)">Material</AppButton>
          <AppButton size="sm" variant="success" :icon="CheckSquare" @click="openClose(shift)">Yakunlash</AppButton>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3">
      <AppSelect v-model="lineFilter" :options="lineOptions" placeholder="Liniya" class="w-48" />
      <AppSelect v-model="statusFilter" :options="shiftStatusOptions" placeholder="Holat" class="w-44" />
    </div>

    <!-- Table — eng yangi yuqorida -->
    <AppTable :columns="columns" :data="filteredData" :loading="loading" @row-click="openDetail">
      <template #status="{ value }">
        <AppBadge :variant="shiftStatusVariant(value)">{{ shiftStatusLabel(value) }}</AppBadge>
      </template>
      <template #production_line="{ value }">{{ value?.name || '—' }}</template>
      <template #operator="{ value }">{{ value?.full_name || value?.username || '—' }}</template>
      <template #start_time="{ value }">{{ formatDateTime(value) }}</template>
      <template #end_time="{ value }">{{ value ? formatDateTime(value) : '—' }}</template>
      <template #duration="{ row }">{{ calcDuration(row) }}</template>
      <template #actions="{ row }">
        <div class="flex gap-1">
          <AppButton v-if="row.status === 'active' && canManage(row)" size="sm" variant="ghost" :icon="PauseCircle" class="text-warning" @click.stop="openPause(row)" />
          <AppButton v-if="row.status === 'active' && canManage(row)" size="sm" variant="ghost" :icon="CheckSquare" class="text-success" @click.stop="openClose(row)" />
          <AppButton size="sm" variant="ghost" :icon="Eye" @click.stop="openDetail(row)" />
        </div>
      </template>
    </AppTable>

    <AppPagination :page="page" :limit="limit" :total="total" @change="onPageChange" />

    <!-- 1. SMENA BOSHLASH -->
    <AppModal v-model="showCreateModal" title="Smena boshlash" size="md">
      <div class="space-y-4">
        <div class="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
          <Clock class="w-5 h-5 text-primary flex-shrink-0" />
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Boshlanish vaqti (avtomatik)</p>
            <p class="font-semibold text-gray-900 dark:text-white">{{ currentTimeDisplay }}</p>
          </div>
        </div>
        <AppSelect v-model="form.production_line_id" label="Ishlab chiqarish liniyasi" required :options="lineSelectOptions" :error="errors.production_line_id" />
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Mashinalar <span class="text-gray-400 font-normal">(ixtiyoriy)</span></label>
          <div class="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-dark-border p-3">
            <label v-for="machine in availableMachines" :key="machine.id" class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 px-1 py-0.5 rounded">
              <input type="checkbox" :value="machine.id" v-model="form.machine_ids" class="rounded border-gray-300 text-primary focus:ring-primary" />
              <span class="text-sm text-gray-700 dark:text-gray-300">{{ machine.name }}</span>
            </label>
            <p v-if="!availableMachines.length" class="text-sm text-gray-400 text-center py-2">Liniyani tanlang</p>
          </div>
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
          <textarea v-model="form.notes" rows="2" placeholder="Qo'shimcha ma'lumot..." class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-gray-900 dark:text-white" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showCreateModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" :icon="Play" @click="saveCreate">Boshlash</AppButton>
      </template>
    </AppModal>

    <!-- 2. PAUZA -->
    <AppModal v-model="showPauseModal" title="Smena to'xtatish" size="sm">
      <div class="space-y-4">
        <div v-if="activePause" class="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
          <p class="font-medium text-warning">Smena to'xtatilgan</p>
          <p class="text-gray-500 mt-1">{{ formatDateTime(activePause.paused_at) }} dan beri</p>
          <p class="text-gray-500">Sabab: {{ pauseReasonLabel(activePause.reason) }}</p>
        </div>
        <template v-else>
          <AppSelect v-model="pauseForm.reason" label="To'xtatish sababi" required :options="pauseReasonOptions" :error="pauseErrors.reason" />
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
            <textarea v-model="pauseForm.notes" rows="2" placeholder="Ixtiyoriy..." class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-gray-900 dark:text-white" />
          </div>
        </template>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showPauseModal = false">Yopish</AppButton>
        <AppButton v-if="activePause" variant="success" :loading="saving" :icon="Play" @click="doResume">Davom ettirish</AppButton>
        <AppButton v-else variant="warning" :loading="saving" :icon="PauseCircle" @click="doPause">To'xtatish</AppButton>
      </template>
    </AppModal>

    <!-- 3. MATERIAL OLISH -->
    <AppModal v-model="showMaterialModal" title="Material olish" size="md">
      <div class="space-y-4">
        <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
          <button @click="materialTab = 'warehouse'" class="flex-1 py-2 text-sm font-medium transition-colors" :class="materialTab === 'warehouse' ? 'bg-primary text-white' : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'">🏭 Ombordan</button>
          <button @click="materialTab = 'scrap'" class="flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-dark-border" :class="materialTab === 'scrap' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400'">♻️ Atxot skladdan</button>
        </div>

        <div v-if="materialTab === 'warehouse'" class="space-y-3">
          <AppSelect v-model="materialForm.raw_material_id" label="Xom ashyo" required :options="rawMaterialOptions" :error="materialErrors.raw_material_id" />
          <AppInput v-model="materialForm.quantity" label="Miqdor" type="number" required :error="materialErrors.quantity" placeholder="0" />
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
            <textarea v-model="materialForm.notes" rows="2" placeholder="Ixtiyoriy..." class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-gray-900 dark:text-white" />
          </div>
        </div>

        <div v-else class="space-y-3">
          <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border">
            <button @click="scrapUsageForm.stock_type = 'recycled'; scrapUsageForm.finished_product_id = ''" class="flex-1 py-2 text-sm font-medium transition-colors" :class="scrapUsageForm.stock_type === 'recycled' ? 'bg-success text-white' : 'bg-white dark:bg-dark-800 text-gray-600'">♻️ Qayta ishlangan</button>
            <button @click="scrapUsageForm.stock_type = 'brak'; scrapUsageForm.finished_product_id = ''" class="flex-1 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-dark-border" :class="scrapUsageForm.stock_type === 'brak' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-dark-800 text-gray-600'">⚠️ Brak</button>
          </div>
          <div v-if="scrapProductOptions.length === 0" class="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-sm text-center text-orange-600">
            {{ scrapUsageForm.stock_type === 'recycled' ? 'Qayta ishlangan atxot yoq' : 'Brak qoldiq yoq' }}
          </div>
          <div v-else class="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-sm">
            <p class="font-medium text-orange-700 dark:text-orange-400 mb-2">Mavjud qoldiqlar:</p>
            <div class="space-y-1">
              <div v-for="s in scrapStockData.filter(x => x.quantity > 0 && x.stock_type === scrapUsageForm.stock_type)" :key="s.id" class="flex justify-between text-gray-700 dark:text-gray-300">
                <span>{{ scrapUsageForm.stock_type === 'recycled' ? s.raw_material?.name : s.finished_product?.name }}</span>
                <span class="font-medium">{{ s.quantity }} {{ scrapUsageForm.stock_type === 'recycled' ? s.raw_material?.unit : s.finished_product?.unit }}</span>
              </div>
            </div>
          </div>
          <AppSelect
            :modelValue="scrapUsageForm.stock_type === 'recycled' ? scrapUsageForm.raw_material_id : scrapUsageForm.finished_product_id"
            label="Mahsulot" required :options="scrapProductOptions" :error="scrapUsageErrors.finished_product_id"
            @update:modelValue="v => scrapUsageForm.stock_type === 'recycled' ? (scrapUsageForm.raw_material_id = v) : (scrapUsageForm.finished_product_id = v)"
          />
          <AppInput v-model="scrapUsageForm.quantity_used" label="Miqdor" type="number" required :error="scrapUsageErrors.quantity_used" placeholder="0" />
          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Izoh</label>
            <textarea v-model="scrapUsageForm.notes" rows="2" placeholder="Ixtiyoriy..." class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showMaterialModal = false">Bekor qilish</AppButton>
        <AppButton :loading="saving" :icon="PackagePlus" @click="saveMaterial">Qoshish</AppButton>
      </template>
    </AppModal>

    <!-- 4. SMENA YOPISH -->
    <AppModal v-model="showCloseModal" title="Smenani yakunlash" size="lg">
      <div v-if="selectedShift" class="space-y-5">
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700 text-sm grid grid-cols-2 gap-2">
          <div><p class="text-gray-500">Liniya</p><p class="font-medium text-gray-900 dark:text-white">{{ selectedShift.production_line?.name }}</p></div>
          <div><p class="text-gray-500">Davomiyligi</p><p class="font-medium text-gray-900 dark:text-white">{{ calcDuration(selectedShift) }}</p></div>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Package class="w-4 h-4 text-success" />Tayyor mahsulotlar</h4>
            <AppButton size="sm" variant="secondary" :icon="Plus" @click="addOutput">Qoshish</AppButton>
          </div>
          <div v-for="(item, idx) in closeForm.outputs" :key="idx" class="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-success/5 border border-success/20">
            <div class="col-span-7"><AppSelect v-model="item.finished_product_id" :label="idx === 0 ? 'Mahsulot' : ''" :options="finishedProductOptions" placeholder="Tanlang" /></div>
            <div class="col-span-4"><AppInput v-model="item.quantity_produced" :label="idx === 0 ? 'Miqdor' : ''" type="number" placeholder="0" /></div>
            <div class="col-span-1 pb-1"><AppButton size="sm" variant="ghost" :icon="Trash2" class="text-danger" @click="removeOutput(idx)" /></div>
          </div>
          <p v-if="!closeForm.outputs.length" class="text-sm text-gray-400 text-center py-2 border border-dashed border-gray-200 dark:border-dark-border rounded-lg">+ Tayyor mahsulot qoshing</p>
        </div>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle class="w-4 h-4 text-orange-500" />Atxot (brak) mahsulotlar</h4>
            <AppButton size="sm" variant="secondary" :icon="Plus" @click="addScrap">Qoshish</AppButton>
          </div>
          <div v-for="(item, idx) in closeForm.scraps" :key="idx" class="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
            <div class="col-span-5"><AppSelect v-model="item.finished_product_id" :label="idx === 0 ? 'Mahsulot' : ''" :options="finishedProductOptions" placeholder="Tanlang" /></div>
            <div class="col-span-3"><AppInput v-model="item.quantity" :label="idx === 0 ? 'Miqdor' : ''" type="number" placeholder="0" /></div>
            <div class="col-span-3"><AppSelect v-model="item.defect_reason_id" :label="idx === 0 ? 'Sabab' : ''" :options="defectReasonOptions" placeholder="Sabab" /></div>
            <div class="col-span-1 pb-1"><AppButton size="sm" variant="ghost" :icon="Trash2" class="text-danger" @click="removeScrap(idx)" /></div>
          </div>
          <p v-if="!closeForm.scraps.length" class="text-sm text-gray-400 text-center py-2 border border-dashed border-orange-200 dark:border-orange-800/30 rounded-lg">+ Atxot mahsulot qoshing (agar bor bolsa)</p>
        </div>
        <div v-if="closeForm.outputs.length || closeForm.scraps.length" class="p-3 rounded-lg bg-gray-50 dark:bg-dark-700 flex gap-6 text-sm">
          <div><p class="text-gray-500">Tayyor jami</p><p class="font-bold text-success text-lg">{{ totalOutputQty }}</p></div>
          <div><p class="text-gray-500">Atxot jami</p><p class="font-bold text-orange-500 text-lg">{{ totalScrapQty }}</p></div>
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Yakuniy izoh</label>
          <textarea v-model="closeForm.notes" rows="2" placeholder="Smena davomida nima qilindi..." class="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors text-gray-900 dark:text-white" />
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showCloseModal = false">Bekor qilish</AppButton>
        <AppButton variant="success" :loading="saving" :icon="CheckSquare" @click="doClose">Smenani yakunlash</AppButton>
      </template>
    </AppModal>

    <!-- 5. DETAIL — TO'LIQ HISOBOT -->
    <AppModal v-model="showDetailModal" :title="detailLoading ? 'Yuklanmoqda...' : `Smena hisoboti`" size="xl">
      <div v-if="selectedShift" class="space-y-5">

        <!-- Asosiy ma'lumotlar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 mb-1">Holat</p>
            <AppBadge :variant="shiftStatusVariant(selectedShift.status)">{{ shiftStatusLabel(selectedShift.status) }}</AppBadge>
          </div>
          <div class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 mb-1">Liniya</p>
            <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ selectedShift.production_line?.name || '—' }}</p>
          </div>
          <div class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 mb-1">Operator</p>
            <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ selectedShift.operator?.full_name || selectedShift.operator?.username || '—' }}</p>
          </div>
          <div class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 mb-1">Davomiyligi</p>
            <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ calcDuration(selectedShift) }}</p>
          </div>
        </div>

        <!-- Vaqt -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl border border-success/20 bg-success/5 flex items-center gap-3">
            <Play class="w-4 h-4 text-success flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-500">Boshlandi</p>
              <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ formatDateTime(selectedShift.start_time) }}</p>
            </div>
          </div>
          <div class="p-3 rounded-xl border border-gray-200 dark:border-dark-border flex items-center gap-3">
            <CheckSquare class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p class="text-xs text-gray-500">Tugadi</p>
              <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ selectedShift.end_time ? formatDateTime(selectedShift.end_time) : 'Hali tugamagan' }}</p>
            </div>
          </div>
        </div>

        <!-- Mashinalar -->
        <div v-if="selectedShift.machines?.length">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mashinalar</p>
          <div class="flex flex-wrap gap-2">
            <AppBadge v-for="m in selectedShift.machines" :key="m.id" variant="default">{{ m.name }}</AppBadge>
          </div>
        </div>

        <div v-if="detailLoading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <template v-else>
          <!-- Statistika kartochkalari -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl border border-primary/20 bg-primary/5 text-center">
              <p class="text-xs text-gray-500">Xom ashyo olindi</p>
              <p class="text-xl font-bold text-primary mt-1">{{ detailStats.materialCount }}</p>
              <p class="text-xs text-gray-400">{{ detailStats.materialTotal }} {{ detailStats.materialUnit }}</p>
            </div>
            <div class="p-3 rounded-xl border border-orange-200 dark:border-orange-800/30 bg-orange-50 dark:bg-orange-900/10 text-center">
              <p class="text-xs text-orange-600">Atxot ishlatildi</p>
              <p class="text-xl font-bold text-orange-500 mt-1">{{ detailStats.scrapCount }}</p>
              <p class="text-xs text-gray-400">{{ detailStats.scrapTotal }} birlik</p>
            </div>
            <div class="p-3 rounded-xl border border-success/20 bg-success/5 text-center">
              <p class="text-xs text-success">Tayyor mahsulot</p>
              <p class="text-xl font-bold text-success mt-1">{{ detailStats.outputCount }}</p>
              <p class="text-xs text-gray-400">{{ detailStats.outputTotal }} birlik</p>
            </div>
            <div class="p-3 rounded-xl border border-danger/20 bg-danger/5 text-center">
              <p class="text-xs text-danger">Brak chiqdi</p>
              <p class="text-xl font-bold text-danger mt-1">{{ detailStats.defectCount }}</p>
              <p class="text-xs text-gray-400">{{ detailStats.defectTotal }} birlik</p>
            </div>
          </div>

          <!-- Xom ashyo sarfi -->
          <div v-if="detailMaterials.length">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-primary inline-block"></span>
              Xom ashyo sarfi (ombordan)
            </p>
            <div class="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
              <div v-for="(m, i) in detailMaterials" :key="m.id"
                class="flex items-center justify-between px-4 py-2.5 text-sm"
                :class="i % 2 === 0 ? 'bg-gray-50 dark:bg-dark-700' : 'bg-white dark:bg-dark-800'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ m.raw_material?.name || '—' }}</span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(m.recorded_at) }}</span>
                </div>
                <span class="font-semibold text-primary">{{ m.quantity_used }} {{ m.raw_material?.unit }}</span>
              </div>
            </div>
          </div>

          <!-- Atxot ishlatildi -->
          <div v-if="detailScrapUsage.length">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
              Atxot sklad sarfi
            </p>
            <div class="rounded-xl border border-orange-200 dark:border-orange-800/30 overflow-hidden">
              <div v-for="(s, i) in detailScrapUsage" :key="s.id"
                class="flex items-center justify-between px-4 py-2.5 text-sm"
                :class="i % 2 === 0 ? 'bg-orange-50 dark:bg-orange-900/10' : 'bg-white dark:bg-dark-800'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ s.raw_material?.name || s.finished_product?.name || '—' }}
                  </span>
                  <AppBadge size="xs" :variant="s.stock_type === 'recycled' ? 'success' : 'warning'">
                    {{ s.stock_type === 'recycled' ? '♻️' : '⚠️' }}
                  </AppBadge>
                </div>
                <span class="font-semibold text-orange-500">{{ s.quantity_used }}</span>
              </div>
            </div>
          </div>

          <!-- Tayyor mahsulotlar -->
          <div v-if="detailOutputs.length">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-success inline-block"></span>
              Tayyor mahsulotlar
            </p>
            <div class="rounded-xl border border-success/20 overflow-hidden">
              <div v-for="(o, i) in detailOutputs" :key="o.id"
                class="flex items-center justify-between px-4 py-2.5 text-sm"
                :class="i % 2 === 0 ? 'bg-success/5' : 'bg-white dark:bg-dark-800'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-success"></span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ o.finished_product?.name || '—' }}</span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(o.produced_at) }}</span>
                </div>
                <span class="font-semibold text-success">{{ o.quantity_produced }} {{ o.finished_product?.unit }}</span>
              </div>
            </div>
          </div>

          <!-- Brak -->
          <div v-if="detailDefects.length">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-danger inline-block"></span>
              Brak mahsulotlar
            </p>
            <div class="rounded-xl border border-danger/20 overflow-hidden">
              <div v-for="(d, i) in detailDefects" :key="d.id"
                class="flex items-center justify-between px-4 py-2.5 text-sm"
                :class="i % 2 === 0 ? 'bg-danger/5' : 'bg-white dark:bg-dark-800'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-danger"></span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ d.finished_product?.name || '—' }}</span>
                  <span v-if="d.defect_reason" class="text-xs text-gray-400">· {{ d.defect_reason?.name }}</span>
                </div>
                <span class="font-semibold text-danger">{{ d.quantity }} {{ d.finished_product?.unit }}</span>
              </div>
            </div>
          </div>

          <!-- Pauzalar -->
          <div v-if="detailPauses.length">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-warning inline-block"></span>
              Pauzalar
            </p>
            <div class="rounded-xl border border-warning/20 overflow-hidden">
              <div v-for="(p, i) in detailPauses" :key="p.id"
                class="flex items-center justify-between px-4 py-2.5 text-sm"
                :class="i % 2 === 0 ? 'bg-warning/5' : 'bg-white dark:bg-dark-800'"
              >
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-warning"></span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ pauseReasonLabel(p.reason) }}</span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(p.paused_at) }}</span>
                </div>
                <span v-if="p.resumed_at" class="text-xs font-medium text-gray-500">{{ calcPauseDuration(p) }}</span>
                <AppBadge v-else variant="warning" size="sm">Davom etayapti</AppBadge>
              </div>
            </div>
          </div>

          <!-- Izoh -->
          <div v-if="selectedShift.notes" class="p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
            <p class="text-xs text-gray-500 mb-1">Izoh</p>
            <p class="text-sm text-gray-900 dark:text-white">{{ selectedShift.notes }}</p>
          </div>

          <div v-if="!detailMaterials.length && !detailOutputs.length && !detailDefects.length && !detailPauses.length && !detailScrapUsage.length"
            class="text-center py-6 text-gray-400 text-sm">
            Bu smena uchun hali ma'lumot kiritilmagan
          </div>
        </template>
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="showDetailModal = false">Yopish</AppButton>
        <AppButton
          v-if="selectedShift?.status === 'active' && canManage(selectedShift)"
          variant="success" :icon="CheckSquare"
          @click="openClose(selectedShift); showDetailModal = false"
        >
          Yakunlash
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { formatDateTime } from '@/composables/useDate'
import { ref, computed, onMounted, watch } from 'vue'
import {
  Plus, Eye, CheckSquare, User, Play, PauseCircle,
  PackagePlus, Package, AlertTriangle, Trash2, Clock
} from 'lucide-vue-next'
import { productionApi, warehouseApi } from '@/api'
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

const data = ref([])
const linesData = ref([])
const machinesData = ref([])
const rawMaterialsData = ref([])
const finishedProductsData = ref([])
const scrapStockData = ref([])
const defectReasonsData = ref([])
const warehouseStockData = ref([])

const detailPauses = ref([])
const detailMaterials = ref([])
const detailScrapUsage = ref([])
const detailOutputs = ref([])
const detailDefects = ref([])
const detailLoading = ref(false)

const loading = ref(false)
const saving = ref(false)
const showCreateModal = ref(false)
const showPauseModal = ref(false)
const showMaterialModal = ref(false)
const showCloseModal = ref(false)
const showDetailModal = ref(false)
const selectedShift = ref(null)
const activePause = ref(null)
const materialTab = ref('warehouse')
const showMyOnly = ref(false)
const lineFilter = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = ref(20)
const total = ref(0)

const errors = ref({})
const pauseErrors = ref({})
const materialErrors = ref({})
const scrapUsageErrors = ref({})

const defaultForm = () => ({ production_line_id: '', machine_ids: [], notes: '' })
const form = ref(defaultForm())
const pauseForm = ref({ reason: '', notes: '' })
const materialForm = ref({ raw_material_id: '', quantity: '', notes: '' })
const scrapUsageForm = ref({ finished_product_id: '', raw_material_id: '', quantity_used: '', stock_type: 'recycled', notes: '' })
const defaultCloseForm = () => ({ outputs: [], scraps: [], notes: '' })
const closeForm = ref(defaultCloseForm())

const isOperator = computed(() =>
  hasRole(['operator']) && !hasRole(['superadmin', 'admin', 'director', 'production_manager'])
)
const activeShifts = computed(() =>
  data.value.filter(s =>
    s.status === 'active' && (
      hasRole(['superadmin', 'admin', 'director', 'production_manager']) ||
      s.operator_id === authStore.user?.id
    )
  )
)
const currentTimeDisplay = computed(() =>
  new Date().toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
)

// Detail statistika computed
const detailStats = computed(() => {
  const matTotal = detailMaterials.value.reduce((s, m) => s + parseFloat(m.quantity_used || 0), 0)
  const scrapTotal = detailScrapUsage.value.reduce((s, u) => s + parseFloat(u.quantity_used || 0), 0)
  const outTotal = detailOutputs.value.reduce((s, o) => s + parseFloat(o.quantity_produced || 0), 0)
  const defTotal = detailDefects.value.reduce((s, d) => s + parseFloat(d.quantity || 0), 0)
  const matUnit = detailMaterials.value[0]?.raw_material?.unit || ''
  return {
    materialCount: detailMaterials.value.length,
    materialTotal: matTotal,
    materialUnit: matUnit,
    scrapCount: detailScrapUsage.value.length,
    scrapTotal: scrapTotal,
    outputCount: detailOutputs.value.length,
    outputTotal: outTotal,
    defectCount: detailDefects.value.length,
    defectTotal: defTotal,
  }
})

const shiftStatusOptions = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'completed', label: 'Yakunlangan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
]
const pauseReasonOptions = [
  { value: 'breakdown', label: 'Mashina buzildi' },
  { value: 'lunch', label: 'Tushlik tanaffus' },
  { value: 'material', label: 'Material yetishmasligi' },
  { value: 'other', label: 'Boshqa sabab' },
]
const columns = [
  { key: 'production_line', label: 'Liniya', sortable: true },
  { key: 'operator', label: 'Operator' },
  { key: 'start_time', label: 'Boshlandi' },
  { key: 'end_time', label: 'Tugadi' },
  { key: 'duration', label: 'Davomiyligi' },
  { key: 'status', label: 'Holat' },
  { key: 'actions', label: '', width: '120px' },
]

const lineOptions = computed(() => [
  { value: '', label: 'Barcha liniyalar' },
  ...linesData.value.map(l => ({ value: l.id, label: l.name }))
])
const lineSelectOptions = computed(() => linesData.value.map(l => ({ value: l.id, label: l.name })))
const availableMachines = computed(() => {
  if (!form.value.production_line_id) return []
  return machinesData.value.filter(m =>
    m.production_line_id === form.value.production_line_id && m.status === 'active'
  )
})
const rawMaterialOptions = computed(() =>
  rawMaterialsData.value.map(m => {
    const stock = warehouseStockData.value.find(s => s.raw_material_id === m.id)
    const qty = stock?.quantity ?? null
    const disabled = qty !== null && qty <= 0
    const label = qty !== null ? `${m.name} (${m.unit}) — Qoldiq: ${qty}` : `${m.name} (${m.unit})`
    return { value: m.id, label, disabled }
  })
)
const finishedProductOptions = computed(() =>
  finishedProductsData.value.map(p => ({ value: p.id, label: `${p.name} (${p.unit})` }))
)
const scrapProductOptions = computed(() => {
  if (scrapUsageForm.value.stock_type === 'recycled') {
    return scrapStockData.value
      .filter(s => s.quantity > 0 && s.stock_type === 'recycled' && s.raw_material_id)
      .map(s => ({ value: s.raw_material_id, label: `${s.raw_material?.name || s.raw_material_id} — ${s.quantity} ${s.raw_material?.unit || ''}` }))
  } else {
    return scrapStockData.value
      .filter(s => s.quantity > 0 && s.stock_type === 'brak' && s.finished_product_id)
      .map(s => ({ value: s.finished_product_id, label: `${s.finished_product?.name} — ${s.quantity} ${s.finished_product?.unit}` }))
  }
})
const defectReasonOptions = computed(() =>
  defectReasonsData.value.map(r => ({ value: r.id, label: r.name }))
)
// Eng yangi yuqorida
const filteredData = computed(() => {
  let result = [...data.value].sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
  if (showMyOnly.value) result = result.filter(s => s.operator_id === authStore.user?.id)
  if (lineFilter.value) result = result.filter(i => i.production_line_id === lineFilter.value)
  if (statusFilter.value) result = result.filter(i => i.status === statusFilter.value)
  return result
})
const totalOutputQty = computed(() =>
  closeForm.value.outputs.reduce((s, i) => s + (parseFloat(i.quantity_produced) || 0), 0)
)
const totalScrapQty = computed(() =>
  closeForm.value.scraps.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0)
)

watch(() => form.value.production_line_id, () => { form.value.machine_ids = [] })
watch(showMyOnly, () => { page.value = 1; load() })

function shiftStatusVariant(s) { return { active: 'success', completed: 'info', cancelled: 'danger' }[s] || 'default' }
function shiftStatusLabel(s) { return { active: 'Faol', completed: 'Yakunlangan', cancelled: 'Bekor qilingan' }[s] || s }
function pauseReasonLabel(r) {
  return { breakdown: 'Mashina buzildi', lunch: 'Tushlik tanaffus', material: 'Material yetishmasligi', other: 'Boshqa sabab' }[r] || r
}
function calcDuration(row) {
  if (!row?.start_time) return '—'
  const mins = Math.round((new Date(row.end_time || Date.now()) - new Date(row.start_time)) / 60000)
  if (mins < 60) return `${mins} daqiqa`
  const h = Math.floor(mins / 60), m = mins % 60
  return m > 0 ? `${h} soat ${m} daqiqa` : `${h} soat`
}
function calcPauseDuration(p) {
  const mins = Math.round((new Date(p.resumed_at) - new Date(p.paused_at)) / 60000)
  return mins < 60 ? `${mins} daqiqa` : `${Math.floor(mins / 60)}s ${mins % 60}d`
}
function canManage(row) {
  if (!row) return false
  if (hasRole(['superadmin', 'admin', 'director', 'production_manager'])) return true
  return hasRole(['operator']) && row.operator_id === authStore.user?.id
}

async function load() {
  loading.value = true
  try {
    const [shiftRes, lineRes, machRes, prodRes, defectRes, scrapRes, rawRes, stockRes] = await Promise.all([
      (showMyOnly.value || isOperator.value)
        ? productionApi.getMyShifts({ page: page.value, limit: limit.value })
        : productionApi.getShifts({ page: page.value, limit: limit.value }),
      productionApi.getLines({ limit: 100 }),
      productionApi.getMachines({ limit: 100 }),
      productionApi.getFinishedProducts({ limit: 100 }),
      productionApi.getDefectReasons({ limit: 100 }),
      productionApi.getScrapStock(),
      warehouseApi.getRawMaterials({ limit: 100 }),
      warehouseApi.getStock({ limit: 100 }),
    ])
    data.value = shiftRes.data?.items || shiftRes.data || []
    total.value = shiftRes.data?.total || data.value.length
    linesData.value = lineRes.data?.items || lineRes.data || []
    machinesData.value = machRes.data?.items || machRes.data || []
    finishedProductsData.value = prodRes.data?.items || prodRes.data || []
    defectReasonsData.value = defectRes.data?.items || defectRes.data || []
    scrapStockData.value = scrapRes.data?.items || scrapRes.data || []
    rawMaterialsData.value = rawRes.data?.items || rawRes.data || []
    warehouseStockData.value = stockRes.data?.items || stockRes.data || []
  } catch {
    toast.error("Ma'lumotlarni yuklashda xatolik")
  } finally {
    loading.value = false
  }
}

function openCreate() { form.value = defaultForm(); errors.value = {}; showCreateModal.value = true }
async function saveCreate() {
  errors.value = {}
  if (!form.value.production_line_id) { errors.value.production_line_id = 'Liniyani tanlang'; return }
  saving.value = true
  try {
    await productionApi.createShift({ ...form.value, start_time: new Date().toISOString() })
    toast.success('Smena boshlandi!')
    showCreateModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function openPause(shift) {
  selectedShift.value = shift
  pauseForm.value = { reason: '', notes: '' }
  pauseErrors.value = {}
  activePause.value = null
  try {
    const res = await productionApi.getShiftPauses(shift.id)
    const pauses = res.data?.items || res.data || []
    activePause.value = pauses.find(p => !p.resumed_at) || null
  } catch { /* ignore */ }
  showPauseModal.value = true
}
async function doPause() {
  if (!pauseForm.value.reason) { pauseErrors.value.reason = 'Sababni tanlang'; return }
  saving.value = true
  try {
    await productionApi.pauseShift(selectedShift.value.id, pauseForm.value)
    toast.success("Smena toxtatildi")
    showPauseModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}
async function doResume() {
  saving.value = true
  try {
    await productionApi.resumeShift(selectedShift.value.id)
    toast.success('Smena davom ettirildi')
    showPauseModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

function openMaterialModal(shift) {
  selectedShift.value = shift
  materialTab.value = 'warehouse'
  materialForm.value = { raw_material_id: '', quantity: '', notes: '' }
  scrapUsageForm.value = { finished_product_id: '', raw_material_id: '', quantity_used: '', stock_type: 'recycled', notes: '' }
  materialErrors.value = {}
  scrapUsageErrors.value = {}
  showMaterialModal.value = true
}
async function saveMaterial() {
  if (materialTab.value === 'warehouse') {
    materialErrors.value = {}
    if (!materialForm.value.raw_material_id) { materialErrors.value.raw_material_id = 'Xom ashyoni tanlang'; return }
    if (!materialForm.value.quantity) { materialErrors.value.quantity = 'Miqdorni kiriting'; return }
    saving.value = true
    try {
      await productionApi.recordMaterialUsage(selectedShift.value.id, {
        raw_material_id: materialForm.value.raw_material_id,
        quantity_used: parseFloat(materialForm.value.quantity),
        notes: materialForm.value.notes || null,
      })
      toast.success("Material qoshildi")
      showMaterialModal.value = false
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      saving.value = false
    }
  } else {
    scrapUsageErrors.value = {}
    const val = scrapUsageForm.value.stock_type === 'recycled'
      ? scrapUsageForm.value.raw_material_id
      : scrapUsageForm.value.finished_product_id
    if (!val) { scrapUsageErrors.value.finished_product_id = 'Mahsulotni tanlang'; return }
    if (!scrapUsageForm.value.quantity_used) { scrapUsageErrors.value.quantity_used = 'Miqdorni kiriting'; return }
    saving.value = true
    try {
      const scrapPayload = {
        quantity_used: parseFloat(scrapUsageForm.value.quantity_used),
        stock_type: scrapUsageForm.value.stock_type,
        notes: scrapUsageForm.value.notes || null,
      }
      if (scrapUsageForm.value.stock_type === 'recycled') {
        scrapPayload.raw_material_id = scrapUsageForm.value.raw_material_id
        scrapPayload.finished_product_id = null
      } else {
        scrapPayload.finished_product_id = scrapUsageForm.value.finished_product_id
        scrapPayload.raw_material_id = null
      }
      await productionApi.useScrapInShift(selectedShift.value.id, scrapPayload)
      toast.success("Atxot material qoshildi")
      showMaterialModal.value = false
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
    } finally {
      saving.value = false
    }
  }
}

function openClose(shift) { selectedShift.value = shift; closeForm.value = defaultCloseForm(); showCloseModal.value = true }
function addOutput() { closeForm.value.outputs.push({ finished_product_id: '', quantity_produced: '' }) }
function removeOutput(idx) { closeForm.value.outputs.splice(idx, 1) }
function addScrap() { closeForm.value.scraps.push({ finished_product_id: '', quantity: '', defect_reason_id: '' }) }
function removeScrap(idx) { closeForm.value.scraps.splice(idx, 1) }

async function doClose() {
  saving.value = true
  try {
    await productionApi.closeShift(selectedShift.value.id, {
      end_time: new Date().toISOString(),
      notes: closeForm.value.notes || null,
      outputs: closeForm.value.outputs.filter(i => i.finished_product_id && i.quantity_produced).map(i => ({ finished_product_id: i.finished_product_id, quantity_produced: parseFloat(i.quantity_produced) })),
      scraps: closeForm.value.scraps.filter(i => i.finished_product_id && i.quantity).map(i => ({ finished_product_id: i.finished_product_id, quantity: parseFloat(i.quantity), defect_reason_id: i.defect_reason_id || null })),
    })
    toast.success('Smena muvaffaqiyatli yakunlandi!')
    showCloseModal.value = false
    load()
  } catch (e) {
    toast.error(e.response?.data?.detail || 'Xatolik yuz berdi')
  } finally {
    saving.value = false
  }
}

async function openDetail(row) {
  selectedShift.value = row
  detailPauses.value = []
  detailMaterials.value = []
  detailScrapUsage.value = []
  detailOutputs.value = []
  detailDefects.value = []
  detailLoading.value = true
  showDetailModal.value = true
  try {
    const [pauseRes, matRes, scrapRes, outRes, defectRes] = await Promise.all([
      productionApi.getShiftPauses(row.id),
      productionApi.getShiftMaterialUsage(row.id),
      productionApi.getShiftScrapUsage(row.id),
      productionApi.getShiftOutput(row.id),
      productionApi.getShiftDefects(row.id),
    ])
    detailPauses.value = pauseRes.data?.items || pauseRes.data || []
    detailMaterials.value = matRes.data?.items || matRes.data || []
    detailScrapUsage.value = scrapRes.data?.items || scrapRes.data || []
    detailOutputs.value = outRes.data?.items || outRes.data || []
    detailDefects.value = defectRes.data?.items || defectRes.data || []
  } catch {
    toast.error("Tafsilotlarni yuklashda xatolik")
  } finally {
    detailLoading.value = false
  }
}

function onPageChange(p) { page.value = p; load() }
onMounted(load)
</script>