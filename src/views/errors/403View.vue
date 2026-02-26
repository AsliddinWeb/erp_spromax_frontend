<template>
  <div class="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-4">
    <div class="text-center max-w-md">
      <!-- 403 number -->
      <div class="relative mb-6">
        <h1 class="text-[140px] font-black leading-none select-none bg-gradient-to-br from-warning via-orange-400 to-danger bg-clip-text text-transparent">
          403
        </h1>
        <div class="absolute inset-0 text-[140px] font-black leading-none select-none bg-gradient-to-br from-warning via-orange-400 to-danger bg-clip-text text-transparent opacity-20 blur-xl -z-10">
          403
        </div>
      </div>

      <!-- Icon -->
      <div class="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-5">
        <ShieldOff class="w-8 h-8 text-warning" />
      </div>

      <!-- Text -->
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ruxsat yo'q</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-8">
        Sizda bu sahifaga kirish huquqi yo'q.<br />
        Agar bu xato deb hisoblasangiz, administratorga murojaat qiling.
      </p>

      <!-- Buttons -->
      <div class="flex gap-3 justify-center">
        <button
          @click="$router.back()"
          class="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-dark-border text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors flex items-center gap-2"
        >
          <ArrowLeft class="w-4 h-4" />
          Orqaga qaytish
        </button>
        <button
          @click="$router.push('/')"
          class="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Home class="w-4 h-4" />
          Bosh sahifa
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShieldOff, ArrowLeft, Home } from 'lucide-vue-next'
</script>